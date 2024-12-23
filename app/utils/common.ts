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
  LICENSE_PARAM_VALID_UPTO,
  LICENSE_PARAM_VARIANT,
} from "./constants";
import {
  inviteSchemaT,
  dealerSchemaT,
  executiveSchemaT,
  addonSchemaT,
} from "./models";

// Role
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
      return LICENSE_PARAM_VALID_UPTO;
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
    case LICENSE_PARAM_VALID_UPTO:
      return "Valid Upto";
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

export function initExecutiveData(): executiveSchemaT {
  return {
    id: 0,
    name: "",
    contact_name: "",
    contact_identifier: "",
    dealer_id: 0,
    department_id: 0,
    role_id: 0,
    send_invitation: false,
    invite_id: 0,
    created_by: 0,
    updated_by: 0,
  };
}

export function loadLicenseParams(): { id: number; name: string }[] {
  const licenseParamIds = [
    LICENSE_PARAM_VARIANT,
    LICENSE_PARAM_VALID_UPTO,
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
    expiry_date_with_grace: null,
    expiry_date_without_grace: null,
    created_by: 0,
  };
}

export function initLicenseTranData() {
  return {
    id: 0,
    license_id: 0,
    tran_type: 0,
    old_product_variant_id: null,
    new_product_variant_id: null,
    current_no_of_users: null,
    modifed_no_of_users: null,
    balance_no_of_users: null,
    current_no_of_months: null,
    modifed_no_of_months: null,
    balance_no_of_months: null,
    old_dealer_id: null,
    new_dealer_id: null,
    current_expiry_date_with_grace: null,
    current_expiry_date_without_grace: null,
    new_expiry_date_with_grace: null,
    new_expiry_date_without_grace: null,
    addon_id: null,
    current_addon_plan_id: null,
    new_addon_plan_id: null,
    remarks: "",
    payment_type: null,
    payment_ref_no: "",
    payment_amt: null,
    tran_nature: 0,
    scheme_id: null,
    created_by: null,
    updated_by: null,
  };
}

export function initAddonStatusData() {
  return {
    id: 0,
    license_id: 0,
    addon_id: null,
    addon_plan_id: null,
    balance_addon_value_with_grace: 0,
    balance_addon_value_without_grace: 0,
    created_by: 0,
  };
}

export function initDealerCreditsStatusData() {
  return {
    id: 0,
    dealer_id: 0,
    balance_credits: 0,
    created_by: 0,
  };
}

export function initDealerCreditsLedgerData() {
  return {
    id: 0,
    dealer_id: null,
    tran_type: 0,
    tran_id: null,
    current_credits: 0,
    consumed_credits: 0,
    balance_credits: 0,
    ref_no: "",
    remarks: "",
    created_by: 0,
    updated_by: 0,
  };
}

export function calculateExpiryDate(months: number): Date {
  const currentDate = new Date();

  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const targetMonth = currentMonth + months;
  const targetYear = currentYear + Math.floor(targetMonth / 12);
  const adjustedMonth = targetMonth % 12;

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
