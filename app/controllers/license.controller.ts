"use server";

import { licenseSchema } from "../utils/zodschema";
import {
  licenseDetSchemaT,
  licenseSchemaT,
  licenseStatusSchemaT,
  licenseTranSchemaT,
  productSchemaT,
} from "../utils/models";
import {
  deleteLicenseFromDB,
  generateLicenseInDB,
  loadLicenseFromDB,
  loadLicenseListFromDB,
  saveLicenseInDB,
} from "../services/license.service";
import { getCurrentUserDet } from "./user.controller";
import {
  calculateExpiryDate,
  initLicenseDetData,
  initLicenseStatusData,
  initLicenseTranData,
} from "../utils/common";
import { loadProduct } from "./product.controller";

export async function generateLicense(data: any) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let licenseDet: licenseDetSchemaT = initLicenseDetData();
  let licenseStatus: licenseStatusSchemaT = initLicenseStatusData();
  let licenseTran: licenseTranSchemaT = initLicenseTranData();
  let productData;
  let variantData;

  try {
    const {
      product_id,
      product_variant_id,
      entity_id,
      entity_identifier,
      contact_name,
      contact_phone,
      contact_email,
    } = data;

    if (proceed) {
      result = await canLicenseBeGenerated(
        product_id,
        product_variant_id,
        entity_id,
        entity_identifier,
        contact_name,
        contact_phone,
        contact_email
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await loadProduct(product_id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        productData = result.data as productSchemaT;
      }
    }

    if (proceed && productData && productData.variants) {
      variantData = productData.variants.find(
        (variant) => variant.id === product_variant_id
      );

      if (!variantData) {
        proceed = false;
        errMsg = `Variant with ID ${product_variant_id} not found.`;
      }
    }

    //setting license data-----------------
    if (proceed) {
      licenseDet.product_id = product_id;
      licenseDet.entity_id = entity_id;
      licenseDet.entity_identifier = entity_identifier;
      licenseDet.contact_name = contact_name;
      licenseDet.contact_email = contact_email;
      licenseDet.contact_phone = contact_phone;
    }
    //--------------------------------------

    //setting license status data---------------
    if (proceed && variantData && variantData.no_of_months) {
      licenseStatus.product_variant_id = product_variant_id;
      licenseStatus.no_of_users = variantData.no_of_users;
      licenseStatus.current_users = 1;

      if (variantData.is_free_variant) {
      } else {
        licenseStatus.expiry_date_without_grace = calculateExpiryDate(
          variantData.no_of_months
        );
        licenseStatus.expiry_date_with_grace =
          licenseStatus.expiry_date_without_grace;
      }
    }
    //------------------------------------------------

    //setting license tran data-----------------------
    if (proceed && variantData) {
      licenseTran.tran_type = 1;
      licenseTran.tran_nature = 1;
      licenseTran.new_product_variant_id = product_variant_id;
      licenseTran.current_no_of_users = 0;
      licenseTran.current_no_of_months = 0;
      licenseTran.modifed_no_of_users = 1;
      licenseTran.balance_no_of_users = 1;
      if (variantData.is_free_variant) {
      } else {
        licenseTran.modifed_no_of_months = variantData.no_of_months;
        licenseTran.balance_no_of_months = variantData.no_of_months;

        licenseTran.new_expiry_date_with_grace = new Date("2026-12-31");
        licenseTran.new_expiry_date_without_grace = new Date("2026-11-30");
      }
    }
    //--------------------------------------------------

    if (proceed) {
      result = await generateLicenseInDB(
        licenseDet,
        licenseStatus,
        licenseTran
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed
        ? {
            license_no: licenseDet.license_no,
          }
        : null,
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

async function canLicenseBeGenerated(
  product_id: number,
  product_variant_id: number,
  entity_id: number,
  entity_identifier: string,
  contact_name: string,
  contact_phone: string,
  contact_email: string
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      if (!product_id) {
        proceed = false;
        errMsg = "Product ID is required.";
      }
    }

    //run db validations in a single functions

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

export async function setLicenseDataB4Saving(licenseData: licenseSchemaT) {
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
      if (!licenseData.id) {
        licenseData.created_by = userData.id;
      }

      licenseData.updated_by = userData.id;
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error while setting license data before saving :", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function saveLicense(licenseData: licenseSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await setLicenseDataB4Saving(licenseData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canLicenseBeSaved(licenseData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveLicenseInDB(licenseData);
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
    console.error("Error saving license:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canLicenseBeSaved(licenseData: licenseSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      if (!licenseData) {
        proceed = false;
        errMsg = "License Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = licenseSchema.safeParse(licenseData);

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

export async function deleteLicense(licenseID: number) {
  let errMsg: string = "";
  let proceed: boolean = true;

  try {
    if (proceed) {
      const result = await canLicenseBeDeleted(licenseID);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      const result = await deleteLicenseFromDB(licenseID);
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

export async function canLicenseBeDeleted(licenseID: number) {
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
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function loadLicense(license_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userId;

  try {
    if (proceed) {
      result = await loadLicenseFromDB(license_id as number);
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

export async function loadLicenseList() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let userData;

  try {
    if (proceed) {
      result = await loadLicenseListFromDB();
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
