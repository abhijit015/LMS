"use server";
import { handleErrorMsg } from "../utils/common";

import {
  checkIfBusinessLoggedInFromDB,
  deleteBusinessFromDB,
  deregisterFromBusinessInDB,
  getHostAndPort4BusinessFromDB,
  getUserRole4BusinessFromDB,
  loadBusinessFromDB,
  loadBusinessListFromDB,
  saveBusinessInDB,
} from "../services/business.service";
import {
  getBusinessIdFromCookies,
  getUserIdFromCookies,
} from "../utils/cookies";
import { businessSchemaT, userSchemaT } from "../utils/models";
import { businessSchema } from "../utils/zodschema";
import { getCurrentUserDet } from "./user.controller";

export async function setBusinessDataB4Saving(data: businessSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
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

    if (proceed) {
      data.updated_by = userData.id;

      if (!data.id) {
        data.created_by = userData.id;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? data : null,
    };
  } catch (error) {
    console.error("Error while setting data before saving:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function saveBusiness(data: businessSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await setBusinessDataB4Saving(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canBusinessBeSaved(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveBusinessInDB(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Business saved successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving Business :", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function canBusinessBeSaved(data: businessSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      if (!data) {
        proceed = false;
        errMsg = "Business Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = businessSchema.safeParse(data);

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
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadBusinessList() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userData: userSchemaT | null = null;

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

    if (proceed && userData && userData.id) {
      result = await loadBusinessListFromDB(userData.id);
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

export async function loadBusiness(business_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await loadBusinessFromDB(business_id as number);
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

export async function deleteBusiness(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await canBusinessBeDeleted(id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await deleteBusinessFromDB(id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Business deleted successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error deleting Business :", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function deregisterFromBusiness(business_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await deregisterFromBusinessInDB(business_id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Deregistered successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error Deregistering :", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function canBusinessBeDeleted(id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
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
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function getHostAndPort4Business(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await getHostAndPort4BusinessFromDB(id);
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
    console.error("Error getting host and port for Business :", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function getCurrentBusinessDet() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let businessId: number | null = 0;
  let result;
  try {
    if (proceed) {
      businessId = await getBusinessIdFromCookies();
      if (!businessId) {
        proceed = false;
        errMsg =
          "Business Entity Not Found. Please Select Business Again From Switch Business Option.";
      }
    }

    if (proceed) {
      result = await loadBusiness(businessId as number);
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

export async function checkIfBusinessLoggedIn() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  try {
    if (proceed) {
      result = await checkIfBusinessLoggedInFromDB();
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

export async function getCurrentUserRole() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let businessId: number | null = 0;
  let userId: number | null = 0;
  let result;
  try {
    if (proceed) {
      userId = await getUserIdFromCookies();
      if (!userId) {
        proceed = false;
        errMsg = "Session Expired. Please Login Again.";
      }
    }

    if (proceed) {
      businessId = await getBusinessIdFromCookies();
      if (!businessId) {
        proceed = false;
        errMsg =
          "Business Entity Not Found. Please Select Business Again From Switch Business Option.";
      }
    }

    if (proceed && userId && businessId) {
      result = await getUserRole4BusinessFromDB(userId, businessId);
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
