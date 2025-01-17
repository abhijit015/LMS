"use server";

import { getHostAndPort4Business } from "../controllers/business.controller";
import {
  canInviteBeSaved,
  loadInvite,
  setInviteDataB4Saving,
} from "../controllers/invite.controller";
import { getCurrentUserDet } from "../controllers/user.controller";
import { initInviteData } from "../utils/common";
import {
  ROLE_BUSINESS_ADMIN,
  USER_BUSINESS_MAPPING_STATUS_ACTIVE,
  INVITE_STATUS_DEREGISTERED,
  ROLE_DEALER_ADMIN,
} from "../utils/constants";
import {
  getBusinessIdFromCookies,
  getUserIdFromCookies,
} from "../utils/cookies";
import { executeQueryInUserDB, getDBConn, getUserDBConn } from "../utils/db";
import { businessSchemaT, inviteSchemaT } from "../utils/models";
import { saveInviteInDB } from "./invite.service";

export async function loadBusinessListFromDB(userId: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  try {
    if (proceed) {
      query = `SELECT b.name, b.id, ubm.role from business_mast as b, user_business_mapping as ubm where b.id=ubm.business_id and ubm.user_id=? and ubm.status=? order by b.name`;
      result = await executeQueryInUserDB(query, [
        userId,
        USER_BUSINESS_MAPPING_STATUS_ACTIVE,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading business  list.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Business loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading business :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading business .",
      data: null,
    };
  }
}

export async function saveBusinessInDB(data: businessSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;
  let connection;
  let db_host: string = "";
  let db_port: number = 0;
  let db_name: string = "";
  let db_info_id: number = 0;
  let businessId: number = 0;

  try {
    connection = await getUserDBConn();
    await connection.beginTransaction();

    if (proceed) {
      if (!data.id) {
        query = "select id,host,port from db_info where use_next=TRUE";
        values = [];
        result = await executeQueryInUserDB(query, values, connection);
        if (result.length > 0) {
          console.log("result : ", result);
          db_host = result[0].host;
          db_port = result[0].port;
          db_info_id = result[0].id;
        } else {
          proceed = false;
          errMsg = "Host and Port Details Not Found.";
        }
      }
    }

    if (proceed) {
      if (data.id) {
        query = `
            UPDATE business_mast SET
              name = ?,
              updated_by = ?
            WHERE id = ?
          `;

        values = [data.name, data.updated_by, data.id];
      } else {
        query = `
            INSERT INTO business_mast (
              name,db_info_id,created_by,updated_by
            ) VALUES (?, ?,?, ?)
          `;

        values = [data.name, db_info_id, data.created_by, data.updated_by];
      }

      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to save  business.";
      } else {
        if (!data.id) {
          businessId = result.insertId;
          db_name = "businessDB_" + String(businessId);
        }
      }
    }

    if (proceed && !data.id) {
      query =
        "insert into user_business_mapping (user_id, business_id,role,status) values (?,?,?,?)";
      values = [
        data.created_by,
        businessId,
        ROLE_BUSINESS_ADMIN,
        USER_BUSINESS_MAPPING_STATUS_ACTIVE,
      ];
      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to save user_business_mapping.";
      }
    }

    if (proceed && !data.id) {
      result = await createBusinessDB(db_name, db_host, db_port);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Business saved successfully." : errMsg,
      data: proceed ? data.id : null,
    };
  } catch (error) {
    await connection?.rollback();
    console.error("Error saving Business :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error saving Business .",
      data: null,
    };
  } finally {
    await connection?.end();
  }
}

export async function loadBusinessFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let businessData = null;
  let query;

  try {
    if (proceed) {
      query = "select * from business_mast where id=?";
      const result = await executeQueryInUserDB(query, [id]);

      if (result.length > 0) {
        businessData = result[0];
      } else {
        proceed = false;
        errMsg = "business  not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Business loaded successfully." : errMsg,
      data: businessData,
    };
  } catch (error) {
    console.error("Error loading Business :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading Business .",
      data: null,
    };
  }
}

export async function getUserRole4BusinessFromDB(
  userId: number,
  businessId: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;

  try {
    if (proceed) {
      query =
        "select role from user_business_mapping where user_id=? and business_id=?";
      result = await executeQueryInUserDB(query, [userId, businessId]);

      if (result.length <= 0) {
        proceed = false;
        errMsg = "No mapping found between user and business.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success." : errMsg,
      data: proceed ? result[0].role : null,
    };
  } catch (error) {
    console.error("Error loading user business mapping :", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error loading user business mapping .",
      data: null,
    };
  }
}

export async function checkIfBusinessLoggedInFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;

  try {
    const businessId = await getBusinessIdFromCookies();
    if (!businessId) {
      proceed = false;
    }

    const userId = await getUserIdFromCookies();
    if (!userId) {
      proceed = false;
    }

    if (proceed) {
      query =
        "select * from user_business_mapping where user_id=? and business_id=?";
      result = await executeQueryInUserDB(query, [userId, businessId]);

      if (result.length <= 0) {
        proceed = false;
        errMsg = "No mapping found between user and business.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error loading user business mapping :", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error loading user business mapping .",
      data: null,
    };
  }
}

export async function deleteBusinessFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;
  let connection;
  let db_host: string = "";
  let db_port: number = 0;

  try {
    connection = await getUserDBConn();
    await connection.beginTransaction();

    if (proceed) {
      result = await getHostAndPort4Business(id);

      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        db_host = result.data?.db_host || "";
        db_port = result.data?.db_port || 0;
      }
    }

    if (proceed) {
      query = "delete from invite_mast where business_id = ?";
      values = [id];

      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Unable to delete invites.";
      }
    }

    if (proceed) {
      query = "delete from user_business_mapping where business_id = ?";
      values = [id];

      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete user_business_mapping.";
      }
    }

    if (proceed) {
      query = "delete from business_mast where id = ?";
      values = [id];

      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete Business .";
      }
    }

    if (proceed) {
      let dropDBCon;
      try {
        dropDBCon = await getDBConn(db_host, db_port);
        const dbName = `businessDB_${id}`;
        const query = `DROP DATABASE ${dbName}`;

        await dropDBCon.query(query);
        console.log(`Database ${dbName} dropped successfully.`);
      } catch (error) {
        proceed = false;
        (errMsg =
          error instanceof Error ? error.message : "Unable to drop database."),
          console.error("Error dropping database:", error);
      } finally {
        if (dropDBCon) dropDBCon.end();
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? " business deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    await connection?.rollback();
    console.error("Error deleting business :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error deleting business .",
      data: null,
    };
  } finally {
    await connection?.end();
  }
}

export async function deregisterFromBusinessInDB(business_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;
  let connection;
  let db_host: string = "";
  let db_port: number = 0;
  let userData;
  let inviteData: inviteSchemaT;

  try {
    inviteData = initInviteData();

    connection = await getUserDBConn();
    await connection.beginTransaction();

    if (proceed) {
      result = await getCurrentUserDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        userData = result.data;
      }
    }

    if (proceed) {
      query =
        "delete from user_business_mapping where business_id = ? and user_id=?";
      values = [business_id, userData.id];

      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete user_business_mapping.";
      }
    }

    if (proceed) {
      const query =
        "SELECT id FROM invite_mast WHERE business_id = ? AND (identifier = ? OR identifier = ?)";
      const values = [business_id, userData.email, userData.phone];

      result = await executeQueryInUserDB(query, values, connection);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to fetch invite id.";
      } else {
        inviteData.id = result[0].id;
      }
    }

    if (proceed) {
      result = await loadInvite(inviteData.id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        inviteData = result.data;
        inviteData.status = INVITE_STATUS_DEREGISTERED;
      }
    }

    if (proceed) {
      result = await setInviteDataB4Saving(inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canInviteBeSaved(inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveInviteInDB(inviteData, connection);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await getHostAndPort4Business(business_id);

      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        db_host = result.data?.db_host || "";
        db_port = result.data?.db_port || 0;
      }
    }

    if (proceed) {
      let businessDBConn;
      try {
        businessDBConn = await getDBConn(db_host, db_port);
        const dbName = `businessDB_${business_id}`;
        await businessDBConn.query("USE " + dbName);

        if (inviteData.role === ROLE_DEALER_ADMIN) {
          query =
            "update dealer_mast set mapped_user_id=0 where id=" +
            inviteData.entity_id;
          await businessDBConn.query(query);

          query =
            "update executive_mast set mapped_user_id=0 where dealer_id=? and role_id=1";
          await businessDBConn.query(query, [inviteData.entity_id]);
        } else {
          query =
            "update executive_mast set mapped_user_id=0 where id=" +
            inviteData.entity_id;
          await businessDBConn.query(query);
        }
      } catch (error) {
        proceed = false;
        (errMsg =
          error instanceof Error
            ? error.message
            : "Unable to remove mapped user."),
          console.error("Error removing mapped user:", error);
      } finally {
        if (businessDBConn) businessDBConn.end();
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Deregistration Successful." : errMsg,
      data: null,
    };
  } catch (error) {
    await connection?.rollback();
    console.error("Error deregistering user from business:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error deregistering user from business.",
      data: null,
    };
  } finally {
    await connection?.end();
  }
}

export async function getHostAndPort4BusinessFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;
  let db_host: string = "";
  let db_port: number = 0;

  try {
    if (proceed) {
      query =
        "SELECT db.port, db.host FROM db_info AS db, business_mast AS b WHERE b.db_info_id=db.id AND b.id=?";
      values = [id];
      result = await executeQueryInUserDB(query, values);

      if (result.length > 0) {
        db_host = result[0].host;
        db_port = result[0].port;
      } else {
        proceed = false;
        errMsg = "Host and Port Details Not Found for the specified business .";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Business details fetched successfully." : errMsg,
      data: proceed ? { db_host, db_port } : null,
    };
  } catch (error) {
    console.error("Error fetching business  details:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error fetching business  details.",
      data: null,
    };
  }
}

async function createBusinessDB(
  name: string,
  host: string,
  port: number
): Promise<any> {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let conn;
  let query;
  let userData;

  try {
    if (proceed) {
      result = await getCurrentUserDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        userData = result.data;
      }
    }

    conn = await getDBConn(host, port);

    const dbExists = await conn.query(`SHOW DATABASES LIKE ?`, [name]);
    if (dbExists.length > 0) {
      proceed = false;
      errMsg = `Database ${name} already exists.`;
      console.log(`Database ${name} already exists.`);
    }

    if (proceed) {
      result = await conn.query("CREATE DATABASE " + name);
      if (!result) {
        proceed = false;
        errMsg = `Error creating database ${name}.`;
      } else {
        console.log(`Created database ${name}.`);
      }
    }

    if (proceed) {
      await conn.query("USE " + name);

      query = `
        CREATE TABLE IF NOT EXISTS product_mast (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL UNIQUE,
          license_num_identifier CHAR(2) NOT NULL UNIQUE,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS dealer_mast (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL UNIQUE,
          mapped_user_id INT NULL,
          invite_id INT NULL UNIQUE,
          contact_name VARCHAR(255) NOT NULL UNIQUE,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS dealer_product_mapping (
          id INT PRIMARY KEY AUTO_INCREMENT,
          dealer_id INT NOT NULL,
          product_id INT NOT NULL,
          FOREIGN KEY (dealer_id) REFERENCES dealer_mast(id),
          FOREIGN KEY (product_id) REFERENCES product_mast(id)
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS role_mast (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL UNIQUE,
          hierarchy TINYINT NOT NULL UNIQUE,
          updated_by INT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `;
      await conn.query(query);

      query = `INSERT INTO role_mast (name, hierarchy,updated_by) VALUES (?, ?, ?);`;
      await conn.query(query, ["Owner", 0, userData.id]);

      query = `INSERT INTO role_mast (name, hierarchy,updated_by) VALUES (?, ?, ?);`;
      await conn.query(query, ["Department Head", 1, userData.id]);

      query = `INSERT INTO role_mast (name, hierarchy,updated_by) VALUES (?, ?, ?);`;
      await conn.query(query, ["Manager", 2, userData.id]);

      query = `INSERT INTO role_mast (name, hierarchy,updated_by) VALUES (?, ?, ?);`;
      await conn.query(query, ["Senior Executive", 3, userData.id]);

      query = `INSERT INTO role_mast (name, hierarchy,updated_by) VALUES (?, ?, ?);`;
      await conn.query(query, ["Junior Executive", 4, userData.id]);

      query = `
        CREATE TABLE IF NOT EXISTS department_mast (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          dealer_id INT NULL,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (dealer_id) REFERENCES dealer_mast(id)
        );
      `;
      await conn.query(query);

      query = `INSERT INTO department_mast (name, created_by,updated_by) VALUES (?, ?, ?);`;
      await conn.query(query, ["Admin", userData.id, userData.id]);

      query = `
        CREATE TABLE IF NOT EXISTS executive_mast (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          mapped_user_id INT NULL,
          dealer_id INT NULL,
          department_id INT NOT NULL,
          role_id INT NOT NULL,
          invite_id INT NULL UNIQUE,
          contact_name VARCHAR(255) NOT NULL UNIQUE,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (dealer_id) REFERENCES dealer_mast(id),
          FOREIGN KEY (department_id) REFERENCES department_mast(id),
          FOREIGN KEY (role_id) REFERENCES role_mast(id)
        );
      `;
      await conn.query(query);

      query = `INSERT INTO executive_mast (name, mapped_user_id, department_id, role_id, contact_name, created_by, updated_by) VALUES (?, ?, ?,?,?,?,?);`;
      await conn.query(query, [
        userData.name,
        userData.id,
        1,
        1,
        userData.name,
        userData.id,
        userData.id,
      ]);

      query = `
        CREATE TABLE IF NOT EXISTS product_variants (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          is_free_variant BOOLEAN NOT NULL DEFAULT(FALSE),
          product_id INT NOT NULL,
          no_of_users INT NULL,
          no_of_days INT NULL,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES product_mast(id)
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS addon_mast (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL UNIQUE,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS variant_pricing (
          id INT PRIMARY KEY AUTO_INCREMENT,
          product_id INT NOT NULL,
          product_variant_id INT NOT NULL,
          effective_from DATE NOT NULL,
          price INT NOT NULL,
          early_discount_percentage INT NOT NULL,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES product_mast(id),
          FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        );
 `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS addon_plan (
          id INT PRIMARY KEY AUTO_INCREMENT,
          addon_id INT NOT NULL,
          product_id INT NOT NULL,
          product_variant_id INT NOT NULL,
          effective_from DATE NOT NULL,
          plan_name VARCHAR(255) NOT NULL,
          value INT NOT NULL,
          price INT NOT NULL,
          grace INT NOT NULL,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (addon_id) REFERENCES addon_mast(id),
          FOREIGN KEY (product_id) REFERENCES product_mast(id),
          FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS validity_discount_slab (
          id INT PRIMARY KEY AUTO_INCREMENT,
          product_id INT NOT NULL,
          product_variant_id INT NOT NULL,
          effective_from DATE NOT NULL,
          start_value INT NOT NULL,
          end_value INT NOT NULL,
          discount_percentage INT NOT NULL,
          grace INT NULL,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES product_mast(id),
          FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS user_discount_slab (
          id INT PRIMARY KEY AUTO_INCREMENT,
          product_id INT NOT NULL,
          product_variant_id INT NOT NULL,
          effective_from DATE NOT NULL,
          start_value INT NOT NULL,
          end_value INT NOT NULL,
          discount_percentage INT NOT NULL,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES product_mast(id),
          FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS scheme_mast (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL UNIQUE,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS license_det (
          id INT PRIMARY KEY AUTO_INCREMENT,
          license_no VARCHAR(255) NOT NULL UNIQUE,
          product_id INT NOT NULL,
          entity_id INT NOT NULL,
          entity_identifier VARCHAR(255) NULL,
          contact_name VARCHAR(255) NULL,
          contact_email VARCHAR(255) NULL,
          contact_phone VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES product_mast(id)
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS license_status (
          id INT PRIMARY KEY AUTO_INCREMENT,
          license_id INT NOT NULL,
          product_variant_id INT NOT NULL,
          no_of_users INT NOT NULL,
          current_users INT NOT NULL,
          last_dealer_id INT NULL,
          expiry_date DATE NULL,
          grace INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by INT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_by INT NULL,
          FOREIGN KEY (license_id) REFERENCES license_det(id),
          FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
          FOREIGN KEY (last_dealer_id) REFERENCES dealer_mast(id)
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS license_tran (
          id INT PRIMARY KEY AUTO_INCREMENT,
          vch_no VARCHAR(255) NULL UNIQUE,
          license_id INT NOT NULL,
          tran_type INT NOT NULL,
          product_variant_id INT NULL,
          no_of_users INT NULL,
          no_of_months INT NULL,
          dealer_id INT NULL,
          addon_id INT NULL,
          addon_plan_id INT NULL,
          remarks VARCHAR(255) NULL,
          payment_mode TINYINT NULL,
          payment_ref_no VARCHAR(255) NULL,
          payment_amt INT NULL,
          scheme_id INT NULL,
          tran_nature TINYINT NOT NULL,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (license_id) REFERENCES license_det(id),
          FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
          FOREIGN KEY (dealer_id) REFERENCES dealer_mast(id),
          FOREIGN KEY (addon_id) REFERENCES addon_mast(id),
          FOREIGN KEY (addon_plan_id) REFERENCES addon_plan(id),
          FOREIGN KEY (scheme_id) REFERENCES scheme_mast(id)
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS addon_status (
          id INT PRIMARY KEY AUTO_INCREMENT,
          license_id INT NOT NULL,
          addon_id INT NULL,
          addon_plan_id INT NULL,
          balance_addon_value INT NOT NULL,
          grace INT NULL,
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (license_id) REFERENCES license_det(id),
          FOREIGN KEY (addon_id) REFERENCES addon_mast(id),
          FOREIGN KEY (addon_plan_id) REFERENCES addon_plan(id)
        );
      `;
      await conn.query(query);

      query = `
        CREATE TABLE IF NOT EXISTS dealer_credit_tran (
          id INT PRIMARY KEY AUTO_INCREMENT,
          vch_no VARCHAR(255) NULL UNIQUE,
          dealer_id INT NULL,
          tran_type INT NOT NULL,
          license_tran_id INT NULL,
          modified_credits INT NOT NULL,
          invoice_no VARCHAR(255) NULL,
          invoice_date DATE NULL,
          tran_date DATE NOT NULL,
          remarks VARCHAR(255) NULL,
          created_by INT NOT NULL,
          updated_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (dealer_id) REFERENCES dealer_mast(id),
          FOREIGN KEY (license_tran_id) REFERENCES license_tran(id)
        );
      `;
      await conn.query(query);
    }
  } catch (error) {
    if (conn) {
      try {
        await conn.query(`DROP DATABASE IF EXISTS ${name}`);
        console.log(`Database ${name} dropped due to error.`);
      } catch (dropError) {
        console.error("Error dropping database:", dropError);
      }
    }

    console.error("Error creating or selecting database:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  } finally {
    if (conn) {
      conn.end();
    }
  }

  return {
    status: proceed,
    message: proceed ? `Database ${name} is ready and tables created.` : errMsg,
    data: proceed ? result : null,
  };
}
