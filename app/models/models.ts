import * as z from "zod";
import * as zs from "../zodschema/zodschema";

export type userSchemaT = z.infer<typeof zs.userSchema>;
export type productSchemaT = z.infer<typeof zs.productSchema>;
export type dealerSchemaT = z.infer<typeof zs.dealerSchema>;
export type licenseFieldSchemaT=z.infer<typeof zs.licenseFieldSchema>
export type productParamSchemaT=z.infer<typeof zs.productParamSchema>
export type businessEntitySchemaT=z.infer<typeof zs.businessEntitySchema>
// export type licenseFieldsArraySchemaT=z.infer<typeof zs.licenseFieldsArraySchema>
