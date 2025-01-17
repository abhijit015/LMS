"use server";

import {
  licenseDetSchemaT,
  licenseStatusSchemaT,
  licenseTranSchemaT,
  productSchemaT,
} from "../utils/models";
import {
  checkIfLicenseExists4ProductFromDB,
  generateLicenseInDB,
  loadAddonStatus4LicenseFromDB,
  loadLicenseDetFromDB,
  loadLicenseList4DealerFromDB,
  loadLicenseStatusFromDB,
  loadLicenseTranFromDB,
  runDBValidationB4GeneratingLicense,
  runDBValidationB4SavingLicenseTran,
  runDBValidationB4ValidatingLicenseExpiry,
  saveLicenseTranInDB,
  validateLicenseExpiryFromDB,
} from "../services/license.service";
import {
  calculateExpiryDateByDays,
  calculateExpiryDateByMonths,
  initLicenseDetData,
  initLicenseStatusData,
  initLicenseTranData,
} from "../utils/common";
import { loadProduct } from "./product.controller";
import {
  LICENSE_TRAN_GENERATE_NEW_LICENSE,
  LICENSE_TRAN_NATURE_FREE_VARIANT,
  LICENSE_TRAN_NATURE_TRIAL_PERIOD,
} from "../utils/constants";
import { getCurrentDealerDet } from "./dealer.controller";
import { licenseTranSchema } from "../utils/zodschema";
import { getCurrentUserDet } from "./user.controller";

export async function generateLicense(data: any) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let licenseDet: licenseDetSchemaT = initLicenseDetData();
  let licenseStatus: licenseStatusSchemaT = initLicenseStatusData();
  let licenseTran: licenseTranSchemaT = initLicenseTranData();

  try {
    const {
      product_id,
      dealer_id,
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
        dealer_id,
        product_variant_id,
        entity_id
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await setDataB4GeneratingLicense(
        product_id,
        product_variant_id,
        licenseDet,
        licenseStatus,
        licenseTran,
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

async function setDataB4GeneratingLicense(
  product_id: number,
  product_variant_id: number,
  licenseDet: licenseDetSchemaT,
  licenseStatus: licenseStatusSchemaT,
  licenseTran: licenseTranSchemaT,
  entity_id: number,
  entity_identifier: string,
  contact_name: string,
  contact_phone: string,
  contact_email: string
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let productData;
  let variantData;

  try {
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
    if (proceed && variantData && variantData.no_of_days) {
      licenseStatus.product_variant_id = product_variant_id;
      licenseStatus.no_of_users = variantData.no_of_users;
      licenseStatus.current_users = 1;

      if (variantData.is_free_variant) {
      } else {
        licenseStatus.expiry_date = calculateExpiryDateByDays(
          new Date(),
          variantData.no_of_days
        );
      }
    }
    //------------------------------------------------

    //setting license tran data-----------------------
    if (proceed && variantData) {
      licenseTran.tran_type = LICENSE_TRAN_GENERATE_NEW_LICENSE;
      licenseTran.tran_nature = variantData.is_free_variant
        ? LICENSE_TRAN_NATURE_FREE_VARIANT
        : LICENSE_TRAN_NATURE_TRIAL_PERIOD;
      licenseTran.product_variant_id = product_variant_id;
      licenseTran.no_of_users = licenseStatus.no_of_users;

      if (variantData.is_free_variant) {
      } else {
        licenseTran.no_of_months = variantData.no_of_days;
      }
    }
    //--------------------------------------------------
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

async function canLicenseBeGenerated(
  product_id: number,
  dealer_id: number,
  product_variant_id: number,
  entity_id: number
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      if (!product_id || !product_variant_id || !entity_id) {
        proceed = false;
        errMsg = "product_id, variant_id, entity_id are required.";
      }
    }

    if (proceed) {
      result = await runDBValidationB4GeneratingLicense(
        product_id,
        dealer_id,
        product_variant_id
      );

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

export async function validateLicenseExpiry(data: any) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  try {
    const { license_id } = data;

    if (proceed) {
      result = await validateDataB4ValidatingLicenseExpiry(license_id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await validateLicenseExpiryFromDB(license_id);
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

export async function validateDataB4ValidatingLicenseExpiry(
  license_id: number
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      if (!license_id) {
        proceed = false;
        errMsg = "License ID is required.";
      }
    }

    if (proceed) {
      result = await runDBValidationB4ValidatingLicenseExpiry(license_id);

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

export async function loadLicenseList4Dealer() {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let dealerData;

  try {
    if (proceed) {
      result = await getCurrentDealerDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        dealerData = result.data;
      }
    }

    if (proceed) {
      result = await loadLicenseList4DealerFromDB(dealerData.id);

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

export async function loadLicenseStatus(license_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await loadLicenseStatusFromDB(license_id);

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

export async function loadLicenseDet(license_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await loadLicenseDetFromDB(license_id);

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

export async function loadAddonStatus4License(license_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await loadAddonStatus4LicenseFromDB(license_id);

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

export async function loadLicenseTran(tran_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await loadLicenseTranFromDB(tran_id);

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

export async function setLicenseTranDataB4Saving(
  transactionData: licenseTranSchemaT
) {
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
      if (!transactionData.id) {
        transactionData.created_by = userData.id;
      }

      transactionData.updated_by = userData.id;
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: null,
    };
  } catch (error) {
    console.error(
      "Error while setting license tran data before saving :",
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

export async function saveLicenseTran(transactionData: licenseTranSchemaT) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await setLicenseTranDataB4Saving(transactionData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await canLicenseTranBeSaved(transactionData);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveLicenseTranInDB(transactionData);
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
    console.error("Error saving license tran:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred.",
      data: null,
    };
  }
}

export async function canLicenseTranBeSaved(
  transactionData: licenseTranSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      if (!transactionData) {
        proceed = false;
        errMsg = "License Transaction Data cannot be null.";
      }
    }

    if (proceed) {
      const parsed = licenseTranSchema.safeParse(transactionData);

      if (!parsed.success) {
        errMsg = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        proceed = false;
      }
    }

    if (proceed) {
      result = await runDBValidationB4SavingLicenseTran(transactionData);
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

export async function checkIfLicenseExists4Product(product_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;

  try {
    if (proceed) {
      result = await checkIfLicenseExists4ProductFromDB(product_id);

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
