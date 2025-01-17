"use server";

import {
  getCurrentBusinessDet,
  getCurrentUserRole,
} from "../controllers/business.controller";
import { getCurrentDealerDet } from "../controllers/dealer.controller";
import { loadExecutive } from "../controllers/executive.controller";
import {
  ROLE_BUSINESS_EXECUTIVE,
  ROLE_DEALER_ADMIN,
  ROLE_DEALER_EXECUTIVE,
} from "../utils/constants";
import {
  executeQueryInBusinessDB,
  executeQueryInUserDB,
  getBusinessDBConn,
  getUserDBConn,
} from "../utils/db";
import { executiveSchemaT, inviteSchemaT } from "../utils/models";
import { loadInviteFromDB, saveInviteInDB } from "./invite.service";

export async function loadExecutiveListFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  let currentRole;
  let dealerData;
  let executiveResult;
  let inviteData;
  let businessData;

  try {
    if (proceed) {
      const result = await getCurrentBusinessDet();
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
      if (currentRole === ROLE_DEALER_ADMIN) {
        query = `SELECT *, (select name from role_mast where id=role_id) as role, (select name from department_mast where id=department_id) as department from executive_mast where dealer_id=? and role_id<>1 order by name`;
        executiveResult = await executeQueryInBusinessDB(query, [
          dealerData.id,
        ]);
      } else {
        query = `SELECT *, (select name from role_mast where id=role_id) as role, (select name from department_mast where id=department_id) as department from executive_mast where dealer_id=0 or dealer_id IS NULL and role_id<>1 order by name`;
        executiveResult = await executeQueryInBusinessDB(query);
      }
      if (executiveResult.length < 0) {
        proceed = false;
        errMsg = "Error fetching list.";
      }
    }

    if (proceed && executiveResult.length > 0) {
      for (let i = 0; i < executiveResult.length; i++) {
        const executive = executiveResult[i];

        if (proceed) {
          const inviteResult = await loadInviteFromDB(executive.invite_id);
          if (inviteResult.status) {
            inviteData = inviteResult.data;
            executive.contact_identifier = inviteData.identifier;
            executive.inviteStatus = inviteData.status;
          } else {
            proceed = false;
            errMsg = inviteResult.message;
            break;
          }
        }

        if (proceed && executive.mapped_user_id) {
          query = `SELECT status FROM user_business_mapping WHERE user_id = ? and business_id=? `;
          const userMappingResult = await executeQueryInUserDB(query, [
            executive.mapped_user_id,
            businessData.id,
          ]);

          if (userMappingResult.length > 0) {
            executive.executiveStatus = userMappingResult[0].status;
          } else {
            proceed = false;
            errMsg = "Error loading user_business_mapping status.";
            break;
          }
        }
      }
    }

    return {
      status: proceed,
      message: proceed ? "Executives loaded successfully." : errMsg,
      data: proceed ? executiveResult : null,
    };
  } catch (error) {
    console.error("Error loading executives:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading executives.",
      data: null,
    };
  }
}

export async function saveExecutiveInDB(
  executiveData: executiveSchemaT,
  inviteData: inviteSchemaT
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let businessDBConn;
  let userDBConn;
  let result;
  let oldExecutiveData: executiveSchemaT | null = null;

  try {
    businessDBConn = await getBusinessDBConn();
    await businessDBConn.beginTransaction();

    userDBConn = await getUserDBConn();
    await userDBConn.beginTransaction();

    if (executiveData.id) {
      result = await loadExecutive(executiveData.id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        oldExecutiveData = result.data;
      }
    }

    if (proceed && executiveData.send_invitation) {
      result = await saveInviteInDB(inviteData, userDBConn);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        if (!executiveData.invite_id) executiveData.invite_id = inviteData.id;
      }
    }

    if (proceed) {
      if (executiveData.id) {
        query = `
                UPDATE executive_mast SET
                  name = ?,
                  contact_name=?,
                  mapped_user_id=?,
                  department_id=?,
                  role_id=?,
                  updated_by = ?
                WHERE id = ?
              `;
        values = [
          executiveData.name,
          executiveData.contact_name,
          executiveData.mapped_user_id,
          executiveData.department_id,
          executiveData.role_id,
          executiveData.updated_by,
          executiveData.id,
        ];
      } else {
        query = `
                INSERT INTO executive_mast (name,contact_name,mapped_user_id,department_id,role_id,dealer_id,invite_id,created_by,updated_by)
                VALUES (?,?,?,?,?,?,?,?,?)
              `;
        values = [
          executiveData.name,
          executiveData.contact_name,
          executiveData.mapped_user_id,
          executiveData.department_id,
          executiveData.role_id,
          executiveData.dealer_id,
          executiveData.invite_id,
          executiveData.created_by,
          executiveData.updated_by,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error saving executive.";
      } else {
        if (!executiveData.id) {
          executiveData.id = result.insertId;
        }
      }
    }

    if (
      proceed &&
      oldExecutiveData?.mapped_user_id &&
      !executiveData.mapped_user_id
    ) {
      result = await executeQueryInUserDB(
        "delete from user_business_mapping where user_id=? and business_id=?",
        [oldExecutiveData.mapped_user_id, inviteData.business_id],
        userDBConn
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete dealer.";
      }
    }

    if (
      proceed &&
      !inviteData.entity_id &&
      executiveData.id &&
      executiveData.send_invitation
    ) {
      inviteData.entity_id = executiveData.id;

      result = await saveInviteInDB(inviteData, userDBConn);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      await businessDBConn.commit();
      await userDBConn.commit();
    } else {
      await businessDBConn.rollback();
      await userDBConn.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Executive saved successfully." : errMsg,
      data: proceed ? executiveData.id : null,
    };
  } catch (error) {
    if (businessDBConn) await businessDBConn.rollback();
    if (userDBConn) await userDBConn.rollback();
    console.error("Error saving executive:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error saving executive.",
      data: null,
    };
  } finally {
    if (businessDBConn) businessDBConn.end();
    if (userDBConn) userDBConn.end();
  }
}

export async function loadExecutiveFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let executiveData;
  let result;
  let query;
  let inviteData;
  let businessData;

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
      query = `SELECT * FROM executive_mast WHERE id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        executiveData = result[0];
      } else {
        proceed = false;
        errMsg = "Executive not found.";
      }
    }

    if (proceed) {
      result = await loadInviteFromDB(executiveData.invite_id);
      if (result.status) {
        inviteData = result.data;
        executiveData.contact_identifier = inviteData.identifier;
        executiveData.inviteStatus = inviteData.status;
      } else {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed && executiveData.mapped_user_id) {
      query = `SELECT status FROM user_business_mapping WHERE user_id = ? and business_id=? `;
      result = await executeQueryInUserDB(query, [
        executiveData.mapped_user_id,
        businessData.id,
      ]);

      if (result.length > 0) {
        executiveData.executiveStatus = result[0].status;
      } else {
        proceed = false;
        errMsg = "Error loading user_business_mapping status.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Executive loaded successfully." : errMsg,
      data: proceed ? executiveData : null,
    };
  } catch (error) {
    console.error("Error loading executive:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading executive.",
      data: null,
    };
  }
}

export async function loadExecutiveByMappedUserFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let executiveData;
  let result;
  let query;

  try {
    if (proceed) {
      query = `SELECT * FROM executive_mast WHERE mapped_user_id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        executiveData = result[0];
      } else {
        proceed = false;
        errMsg = "Executive not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Executive loaded successfully." : errMsg,
      data: proceed ? executiveData : null,
    };
  } catch (error) {
    console.error("Error loading executive:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading executive.",
      data: null,
    };
  }
}

export async function deleteExecutiveFromDB(executiveId: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query;
  let businessDBConn;
  let userDBConn;
  let values: any[];
  let executiveData;
  let businessData;

  try {
    businessDBConn = await getBusinessDBConn();
    await businessDBConn.beginTransaction();

    userDBConn = await getUserDBConn();
    await userDBConn.beginTransaction();

    if (proceed) {
      result = await loadExecutive(executiveId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        executiveData = result.data;
      }
    }

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
      result = await executeQueryInBusinessDB(
        "delete from executive_mast where id=?",
        [executiveId],
        businessDBConn
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete executive.";
      }
    }

    if (proceed && executiveData.mapped_user_id) {
      result = await executeQueryInUserDB(
        "delete from user_business_mapping where user_id=? and business_id=?",
        [executiveData.mapped_user_id, businessData.id],
        userDBConn
      );

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete executive.";
      }
    }

    if (proceed) {
      result = await executeQueryInUserDB(
        "delete from invite_mast where id=? ",
        [executiveData.invite_id],
        userDBConn
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error deleting invites.";
      }
    }

    if (proceed) {
      await businessDBConn.commit();
      await userDBConn.commit();
    } else {
      await businessDBConn.rollback();
      await userDBConn.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Executive deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (businessDBConn) await businessDBConn.rollback();
    if (userDBConn) await userDBConn.rollback();
    console.error("Error deleting executive:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error deleting executive.",
      data: null,
    };
  } finally {
    if (businessDBConn) businessDBConn.end();
    if (userDBConn) userDBConn.end();
  }
}
