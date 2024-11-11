"use server";

import { loadAllLicenseFieldsFromDB } from "../services/license.service";
import { getUserIdFromCookies } from "./cookies.controller";
import { getCurrentUserDet } from "./user.controller";

export async function loadAllLicenseFields() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let currentUserData;

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
        currentUserData = result.data;
      }
    }

    if (proceed) {
      result = await loadAllLicenseFieldsFromDB(
        currentUserData.client_id as number
      );
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
