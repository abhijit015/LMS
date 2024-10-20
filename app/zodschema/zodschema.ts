import * as z from "zod";

export const licenseFieldSchema = z.object({
  id: z.number().optional(),
  name: z.string()
    .trim()
    .min(1, "Name Cannot Be Empty")
    .max(255, "Name Cannot Exceed 255 Characters"),
  basis: z.string()
    .trim()
    .min(1, "Basis Cannot Be Blank"),
  isNew: z.boolean().optional(),
});

// export const licenseFieldsArraySchema = z.array(licenseFieldSchema);


export const userSchema = z.object({
  id: z.number().optional(),
  username: z.string()
    .trim()
    .min(1, "Username Cannot Be Empty")
    .max(255, "Username Cannot Exceed 255 Characters"),
  password: z.string()
    .trim()
    .min(1, "Password Cannot Be Empty")
    .max(255, "Password Cannot Exceed 255 Characters"),
  display_name: z.string()
    .trim()
    .min(1, "Display Name Cannot Be Empty")
    .max(255, "Display Name Cannot Exceed 255 Characters"),
  type: z.number().optional(),
});


export const productSchema = z.object({
  id: z.number().optional(),
  name: z.string()
    .trim()
    .min(1, "Name Cannot Be Empty")
    .max(255, "Name Cannot Exceed 255 Characters"),
});


export const dealerSchema = z.object({
  id: z.number().optional(),
  name: z.string()
    .trim()
    .min(1, "Name Cannot Be Empty")
    .max(255, "Name Cannot Exceed 255 Characters"),
  contact_num: z.string()
    .trim()
    .max(2, "Contact Number Cannot Exceed 255 Characters")
    .optional(),
  email: z.string()
    .trim()
    .max(255, "Email Cannot Exceed 255 Characters")
    .optional(),
});
