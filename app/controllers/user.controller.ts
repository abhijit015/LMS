"use server";
import { handleErrorMsg } from "../utils/common";

import {
  checkIfPhoneExistsFromDB,
  checkIfMailExistsFromDB,
  loadUserFromDB,
  saveOTPEntryInDB,
  saveUserInDB,
  updateUserBusinessMappingStatusInDB,
  validateOTPFromDB,
  validateSignInFromDB,
} from "../services/user.service";
import bcrypt from "bcryptjs";
import {
  clearUserIdCookie,
  setUserIdCookie,
  getUserIdFromCookies,
} from "../utils/cookies";
import { userSchemaT } from "../utils/models";
import { userSchema } from "../utils/zodschema";

export async function checkIfMailExists(email: string) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await checkIfMailExistsFromDB(email);
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
    console.error("Error during user validation:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function checkIfPhoneExists(phone: string) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await checkIfPhoneExistsFromDB(phone);
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
    console.error("Error during user validation:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function saveOTPEntry(
  email: string,
  phone: string,
  emailOTP: string,
  phoneOTP: string
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await saveOTPEntryInDB(email, phone, emailOTP, phoneOTP);
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
    console.error("Error during saving otp entry in db:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function validateOTP(
  email: string,
  phone: string,
  emailOTP: string,
  phoneOTP: string
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await validateOTPFromDB(email, phone, emailOTP, phoneOTP);
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
    console.error("Error during validating:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function updateUserBusinessMappingStatus(
  userId: number,
  status: number
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await updateUserBusinessMappingStatusInDB(userId, status);
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

export async function validateSignIn(username: string, password: string) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let user;

  try {
    if (proceed) {
      user = await validateSignInFromDB(username);
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
      await clearUserIdCookie();
      await setUserIdCookie(user.data.id);
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
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function setUserDataB4Saving(data: userSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";

  try {
    if (proceed && !data.id) {
      data.password = await hashString(String(data.password));
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

export async function saveUser(data: userSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await setUserDataB4Saving(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canUserBeSaved(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveUserInDB(data);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "User saved successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving user:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function canUserBeSaved(data: userSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
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

export async function hashString(plainText: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainText, salt);
  return hash;
}

export async function loadUser(id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await loadUserFromDB(id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "User loaded successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error while loading user:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
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
      message: handleErrorMsg(error),
      data: null,
    };
  }
}
