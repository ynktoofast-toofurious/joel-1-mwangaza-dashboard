import { query } from "../db.js";
import { writeAudit } from "./auditService.js";

function buildWhere(filters, params) {
  const where = [];
  if (filters.city) {
    params.push(filters.city);
    where.push(`l.city = $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    where.push(`c.category_name = $${params.length}`);
  }
  if (filters.severity) {
    params.push(filters.severity);
    where.push(`sev.severity_name = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    where.push(`st.status_name = $${params.length}`);
  }
  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(fi.incident_ref ilike $${params.length} or i.institution_name ilike $${params.length})`);
  }
  return where.length ? `where ${where.join(" and ")}` : "";
}

export async function getIncidents(filters = {}) {
  const params = [];
  const where = buildWhere(filters, params);
  params.push(Number(filters.limit || 200));

  const sql = `
    select
      fi.incident_key,
      fi.incident_ref,
      c.category_name as category,
      i.institution_name as institution,
      l.city,
      sev.severity_name as severity,
      st.status_name as status,
      dd.full_date as occurred_on
    from fact_incident fi
    join dim_category c on fi.category_key = c.category_key
    join dim_institution i on fi.institution_key = i.institution_key
    join dim_location l on fi.location_key = l.location_key
    join dim_severity sev on fi.severity_key = sev.severity_key
    join dim_status st on fi.status_key = st.status_key
    join dim_date dd on fi.date_key = dd.date_key
    ${where}
    order by fi.inserted_at desc
    limit $${params.length}
  `;
  const result = await query(sql, params);
  return result.rows;
}

export async function updateIncident(incidentKey, payload, changedBy) {
  const current = await query(
    `select fi.incident_key, fi.incident_ref, st.status_name as status, sev.severity_name as severity
     from fact_incident fi
     join dim_status st on fi.status_key = st.status_key
     join dim_severity sev on fi.severity_key = sev.severity_key
     where fi.incident_key = $1`,
    [incidentKey]
  );

  if (!current.rowCount) {
    return null;
  }

  const currentRow = current.rows[0];
  const nextStatus = payload.status || currentRow.status;
  const nextSeverity = payload.severity || currentRow.severity;

  const statusKeyRes = await query("select status_key from dim_status where status_name = $1", [nextStatus]);
  const severityKeyRes = await query("select severity_key from dim_severity where severity_name = $1", [nextSeverity]);

  if (!statusKeyRes.rowCount || !severityKeyRes.rowCount) {
    throw new Error("Invalid status or severity");
  }

  await query(
    `update fact_incident
      set status_key = $1,
          severity_key = $2,
          updated_at = current_timestamp
      where incident_key = $3`,
    [statusKeyRes.rows[0].status_key, severityKeyRes.rows[0].severity_key, incidentKey]
  );

  await writeAudit({
    tableName: "fact_incident",
    recordId: incidentKey,
    actionType: "update",
    changedBy,
    oldValue: JSON.stringify({ status: currentRow.status, severity: currentRow.severity }),
    newValue: JSON.stringify({ status: nextStatus, severity: nextSeverity })
  });

  return getIncidents({ q: currentRow.incident_ref, limit: 1 }).then((rows) => rows[0]);
}

export async function getUsers(filters = {}) {
  const params = [];
  const where = [];

  if (filters.city) {
    params.push(filters.city);
    where.push(`l.city = $${params.length}`);
  }
  if (filters.role) {
    params.push(filters.role);
    where.push(`u.role_name = $${params.length}`);
  }
  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(u.full_name ilike $${params.length} or u.email ilike $${params.length})`);
  }

  params.push(Number(filters.limit || 200));
  const sql = `
    select u.user_key, u.full_name, u.email, u.role_name as role, l.city
    from dim_user u
    left join dim_location l on u.location_key = l.location_key
    ${where.length ? `where ${where.join(" and ")}` : ""}
    order by u.full_name asc
    limit $${params.length}
  `;
  const result = await query(sql, params);
  return result.rows;
}

export async function getSubscriptions(filters = {}) {
  const params = [];
  const where = [];

  if (filters.plan) {
    params.push(filters.plan);
    where.push(`dp.plan_name = $${params.length}`);
  }
  if (filters.state) {
    params.push(filters.state);
    where.push(`fs.state = $${params.length}`);
  }

  params.push(Number(filters.limit || 200));

  const sql = `
    select
      fs.subscription_key,
      di.institution_name as institution,
      dp.plan_name as plan,
      fs.amount,
      ds.full_date as start_date,
      dr.full_date as renewal_date,
      fs.state
    from fact_subscription fs
    join dim_institution di on fs.institution_key = di.institution_key
    join dim_plan dp on fs.plan_key = dp.plan_key
    join dim_date ds on fs.start_date_key = ds.date_key
    join dim_date dr on fs.renewal_date_key = dr.date_key
    ${where.length ? `where ${where.join(" and ")}` : ""}
    order by dr.full_date desc
    limit $${params.length}
  `;
  const result = await query(sql, params);
  return result.rows;
}

export async function getAnalyticsSummary() {
  const monthly = await query(`
    select to_char(dd.full_date, 'Mon') as month, count(*)::int as incidents
    from fact_incident fi
    join dim_date dd on fi.date_key = dd.date_key
    group by 1
    order by min(dd.full_date)
  `);

  const categories = await query(`
    select c.category_name as category, count(*)::int as volume
    from fact_incident fi
    join dim_category c on fi.category_key = c.category_key
    group by c.category_name
    order by volume desc
  `);

  return {
    monthly: monthly.rows,
    categories: categories.rows
  };
}

export async function logAccessEvent(payload) {
  const { route, locationText, userEmail, userAgent, eventType, ipAddress, metadata } = payload;
  await query(
    `insert into fact_access_event (route, location_text, user_email, user_agent, event_type, ip_address, metadata)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [route || "unknown", locationText || "unknown", userEmail || "anonymous", userAgent || "unknown", eventType || "seo_access", ipAddress || "", metadata ? JSON.stringify(metadata) : "{}"]
  );
}

export async function getSeoEvents(limit = 200) {
  const result = await query(
    `select access_key, event_time, route, location_text, user_email, user_agent, ip_address
     from fact_access_event
     order by event_time desc
     limit $1`,
    [limit]
  );
  return result.rows;
}
