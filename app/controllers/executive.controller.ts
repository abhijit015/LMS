"use server";

import {
  deleteExecutiveFromDB,
  loadExecutiveByMappedUserFromDB,
  loadExecutiveFromDB,
  loadExecutiveListFromDB,
  saveExecutiveInDB,
} from "../services/executive.service";
import { initInviteData } from "../utils/common";
import {
  INVITE_STATUS_ACCEPTED,
  INVITE_STATUS_PENDING,
  ROLE_BUSINESS_EXECUTIVE,
  ROLE_DEALER_ADMIN,
  ROLE_DEALER_EXECUTIVE,
} from "../utils/constants";
import { executiveSchemaT, inviteSchemaT } from "../utils/models";
import { executiveSchema } from "../utils/zodschema";
import { getCurrentRole } from "./business.controller";
import { getCurrentDealerDet } from "./dealer.controller";
import {
  canInviteBeSaved,
  loadInvite,
  saveInvite,
  setInviteDataB4Saving,
} from "./invite.controller";
import { getCurrentUserDet } from "./user.controller";

export async function deleteExecutive(executiveId: number) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      const result = await canExecutiveBeDeleted(executiveId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const result = await deleteExecutiveFromDB(executiveId);
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canExecutiveBeDeleted(executiveId: number) {
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadExecutive(executive_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadExecutiveFromDB(executive_id as number);
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadExecutiveByMappedUser(mapped_user_id_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadExecutiveByMappedUserFromDB(mapped_user_id_id);
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveExecutive(executiveData: executiveSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let inviteData: inviteSchemaT;

  try {
    inviteData = initInviteData();

    if (proceed) {
      result = await setExecutiveDataB4Saving(executiveData, inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canExecutiveBeSaved(executiveData, inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveExecutiveInDB(executiveData, inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (
      proceed &&
      inviteData.status === INVITE_STATUS_PENDING &&
      executiveData.send_invitation
    ) {
      // result = await sendInviteNotification(inviteData);
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving executive:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function setExecutiveDataB4Saving(
  executiveData: executiveSchemaT,
  inviteData: inviteSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let userData;
  let result;
  let dealerData;
  let currentRole;

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

    if (proceed && !executiveData.id) {
      result = await getCurrentRole();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        currentRole = result.data;
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
        executiveData.created_by = userData.id;
        if (currentRole === ROLE_DEALER_ADMIN && dealerData)
          executiveData.dealer_id = dealerData.id;

        executiveData.updated_by = userData.id;
      }
    }

    if (executiveData.send_invitation) {
      if (executiveData.invite_id) {
        result = await loadInvite(executiveData.invite_id);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          // inviteData = result.data;
          Object.assign(inviteData, result.data);
        }
      }

      if (proceed) {
        inviteData.name = executiveData.contact_name;
        inviteData.identifier = executiveData.contact_identifier;

        if (inviteData.id) {
          if (inviteData.status === INVITE_STATUS_ACCEPTED) {
            executiveData.mapped_user_id = 0;
          }
          inviteData.status = INVITE_STATUS_PENDING;
        } else {
          if (currentRole === ROLE_DEALER_ADMIN)
            inviteData.role = ROLE_DEALER_EXECUTIVE;
          else inviteData.role = ROLE_BUSINESS_EXECUTIVE;
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
    console.error("Error while setting executive data before saving :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canExecutiveBeSaved(
  executiveData: executiveSchemaT,
  inviteData: inviteSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      if (!executiveData) {
        proceed = false;
        errMsg = "Executive Data cannot be null.";
      }
    }

    if (proceed) {
      result = executiveSchema.safeParse(executiveData);

      if (!result.success) {
        errMsg = result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        proceed = false;
      }
    }

    if (proceed && executiveData.send_invitation) {
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadExecutiveList() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await loadExecutiveListFromDB();
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}
