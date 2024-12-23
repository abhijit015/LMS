"use server";

import { getCurrentBusinessDet } from "../controllers/business.controller";
import { loadDealer } from "../controllers/dealer.controller";
import { ROLE_DEALER_ADMIN } from "../utils/constants";
import {
  executeQueryInBusinessDB,
  executeQueryInUserDB,
  getBusinessDBConn,
  getUserDBConn,
} from "../utils/db";
import { dealerSchemaT, inviteSchemaT } from "../utils/models";
import { loadInviteFromDB, saveInviteInDB } from "./invite.service";

export async function loadDealerListFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let dealersResult;
  let businessData;
  let inviteData;

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
      query = `SELECT * from dealer_mast order by name`;
      dealersResult = await executeQueryInBusinessDB(query);
      if (dealersResult.length < 0) {
        proceed = false;
        errMsg = "Error fetching dealers.";
      }
    }

    if (proceed && dealersResult.length > 0) {
      for (let i = 0; i < dealersResult.length; i++) {
        const dealer = dealersResult[i];

        if (proceed) {
          const inviteResult = await loadInviteFromDB(dealer.invite_id);
          if (inviteResult.status) {
            inviteData = inviteResult.data;
            dealer.contact_identifier = inviteData.identifier;
            dealer.inviteStatus = inviteData.status;
          } else {
            proceed = false;
            errMsg = inviteResult.message;
            break;
          }
        }

        if (proceed && dealer.mapped_user_id) {
          query = `SELECT status FROM user_business_mapping WHERE user_id = ? and business_id=? `;
          const userMappingResult = await executeQueryInUserDB(query, [
            dealer.mapped_user_id,
            businessData.id,
          ]);

          if (userMappingResult.length > 0) {
            dealer.dealerStatus = userMappingResult[0].status;
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
      message: proceed ? "Dealers loaded successfully." : errMsg,
      data: proceed ? dealersResult : null,
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

export async function saveDealerInDB(
  dealerData: dealerSchemaT,
  inviteData: inviteSchemaT
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let businessDBConn;
  let userDBConn;
  let result;
  let oldDealerData: dealerSchemaT | null = null;

  try {
    businessDBConn = await getBusinessDBConn();
    await businessDBConn.beginTransaction();

    userDBConn = await getUserDBConn();
    await userDBConn.beginTransaction();

    if (dealerData.id) {
      result = await loadDealer(dealerData.id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        oldDealerData = result.data;
      }
    }
    if (proceed && dealerData.send_invitation) {
      result = await saveInviteInDB(inviteData, userDBConn);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        if (!dealerData.invite_id) dealerData.invite_id = inviteData.id;
      }
    }

    if (proceed) {
      if (dealerData.id) {
        query = `
                UPDATE dealer_mast SET
                  name = ?,
                  contact_name=?,
                  mapped_user_id=?,
                  updated_by = ?
                WHERE id = ?
              `;
        values = [
          dealerData.name,
          dealerData.contact_name,
          dealerData.mapped_user_id,
          dealerData.updated_by,
          dealerData.id,
        ];
      } else {
        query = `
                INSERT INTO dealer_mast (name,contact_name,mapped_user_id,invite_id,created_by,updated_by)
                VALUES (?,?,?,?,?,?)
              `;
        values = [
          dealerData.name,
          dealerData.contact_name,
          dealerData.mapped_user_id,
          dealerData.invite_id,
          dealerData.created_by,
          dealerData.updated_by,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error saving dealer.";
      } else {
        if (!dealerData.id) {
          dealerData.id = result.insertId;
        }
      }
    }

    if (proceed) {
      query = `delete from dealer_product_mapping where dealer_id=?`;
      values = [dealerData.id];

      result = await executeQueryInBusinessDB(query, values, businessDBConn);
      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error deleting dealer dealer mapping.";
      }
    }

    if (proceed && dealerData.products && dealerData.products.length > 0) {
      for (let productId of dealerData.products) {
        query = `INSERT INTO dealer_product_mapping (dealer_id, product_id) VALUES (?, ?)`;
        values = [dealerData.id, productId];

        result = await executeQueryInBusinessDB(query, values, businessDBConn);
        if (result.affectedRows <= 0) {
          proceed = false;
          errMsg = "Error saving dealer dealer mapping.";
          break;
        }
      }
    }

    if (
      proceed &&
      oldDealerData?.mapped_user_id &&
      !dealerData.mapped_user_id
    ) {
      result = await executeQueryInUserDB(
        "delete from user_business_mapping where user_id=? and business_id=? ",
        [oldDealerData.mapped_user_id, inviteData.business_id],
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
      dealerData.id &&
      dealerData.send_invitation
    ) {
      inviteData.entity_id = dealerData.id;

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
      message: proceed ? "Dealer saved successfully." : errMsg,
      data: proceed ? dealerData.id : null,
    };
  } catch (error) {
    if (businessDBConn) await businessDBConn.rollback();
    if (userDBConn) await userDBConn.rollback();
    console.error("Error saving dealer:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving dealer.",
      data: null,
    };
  } finally {
    if (businessDBConn) businessDBConn.end();
    if (userDBConn) userDBConn.end();
  }
}

export async function loadDealerFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let dealerData;
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
      query = `SELECT * FROM dealer_mast WHERE id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        dealerData = result[0];
      } else {
        proceed = false;
        errMsg = "Dealer not found.";
      }
    }

    if (proceed) {
      query = `SELECT product_id FROM dealer_product_mapping WHERE dealer_id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        dealerData.products = result.map(
          (row: { product_id: number }) => row.product_id
        );
      } else if (result.length === 0) {
        dealerData.products = [];
      } else {
        proceed = false;
        errMsg = "Error loading dealer product mapping.";
      }
    }

    if (proceed) {
      result = await loadInviteFromDB(dealerData.invite_id);
      if (result.status) {
        inviteData = result.data;
        dealerData.contact_identifier = inviteData.identifier;
        dealerData.inviteStatus = inviteData.status;
      } else {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed && dealerData.mapped_user_id) {
      query = `SELECT status FROM user_business_mapping WHERE user_id = ? and business_id=? `;
      result = await executeQueryInUserDB(query, [
        dealerData.mapped_user_id,
        businessData.id,
      ]);

      if (result.length > 0) {
        dealerData.dealerStatus = result[0].status;
      } else {
        proceed = false;
        errMsg = "Error loading user_business_mapping status.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Dealer loaded successfully." : errMsg,
      data: proceed ? dealerData : null,
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

export async function loadDealerByMappedUserFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let dealerData;
  let result;
  let query;
  let businessData;
  let inviteData;

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
      query = `SELECT * FROM dealer_mast WHERE mapped_user_id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        dealerData = result[0];
      } else {
        proceed = false;
        errMsg = "Dealer not found.";
      }
    }

    if (proceed) {
      query = `SELECT dealer_id FROM dealer_product_mapping WHERE dealer_id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        dealerData.products = result.map(
          (row: { product_id: number }) => row.product_id
        );
      } else if (result.length === 0) {
        dealerData.products = [];
      } else {
        proceed = false;
        errMsg = "Error loading dealer_product_mapping mapping.";
      }
    }

    if (proceed) {
      result = await loadInviteFromDB(dealerData.invite_id);
      if (result.status) {
        inviteData = result.data;
        dealerData.contact_identifier = inviteData.identifier;
        dealerData.inviteStatus = inviteData.status;
      } else {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed && dealerData.mapped_user_id) {
      query = `SELECT status FROM user_business_mapping WHERE user_id = ? and business_id=? `;
      result = await executeQueryInUserDB(query, [
        dealerData.mapped_user_id,
        businessData.id,
      ]);

      if (result.length > 0) {
        dealerData.dealerStatus = result[0].status;
      } else {
        proceed = false;
        errMsg = "Error loading user_business_mapping status.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Dealer loaded successfully." : errMsg,
      data: proceed ? dealerData : null,
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

export async function deleteDealerFromDB(dealerId: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query;
  let businessDBConn;
  let userDBConn;
  let values: any[];
  let dealerData;
  let businessData;

  try {
    businessDBConn = await getBusinessDBConn();
    await businessDBConn.beginTransaction();

    userDBConn = await getUserDBConn();
    await userDBConn.beginTransaction();

    if (proceed) {
      result = await loadDealer(dealerId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        dealerData = result.data;
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
      query = `
        DELETE FROM dealer_product_mapping WHERE dealer_id = ?
      `;
      values = [dealerId];
      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error deleting old dealer license parameters.";
      }
    }

    if (proceed) {
      result = await executeQueryInBusinessDB(
        "delete from dealer_mast where id=?",
        [dealerId],
        businessDBConn
      );
      console.log("result : ", result);
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete dealer.";
      }
    }

    if (proceed && dealerData.mapped_user_id) {
      result = await executeQueryInUserDB(
        "delete from user_business_mapping where user_id=? and business_id=? ",
        [dealerData.mapped_user_id, businessData.id],
        userDBConn
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete dealer.";
      }
    }

    if (proceed) {
      result = await executeQueryInUserDB(
        "delete from invite_mast where id=? ",
        [dealerData.invite_id],
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
      message: proceed ? "Dealer deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (businessDBConn) await businessDBConn.rollback();
    if (userDBConn) await userDBConn.rollback();
    console.error("Error deleting dealer:", error);
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
