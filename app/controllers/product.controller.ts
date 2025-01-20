"use server";
import { handleErrorMsg } from "../utils/common";

import { productSchema, productVariantsSchema } from "../utils/zodschema";
import { productSchemaT, userSchemaT } from "../utils/models";
import {
  deleteProductFromDB,
  loadProductFromDB,
  loadProductListFromDB,
  loadVariantFromDB,
  saveProductInDB,
} from "../services/product.service";
import { getCurrentUserDet } from "./user.controller";

export async function setProductDataB4Saving(productData: productSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let userData;
  let result;

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
      if (!productData.id) {
        productData.created_by = userData.id;
      }

      productData.updated_by = userData.id;
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error while setting product data before saving :", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function saveProduct(productData: productSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await setProductDataB4Saving(productData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canProductBeSaved(productData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveProductInDB(productData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    console.error("Error saving product:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function canProductBeSaved(productData: productSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  console.log("productData : ", productData);
  try {
    if (proceed) {
      if (!productData) {
        proceed = false;
        errMsg = "Product Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = productSchema.safeParse(productData);

      if (!parsed.success) {
        errMsg = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        proceed = false;
      }
    }

    if (proceed && productData.variants) {
      const validationErrors: string[] = [];

      // Check for more than one free variant
      const freeVariantsCount = productData.variants.filter(
        (variant) => variant.is_free_variant
      ).length;
      if (freeVariantsCount > 1) {
        proceed = false;
        errMsg = "Only one variant can be marked as free.";
      }

      // Validate each variant
      productData.variants.forEach((plan, index) => {
        const parsed = productVariantsSchema.safeParse(plan);
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
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function deleteProduct(productID: number) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      const result = await canProductBeDeleted(productID);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const result = await deleteProductFromDB(productID);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function canProductBeDeleted(productID: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  try {
    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadProduct(product_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadProductFromDB(product_id as number);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadVariant(variant_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadVariantFromDB(variant_id as number);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadProductList() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userData;

  try {
    if (proceed) {
      result = await loadProductListFromDB();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result?.data : null,
    };
  } catch (error) {
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}
