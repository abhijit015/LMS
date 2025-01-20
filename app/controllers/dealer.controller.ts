"use server";
import { handleErrorMsg } from "../utils/common";

import {
  deleteDealerFromDB,
  getDealerCreditBalanceFromDB,
  loadDealerByMappedUserFromDB,
  loadDealerFromDB,
  loadDealerListFromDB,
  saveDealerInDB,
} from "../services/dealer.service";
import { initInviteData } from "../utils/common";
import {
  INVITE_STATUS_ACCEPTED,
  INVITE_STATUS_PENDING,
  ROLE_DEALER_ADMIN,
} from "../utils/constants";
import { dealerSchemaT, inviteSchemaT } from "../utils/models";
import { dealerSchema } from "../utils/zodschema";
import {
  canInviteBeSaved,
  loadInvite,
  saveInvite,
  setInviteDataB4Saving,
} from "./invite.controller";
import { getCurrentUserDet } from "./user.controller";

export async function getCurrentDealerDet() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let userData;
  let result;
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
      result = await loadDealerByMappedUser(userData.id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        userData = result.data;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function deleteDealer(dealerId: number) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      const result = await canDealerBeDeleted(dealerId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const result = await deleteDealerFromDB(dealerId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function canDealerBeDeleted(dealerId: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  try {
    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadDealer(dealer_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadDealerFromDB(dealer_id as number);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadDealerByMappedUser(mapped_user_id_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadDealerByMappedUserFromDB(mapped_user_id_id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function saveDealer(dealerData: dealerSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let inviteData: inviteSchemaT;

  try {
    inviteData = initInviteData();

    if (proceed) {
      result = await setDealerDataB4Saving(dealerData, inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canDealerBeSaved(dealerData, inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveDealerInDB(dealerData, inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (
      proceed &&
      inviteData.status === INVITE_STATUS_PENDING &&
      dealerData.send_invitation
    ) {
      // result = await sendInviteNotification(inviteData);
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving dealer:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function setDealerDataB4Saving(
  dealerData: dealerSchemaT,
  inviteData: inviteSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let userData;
  let result;

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
      if (!dealerData.id) {
        dealerData.created_by = userData.id;
      }
      dealerData.updated_by = userData.id;
    }

    if (dealerData.send_invitation) {
      if (dealerData.invite_id) {
        result = await loadInvite(dealerData.invite_id);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          // inviteData = result.data;
          Object.assign(inviteData, result.data);
        }
      }

      if (proceed) {
        inviteData.name = dealerData.contact_name;
        inviteData.identifier = dealerData.contact_identifier;

        if (inviteData.id) {
          if (inviteData.status === INVITE_STATUS_ACCEPTED) {
            dealerData.mapped_user_id = 0;
          }
          inviteData.status = INVITE_STATUS_PENDING;
        } else {
          inviteData.role = ROLE_DEALER_ADMIN;
        }
      }

      if (proceed) {
        result = await setInviteDataB4Saving(inviteData);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        }
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error while setting dealer data before saving :", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function canDealerBeSaved(
  dealerData: dealerSchemaT,
  inviteData: inviteSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      if (!dealerData) {
        proceed = false;
        errMsg = "Dealer Data cannot be null.";
      }
    }

    if (proceed) {
      result = dealerSchema.safeParse(dealerData);

      if (!result.success) {
        errMsg = result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        proceed = false;
      }
    }

    if (proceed && dealerData.send_invitation) {
      result = await canInviteBeSaved(inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadDealerList() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await loadDealerListFromDB();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function getDealerCreditBalance(dealer_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await getDealerCreditBalanceFromDB(dealer_id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}
