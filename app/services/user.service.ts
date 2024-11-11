"use server";

import {
  USER_TYPE_CLIENT,
  USER_TYPE_DEALER,
  USER_TYPE_SUB_USER,
} from "../utils/constants";
import { executeQuery } from "../utils/db";
import { userSchemaT } from "../utils/models";
import mariadb from "mariadb";

export async function saveUserInDB(
  data: userSchemaT,
  connection?: mariadb.Connection
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;

  try {
    if (proceed) {
      if (data.id) {
        query = `
          UPDATE users SET
            email = ?,
            phone = ?,
            display_name = ?,
            updated_by = ?
          WHERE id = ?
        `;

        values = [
          data.email,
          data.phone || null,
          data.display_name,
          data.updated_by || null,
          data.id,
        ];
      } else {
        query = `
          INSERT INTO users (
            client_id,
            email,
            phone,
            password,
            display_name,
            dealer_id,
            user_type,
            created_by,
            updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        values = [
          data.client_id,
          data.email,
          data.phone || null,
          data.password,
          data.display_name,
          data.dealer_id || null,
          data.user_type,
          data.created_by || null,
          data.updated_by || null,
        ];
      }

      if (connection) {
        result = await executeQuery(query, values, connection);
      } else {
        result = await executeQuery(query, values);
      }

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to save user.";
      } else {
        if (!data.id) {
          data.id = result.insertId;
        }
      }
    }

    return {
      status: proceed,
      message: "User saved successfully.",
      data: proceed ? data.id : null,
    };
  } catch (error) {
    console.error("Error saving user:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving user.",
      data: null,
    };
  } finally {
  }
}

export async function loadUserListFromDB(userData: userSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  try {
    if (proceed) {
      if (userData.user_type === USER_TYPE_CLIENT) {
        query =
          "SELECT * from users where client_id=? AND (dealer_id IS NULL OR dealer_id = 0) and user_type=" +
          USER_TYPE_SUB_USER +
          " order by display_name";
        result = await executeQuery(query, [userData.client_id]);
      } else if (userData.user_type === USER_TYPE_DEALER) {
        query =
          "SELECT * from users where dealer_id=? and user_type=" +
          USER_TYPE_SUB_USER +
          " order by display_name";
        result = await executeQuery(query, [userData.dealer_id]);
      }
    }

    return {
      status: proceed,
      message: proceed ? "Users loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading users:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading users.",
      data: null,
    };
  }
}

export async function validateUserFromDB(username: string) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;

  try {
    if (proceed) {
      query = "SELECT id,password FROM users WHERE email = ? OR phone = ?";
      values = [username, username];

      result = await executeQuery(query, values);
      if (result.length <= 0) {
        proceed = false;
        errMsg = "Invalid Email or Phone";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result[0] : null,
    };
  } catch (error) {
    console.error("Error during user validation:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Database error occurred while validating user.",
      data: null,
    };
  }
}

export async function deleteUserFromDB(
  id: number,
  connection?: mariadb.Connection
) {
  let proceed: boolean = true;
  let errMsg: string = "";

  try {
    let result;
    if (connection) {
      result = await executeQuery(
        "DELETE FROM users WHERE id = ?",
        [id],
        connection
      );
    } else {
      result = await executeQuery("DELETE FROM users WHERE id = ?", [id]);
    }

    if (result.affectedRows <= 0) {
      proceed = false;
      errMsg = "User not found or already deleted.";
    }

    return {
      status: proceed,
      message: proceed ? "User deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error deleting user.",
      data: null,
    };
  }
}

export async function loadUserFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      const query = `SELECT * FROM users WHERE id = ?`;
      result = await executeQuery(query, [id]);

      if (result.length <= 0) {
        proceed = false;
        errMsg = "User not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "User loaded successfully." : errMsg,
      data: proceed ? result[0] : null,
    };
  } catch (error) {
    console.error("Error loading user:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading user.",
      data: null,
    };
  }
}

export async function getAllUserId4Dealer(dealer_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      const query = `SELECT id FROM users WHERE dealer_id = ?`;
      result = await executeQuery(query, [dealer_id]);

      if (result.length <= 0) {
        proceed = false;
        errMsg = "User not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "User loaded successfully." : errMsg,
      data: proceed
        ? (result = result.map((row: { id: number }) => row.id))
        : null,
    };
  } catch (error) {
    console.error("Error loading user:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading user.",
      data: null,
    };
  }
}

export async function runDBValidationsB4Saving(userData: userSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query;
  console.log("hii: ", userData);
  try {
    if (proceed) {
      if (userData.id) {
        query = `SELECT * FROM users WHERE email=? and id<>?`;
        result = await executeQuery(query, [userData.email, userData.id]);
      } else {
        query = `SELECT * FROM users WHERE email=?`;
        result = await executeQuery(query, [userData.email]);
      }

      if (result.length > 0) {
        proceed = false;
        errMsg = "Email already exists";
      }
    }

    if (proceed && userData.phone) {
      if (userData.id) {
        query = `SELECT * FROM users WHERE phone=? and id<>?`;
        result = await executeQuery(query, [userData.email, userData.id]);
      } else {
        query = `SELECT * FROM users WHERE phone=?`;
        result = await executeQuery(query, [userData.phone]);
      }

      if (result.length > 0) {
        proceed = false;
        errMsg = "Phone Number already exists";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error loading user:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading user.",
      data: null,
    };
  }
}
