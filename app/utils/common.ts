import {
  ROLE_BUSINESS_ADMIN,
  ROLE_BUSINESS_EXECUTIVE,
  ROLE_DEALER_ADMIN,
  ROLE_DEALER_EXECUTIVE,
  INVITE_STATUS_ACCEPTED,
  INVITE_STATUS_REJECTED,
  INVITE_STATUS_PENDING,
  INVITE_STATUS_CANCELLED,
  USER_BUSINESS_MAPPING_STATUS_ACTIVE,
  USER_BUSINESS_MAPPING_STATUS_DISABLED,
  INVITE_STATUS_DEREGISTERED,
  LICENSE_PARAM_USERS,
  LICENSE_PARAM_VALIDITY,
  LICENSE_PARAM_VARIANT,
  LICENSE_TRAN_ASSIGN_DEALER_2_LICENSE,
  LICENSE_TRAN_EXTEND_ADD_ON,
  LICENSE_TRAN_EXTEND_USERS,
  LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY,
  LICENSE_TRAN_EXTEND_VALIDITY,
  LICENSE_TRAN_EXTEND_VARIANT,
  LICENSE_TRAN_GENERATE_NEW_LICENSE,
  LICENSE_TRAN_NATURE_FREE_VARIANT,
  LICENSE_TRAN_NATURE_TRIAL_PERIOD,
} from "./constants";
import {
  inviteSchemaT,
  dealerSchemaT,
  addonSchemaT,
  licenseTranSchemaT,
} from "./models";

export const roleName2Id = (roleName: string): number => {
  switch (roleName) {
    case "Business Admin":
      return ROLE_BUSINESS_ADMIN;
    case "Business Executive":
      return ROLE_BUSINESS_EXECUTIVE;
    case "Dealer Admin":
      return ROLE_DEALER_ADMIN;
    case "Dealer Executive":
      return ROLE_DEALER_EXECUTIVE;
    default:
      return 0;
  }
};

export const roleId2Name = (roleId: number): string => {
  switch (roleId) {
    case ROLE_BUSINESS_ADMIN:
      return "Business Admin";
    case ROLE_BUSINESS_EXECUTIVE:
      return "Business Executive";
    case ROLE_DEALER_ADMIN:
      return "Dealer Admin";
    case ROLE_DEALER_EXECUTIVE:
      return "Dealer Executive";
    default:
      return "";
  }
};

// Invite Status
export const inviteStatusName2Id = (statusName: string): number => {
  switch (statusName) {
    case "Accepted":
      return INVITE_STATUS_ACCEPTED;
    case "Rejected":
      return INVITE_STATUS_REJECTED;
    case "Pending":
      return INVITE_STATUS_PENDING;
    case "Cancelled":
      return INVITE_STATUS_CANCELLED;
    case "User Deregistered":
      return INVITE_STATUS_DEREGISTERED;
    default:
      return 0;
  }
};

export const inviteStatusId2Name = (statusId: number): string => {
  switch (statusId) {
    case INVITE_STATUS_ACCEPTED:
      return "Accepted";
    case INVITE_STATUS_REJECTED:
      return "Rejected";
    case INVITE_STATUS_PENDING:
      return "Pending";
    case INVITE_STATUS_CANCELLED:
      return "Cancelled";
    case INVITE_STATUS_DEREGISTERED:
      return "User Deregistered";
    default:
      return "";
  }
};

// User Status
export const userStatusName2Id = (statusName: string): number => {
  switch (statusName) {
    case "Active":
      return USER_BUSINESS_MAPPING_STATUS_ACTIVE;
    case "Disabled":
      return USER_BUSINESS_MAPPING_STATUS_DISABLED;
    default:
      return 0;
  }
};

export const userStatusId2Name = (statusId: number): string => {
  switch (statusId) {
    case USER_BUSINESS_MAPPING_STATUS_ACTIVE:
      return "Active";
    case USER_BUSINESS_MAPPING_STATUS_DISABLED:
      return "Disabled";
    default:
      return "";
  }
};

// License Params
export const licenseParamName2Id = (licenseParamName: string): number => {
  switch (licenseParamName) {
    case "Variant":
      return LICENSE_PARAM_VARIANT;
    case "Valid Upto":
      return LICENSE_PARAM_VALIDITY;
    case "Users":
      return LICENSE_PARAM_USERS;
    default:
      return 0;
  }
};

export const licenseParamId2Name = (licenseParamId: number): string => {
  switch (licenseParamId) {
    case LICENSE_PARAM_VARIANT:
      return "Variant";
    case LICENSE_PARAM_VALIDITY:
      return "Validity";
    case LICENSE_PARAM_USERS:
      return "Users";
    default:
      return "";
  }
};

export function initInviteData(): inviteSchemaT {
  return {
    id: 0,
    business_id: 0,
    name: "",
    identifier: "",
    dealer_id: 0,
    role: 0,
    status: 0,
    entity_id: 0,
    created_by: 0,
    updated_by: 0,
  };
}

export function initDealerData(): dealerSchemaT {
  return {
    id: 0,
    name: "",
    contact_name: "",
    contact_identifier: "",
    send_invitation: false,
    products: [],
    invite_id: 0,
    created_by: 0,
    updated_by: 0,
  };
}

export function initAddonData(): addonSchemaT {
  return {
    id: 0,
    name: "",
    created_by: 0,
    updated_by: 0,
  };
}

export function initDepartmentData() {
  return {
    id: undefined,
    name: "",
    dealer_id: null,
    created_by: undefined,
    updated_by: undefined,
  };
}

export function loadLicenseParams(): { id: number; name: string }[] {
  const licenseParamIds = [
    LICENSE_PARAM_VARIANT,
    LICENSE_PARAM_VALIDITY,
    LICENSE_PARAM_USERS,
  ];

  return licenseParamIds.map((id) => ({
    id,
    name: licenseParamId2Name(id),
  }));
}

export function initLicenseDetData() {
  return {
    id: 0,
    license_no: "",
    product_id: 0,
    entity_id: 0,
    entity_identifier: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  };
}

export function initLicenseStatusData() {
  return {
    id: 0,
    license_id: 0,
    product_variant_id: 0,
    no_of_users: 0,
    current_users: 0,
    dealer_id: null,
    dealer_name: "",
    product_variant_name: "",
    expiry_date_with_grace: null,
    expiry_date_without_grace: null,
    created_by: null,
    updated_by: null,
  };
}

export function initLicenseTranData() {
  return {
    id: 0,
    license_id: 0,
    tran_type: 0,
    product_variant_id: null,
    no_of_users: null,
    no_of_months: null,
    dealer_id: null,
    addon_id: null,
    addon_plan_id: null,
    remarks: "",
    payment_mode: null,
    payment_ref_no: "",
    payment_amt: null,
    tran_nature: 0,
    scheme_id: null,
    created_by: null,
    updated_by: null,
    created_at: null,
  };
}

export function initAddonStatusData() {
  return {
    id: 0,
    license_id: 0,
    addon_id: 0,
    addon_plan_id: 0,
    balance_addon_value: 0,
    grace: null,
    expiry_date: new Date(),
    created_by: 0,
  };
}

export function initDealerCreditLedgerData() {
  return {
    id: 0,
    vch_no: null,
    dealer_id: null,
    tran_type: 0,
    license_tran_id: null,
    modified_credits: 0,
    invoice_no: null,
    invoice_date: null,
    tran_date: new Date(),
    remarks: null,
    created_by: null,
    updated_by: null,
  };
}

export function initExecutiveData() {
  return {
    id: undefined,
    name: "",
    mapped_user_id: null,
    invite_id: undefined,
    department_id: 0,
    role_id: 0,
    dealer_id: null,
    contact_name: "",
    contact_identifier: "",
    send_invitation: false,
    inviteStatus: undefined,
    created_by: undefined,
    updated_by: undefined,
    executiveStatus: 0,
  };
}

export function calculateExpiryDateByMonths(
  startDate: Date,
  months: number
): Date | null {
  if (!Number.isFinite(months) || months < 0) {
    return null;
  }

  const currentDay = startDate.getDate();
  const currentMonth = startDate.getMonth();
  const currentYear = startDate.getFullYear();

  const targetMonth = currentMonth + months;
  const targetYear = currentYear + Math.floor(targetMonth / 12);
  const adjustedMonth = targetMonth % 12;

  if (targetYear > 9999 || targetYear < 0) {
    return null;
  }

  const lastDayOfTargetMonth = new Date(
    targetYear,
    adjustedMonth + 1,
    0
  ).getDate();

  const expiryDay = Math.min(currentDay - 1, lastDayOfTargetMonth);

  return new Date(
    targetYear,
    adjustedMonth,
    expiryDay > 0 ? expiryDay : lastDayOfTargetMonth
  );
}

export function calculateExpiryDateByDays(startDate: Date, days: number): Date {
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

export function formatDate(dateInput: Date | null | undefined): string {
  if (!dateInput) {
    return "";
  }
  const day = dateInput.getDate();
  const month = dateInput.toLocaleString("default", { month: "short" });
  const year = dateInput.getFullYear();

  return `${day} ${month} ${year}`;
}

export function formatNum(value: number | null | undefined): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "0";
  }

  const numStr = value.toString();

  const [integerPart, decimalPart] = numStr.split(".");

  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ","
  );

  return decimalPart
    ? `${formattedIntegerPart}.${decimalPart}`
    : formattedIntegerPart;
}

export function getPendingMonthsFromExpiry(
  expiryDate: Date | null | undefined
): number {
  const currentDate = new Date();

  if (
    expiryDate === undefined ||
    expiryDate === null ||
    expiryDate <= currentDate
  ) {
    return 0;
  }

  const yearDiff = expiryDate.getFullYear() - currentDate.getFullYear();
  const monthDiff = expiryDate.getMonth() - currentDate.getMonth();

  let totalMonths = yearDiff * 12 + monthDiff;

  const daysDiff = expiryDate.getDate() - currentDate.getDate();

  if (daysDiff > 15) {
    totalMonths += 1;
  } else if (daysDiff < 0) {
    totalMonths -= 1;
  }

  return Math.max(totalMonths, 0);
}

export function handleErrorMsg(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "errno" in error &&
    "message" in error
  ) {
    const sqlError = error as {
      errno?: number;
      message?: string;
      sqlMessage?: string;
    };

    switch (sqlError.errno) {
      case 1451:
        return "Cannot delete this entity as it is referenced in other records.";
      // case 1062:
      //   return "A record with the same value already exists.";
      // case 1048:
      //   return "A required field is missing.";
      // case 1054:
      //   return "An unknown column was specified in the query.";
      // case 1146:
      //   return "The specified table does not exist in the database.";
      // case 1364:
      //   return "A required field does not have a default value.";
      default:
        return `Database error: ${
          sqlError.sqlMessage || sqlError.message || "Unknown error"
        }`;
    }
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle any other type of error
  return String(error);
}

export function getLicenseExtensionStr(data: licenseTranSchemaT): string {
  switch (data.tran_type) {
    case LICENSE_TRAN_GENERATE_NEW_LICENSE: {
      if (data.tran_nature === LICENSE_TRAN_NATURE_FREE_VARIANT) {
        return (
          "Started using " +
          data.product_variant_name +
          " with " +
          data.no_of_users +
          " users."
        );
      } else if (data.tran_nature === LICENSE_TRAN_NATURE_TRIAL_PERIOD) {
        return (
          "Started using " +
          data.product_variant_name +
          " with " +
          data.no_of_users +
          " users and " +
          data.no_of_months +
          " months validity."
        );
      }
    }
    case LICENSE_TRAN_ASSIGN_DEALER_2_LICENSE:
      return "Assigned dealer " + data.dealer_name;
    case LICENSE_TRAN_EXTEND_VARIANT:
      return "Changed to variant " + data.product_variant_name;
    case LICENSE_TRAN_EXTEND_USERS:
      if (data.no_of_users) {
        if (data.no_of_users > 0) {
          return "Increased " + data.no_of_users + " users";
        } else {
          return "Decreased " + Math.abs(data.no_of_users) + " users";
        }
      }
    case LICENSE_TRAN_EXTEND_VALIDITY:
      return "Extended Validity for " + data.no_of_months + " months";
    case LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY:
      return (
        "Extended Validity for " +
        data.no_of_months +
        " months and " +
        data.no_of_users +
        " users"
      );
    case LICENSE_TRAN_EXTEND_ADD_ON:
      return "New License";

    default:
      return "";
  }
}
