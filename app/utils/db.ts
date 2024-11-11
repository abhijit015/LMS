"use server";

import mariadb, { Connection } from "mariadb";

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306, // Fallback to default if DB_PORT is not set
  connectionLimit: 5,
});

export async function getDBConn(): Promise<Connection> {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error("Error getting database connection:", error);
    throw error;
  }
}

export async function executeQuery<T = any>(
  query: string,
  values?: T[],
  connection?: mariadb.Connection
) {
  console.log("qry : ", query);
  console.log("values : ", values);
  let conn;

  try {
    conn = connection || (await pool.getConnection());

    const results = await conn.query(query, values);
    return results;
  } catch (error) {
    console.error("Database Query Error:", error);
    throw error;
  } finally {
    if (!connection && conn) conn.end();
  }
}
