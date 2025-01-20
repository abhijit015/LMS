"use server";
import { handleErrorMsg } from "../utils/common";

import mariadb, { Connection } from "mariadb";
import { getBusinessIdFromCookies } from "./cookies";
import { getHostAndPort4Business } from "../controllers/business.controller";

const userDBPool = mariadb.createPool({
  host: process.env.USER_DB_HOST,
  user: process.env.USER_DB_USERNAME,
  password: process.env.USER_DB_PASSWORD,
  database: process.env.USER_DB_NAME,
  port: Number(process.env.USER_DB_PORT),
  connectionLimit: 5,
});

async function createBusinessDBPool() {
  const businessId = await getBusinessIdFromCookies();
  if (!businessId) {
    throw new Error("Invalid or missing business cookie");
  }

  const { status, message, data } = await getHostAndPort4Business(businessId);
  if (!status || !data) {
    throw new Error(message || "Error fetching host and port for  business.");
  }

  const { db_host, db_port } = data;

  return mariadb.createPool({
    host: db_host,
    user: process.env.BUSINESS_DB_USERNAME,
    password: process.env.BUSINESS_DB_PASSWORD,
    database: `businessDB_${businessId}`,
    port: db_port,
    connectionLimit: 5,
  });
}

export async function getUserDBConn(): Promise<Connection> {
  try {
    return await userDBPool.getConnection();
  } catch (error) {
    throw error;
  }
}

export async function getBusinessDBConn(): Promise<Connection> {
  try {
    const businessDBPool = await createBusinessDBPool();
    return await businessDBPool.getConnection();
  } catch (error) {
    throw error;
  }
}

export async function executeQueryInUserDB<T = any>(
  query: string,
  values?: T[],
  connection?: Connection
) {
  console.log("query : ", query);
  console.log("values : ", values);

  let conn;
  try {
    conn = connection || (await getUserDBConn());
    return await conn.query(query, values);
  } catch (error) {
    throw error;
  } finally {
    if (!connection && conn) conn.end();
  }
}

export async function executeQueryInBusinessDB<T = any>(
  query: string,
  values?: T[],
  connection?: Connection
) {
  console.log("query : ", query);
  console.log("values : ", values);

  let conn;
  try {
    conn = connection || (await getBusinessDBConn());
    return await conn.query(query, values);
  } catch (error) {
    throw error;
  } finally {
    if (!connection && conn) conn.end();
  }
}

async function createDBPool(host: string, port: number, name?: string) {
  return mariadb.createPool({
    host: host,
    user: process.env.BUSINESS_DB_USERNAME,
    password: process.env.BUSINESS_DB_PASSWORD,
    port: port,
    database: name,
    connectionLimit: 5,
  });
}

export async function getDBConn(
  host: string,
  port: number,
  name?: string
): Promise<Connection> {
  try {
    const DBPool = await createDBPool(host, port, name);
    return await DBPool.getConnection();
  } catch (error) {
    throw error;
  }
}
