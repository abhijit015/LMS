import * as z from "zod";
import * as zs from "./zodschema";

export type userSchemaT = z.infer<typeof zs.userSchema>;
export type dealerSchemaT = z.infer<typeof zs.dealerSchema>;
export type clientSchemaT = z.infer<typeof zs.clientSchema>;
export type productSchemaT = z.infer<typeof zs.productSchema>;

export interface licenseParamSchemaT {
  id: number;
  name: string;
  basis: number;
  client_id: number;
}

export type productLicenseParamsSchemaT = z.infer<
  typeof zs.productLicenseParamsSchema
>;

// export type dealerInfoSchemaT = z.infer<typeof zs.dealerInfoSchema>;
// export type productSchemaT = z.infer<typeof zs.productSchema>;
// export type productLicensePlanSchemaT = z.infer<typeof zs.productLicensePlanSchema>;
// export type productLicenseParamSchemaT = z.infer<typeof zs.productLicenseParamSchema>;
// export type productDetailSchemaT = z.infer<typeof zs.productDetailSchema>;

// export type licenseFieldSchemaT = {
//     id: number;
//     name: string;
//     license_param_basis_id: number;
// };
