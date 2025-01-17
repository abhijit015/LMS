"use server";

import mariadb, { Connection } from "mariadb";
import { inviteSchemaT } from "../utils/models";
import { executeQueryInUserDB, getDBConn, getUserDBConn } from "../utils/db";
import {
  getCurrentBusinessDet,
  getCurrentUserRole,
} from "../controllers/business.controller";
import { getCurrentUserDet } from "../controllers/user.controller";
import {
  INVITE_STATUS_ACCEPTED,
  INVITE_STATUS_PENDING,
  ROLE_DEALER_ADMIN,
  ROLE_DEALER_EXECUTIVE,
  USER_BUSINESS_MAPPING_STATUS_ACTIVE,
} from "../utils/constants";
import { getHostAndPort4Business } from "../controllers/business.controller";
import { getCurrentDealerDet } from "../controllers/dealer.controller";
import { loadInvite } from "../controllers/invite.controller";
import { initInviteData } from "../utils/common";

export async function loadInviteFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let inviteData;
  let result;
  let query;

  try {
    if (proceed) {
      query = `SELECT * FROM invite_mast WHERE id = ?`;
      result = await executeQueryInUserDB(query, [id]);

      if (result.length > 0) {
        inviteData = result[0];
      } else {
        proceed = false;
        errMsg = "Invite not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Invite loaded successfully." : errMsg,
      data: proceed ? inviteData : null,
    };
  } catch (error) {
    console.error("Error loading invite:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading invite.",
      data: null,
    };
  }
}

export async function loadInvite4CurrentBusinessFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let businessData;
  let result;
  let query;
  let currentRole;
  let dealerData;

  try {
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
      result = await getCurrentUserRole();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        currentRole = result.data;
      }
    }

    if (proceed && currentRole === ROLE_DEALER_ADMIN) {
      result = await getCurrentDealerDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        dealerData = result.data;
      }
    }

    if (proceed) {
      if (
        currentRole === ROLE_DEALER_ADMIN ||
        currentRole === ROLE_DEALER_EXECUTIVE
      ) {
        query =
          "SELECT * FROM invite_mast WHERE business_id = ? and dealer_id=? and role in (" +
          String(ROLE_DEALER_EXECUTIVE) +
          ")";
        result = await executeQueryInUserDB(query, [
          businessData.id,
          dealerData.id,
        ]);
      } else {
        query =
          "SELECT * FROM invite_mast WHERE business_id = ? and role<>" +
          String(ROLE_DEALER_EXECUTIVE);
        result = await executeQueryInUserDB(query, [businessData.id]);
      }

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading invite list.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Invite list loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading invite:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading invite.",
      data: null,
    };
  }
}

export async function loadInvite4CurrentUserFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let userData;
  let result;
  let query;

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

    if (proceed) {
      query =
        "SELECT (SELECT name FROM business_mast WHERE id = business_id) AS business_name,  invite_mast.*  FROM invite_mast WHERE (identifier = ? OR identifier = ?) and status=" +
        String(INVITE_STATUS_PENDING);
      result = await executeQueryInUserDB(query, [
        userData.email,
        userData.phone,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading invite list.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Invite list loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading invite:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading invite.",
      data: null,
    };
  }
}

export async function saveInviteInDB(
  inviteData: inviteSchemaT,
  connection?: Connection
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let userDBConn;
  let result;
  let userData;
  let db_host;
  let db_port;
  let businessDBConn;
  let oldInviteData: inviteSchemaT;

  try {
    if (connection) {
      userDBConn = connection;
    } else {
      userDBConn = await getUserDBConn();
      await userDBConn.beginTransaction();
    }

    oldInviteData = initInviteData();

    if (proceed && inviteData.id && !connection) {
      result = await loadInvite(inviteData.id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        oldInviteData = result.data;
      }
    }

    if (proceed) {
      if (inviteData.id) {
        query = `
              UPDATE invite_mast SET
                name = ?,
                identifier=?,
                status = ?,
                entity_id=?,
                updated_by = ?
              WHERE id = ?
            `;
        values = [
          inviteData.name,
          inviteData.identifier,
          inviteData.status,
          inviteData.entity_id,
          inviteData.updated_by,
          inviteData.id,
        ];
      } else {
        query = `
              INSERT INTO invite_mast (business_id,name,identifier,role,entity_id,dealer_id,status,created_by,updated_by)
              VALUES (?,?,?,?,?,?,?,?,?)
            `;
        values = [
          inviteData.business_id,
          inviteData.name,
          inviteData.identifier,
          inviteData.role,
          inviteData.entity_id,
          inviteData.dealer_id,
          inviteData.status,
          inviteData.created_by,
          inviteData.updated_by,
        ];
      }

      result = await executeQueryInUserDB(query, values, userDBConn);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving invite.";
      } else {
        if (!inviteData.id) {
          inviteData.id = result.insertId;
        }
      }
    }

    if (
      proceed &&
      inviteData.status === INVITE_STATUS_ACCEPTED &&
      oldInviteData.status !== INVITE_STATUS_ACCEPTED
    ) {
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
        result = await getHostAndPort4Business(inviteData.business_id);

        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          db_host = result.data?.db_host || "";
          db_port = result.data?.db_port || 0;
        }
      }

      if (proceed && db_host && db_port) {
        try {
          businessDBConn = await getDBConn(
            db_host,
            db_port,
            `businessDB_${inviteData.business_id}`
          );

          await businessDBConn.beginTransaction();

          if (inviteData.role === ROLE_DEALER_ADMIN) {
            query = "update dealer_mast set mapped_user_id=? where invite_id=?";
            const dealerUpdateResult = await businessDBConn.query(query, [
              userData.id,
              inviteData.id,
            ]);

            query = "SELECT id FROM dealer_mast WHERE invite_id = ?";
            const dealerResult = await businessDBConn.query(query, [
              inviteData.id,
            ]);
            const dealerId = dealerResult[0]?.id;

            query =
              "update executive_mast set mapped_user_id=? where dealer_id=? and role_id=1";
            await businessDBConn.query(query, [userData.id, dealerId]);
          } else {
            query =
              "update executive_mast set mapped_user_id=? where invite_id=?";
            await businessDBConn.query(query, [userData.id, inviteData.id]);
          }

          await businessDBConn.commit();
        } catch (error) {
          if (businessDBConn) await businessDBConn.rollback();
          proceed = false;
          errMsg =
            error instanceof Error ? error.message : "Unknown error occurred.";
          console.error("Error updating mapped user in dealers table:", error);
        } finally {
          if (businessDBConn) await businessDBConn.end();
        }
      }

      if (proceed) {
        query = `
              INSERT INTO user_business_mapping (user_id, business_id, role, status )
              VALUES (?,?,?,? )
            `;
        values = [
          userData.id,
          inviteData.business_id,
          inviteData.role,
          USER_BUSINESS_MAPPING_STATUS_ACTIVE,
        ];

        result = await executeQueryInUserDB(query, values, userDBConn);

        if (result.affectedRows <= 0) {
          proceed = false;
          errMsg = "Error saving user_business_mapping.";
        }
      }
    }

    if (!connection) {
      if (proceed) {
        await userDBConn.commit();
      } else {
        await userDBConn.rollback();
      }
    }

    return {
      status: proceed,
      message: proceed ? "Invite saved successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (businessDBConn) await businessDBConn.rollback();
    if (userDBConn && !connection) await userDBConn.rollback();
    console.error("Error saving invite:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving invite.",
      data: null,
    };
  } finally {
    if (businessDBConn) await businessDBConn.end();
    if (userDBConn && !connection) await userDBConn.end();
  }
}
