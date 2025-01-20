"use server";
import { handleErrorMsg } from "../utils/common";

import {
  deleteAssignCreditTranFromDB,
  loadAssignCreditListFromDB,
  loadAssignCreditTranFromDB,
  saveDealerCreditTranInDB,
} from "../services/credit.service";
import { dealerCreditTranSchemaT } from "../utils/models";
import { dealerCreditTranSchema } from "../utils/zodschema";
import { getCurrentUserDet } from "./user.controller";

export async function loadAssignCreditList() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userData;

  try {
    if (proceed) {
      result = await loadAssignCreditListFromDB();
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

export async function loadAssignCreditTran(id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await loadAssignCreditTranFromDB(id);
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

export async function deleteAssignCreditTran(id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await deleteAssignCreditTranFromDB(id);
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

export async function saveDealerCreditTran(data: dealerCreditTranSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await setDealerCreditTranDataB4Saving(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canDealerCreditTranBeSaved(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveDealerCreditTranInDB(data);
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

export async function setDealerCreditTranDataB4Saving(
  data: dealerCreditTranSchemaT
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
      if (!data.id) {
        data.created_by = userData.id;
      }

      data.updated_by = userData.id;
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error while setting license data before saving :", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function canDealerCreditTranBeSaved(
  data: dealerCreditTranSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!data) {
        proceed = false;
        errMsg = "Credit Transaction Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = dealerCreditTranSchema.safeParse(data);

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
