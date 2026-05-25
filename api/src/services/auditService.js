import { query } from "../db.js";

export async function writeAudit({ tableName, recordId, actionType, changedBy, oldValue, newValue }) {
  await query(
    `insert into audit_trail (table_name, record_id, action_type, changed_by, old_value, new_value)
     values ($1, $2, $3, $4, $5, $6)`,
    [tableName, String(recordId), actionType, changedBy || "system", oldValue || "", newValue || ""]
  );
}

export async function listAudit(limit = 100) {
  const sql = `select audit_key, table_name, record_id, action_type, changed_by, changed_at, old_value, new_value
               from audit_trail
               order by changed_at desc
               limit $1`;
  const result = await query(sql, [limit]);
  return result.rows;
}
