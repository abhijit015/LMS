"use server";

import {
  addonPlansSchema,
  userDiscountSlabSchema,
  validityDiscountSlabSchema,
  variantPricingSchema,
} from "../utils/zodschema";
import {
  addonPlansSchemaT,
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
} from "../services/pricing.service";

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

      userDiscountSlabData.forEach((plan, index) => {
        const parsed = userDiscountSlabSchema.safeParse(plan);
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

      validityDiscountSlabData.forEach((plan, index) => {
        const parsed = validityDiscountSlabSchema.safeParse(plan);
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
