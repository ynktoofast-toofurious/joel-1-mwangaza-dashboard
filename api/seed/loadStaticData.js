import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { withClient } from "../src/db.js";
import { incidents, users, subscriptions, plans, statuses, severities } from "./staticData.js";

const toDateKey = (dateText) => Number(dateText.replaceAll("-", ""));

async function ensureDate(client, dateText) {
  const dateKey = toDateKey(dateText);
  await client.query(
    `insert into dim_date (date_key, full_date, year, month, day, month_name)
     select $1, $2::date, extract(year from $2::date), extract(month from $2::date), extract(day from $2::date), to_char($2::date, 'Mon')
     where not exists (select 1 from dim_date where date_key = $1)`,
    [dateKey, dateText]
  );
  return dateKey;
}

async function ensureKey(client, table, keyColumn, valueColumn, value) {
  const existing = await client.query(`select ${keyColumn} from ${table} where ${valueColumn} = $1`, [value]);
  if (existing.rowCount) return existing.rows[0][keyColumn];
  await client.query(`insert into ${table} (${valueColumn}) values ($1)`, [value]);
  const created = await client.query(`select ${keyColumn} from ${table} where ${valueColumn} = $1`, [value]);
  return created.rows[0][keyColumn];
}

async function ensureLocationKey(client, city) {
  const existing = await client.query("select location_key from dim_location where city = $1", [city]);
  if (existing.rowCount) return existing.rows[0].location_key;
  await client.query("insert into dim_location (city) values ($1)", [city]);
  const created = await client.query("select location_key from dim_location where city = $1", [city]);
  return created.rows[0].location_key;
}

async function run() {
  await withClient(async (client) => {
    const sql = readFileSync(resolve(process.cwd(), "sql", "star_schema.sql"), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);

      for (const status of statuses) {
        await ensureKey(client, "dim_status", "status_key", "status_name", status);
      }

      for (const severity of severities) {
        await ensureKey(client, "dim_severity", "severity_key", "severity_name", severity);
      }

      for (const plan of plans) {
        const existing = await client.query("select plan_key from dim_plan where plan_name = $1", [plan.name]);
        if (!existing.rowCount) {
          await client.query("insert into dim_plan (plan_name, monthly_price) values ($1, $2)", [plan.name, plan.monthlyPrice]);
        }
      }

      for (const user of users) {
        const locationKey = await ensureLocationKey(client, user.city);
        const existing = await client.query("select user_key from dim_user where email = $1", [user.email]);
        if (!existing.rowCount) {
          await client.query(
            "insert into dim_user (full_name, email, role_name, location_key) values ($1, $2, $3, $4)",
            [user.fullName, user.email, user.role, locationKey]
          );
        }
      }

      for (const row of incidents) {
        const dateKey = await ensureDate(client, row.occurredOn);
        const categoryKey = await ensureKey(client, "dim_category", "category_key", "category_name", row.category);
        const statusKey = await ensureKey(client, "dim_status", "status_key", "status_name", row.status);
        const severityKey = await ensureKey(client, "dim_severity", "severity_key", "severity_name", row.severity);
        const institutionKey = await ensureKey(client, "dim_institution", "institution_key", "institution_name", row.institution);
        const locationKey = await ensureLocationKey(client, row.city);

        const existing = await client.query("select incident_key from fact_incident where incident_ref = $1", [row.ref]);
        if (!existing.rowCount) {
          await client.query(
            `insert into fact_incident (
              incident_ref, date_key, category_key, status_key, severity_key, institution_key, location_key
            ) values ($1, $2, $3, $4, $5, $6, $7)`,
            [row.ref, dateKey, categoryKey, statusKey, severityKey, institutionKey, locationKey]
          );
        }
      }

      for (const sub of subscriptions) {
        const institutionKey = await ensureKey(client, "dim_institution", "institution_key", "institution_name", sub.institution);
        const plan = await client.query("select plan_key from dim_plan where plan_name = $1", [sub.plan]);
        const startDateKey = await ensureDate(client, sub.startDate);
        const renewalDateKey = await ensureDate(client, sub.renewalDate);

        const existing = await client.query(
          "select subscription_key from fact_subscription where institution_key = $1 and plan_key = $2 and renewal_date_key = $3",
          [institutionKey, plan.rows[0].plan_key, renewalDateKey]
        );

        if (!existing.rowCount) {
          await client.query(
            `insert into fact_subscription (institution_key, plan_key, start_date_key, renewal_date_key, amount, state)
             values ($1, $2, $3, $4, $5, $6)`,
            [institutionKey, plan.rows[0].plan_key, startDateKey, renewalDateKey, sub.amount, sub.state]
          );
        }
      }

      await client.query("commit");
      console.log("Seed complete: star schema and static data loaded.");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  });
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
