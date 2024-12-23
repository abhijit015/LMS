"use server";

import { executeQueryInUserDB, getUserDBConn } from "../utils/db";
import mariadb from "mariadb";
import { userSchemaT } from "../utils/models";
import { getCurrentBusinessDet } from "../controllers/business.controller";

export async function checkIfPhoneExistsFromDB(phone: string) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;

  try {
    if (proceed) {
      query = "SELECT * FROM user_mast WHERE phone = ?";
      values = [phone];

      result = await executeQueryInUserDB(query, values);
      if (result.length > 0) {
        proceed = false;
        errMsg = "Phone Number Already Exists.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result[0] : null,
    };
  } catch (error) {
    console.error("Error during phone validation: ", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Database error occurred during phone validation:",
      data: null,
    };
  }
}

export async function checkIfMailExistsFromDB(email: string) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;

  try {
    if (proceed) {
      query = "SELECT * FROM user_mast WHERE email = ?";
      values = [email];

      result = await executeQueryInUserDB(query, values);
      if (result.length > 0) {
        proceed = false;
        errMsg = "Email ID Already Exists.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result[0] : null,
    };
  } catch (error) {
    console.error("Error during email validation: ", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Database error occurred during email validation:",
      data: null,
    };
  }
}

export async function saveOTPEntryInDB(
  email: string,
  phone: string,
  emailOTP: string,
  phoneOTP: string
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;
  let connection;

  try {
    connection = await getUserDBConn();
    await connection.beginTransaction();

    const otpExpirationTime = new Date(Date.now() + 5 * 60 * 1000);

    query = `DELETE FROM otp_verification WHERE identifier = ?`;

    if (proceed) {
      values = [email];
      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error removing existing email OTP entry.";
      }
    }

    if (proceed) {
      values = [phone];
      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error removing existing phone OTP entry.";
      }
    }

    query = `INSERT INTO otp_verification (identifier, otp, expires_at) VALUES (?, ?, ?)`;

    if (proceed) {
      values = [email, emailOTP, otpExpirationTime];
      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving email OTP.";
      }
    }

    if (proceed) {
      values = [phone, phoneOTP, otpExpirationTime];
      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving phone OTP.";
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "OTP entries saved successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error during OTP entry save:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error saving OTP entries.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

export async function validateOTPFromDB(
  email: string,
  phone: string,
  emailOTP: string,
  phoneOTP: string
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;
  let connection;

  try {
    connection = await getUserDBConn();
    await connection.beginTransaction();

    const currentTime = new Date();

    query = `SELECT otp, expires_at FROM otp_verification WHERE identifier = ?`;
    values = [email];
    result = await executeQueryInUserDB(query, values, connection);

    // if (result.length === 0) {
    //   proceed = false;
    //   errMsg = "Email OTP not found.";
    // } else {
    //   const otpData = result[0];
    //   if (otpData.otp !== emailOTP) {
    //     proceed = false;
    //     errMsg = "Invalid Email OTP.";
    //   } else if (new Date(otpData.expires_at) < currentTime) {
    //     proceed = false;
    //     errMsg = "Email OTP has expired.";
    //   } else {
    //     query = `DELETE FROM otp_verification WHERE identifier = ?`;
    //     values = [email];
    //     await executeQueryInUserDB(query, values, connection);
    //   }
    // }

    // if (proceed) {
    //   query = `SELECT otp, expires_at FROM otp_verification WHERE identifier = ?`;
    //   values = [phone];
    //   result = await executeQueryInUserDB(query, values, connection);

    //   if (result.length === 0) {
    //     proceed = false;
    //     errMsg = "Phone OTP not found.";
    //   } else {
    //     const otpData = result[0];
    //     if (otpData.otp !== phoneOTP) {
    //       proceed = false;
    //       errMsg = "Invalid Phone OTP.";
    //     } else if (new Date(otpData.expires_at) < currentTime) {
    //       proceed = false;
    //       errMsg = "Phone OTP has expired.";
    //     } else {
    //       query = `DELETE FROM otp_verification WHERE identifier = ?`;
    //       values = [phone];
    //       await executeQueryInUserDB(query, values, connection);
    //     }
    //   }
    // }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "OTP validated successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error during OTP validation:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error validating OTP.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

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
          UPDATE user_mast SET
            name = ?
          WHERE id = ?
        `;

        values = [data.name, data.id];
      } else {
        query = `
          INSERT INTO user_mast (
            email,
            phone,
            password,
            name
          ) VALUES (?, ?, ?, ?)
        `;

        values = [data.email, data.phone, data.password, data.name];
      }

      if (connection) {
        result = await executeQueryInUserDB(query, values, connection);
      } else {
        result = await executeQueryInUserDB(query, values);
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
      message: proceed ? "User saved successfully." : errMsg,
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

export async function validateSignInFromDB(username: string) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;

  try {
    if (proceed) {
      query = "SELECT id,password FROM user_mast WHERE email = ? OR phone = ?";
      values = [username, username];

      result = await executeQueryInUserDB(query, values);
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

export async function loadUserFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      const query = `SELECT * FROM user_mast WHERE id = ?`;
      result = await executeQueryInUserDB(query, [id]);

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

export async function updateUserBusinessMappingStatusInDB(
  userId: number,
  status: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;
  let connection;
  let businessData;

  try {
    connection = await getUserDBConn();
    await connection.beginTransaction();

    if (proceed) {
      result = await getCurrentBusinessDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        businessData = result.data;
      }
    }

    if (proceed) {
      query =
        "update user_business_mapping set status=? where user_id=? and business_id=?";

      values = [status, userId, businessData.id];

      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to update user_business_mapping status.";
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed
        ? "user_business_mapping status updated successfully."
        : errMsg,
      data: null,
    };
  } catch (error) {
    await connection?.rollback();
    console.error("Error updating user_business_mapping :", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error updating user_business_mapping.",
      data: null,
    };
  } finally {
    await connection?.end();
  }
}
