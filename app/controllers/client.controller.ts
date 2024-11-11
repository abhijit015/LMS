"use server";

import { clientSchema, userSchema } from "../utils/zodschema";
import { clientSchemaT, userSchemaT } from "../utils/models";
import { saveClientInDB } from "../services/client.service";
import {
  getCurrentUserDet,
  loadUser,
  setUserDataB4Saving,
} from "./user.controller";
import { canUserBeSaved } from "./user.controller";
import { saveUserInDB } from "../services/user.service";
import { getUserIdFromCookies } from "./cookies.controller";

export async function setClientDataB4Saving(
  clientData: clientSchemaT,
  userData: userSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await setUserDataB4Saving(userData);
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
    console.error("Error while setting client data before saving :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveClient(
  clientData: clientSchemaT,
  userData: userSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await canClientBeSaved(clientData, userData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await setClientDataB4Saving(clientData, userData);
      if (result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveClientInDB(clientData, userData);
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
    console.error("Error saving client:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canClientBeSaved(
  clientData: clientSchemaT,
  userData: userSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed && clientData.id) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.pppp";
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
      if (!clientData) {
        proceed = false;
        errMsg = "Client Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = clientSchema.safeParse(clientData);

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
