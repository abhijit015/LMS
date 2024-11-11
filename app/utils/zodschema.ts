import * as z from "zod";

export const userSchema = z.object({
  id: z.number().int().positive().optional(),
  client_id: z.number().int().positive().optional(),
  email: z.string().trim().email().min(1).max(255),
  phone: z.string().trim().max(255).optional(),
  password: z.string().trim().min(1).max(255).optional(),
  display_name: z.string().trim().min(1).max(255),
  dealer_id: z.number().int().positive().optional(),
  user_type: z.number().int().min(1).max(3),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const clientSchema = z.object({
  id: z.number().int().positive().optional(),
  contact_person: z.string().trim().max(255).optional(),
});

export const dealerSchema = z.object({
  id: z.number().int().positive().optional(),
  client_id: z.number().int().positive().optional(),
  products: z.array(z.number().int().positive()).optional(),
  contact_person: z.string().trim().max(255).optional(),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

export const productLicenseParamsSchema = z.object({
  id: z.number().optional(),
  product_id: z.number().int(),
  license_param_id: z.number().int(),
  effective_from: z.date(),
  selected: z.boolean().default(false),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
});

export const productSchema = z.object({
  id: z.number().int().positive().optional(),
  client_id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(255),
  productLicenseParams: z.array(productLicenseParamsSchema).optional(),
  created_by: z.number().int().positive().optional(),
  updated_by: z.number().int().positive().optional(),
});

// export const productLicenseParamSchema = z.object({
//     id: z.number().int().optional(),
//     product_id: z.number().int(),
//     license_param_id: z.number().int(),
//     with_effect_from: z.date(),
//     selected: z.boolean(),
//     created_by: z.number()
//         .int()
//         .positive("Created By Must Be a Positive Integer"),
//     updated_by: z.number()
//         .int()
//         .positive("Updated By Must Be a Positive Integer"),
//     isNew: z.boolean()
// });

// export const productLicensePlanSchema = z.object({
//     id: z.number().int().optional(),
//     product_id: z.number().int(),
//     license_param_id: z.number().int(),
//     plan_name: z.string().max(255),
//     with_effect_from: z.date(),
//     plan_value: z.string().max(255),
//     price: z.number(),
//     created_by: z.number()
//         .int()
//         .positive("Created By Must Be a Positive Integer"),
//     updated_by: z.number()
//         .int()
//         .positive("Updated By Must Be a Positive Integer"),
//     isNew: z.boolean()
// });

// export const productDetailSchema = z.object({
//     id: z.number().int().optional(),
//     name: z.string().max(255),
//     created_by: z.number()
//         .int()
//         .positive("Created By Must Be a Positive Integer"),
//     updated_by: z.number()
//         .int()
//         .positive("Updated By Must Be a Positive Integer"),
// })

// export const productSchema = z.object({
//     productDetail: productDetailSchema,
//     licenseParams: z.array(productLicenseParamSchema)
// });
