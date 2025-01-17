"use server";

import {
  saveInviteInDB,
  loadInviteFromDB,
  loadInvite4CurrentBusinessFromDB,
  loadInvite4CurrentUserFromDB,
} from "../services/invite.service";
import {
  INVITE_STATUS_ACCEPTED,
  INVITE_STATUS_PENDING,
  ROLE_DEALER_ADMIN,
} from "../utils/constants";
import { inviteSchemaT } from "../utils/models";
import {
  getCurrentBusinessDet,
  getCurrentUserRole,
} from "./business.controller";
import { getCurrentDealerDet } from "./dealer.controller";
import { getCurrentUserDet } from "./user.controller";

export async function setInviteDataB4Saving(inviteData: inviteSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let userData;
  let businessData;
  let result;
  let currentRole;
  let dealerData;

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

    if (proceed && !inviteData.id) {
      result = await getCurrentBusinessDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        businessData = result.data;
      }
    }

    if (proceed && !inviteData.id) {
      result = await getCurrentUserRole();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        currentRole = result.data;
      }
    }

    if (proceed && currentRole === ROLE_DEALER_ADMIN && !inviteData.id) {
      result = await getCurrentDealerDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        dealerData = result.data;
      }
    }

    if (proceed) {
      if (!inviteData.id) {
        inviteData.created_by = userData.id;
        inviteData.business_id = businessData.id;
        inviteData.status = INVITE_STATUS_PENDING;

        if (currentRole === ROLE_DEALER_ADMIN) {
          inviteData.dealer_id = dealerData.id;
        }
      }

      inviteData.updated_by = userData.id;
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error while setting invite data before saving :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveInvite(inviteData: inviteSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
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
      result = await saveInviteInDB(inviteData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      //send notification
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving invite:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canInviteBeSaved(inviteData: inviteSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!inviteData) {
        proceed = false;
        errMsg = "Invite Data cannot be null.";
      }
    }

    if (proceed) {
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

export async function loadInvite(invite_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadInviteFromDB(invite_id as number);
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

export async function loadInvite4CurrentBusiness() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userData;

  try {
    if (proceed) {
      result = await loadInvite4CurrentBusinessFromDB();
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

export async function loadInvite4CurrentUser() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userData;

  try {
    if (proceed) {
      result = await loadInvite4CurrentUserFromDB();
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
