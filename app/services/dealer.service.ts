import { dealerSchemaT, userSchemaT } from "../utils/models";
import { executeQuery, getDBConn } from "../utils/db";
import {
  deleteUserFromDB,
  getAllUserId4Dealer,
  saveUserInDB,
} from "./user.service";
import { USER_TYPE_DEALER } from "../utils/constants";

export async function loadDealerFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let dealerData = null;
  let query;
  let productIds = [];

  try {
    if (proceed) {
      query =
        "SELECT u.id, u.dealer_id, d.contact_person, u.phone, u.email, u.display_name FROM dealers as d, users as u WHERE u.dealer_id=d.id and u.dealer_id = ? and u.user_type=" +
        USER_TYPE_DEALER;
      const result = await executeQuery(query, [id]);

      if (result.length > 0) {
        dealerData = result[0];
      } else {
        proceed = false;
        errMsg = "Dealer not found.";
      }
    }

    if (proceed) {
      query = `
        SELECT product_id 
        FROM dealer_product_mapping 
        WHERE dealer_id = ?
      `;

      const productResult = await executeQuery(query, [id]);

      productIds = productResult.map(
        (row: { product_id: number }) => row.product_id
      );
    }

    if (dealerData) {
      dealerData.products = productIds;
    }

    return {
      status: proceed,
      message: proceed ? "Dealer loaded successfully." : errMsg,
      data: dealerData,
    };
  } catch (error) {
    console.error("Error loading dealer:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading dealer.",
      data: null,
    };
  }
}

export async function loadDealerListFromDB(client_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  try {
    if (proceed) {
      query =
        "SELECT d.id, u.display_name from dealers as d, users as u where d.id=u.dealer_id and d.client_id=? and u.user_type=" +
        USER_TYPE_DEALER +
        " order by u.display_name";
      result = await executeQuery(query, [client_id]);
      console.log("result : ", result);
    }

    return {
      status: proceed,
      message: proceed ? "Dealers loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading dealers:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading dealers.",
      data: null,
    };
  }
}

export async function dealerName2IDFromDB(name: string) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let dealerId = null;

  try {
    if (proceed) {
      const query = `SELECT id FROM dealers WHERE name = ?`;
      const result = await executeQuery(query, [name]);

      if (result.length > 0) {
        dealerId = result[0].id;
      } else {
        proceed = false;
        errMsg = "Dealer not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Dealer ID retrieved successfully." : errMsg,
      data: dealerId,
    };
  } catch (error) {
    console.error("Error fetching dealer ID by name:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Database error occurred while fetching dealer ID.",
      data: null,
    };
  }
}

export async function deleteDealerFromDB(dealerId: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let connection;

  try {
    connection = await getDBConn();
    await connection.beginTransaction();

    if (proceed) {
      result = await executeQuery(
        "SELECT COUNT(*) AS count FROM dealer_product_mapping WHERE dealer_id = ?",
        [dealerId],
        connection
      );

      if (result[0].count !== 0) {
        result = await executeQuery(
          "DELETE FROM dealer_product_mapping WHERE dealer_id = ?",
          [dealerId],
          connection
        );

        if (result.affectedRows <= 0) {
          proceed = false;
          errMsg = "Unable to delete dealer product mapping.";
        }
      }
    }

    if (proceed) {
      result = await getAllUserId4Dealer(dealerId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed && result && Array.isArray(result.data)) {
      for (const userId of result.data) {
        const userDeleteResult = await deleteUserFromDB(userId, connection);
        if (!userDeleteResult.status) {
          proceed = false;
          errMsg = `Error deleting user ID ${userId}: ${userDeleteResult.message}`;
          break;
        }
      }
    } else {
      proceed = false;
      errMsg = "No users found for the dealer.";
    }

    if (proceed) {
      result = await executeQuery(
        "DELETE FROM dealers WHERE id = ?",
        [dealerId],
        connection
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete dealer.";
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Dealer deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error deleting dealer.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

export async function saveDealerInDB(
  dealerData: dealerSchemaT,
  userData: userSchemaT
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let connection;
  let query: string;
  let values: any[];

  try {
    connection = await getDBConn();
    await connection.beginTransaction();

    if (proceed) {
      if (dealerData.id) {
        query = `
          UPDATE dealers SET
            contact_person = ?,
            updated_by = ?
          WHERE id = ?
        `;
        values = [
          dealerData.contact_person || null,
          dealerData.updated_by,
          dealerData.id,
        ];
      } else {
        query = `
          INSERT INTO dealers (contact_person,client_id,created_by,updated_by)
          VALUES (?,?,?,?)
        `;
        values = [
          dealerData.contact_person || null,
          dealerData.client_id,
          dealerData.created_by,
          dealerData.updated_by,
        ];
      }

      const result = await executeQuery(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving dealer.";
      } else {
        if (!dealerData.id) {
          dealerData.id = result.insertId;
          userData.dealer_id = dealerData.id;
        }
      }
    }

    if (proceed) {
      if (dealerData.id) {
        query = `
        DELETE FROM dealer_product_mapping WHERE dealer_id = ?
      `;
        values = [dealerData.id];
        const deleteResult = await executeQuery(query, values, connection);
        if (deleteResult.affectedRows < 0) {
          proceed = false;
          errMsg = "Error deleting existing product mappings.";
        }
      }

      if (proceed && dealerData.products && dealerData.products.length > 0) {
        try {
          for (let id of dealerData.products) {
            query = `
              INSERT INTO dealer_product_mapping (dealer_id, product_id)
              VALUES (?, ?)
            `;
            values = [dealerData.id, id];

            const result = await executeQuery(query, values, connection);

            if (result.affectedRows <= 0) {
              proceed = false;
              errMsg = `Error saving product mapping for product id ${id}.`;
              break;
            }
          }
        } catch (error) {
          proceed = false;
          errMsg = `Error while inserting product mappings: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
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
      message: proceed ? "Dealer saved successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error saving dealer:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving dealer.",
      data: null,
    };
  } finally {
    if (connection) connection.end;
  }
}
