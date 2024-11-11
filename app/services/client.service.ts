import { clientSchemaT, userSchemaT } from "../utils/models";
import { executeQuery, getDBConn } from "../utils/db";
import { saveUserInDB } from "./user.service";

export async function saveClientInDB(
  clientData: clientSchemaT,
  userData: userSchemaT
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let connection;
  let query: string;
  let values: any[];

  try {
    if (proceed) {
      connection = await getDBConn();

      await connection.beginTransaction();

      if (clientData.id) {
        query = `
          UPDATE clients SET
            contact_person = ?
          WHERE id = ?
        `;
        values = [clientData.contact_person || null, clientData.id];
      } else {
        query = `
          INSERT INTO clients (contact_person)
          VALUES (?)
        `;
        values = [clientData.contact_person || null];
      }

      result = await executeQuery(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving client.";
      } else {
        if (!clientData.id) {
          clientData.id = result.insertId;
          userData.client_id = clientData.id;
        }
      }
    }

    if (proceed) {
      result = await saveUserInDB(userData, connection);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (connection) {
      if (proceed) {
        await connection.commit();
      } else {
        await connection.rollback();
      }
    }

    return {
      status: proceed,
      message: proceed ? "Client saved successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error saving client:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving client.",
      data: null,
    };
  } finally {
    if (connection) connection.end;
  }
}
