//roles
export const ROLE_BUSINESS_ADMIN: number = 1;
export const ROLE_BUSINESS_EXECUTIVE: number = 2;
export const ROLE_DEALER_ADMIN: number = 3;
export const ROLE_DEALER_EXECUTIVE: number = 4;

//license param
export const LICENSE_PARAM_VARIANT: number = 1;
export const LICENSE_PARAM_VALIDITY: number = 2;
export const LICENSE_PARAM_USERS: number = 3;

//invite status
export const INVITE_STATUS_ACCEPTED: number = 1;
export const INVITE_STATUS_REJECTED: number = 2;
export const INVITE_STATUS_PENDING: number = 3;
export const INVITE_STATUS_CANCELLED: number = 4;
export const INVITE_STATUS_DEREGISTERED: number = 5;

//user business mapping status
export const USER_BUSINESS_MAPPING_STATUS_ACTIVE: number = 1;
export const USER_BUSINESS_MAPPING_STATUS_DISABLED: number = 2;

//license tran types
export const LICENSE_TRAN_GENERATE_NEW_LICENSE: number = 1;
export const LICENSE_TRAN_ASSIGN_DEALER_2_LICENSE: number = 2;
export const LICENSE_TRAN_EXTEND_VARIANT: number = 3;
export const LICENSE_TRAN_EXTEND_USERS: number = 4;
export const LICENSE_TRAN_EXTEND_VALIDITY: number = 5;
export const LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY: number = 6;
export const LICENSE_TRAN_EXTEND_ADD_ON: number = 7;

//dealer credit tran types
export const DEALER_CREDIT_TRAN_ASSIGN_CREDITS: number = 1;
export const DEALER_CREDIT_TRAN_CONSUME_CREDITS: number = 2;

//tran nature
export const LICENSE_TRAN_NATURE_GENERAL: number = 1;
export const LICENSE_TRAN_NATURE_TRIAL_PERIOD: number = 2;
export const LICENSE_TRAN_NATURE_FREE_VARIANT: number = 3;
export const LICENSE_TRAN_NATURE_SCHEME: number = 4;

//input modes
export const ADD: number = 1;
export const MODIFY: number = 2;

//payment types
export const PAYMENT_MODE_CASH: number = 1;
export const PAYMENT_MODE_CREDITS: number = 2;
