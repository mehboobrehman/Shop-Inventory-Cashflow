import postgres from 'postgres';

let _sql: postgres.Sql | null = null;

function getConnectionString(): string | null {
  return process.env.DATABASE_URL ?? null;
}

export function getSql(): postgres.Sql | null {
  if (_sql) return _sql;
  const connectionString = getConnectionString();
  if (!connectionString) return null;
  _sql = postgres(connectionString, { prepare: false });
  return _sql;
}
