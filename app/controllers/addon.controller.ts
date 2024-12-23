"use server";

import { addonSchema } from "../utils/zodschema";
import { addonSchemaT } from "../utils/models";
import {
  deleteAddonFromDB,
  loadAddonFromDB,
  loadAddonListFromDB,
  saveAddonInDB,
} from "../services/addon.service";
import { getCurrentUserDet } from "./user.controller";

export async function setAddonDataB4Saving(addonData: addonSchemaT) {
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
      if (!addonData.id) {
        addonData.created_by = userData.id;
      }

      addonData.updated_by = userData.id;
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error while setting addon data before saving :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveAddon(addonData: addonSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await setAddonDataB4Saving(addonData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canAddonBeSaved(addonData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveAddonInDB(addonData);
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
    console.error("Error saving addon:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canAddonBeSaved(addonData: addonSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!addonData) {
        proceed = false;
        errMsg = "Addon Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = addonSchema.safeParse(addonData);

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

export async function deleteAddon(addonID: number) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      const result = await canAddonBeDeleted(addonID);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const result = await deleteAddonFromDB(addonID);
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

export async function canAddonBeDeleted(addonID: number) {
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

export async function loadAddon(addon_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadAddonFromDB(addon_id as number);
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

export async function loadAddonList() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userData;

  try {
    if (proceed) {
      result = await loadAddonListFromDB();
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
