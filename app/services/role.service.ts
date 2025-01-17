"use server";

import { roleSchemaT } from "../utils/models";
import { executeQueryInBusinessDB, getBusinessDBConn } from "../utils/db";

export async function loadRoleFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let roleData;
  let result;
  let query;

  try {
    if (proceed) {
      query = `SELECT * FROM role_mast WHERE id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        roleData = result[0];
      } else {
        proceed = false;
        errMsg = "Role not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Role loaded successfully." : errMsg,
      data: proceed ? roleData : null,
    };
  } catch (error) {
    console.error("Error loading role:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading role.",
      data: null,
    };
  }
}

export async function loadRoleListFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;

  let dealerData;

  try {
    if (proceed) {
      query = `SELECT * from role_mast where hierarchy>0 order by hierarchy`;
      result = await executeQueryInBusinessDB(query);
      if (result.length < 0) {
        proceed = false;
        errMsg = "Error fetching list.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Roles loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading roles:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading roles.",
      data: null,
    };
  }
}

export async function saveRoleInDB(roleData: roleSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let connection;
  let result;

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed) {
      if (roleData.id) {
        query = `
              UPDATE role_mast SET
                name = ?,
                updated_by = ?
              WHERE id = ?
            `;
        values = [roleData.name, roleData.updated_by, roleData.id];
      } else {
        query = `
              INSERT INTO role_mast (name,updated_by)
              VALUES (?,?,?,?)
            `;
        values = [roleData.name, roleData.updated_by];
      }

      result = await executeQueryInBusinessDB(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error saving role.";
      } else {
        if (!roleData.id) {
          roleData.id = result.insertId;
        }
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Role saved successfully." : errMsg,
      data: proceed ? roleData.id : null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error saving role:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving role.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}
