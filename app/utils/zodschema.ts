import * as z from "zod";

export const userSchema = z.object({
  id: z.number().int().positive().optional(),
  email: z.string().trim().email().min(1).max(255),
  phone: z
    .string()
    .trim()
    .min(1)
    .refine((value) => /^[0-9]{10}$/.test(value), {
      message: "Phone number must be a 10-digit number",
    }),
  password: z.string().trim().min(1).max(255),
  name: z.string().trim().min(1).max(255),
});

export const businessSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(255),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const dealerSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Name is required").max(255),
  mapped_user_id: z.number().int().nullable().optional(),
  invite_id: z.number().int().positive().nullable().optional(),
  products: z.array(z.number().int().positive()).default([]),
  contact_name: z.string().trim().min(1, "Contact name is required").max(255),
  contact_identifier: z
    .union([
      z.string().email("Must be either a valid email or 10-digit phone number"),
      z
        .string()
        .regex(
          /^\d{10}$/,
          "Must be either a valid email or 10-digit phone number"
        ),
    ])

    .refine((val) => {
      return true;
    }, "Must be either a valid email or 10-digit phone number"),
  send_invitation: z.boolean().default(false),
  dealerStatus: z.number().int().positive().optional(),
  inviteStatus: z.number().int().positive().optional(),
  created_by: z.number().int().positive().nullable().optional(),
  updated_by: z.number().int().positive().nullable().optional(),
});

export const productVariantsSchema = z.object({
  id: z.number().or(z.string()).optional(),
  name: z.string().trim().min(1),
  product_id: z.number().int().positive().nullable().optional(),
  is_free_variant: z.boolean().default(false),
  no_of_users: z.number().int().positive(),
  no_of_months: z.number().int().nonnegative().nullable().optional(),
});

export const productSchema = z.object({
  id: z.number().int().positive().optional(),
  license_num_identifier: z.string().trim().min(2).max(2),
  name: z.string().trim().min(1).max(255),
  variants: z.array(productVariantsSchema).optional(),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const licenseSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(255),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const addonSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(255),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const departmentSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(255),
  dealer_id: z.number().int().positive().nullable().optional(),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const roleSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(255),
  hierarchy: z.number().int().positive(),
  updated_by: z.number().int().positive().optional(),
});

export const executiveSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(255),
  mapped_user_id: z.number().int().nullable().optional(),
  invite_id: z.number().int().positive().optional(),
  department_id: z.number().int().positive(),
  role_id: z.number().int().positive(),
  dealer_id: z.number().int().positive().nullable().optional(),
  contact_name: z.string().trim().min(1).max(255),
  contact_identifier: z
    .union([
      z.string().email("Must be either a valid email or 10-digit phone number"),
      z
        .string()
        .regex(
          /^\d{10}$/,
          "Must be either a valid email or 10-digit phone number"
        ),
    ])
    .refine((val) => {
      return true;
    }, "Must be either a valid email or 10-digit phone number"),
  send_invitation: z.boolean().default(false),
  executiveStatus: z.number().int().positive().optional(),
  inviteStatus: z.number().int().positive().optional(),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const addonPlansSchema = z.object({
  id: z.number().or(z.string()).optional(),
  addon_id: z.number().positive(),
  product_id: z.number().positive(),
  product_variant_id: z.number().positive(),
  effective_from: z.date(),
  plan_name: z.string().trim().min(1, "Plan name is required").max(255),
  value: z.number().int().min(0),
  price: z.number().int().min(0),
  grace: z.number().int().min(0),
  created_by: z.number().int().positive().optional(),
});

export const validityDiscountSlabSchema = z.object({
  id: z.number().or(z.string()).optional(),
  product_id: z.number().positive(),
  product_variant_id: z.number().positive(),
  effective_from: z.date(),
  start_value: z.number().int().min(0),
  end_value: z.number().int().min(0),
  discount_percentage: z.number().int().min(0),
  grace: z.number().int().nullable(),
  created_by: z.number().int().positive().optional(),
});

export const userDiscountSlabSchema = z.object({
  id: z.number().or(z.string()).optional(),
  product_id: z.number().positive(),
  product_variant_id: z.number().positive(),
  effective_from: z.date(),
  start_value: z.number().int().min(0),
  end_value: z.number().int().min(0),
  discount_percentage: z.number().int().min(0),
  created_by: z.number().int().positive().optional(),
});

export const variantPricingSchema = z.object({
  id: z.number().or(z.string()).optional(),
  product_id: z.number().positive(),
  product_variant_id: z.number().positive(),
  effective_from: z.date(),
  price: z.number().int().min(0),
  early_discount_percentage: z.number().int().min(0),
  created_by: z.number().int().positive().optional(),
});

export const schemeMastSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(255),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const licenseDetSchema = z.object({
  id: z.number().int().positive().optional(),
  license_no: z.string().trim().min(1).max(255),
  product_id: z.number().int().positive(),
  entity_id: z.number().int().positive(),
  entity_identifier: z.string().trim().max(255).nullable().optional(),
  contact_name: z.string().trim().max(255).nullable().optional(),
  contact_email: z.string().trim().email().max(255).nullable().optional(),
  contact_phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be 10 digits")
    .nullable()
    .optional(),
});

export const licenseStatusSchema = z.object({
  id: z.number().int().positive().optional(),
  license_id: z.number().int().positive(),
  product_variant_id: z.number().int().positive(),
  no_of_users: z.number().int().min(0),
  current_users: z.number().int().min(0),
  dealer_id: z.number().int().positive().nullable().optional(),
  expiry_date_with_grace: z.date().nullable().optional(),
  expiry_date_without_grace: z.date().nullable().optional(),
  created_by: z.number().int().positive(),
});

export const licenseTranSchema = z.object({
  id: z.number().int().positive().optional(),
  license_id: z.number().int().positive(),
  tran_type: z.number().int().positive(),
  old_product_variant_id: z.number().int().positive().nullable().optional(),
  new_product_variant_id: z.number().int().positive().nullable().optional(),
  current_no_of_users: z.number().int().min(0).nullable().optional(),
  modifed_no_of_users: z.number().int().min(0).nullable().optional(),
  balance_no_of_users: z.number().int().min(0).nullable().optional(),
  current_no_of_months: z.number().int().min(0).nullable().optional(),
  modifed_no_of_months: z.number().int().min(0).nullable().optional(),
  balance_no_of_months: z.number().int().min(0).nullable().optional(),
  old_dealer_id: z.number().int().positive().nullable().optional(),
  new_dealer_id: z.number().int().positive().nullable().optional(),
  current_expiry_date_with_grace: z.date().nullable().optional(),
  current_expiry_date_without_grace: z.date().nullable().optional(),
  new_expiry_date_with_grace: z.date().nullable().optional(),
  new_expiry_date_without_grace: z.date().nullable().optional(),
  addon_id: z.number().int().positive().nullable().optional(),
  current_addon_plan_id: z.number().int().positive().nullable().optional(),
  new_addon_plan_id: z.number().int().positive().nullable().optional(),
  remarks: z.string().trim().max(255).nullable().optional(),
  payment_type: z.number().int().min(0).nullable().optional(),
  payment_ref_no: z.string().trim().max(255).nullable().optional(),
  payment_amt: z.number().int().nullable().optional(),
  scheme_id: z.number().int().positive().nullable().optional(),
  tran_nature: z.number().int().positive(),
  created_by: z.number().int().positive().nullable().optional(),
  updated_by: z.number().int().positive().nullable().optional(),
});

export const addonStatusSchema = z.object({
  id: z.number().int().positive().optional(),
  license_id: z.number().int().positive(),
  addon_id: z.number().int().positive().nullable().optional(),
  addon_plan_id: z.number().int().positive().nullable().optional(),
  balance_addon_value_with_grace: z.number().int().min(0),
  balance_addon_value_without_grace: z.number().int().min(0),
  created_by: z.number().int().positive(),
});

export const dealerCreditsStatusSchema = z.object({
  id: z.number().int().positive().optional(),
  dealer_id: z.number().int().positive(),
  balance_credits: z.number().int().min(0),
  created_by: z.number().int().positive(),
});

export const dealerCreditsLedgerSchema = z.object({
  id: z.number().int().positive().optional(),
  dealer_id: z.number().int().positive().nullable().optional(),
  tran_type: z.number().int().positive(),
  tran_id: z.number().int().positive().nullable().optional(),
  current_credits: z.number().int().min(0),
  consumed_credits: z.number().int().min(0),
  balance_credits: z.number().int().min(0),
  ref_no: z.string().trim().max(255).nullable().optional(),
  remarks: z.string().trim().max(255).nullable().optional(),
  created_by: z.number().int().positive(),
  updated_by: z.number().int().positive(),
});
