"use server";

import { departmentSchema } from "../utils/zodschema";
import { departmentSchemaT } from "../utils/models";
import {
  deleteDepartmentFromDB,
  loadDepartmentFromDB,
  loadDepartmentListFromDB,
  saveDepartmentInDB,
} from "../services/department.service";
import { getCurrentUserDet } from "./user.controller";
import { ROLE_DEALER_ADMIN } from "../utils/constants";
import { getCurrentUserRole } from "./business.controller";
import { getCurrentDealerDet } from "./dealer.controller";

export async function setDepartmentDataB4Saving(
  departmentData: departmentSchemaT
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

    if (proceed && !departmentData.id) {
      result = await getCurrentUserRole();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        currentRole = result.data;
      }
    }

    if (proceed && !departmentData.id && currentRole === ROLE_DEALER_ADMIN) {
      result = await getCurrentDealerDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        dealerData = result.data;
      }
    }

    if (proceed) {
      if (!departmentData.id) {
        departmentData.created_by = userData.id;

        if (currentRole === ROLE_DEALER_ADMIN && dealerData)
          departmentData.dealer_id = dealerData.id;
      }
      departmentData.updated_by = userData.id;
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error while setting department data before saving :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveDepartment(departmentData: departmentSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await setDepartmentDataB4Saving(departmentData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canDepartmentBeSaved(departmentData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveDepartmentInDB(departmentData);
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
    console.error("Error saving department:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canDepartmentBeSaved(departmentData: departmentSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!departmentData) {
        proceed = false;
        errMsg = "Department Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = departmentSchema.safeParse(departmentData);

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

export async function deleteDepartment(departmentID: number) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      const result = await canDepartmentBeDeleted(departmentID);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const result = await deleteDepartmentFromDB(departmentID);
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

export async function canDepartmentBeDeleted(departmentID: number) {
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

export async function loadDepartment(department_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadDepartmentFromDB(department_id as number);
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

export async function loadDepartmentList() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userData;

  try {
    if (proceed) {
      result = await loadDepartmentListFromDB();
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
