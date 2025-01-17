import * as z from "zod";
import * as zs from "./zodschema";

export type userSchemaT = z.infer<typeof zs.userSchema>;
export type businessSchemaT = z.infer<typeof zs.businessSchema>;
export type departmentSchemaT = z.infer<typeof zs.departmentSchema>;
export type roleSchemaT = z.infer<typeof zs.roleSchema>;
export type dealerSchemaT = z.infer<typeof zs.dealerSchema>;
export type productSchemaT = z.infer<typeof zs.productSchema>;
export type productVariantsSchemaT = z.infer<typeof zs.productVariantsSchema>;
export type addonSchemaT = z.infer<typeof zs.addonSchema>;
export type executiveSchemaT = z.infer<typeof zs.executiveSchema>;
export type addonPlansSchemaT = z.infer<typeof zs.addonPlansSchema>;
export type validityDiscountSlabSchemaT = z.infer<
  typeof zs.validityDiscountSlabSchema
>;
export type userDiscountSlabSchemaT = z.infer<typeof zs.userDiscountSlabSchema>;
export type variantPricingSchemaT = z.infer<typeof zs.variantPricingSchema>;
export type schemeMastSchemaT = z.infer<typeof zs.schemeMastSchema>;
export type licenseDetSchemaT = z.infer<typeof zs.licenseDetSchema>;
export type licenseStatusSchemaT = z.infer<typeof zs.licenseStatusSchema>;
export type licenseTranSchemaT = z.infer<typeof zs.licenseTranSchema>;
export type addonStatusSchemaT = z.infer<typeof zs.addonStatusSchema>;
export type dealerCreditTranSchemaT = z.infer<typeof zs.dealerCreditTranSchema>;

export type inviteSchemaT = {
  id: number;
  business_id: number;
  name: string;
  identifier: string | undefined | null;
  role: number;
  entity_id: number;
  dealer_id: number;
  status: number;
  created_by: number;
  updated_by: number;
};
