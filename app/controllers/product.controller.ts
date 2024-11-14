"use server";

import { productSchema } from "../utils/zodschema";
import { productSchemaT } from "../utils/models";
import {
  deleteProductFromDB,
  loadProductFromDB,
  loadProductListFromDB,
  saveProductInDB,
} from "../services/product.service";
import { getCurrentUserDet } from "./user.controller";
import { getUserIdFromCookies } from "./cookies.controller";

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
        productData.client_id = userData.client_id;
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveProduct(productData: productSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  console.log("productData : ", productData);

  console.log(
    "licenseParams : ",
    JSON.stringify(
      productData.productLicenseParams,
      (key, value) => (key === "licenseParams" ? value : value),
      2
    )
  );

  try {
    if (proceed) {
      result = await canProductBeSaved(productData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await setProductDataB4Saving(productData);
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canProductBeSaved(productData: productSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

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

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canProductBeDeleted(productID: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  try {
    if (proceed) {
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
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
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
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
      if (!(await getUserIdFromCookies())) {
        proceed = false;
        errMsg = "Session expired. Please login again.";
      }
    }

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
      result = await loadProductListFromDB(userData.client_id as number);
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}
