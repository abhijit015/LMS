"use server";

import {
  addonPlansSchema,
  userDiscountSlabSchema,
  validityDiscountSlabSchema,
  variantPricingSchema,
} from "../utils/zodschema";
import {
  addonPlansSchemaT,
  licenseStatusSchemaT,
  productVariantsSchemaT,
  userDiscountSlabSchemaT,
  userSchemaT,
  validityDiscountSlabSchemaT,
  variantPricingSchemaT,
} from "../utils/models";
import { getCurrentUserDet } from "./user.controller";
import {
  saveAddonPlansInDB,
  loadActiveAddonPlansFromDB,
  loadActiveVariantPricingFromDB,
  loadActiveUserDiscountSlabsFromDB,
  loadActiveValidityDiscountSlabsFromDB,
  saveVariantPricingInDB,
  saveUserDiscountSlabsInDB,
  saveValidityDiscountSlabsInDB,
  loadPrevAddonPlansFromDB,
  loadPrevUserDiscountSlabsFromDB,
  loadPrevValidityDiscountSlabsFromDB,
  loadPrevVariantPricingFromDB,
  getUnitPriceAndEarlyDiscount4VariantFromDB,
  getDiscount4ExtendingUsersFromDB,
  getDiscountAndGrace4ExtendingValidityFromDB,
} from "../services/pricing.service";
import {
  getPendingMonthsFromExpiry,
  initLicenseStatusData,
} from "../utils/common";
import { loadLicenseStatus } from "./license.controller";
import {
  LICENSE_TRAN_EXTEND_USERS,
  LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY,
  LICENSE_TRAN_EXTEND_VALIDITY,
  LICENSE_TRAN_EXTEND_VARIANT,
} from "../utils/constants";
import { loadVariant } from "./product.controller";

export async function setAddonPlansDataB4Saving(
  addonPlansData: addonPlansSchemaT[],
  addon_id: number,
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let userData: userSchemaT;

  try {
    if (proceed) {
      result = await getCurrentUserDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        userData = result.data;
      }
    }

    if (proceed) {
      addonPlansData.forEach((plan) => {
        plan.updated_by = userData.id;
        plan.created_by = userData.id;
      });
    }

    return {
      status: proceed,
      message: proceed ? "Addon plans data prepared successfully." : errMsg,
      data: proceed ? addonPlansData : null,
    };
  } catch (error) {
    console.error("Error while setting addon_plans data before saving:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function setVariantPricingDataB4Saving(
  variantPricingData: variantPricingSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let userData: userSchemaT;

  try {
    if (proceed) {
      result = await getCurrentUserDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        userData = result.data;
      }
    }

    if (proceed) {
      variantPricingData.forEach((plan) => {
        plan.created_by = userData.id;
        plan.updated_by = userData.id;
      });
    }

    return {
      status: proceed,
      message: proceed ? "variant_pricing data prepared successfully." : errMsg,
      data: proceed ? variantPricingData : null,
    };
  } catch (error) {
    console.error(
      "Error while setting variant_pricing data before saving:",
      error
    );
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function setUserDiscountSlabsDataB4Saving(
  userDiscountSlabData: userDiscountSlabSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let userData: userSchemaT;

  try {
    if (proceed) {
      result = await getCurrentUserDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        userData = result.data;
      }
    }

    if (proceed) {
      userDiscountSlabData.forEach((plan) => {
        plan.created_by = userData.id;
        plan.updated_by = userData.id;
      });
    }

    return {
      status: proceed,
      message: proceed
        ? "user_discount_slabs data prepared successfully."
        : errMsg,
      data: proceed ? userDiscountSlabData : null,
    };
  } catch (error) {
    console.error(
      "Error while setting user_discount_slabs data before saving:",
      error
    );
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function setValidityDiscountSlabsDataB4Saving(
  validityDiscountSlabData: validityDiscountSlabSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let userData: userSchemaT;

  try {
    if (proceed) {
      result = await getCurrentUserDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        userData = result.data;
      }
    }

    if (proceed) {
      validityDiscountSlabData.forEach((plan) => {
        plan.created_by = userData.id;
        plan.updated_by = userData.id;
      });
    }

    return {
      status: proceed,
      message: proceed
        ? "validity_discount_slabs data prepared successfully."
        : errMsg,
      data: proceed ? validityDiscountSlabData : null,
    };
  } catch (error) {
    console.error(
      "Error while setting validity_discount_slabs data before saving:",
      error
    );
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveAddonPlans(
  addonPlansData: addonPlansSchemaT[],
  addon_id: number,
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await setAddonPlansDataB4Saving(
        addonPlansData,
        addon_id,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canAddonPlansBeSaved(
        addonPlansData,
        addon_id,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveAddonPlansInDB(
        addonPlansData,
        addon_id,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Addon plans saved successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving addon_plans:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveVariantPricing(
  variantPricingData: variantPricingSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await setVariantPricingDataB4Saving(
        variantPricingData,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canVariantPricingBeSaved(
        variantPricingData,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveVariantPricingInDB(
        variantPricingData,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "variant_pricing saved successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving variant_pricing:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveUserDiscountSlabs(
  userDiscountSlabData: userDiscountSlabSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await setUserDiscountSlabsDataB4Saving(
        userDiscountSlabData,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canUserDiscountSlabsBeSaved(
        userDiscountSlabData,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveUserDiscountSlabsInDB(
        userDiscountSlabData,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "user_discount_slabs saved successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving user_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveValidityDiscountSlabs(
  validityDiscountSlabData: validityDiscountSlabSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await setValidityDiscountSlabsDataB4Saving(
        validityDiscountSlabData,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canValidityDiscountSlabsBeSaved(
        validityDiscountSlabData,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveValidityDiscountSlabsInDB(
        validityDiscountSlabData,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "validity_discount_slabs saved successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving validity_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canAddonPlansBeSaved(
  addonPlansData: addonPlansSchemaT[],
  addon_id: number,
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";

  try {
    if (proceed) {
      if (!addonPlansData) {
        proceed = false;
        errMsg = "Addon plans data cannot be null.";
      }
    }

    if (proceed) {
      const validationErrors: string[] = [];

      addonPlansData.forEach((plan, index) => {
        const parsed = addonPlansSchema.safeParse(plan);
        if (!parsed.success) {
          const issues = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ");
          validationErrors.push(`Plan ${index + 1}: ${issues}`);
        }
      });

      if (validationErrors.length > 0) {
        proceed = false;
        errMsg = validationErrors.join("; ");
      }
    }

    return {
      status: proceed,
      message: proceed ? "Validation successful." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error validating addon_plans:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canVariantPricingBeSaved(
  variantPricingData: variantPricingSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";

  try {
    if (proceed) {
      if (!variantPricingData) {
        proceed = false;
        errMsg = "variant_pricing data cannot be null.";
      }
    }

    if (proceed) {
      const validationErrors: string[] = [];

      variantPricingData.forEach((plan, index) => {
        const parsed = variantPricingSchema.safeParse(plan);
        if (!parsed.success) {
          const issues = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ");
          validationErrors.push(`Plan ${index + 1}: ${issues}`);
        }
      });

      if (validationErrors.length > 0) {
        proceed = false;
        errMsg = validationErrors.join("; ");
      }
    }

    return {
      status: proceed,
      message: proceed ? "Validation successful." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error validating variant_pricing:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canUserDiscountSlabsBeSaved(
  userDiscountSlabData: userDiscountSlabSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";

  try {
    if (proceed) {
      if (!userDiscountSlabData) {
        proceed = false;
        errMsg = "user_discount_slabs data cannot be null.";
      }
    }

    if (proceed) {
      const validationErrors: string[] = [];

      // Validate each slab
      userDiscountSlabData.forEach((plan, index) => {
        const parsed = userDiscountSlabSchema.safeParse(plan);
        if (!parsed.success) {
          const issues = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ");
          validationErrors.push(`Plan ${index + 1}: ${issues}`);
        }
      });

      // Group slabs by date
      const groupedByDate: Record<string, userDiscountSlabSchemaT[]> =
        userDiscountSlabData.reduce(
          (acc: Record<string, userDiscountSlabSchemaT[]>, row) => {
            const dateKey = row.effective_from.toISOString();
            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push(row);
            return acc;
          },
          {}
        );

      // Check for overlaps and gaps within each group
      Object.entries(groupedByDate).forEach(([effectiveDate, rowsForDate]) => {
        const sortedRows = rowsForDate.sort(
          (a, b) => a.start_value - b.start_value
        );

        for (let i = 0; i < sortedRows.length - 1; i++) {
          const currentRow = sortedRows[i];
          const nextRow = sortedRows[i + 1];

          // Check for overlaps
          if (currentRow.end_value >= nextRow.start_value) {
            validationErrors.push(
              `Overlap detected: Row ${i + 1} ends at ${
                currentRow.end_value
              } while Row ${i + 2} starts at ${nextRow.start_value}  `
            );
          }

          // Check for gaps
          else if (nextRow.start_value - currentRow.end_value > 1) {
            const missingRange = `${currentRow.end_value + 1} to ${
              nextRow.start_value - 1
            }`;
            validationErrors.push(
              `Gap detected: Missing values ${missingRange} between Row ${
                i + 1
              } and Row ${i + 2}`
            );
          }
        }
      });

      // If there are validation errors, mark as failed
      if (validationErrors.length > 0) {
        proceed = false;
        errMsg = validationErrors.join("; ");
      }
    }

    return {
      status: proceed,
      message: proceed ? "Validation successful." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error validating user_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canValidityDiscountSlabsBeSaved(
  validityDiscountSlabData: validityDiscountSlabSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";

  try {
    if (proceed) {
      if (!validityDiscountSlabData) {
        proceed = false;
        errMsg = "validity_discount_slabs data cannot be null.";
      }
    }

    if (proceed) {
      const validationErrors: string[] = [];

      // Step 1: Validate each slab using schema
      validityDiscountSlabData.forEach((plan, index) => {
        const parsed = validityDiscountSlabSchema.safeParse(plan);
        if (!parsed.success) {
          const issues = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ");
          validationErrors.push(`Plan ${index + 1}: ${issues}`);
        }
      });

      // Step 2: Group slabs by `effective_from` date
      const groupedByDate: Record<string, validityDiscountSlabSchemaT[]> =
        validityDiscountSlabData.reduce(
          (acc: Record<string, validityDiscountSlabSchemaT[]>, row) => {
            const dateKey = row.effective_from.toISOString();
            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push(row);
            return acc;
          },
          {}
        );

      // Step 3: Validate each group for overlaps and gaps
      Object.entries(groupedByDate).forEach(([effectiveDate, rowsForDate]) => {
        // Sort rows by `start_value`
        const sortedRows = [...rowsForDate].sort(
          (a, b) => a.start_value - b.start_value
        );

        // Validate for overlaps and gaps
        for (let i = 0; i < sortedRows.length - 1; i++) {
          const currentRow = sortedRows[i];
          const nextRow = sortedRows[i + 1];

          // Overlap detection
          if (currentRow.end_value >= nextRow.start_value) {
            validationErrors.push(
              `Overlap detected : Row ${i + 1} (ends at ${
                currentRow.end_value
              }) overlaps with Row ${i + 2} (starts at ${nextRow.start_value}).`
            );
          }

          // Gap detection
          else if (nextRow.start_value - currentRow.end_value > 1) {
            const missingRange = `${currentRow.end_value + 1} to ${
              nextRow.start_value - 1
            }`;
            validationErrors.push(
              `Gap detected : Missing values ${missingRange} between Row ${
                i + 1
              } and Row ${i + 2}.`
            );
          }
        }
      });

      // If validation errors exist, set proceed to false
      if (validationErrors.length > 0) {
        proceed = false;
        errMsg = validationErrors.join("; ");
      }

      if (validationErrors.length > 0) {
        proceed = false;
        errMsg = validationErrors.join("; ");
      }
    }

    return {
      status: proceed,
      message: proceed ? "Validation successful." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error validating validity_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadActiveAddonPlans(
  addon_id: number,
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await loadActiveAddonPlansFromDB(
        addon_id,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Addon plans loaded successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error loading addon_plans:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadActiveVariantPricing(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await loadActiveVariantPricingFromDB(
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "variant_pricing loaded successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error loading variant_pricing:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadActiveUserDiscountSlabs(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await loadActiveUserDiscountSlabsFromDB(
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "user_discount_slabs loaded successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error loading user_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadActiveValidityDiscountSlabs(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await loadActiveValidityDiscountSlabsFromDB(
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed
        ? "validity_discount_slabs loaded successfully."
        : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error loading validity_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadPrevAddonPlans(
  addon_id: number,
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await loadPrevAddonPlansFromDB(
        addon_id,
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Addon plans loaded successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error loading addon_plans:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadPrevVariantPricing(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await loadPrevVariantPricingFromDB(
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "variant_pricing loaded successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error loading variant_pricing:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadPrevUserDiscountSlabs(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await loadPrevUserDiscountSlabsFromDB(
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "user_discount_slabs loaded successfully." : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error loading user_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadPrevValidityDiscountSlabs(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      result = await loadPrevValidityDiscountSlabsFromDB(
        product_id,
        product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed
        ? "validity_discount_slabs loaded successfully."
        : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error loading validity_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

// export async function getCreditsReqd4ExtendingVariant(
//   product_variant_id: number
// ) {
//   let proceed: boolean = true;
//   let errMsg: string = "";
//   let result;

//   try {
//     if (proceed) {
//       result = await getCreditsReqd4ExtendingVariantFromDB(product_variant_id);
//       if (!result.status) {
//         proceed = false;
//         errMsg = result.message;
//       }
//     }

//     return {
//       status: proceed,
//       message: proceed ? "Success" : errMsg,
//       data: proceed ? result?.data : null,
//     };
//   } catch (error) {
//     console.error("Error in getCreditsReqd4ExtendingVariant :", error);
//     return {
//       status: false,
//       message:
//         error instanceof Error ? error.message : "Unknown error occurred.",
//       data: null,
//     };
//   }
// }

export async function getCurrentLicensePrice(licenseId: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let currentLicensePrice: number = 0;
  let licenseStatusData: licenseStatusSchemaT = initLicenseStatusData();
  let unitPrice: number = 0;
  let units: number = 0;

  try {
    if (proceed) {
      result = await loadLicenseStatus(licenseId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        licenseStatusData = result.data;
      }
    }

    if (proceed) {
      result = await getUnitPriceAndEarlyDiscount4VariantFromDB(
        licenseStatusData.product_variant_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        if (result.data?.unitPrice) {
          unitPrice = result.data?.unitPrice;
        }
      }
    }

    if (proceed) {
      const pendingMonths: number = getPendingMonthsFromExpiry(
        licenseStatusData.expiry_date
      );

      units = pendingMonths + licenseStatusData.no_of_users;
      currentLicensePrice = units * unitPrice;
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? currentLicensePrice : null,
    };
  } catch (error) {
    console.error("Error in getCurrentLicensePrice : ", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error in getCurrentLicensePrice",
      data: null,
    };
  }
}

export async function getCreditsReqd4ExtendingLicenseParam(
  licenseId: number,
  licenseTranType: number,
  variant: number = 0,
  users: number = 0,
  months: number = 0
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let currentLicensePrice: number = 0;
  let requiredCredits: number = 0;
  let unitPrice: number = 0;
  let units: number = 0;
  let earlyDiscountPercentage: number = 0;
  let licenseStatusData: licenseStatusSchemaT = initLicenseStatusData();
  let pendingMonths: number = 0;
  let userSlabDiscount: number = 0;
  let validitySlabDiscount: number = 0;
  let variantId: number = 0;
  let totalDiscountPercentage: number = 0;
  let variantData;

  try {
    if (proceed) {
      result = await loadLicenseStatus(licenseId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        licenseStatusData = result.data;
      }
    }

    if (proceed) {
      result = await loadVariant(licenseStatusData.product_variant_id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        variantData = result.data;
      }
    }

    //when switching from free to paid variant, no credits required
    if (
      proceed &&
      licenseTranType === LICENSE_TRAN_EXTEND_VARIANT &&
      variantData.is_free_variant
    ) {
      return {
        status: true,
        message: "Success",
        data: 0,
      };
    }

    if (proceed) {
      result = await getCurrentLicensePrice(licenseId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        if (result.data) {
          currentLicensePrice = result.data;
        }
      }
    }

    if (proceed) {
      if (licenseTranType === LICENSE_TRAN_EXTEND_VARIANT && variant) {
        variantId = variant;
      } else {
        variantId = licenseStatusData.product_variant_id;
      }
      result = await getUnitPriceAndEarlyDiscount4VariantFromDB(variantId);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        if (result.data?.earlyDiscount) {
          earlyDiscountPercentage = result.data?.earlyDiscount;
        }

        if (result.data?.unitPrice) {
          unitPrice = result.data?.unitPrice;
        }
      }
    }

    if (proceed) {
      pendingMonths = getPendingMonthsFromExpiry(licenseStatusData.expiry_date);

      if (licenseTranType === LICENSE_TRAN_EXTEND_VARIANT) {
        units = pendingMonths + licenseStatusData.no_of_users;
      } else if (licenseTranType === LICENSE_TRAN_EXTEND_USERS) {
        units = pendingMonths + users;
      } else if (licenseTranType === LICENSE_TRAN_EXTEND_VALIDITY) {
        units = licenseStatusData.no_of_users + months;
      } else if (licenseTranType === LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY) {
        units = users + months;
      }
    }

    if (proceed) {
      result = await getDiscount4ExtendingUsersFromDB(
        variantId,
        licenseStatusData.no_of_users + users
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        if (result.data) {
          userSlabDiscount = result.data;
        }
      }
    }

    if (proceed) {
      result = await getDiscountAndGrace4ExtendingValidityFromDB(
        variantId,
        pendingMonths + months
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        if (result.data) {
          validitySlabDiscount = result.data.discount;
        }
      }
    }

    if (proceed) {
      totalDiscountPercentage =
        earlyDiscountPercentage + userSlabDiscount + validitySlabDiscount;

      requiredCredits = units * unitPrice * (1 - totalDiscountPercentage / 100);
      requiredCredits = requiredCredits - currentLicensePrice;

      if (requiredCredits > 0) {
        requiredCredits = Math.round(requiredCredits);
      } else {
        requiredCredits = 0;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? requiredCredits : 0,
    };
  } catch (error) {
    console.error(
      "Error in getCreditsReqd4ExtendingLicenseParamFromDB : ",
      error
    );
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error in getCreditsReqd4ExtendingLicenseParamFromDB",
      data: null,
    };
  }
}
