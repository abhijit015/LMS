"use server";

import { dealerSchema } from "../utils/zodschema";
import { dealerSchemaT, userSchemaT } from "../utils/models";
import {
  deleteDealerFromDB,
  loadDealerFromDB,
  loadDealerListFromDB,
  saveDealerInDB,
} from "../services/dealer.service";
import {
  canUserBeDeleted,
  getCurrentUserDet,
  setUserDataB4Saving,
} from "./user.controller";
import { canUserBeSaved } from "./user.controller";
import { getAllUserId4Dealer, saveUserInDB } from "../services/user.service";
import { getUserIdFromCookies } from "./cookies.controller";

export async function setDealerDataB4Saving(
  dealerData: dealerSchemaT,
  userData: userSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let currentUserData;

  try {
    if (proceed) {
      result = await setUserDataB4Saving(userData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await getCurrentUserDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        currentUserData = result.data;
      }
    }

    if (proceed) {
      if (!dealerData.id) {
        dealerData.created_by = currentUserData.id;
        dealerData.client_id = currentUserData.client_id;
      }

      dealerData.updated_by = currentUserData.id;
    }

    console.log("currentUserData : ", currentUserData);

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error while setting dealer data before saving :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveDealer(
  dealerData: dealerSchemaT,
  userData: userSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await canDealerBeSaved(dealerData, userData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await setDealerDataB4Saving(dealerData, userData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveDealerInDB(dealerData, userData);

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
    console.error("Error saving dealer:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canDealerBeSaved(
  dealerData: dealerSchemaT,
  userData: userSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

    if (proceed) {
      const result = await canUserBeSaved(userData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      if (!dealerData) {
        proceed = false;
        errMsg = "Dealer Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = dealerSchema.safeParse(dealerData);

      if (!parsed.success) {
        errMsg = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        proceed = false;
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

export async function deleteDealer(dealerID: number) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

    if (proceed) {
      const result = await canDealerBeDeleted(dealerID);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const result = await deleteDealerFromDB(dealerID);
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

export async function canDealerBeDeleted(dealerID: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  try {
    if (proceed) {
      result = await getAllUserId4Dealer(dealerID);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed && result && Array.isArray(result.data)) {
      for (const userId of result.data) {
        const canDeleteResult = await canUserBeDeleted(userId);
        if (!canDeleteResult.status) {
          proceed = false;
          errMsg = canDeleteResult.message;
          break;
        }
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

export async function loadDealerList() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userData;

  try {
    if (proceed) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

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
      result = await loadDealerListFromDB(userData.client_id);
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

export async function loadDealer(dealer_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}
