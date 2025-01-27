import * as z from "zod";

export const userSchema = z.object({
  id: z.number().int().optional(),
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
  id: z.number().int().optional(),
  name: z.string().trim().min(1).max(255),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const dealerSchema = z.object({
  id: z.number().int().optional(),
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
  no_of_days: z.number().int().nonnegative().nullable().optional(),
});

export const productSchema = z.object({
  id: z.number().int().optional(),
  license_num_identifier: z.string().trim().min(2).max(2),
  name: z.string().trim().min(1).max(255),
  variants: z.array(productVariantsSchema).optional(),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const addonSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().trim().min(1).max(255),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const departmentSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().trim().min(1).max(255),
  dealer_id: z.number().int().positive().nullable().optional(),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const roleSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().trim().min(1).max(255),
  hierarchy: z.number().int().positive(),
  updated_by: z.number().int().positive().optional(),
});

export const executiveSchema = z.object({
  id: z.number().int().optional(),
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
  inviteStatus: z.number().int().positive().optional(),
  executiveStatus: z.number().int().positive().optional(),
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
  valid_months: z.number().int().min(0),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const validityDiscountSlabSchema = z
  .object({
    id: z.number().or(z.string()).optional(),
    product_id: z.number().positive(),
    product_variant_id: z.number().positive(),
    effective_from: z.date(),
    start_value: z.number().int().min(0),
    end_value: z.number().int().min(0),
    discount_percentage: z.number().int().min(0),
    grace: z.number().int().nullable(),
    created_by: z.number().int().positive().optional(),
    updated_by: z.number().int().positive().optional(),
  })
  .refine((data) => data.end_value > data.start_value, {
    message: "End value must be greater than start value",
    path: ["end_value"],
  });

export const userDiscountSlabSchema = z
  .object({
    id: z.number().or(z.string()).optional(),
    product_id: z.number().positive(),
    product_variant_id: z.number().positive(),
    effective_from: z.date(),
    start_value: z.number().int().min(0),
    end_value: z.number().int().min(0),
    discount_percentage: z.number().int().min(0),
    created_by: z.number().int().positive().optional(),
    updated_by: z.number().int().positive().optional(),
  })
  .refine((data) => data.end_value > data.start_value, {
    message: "End value must be greater than start value",
    path: ["end_value"],
  });

export const variantPricingSchema = z.object({
  id: z.number().or(z.string()).optional(),
  product_id: z.number().positive(),
  product_variant_id: z.number().positive(),
  effective_from: z.date(),
  price: z.number().int().min(0),
  early_discount_percentage: z.number().int().min(0),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const schemeMastSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().trim().min(1).max(255),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const licenseDetSchema = z.object({
  id: z.number().int().optional(),
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
  id: z.number().int().optional(),
  license_id: z.number().int().positive(),
  product_variant_id: z.number().int().positive(),
  product_variant_name: z.string().trim().max(255).nullable().optional(),
  no_of_users: z.number().int().min(1),
  current_users: z.number().int().min(1),
  last_dealer_id: z.number().int().positive().nullable().optional(),
  dealer_name: z.string().trim().max(255).nullable().optional(),
  expiry_date: z.date().nullable().optional(),
  grace: z.number().int().min(0).nullable().optional(),
  created_by: z.number().int().positive().nullable().optional(),
  updated_by: z.number().int().positive().nullable().optional(),
});

export const licenseTranSchema = z.object({
  id: z.number().int().nullable().optional(),
  vch_no: z.string().trim().max(255).nullable().optional(),
  license_id: z.number().int().positive(),
  tran_type: z.number().int().positive(),
  product_variant_id: z.number().int().positive().nullable().optional(),
  product_variant_name: z.string().trim().max(255).nullable().optional(),
  no_of_users: z.number().int().nullable().optional(),
  no_of_months: z.number().int().min(1).nullable().optional(),
  dealer_id: z.number().int().positive().nullable().optional(),
  dealer_name: z.string().trim().max(255).nullable().optional(),
  addon_id: z.number().int().positive().nullable().optional(),
  addon_plan_id: z.number().int().positive().nullable().optional(),
  addon_name: z.string().trim().max(255).nullable().optional(),
  addon_plan_name: z.string().trim().max(255).nullable().optional(),
  remarks: z.string().trim().max(255).nullable().optional(),
  payment_mode: z.number().int().min(0).nullable().optional(),
  payment_ref_no: z.string().trim().max(255).nullable().optional(),
  payment_amt: z.number().int().nullable().optional(),
  scheme_id: z.number().int().positive().nullable().optional(),
  tran_nature: z.number().int().positive(),
  created_by: z.number().int().positive().nullable().optional(),
  updated_by: z.number().int().positive().nullable().optional(),
  created_at: z.date().nullable().optional(),
});

export const addonStatusSchema = z.object({
  id: z.number().int().optional(),
  license_id: z.number().int().positive(),
  addon_id: z.number().int().positive(),
  addon_plan_id: z.number().int().positive(),
  addon_plan_name: z.string().trim().max(255).nullable().optional(),
  addon_plan_value: z.number().int().nullable().optional(),
  balance_addon_value: z.number().int(),
  expiry_date: z.date(),
  grace: z.number().int().positive().nullable().optional(),
  created_by: z.number().int().positive(),
});

export const dealerCreditTranSchema = z.object({
  id: z.number().int().optional(),
  vch_no: z.string().trim().max(255).nullable().optional(),
  dealer_id: z.number().int().positive().nullable().optional(),
  tran_type: z.number().int().positive(),
  license_tran_id: z.number().int().positive().nullable().optional(),
  modified_credits: z.number().int().min(-2147483647).max(2147483647),
  invoice_no: z.string().trim().max(255).nullable().optional(),
  invoice_date: z.date().nullable().optional(),
  tran_date: z.date(),
  remarks: z.string().trim().max(255).nullable().optional(),
  created_by: z.number().int().positive().nullable().optional(),
  updated_by: z.number().int().positive().nullable().optional(),
});
