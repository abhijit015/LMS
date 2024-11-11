"use server";

import {
  deleteUserFromDB,
  loadUserFromDB,
  loadUserListFromDB,
  runDBValidationsB4Saving,
  saveUserInDB,
  validateUserFromDB,
} from "../services/user.service";
import bcrypt from "bcryptjs";
import { getUserIdFromCookies, setCookies } from "./cookies.controller";
import { userSchemaT } from "../utils/models";
import { userSchema } from "../utils/zodschema";
import { USER_TYPE_CLIENT, USER_TYPE_DEALER } from "../utils/constants";

export async function hashString(plainText: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainText, salt);
  return hash;
}

export async function validateUser(username: string, password: string) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let user;

  try {
    if (proceed) {
      user = await validateUserFromDB(username);
      if (!user.status) {
        proceed = false;
        errMsg = user.message;
      }
    }

    if (proceed && user) {
      const isPasswordValid = await bcrypt.compare(
        password,
        user.data?.password
      );

      if (!isPasswordValid) {
        proceed = false;
        errMsg = "Invalid Password";
      }
    }

    if (proceed && user) {
      await setCookies(user.data.id);
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error during user validation:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while validating the user.",
      data: null,
    };
  }
}

export async function setUserDataB4Saving(data: userSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let currentUserData;
  let result;
  try {
    if (
      proceed &&
      (data.user_type !== USER_TYPE_CLIENT ||
        (data.user_type === USER_TYPE_CLIENT && data.id))
    ) {
      result = await getCurrentUserDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        currentUserData = result.data;
      }
    }

    if (proceed) {
      if (data.id) {
        data.updated_by = currentUserData.id;
      } else {
        data.password = await hashString(String(data.password));

        if (data.user_type !== USER_TYPE_CLIENT) {
          data.created_by = currentUserData.id;
          data.updated_by = currentUserData.id;
        }

        if (
          data.user_type !== USER_TYPE_CLIENT ||
          (data.user_type === USER_TYPE_CLIENT && data.id)
        ) {
          data.client_id = currentUserData.client_id;
        }

        if (data.user_type !== USER_TYPE_DEALER) {
          data.dealer_id = currentUserData.dealer_id;
        }
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveUser(data: userSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";

  try {
    if (proceed) {
      const validationResult = await canUserBeSaved(data);
      if (!validationResult.status) {
        proceed = false;
        errMsg = validationResult.message;
      }
    }

    if (proceed) {
      const formattingResult = await setUserDataB4Saving(data);
      if (!formattingResult.status) {
        proceed = false;
        errMsg = formattingResult.message;
      }
    }

    if (proceed) {
      const dbResult = await saveUserInDB(data);
      return dbResult;
    }

    return {
      status: proceed,
      message: proceed ? "User saved successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error saving user:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canUserBeSaved(data: userSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed && data.user_type === USER_TYPE_CLIENT && data.id) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

    if (proceed) {
      if (!data) {
        proceed = false;
        errMsg = "User Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = userSchema.safeParse(data);

      if (!parsed.success) {
        errMsg = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        proceed = false;
      }
    }

    if (proceed) {
      result = await runDBValidationsB4Saving(data);
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

export async function canUserBeDeleted(id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
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

export async function deleteUser(id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await canUserBeDeleted(id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await deleteUserFromDB(id);
    }

    return {
      status: proceed,
      message: proceed ? "User deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error while deleting user:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadUser(id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let dbResult;

  try {
    if (proceed) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

    if (proceed) {
      dbResult = await loadUserFromDB(id);
      if (!dbResult.status) {
        proceed = false;
        errMsg = dbResult.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "User loaded successfully." : errMsg,
      data: proceed && dbResult ? dbResult.data : null,
    };
  } catch (error) {
    console.error("Error while loading user:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function getCurrentUserDet() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let userId: number | null = 0;
  let result;
  try {
    if (proceed) {
      userId = await getUserIdFromCookies();
      if (!userId) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

    if (proceed) {
      result = await loadUser(userId as number);
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

export async function loadUserList() {
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
      result = await loadUserListFromDB(userData);
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
