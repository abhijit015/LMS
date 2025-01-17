"use server";

import {
  dealerCreditTranSchemaT,
  dealerSchemaT,
  licenseDetSchemaT,
  licenseStatusSchemaT,
  licenseTranSchemaT,
} from "../utils/models";
import { executeQueryInBusinessDB, getBusinessDBConn } from "../utils/db";
import { Connection } from "mariadb";
import {
  calculateExpiryDateByMonths,
  getPendingMonthsFromExpiry,
  initDealerCreditLedgerData,
  initDealerData,
  initLicenseStatusData,
} from "../utils/common";
import { loadLicenseStatus } from "../controllers/license.controller";
import {
  ADD,
  DEALER_CREDIT_TRAN_CONSUME_CREDITS,
  LICENSE_TRAN_ASSIGN_DEALER_2_LICENSE,
  LICENSE_TRAN_EXTEND_USERS,
  LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY,
  LICENSE_TRAN_EXTEND_VALIDITY,
  LICENSE_TRAN_EXTEND_VARIANT,
  MODIFY,
} from "../utils/constants";
import { getCurrentDealerDet } from "../controllers/dealer.controller";
import { getCurrentUserDet } from "../controllers/user.controller";
import { saveDealerCreditTranInDB } from "./credit.service";
import { getDiscountAndGrace4ExtendingValidityFromDB } from "./pricing.service";

export async function generateLicenseInDB(
  licenseData: licenseDetSchemaT,
  statusData: licenseStatusSchemaT,
  licenseTranData: licenseTranSchemaT
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let businessDBConn;
  let result;
  let query: string = "";

  try {
    businessDBConn = await getBusinessDBConn();
    await businessDBConn.beginTransaction();

    if (proceed) {
      try {
        query = "LOCK TABLES license_det WRITE;";
        result = await executeQueryInBusinessDB(query, [], businessDBConn);
        console.log("license_det locked successfully.");
      } catch (error) {
        proceed = false;
        errMsg: error instanceof Error
          ? error.message
          : "Error locking license_det",
          console.error(error);
      }
    }

    if (proceed) {
      result = await generateLicenseNo4Product(licenseData.product_id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        if (result.data) {
          licenseData.license_no = result.data;
        } else {
          proceed = false;
          errMsg = "Error generating license no.";
        }
      }
    }

    if (proceed) {
      result = await saveLicenseDetailInDB(licenseData, businessDBConn);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed && licenseData.id) {
      statusData.license_id = licenseData.id;
      licenseTranData.license_id = licenseData.id;
    } else {
      proceed = false;
      errMsg = "License ID not found.";
    }

    if (proceed) {
      result = await saveLicenseStatusInDB(statusData, businessDBConn);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await saveLicenseTranInDB(licenseTranData, businessDBConn);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      await businessDBConn.commit();
    } else {
      await businessDBConn.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "License generated successfully." : errMsg,
      data: proceed ? licenseData.id : null,
    };
  } catch (error) {
    if (businessDBConn) {
      await businessDBConn.rollback();
    }
    console.error("Error generating license:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error generating license",
      data: null,
    };
  } finally {
    if (businessDBConn) {
      query = "UNLOCK TABLES;";
      result = await executeQueryInBusinessDB(query, [], businessDBConn);
      await businessDBConn.end();
    }
  }
}

export async function saveLicenseDetailInDB(
  licenseData: licenseDetSchemaT,
  connection?: Connection
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let businessDBConn;
  let result;

  try {
    if (connection) {
      businessDBConn = connection;
    } else {
      businessDBConn = await getBusinessDBConn();
      await businessDBConn.beginTransaction();
    }

    if (proceed) {
      if (licenseData.id) {
        query = `
          UPDATE license_det SET
            entity_identifier = ?,
            contact_name = ?,
            contact_email = ?,
            contact_phone = ?
          WHERE id = ?
        `;
        values = [
          licenseData.entity_identifier,
          licenseData.contact_name,
          licenseData.contact_email,
          licenseData.contact_phone,
          licenseData.id,
        ];
      } else {
        query = `
          INSERT INTO license_det (
            license_no, product_id, entity_id, entity_identifier,
            contact_name, contact_email, contact_phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        values = [
          licenseData.license_no,
          licenseData.product_id,
          licenseData.entity_id,
          licenseData.entity_identifier,
          licenseData.contact_name,
          licenseData.contact_email,
          licenseData.contact_phone,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving license details.";
      } else {
        if (!licenseData.id) {
          licenseData.id = result.insertId;
        }
      }
    }

    if (!connection) {
      if (proceed) {
        await businessDBConn.commit();
      } else {
        await businessDBConn.rollback();
      }
    }

    return {
      status: proceed,
      message: proceed ? "License details saved successfully." : errMsg,
      data: proceed ? licenseData.id : null,
    };
  } catch (error) {
    if (!connection && businessDBConn) {
      await businessDBConn.rollback();
    }
    console.error("Error saving license details:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error saving license details.",
      data: null,
    };
  } finally {
    if (!connection && businessDBConn) {
      await businessDBConn.end();
    }
  }
}

export async function saveLicenseStatusInDB(
  statusData: licenseStatusSchemaT,
  connection?: Connection
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let businessDBConn;
  let result;

  try {
    if (connection) {
      businessDBConn = connection;
    } else {
      businessDBConn = await getBusinessDBConn();
      await businessDBConn.beginTransaction();
    }

    if (proceed) {
      if (statusData.id) {
        query = `
          UPDATE license_status SET
            license_id = ?,
            product_variant_id = ?,
            no_of_users = ?,
            current_users = ?,
            last_dealer_id = ?,
            expiry_date = ?,
            grace = ?,
            updated_by = ?
          WHERE id = ?
        `;
        values = [
          statusData.license_id,
          statusData.product_variant_id,
          statusData.no_of_users,
          statusData.current_users,
          statusData.last_dealer_id,
          statusData.expiry_date,
          statusData.grace,
          statusData.updated_by,
          statusData.id,
        ];
      } else {
        query = `
          INSERT INTO license_status (
            license_id, product_variant_id, no_of_users, current_users,
            last_dealer_id, expiry_date, grace,
            created_by, updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [
          statusData.license_id,
          statusData.product_variant_id,
          statusData.no_of_users,
          statusData.current_users,
          statusData.last_dealer_id,
          statusData.expiry_date,
          statusData.grace,
          statusData.created_by,
          statusData.updated_by,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving license status.";
      } else {
        if (!statusData.id) {
          statusData.id = result.insertId;
        }
      }
    }

    if (!connection) {
      if (proceed) {
        await businessDBConn.commit();
      } else {
        await businessDBConn.rollback();
      }
    }

    return {
      status: proceed,
      message: proceed ? "License status saved successfully." : errMsg,
      data: proceed ? statusData.id : null,
    };
  } catch (error) {
    if (!connection && businessDBConn) {
      await businessDBConn.rollback();
    }
    console.error("Error saving license status:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error saving license details.",
      data: null,
    };
  } finally {
    if (!connection && businessDBConn) {
      await businessDBConn.end();
    }
  }
}

export async function saveLicenseTranInDB(
  transactionData: licenseTranSchemaT,
  connection?: Connection
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let businessDBConn;
  let result;
  let licenseStatusData: licenseStatusSchemaT = initLicenseStatusData();
  let dealerCreditTranData: dealerCreditTranSchemaT =
    initDealerCreditLedgerData();
  let inputMode: number = 0;
  let dealerData: dealerSchemaT = initDealerData();
  let userData;

  try {
    if (transactionData.id) {
      inputMode = MODIFY;
    } else {
      inputMode = ADD;
    }

    if (connection) {
      businessDBConn = connection;
    } else {
      businessDBConn = await getBusinessDBConn();
      await businessDBConn.beginTransaction();
    }

    if (proceed) {
      if (inputMode === MODIFY) {
        query = `
          UPDATE license_tran SET
            vch_no = ?, 
            license_id = ?, 
            tran_type = ?, 
            product_variant_id = ?, 
            no_of_users = ?, 
            no_of_months = ?, 
            dealer_id = ?, 
            addon_id = ?, 
            addon_plan_id = ?, 
            remarks = ?, 
            payment_mode = ?, 
            payment_ref_no = ?, 
            payment_amt = ?, 
            scheme_id = ?, 
            tran_nature = ?, 
            updated_by = ?
          WHERE id = ?
        `;
        values = [
          transactionData.vch_no,
          transactionData.license_id,
          transactionData.tran_type,
          transactionData.product_variant_id,
          transactionData.no_of_users,
          transactionData.no_of_months,
          transactionData.dealer_id,
          transactionData.addon_id,
          transactionData.addon_plan_id,
          transactionData.remarks,
          transactionData.payment_mode,
          transactionData.payment_ref_no,
          transactionData.payment_amt,
          transactionData.scheme_id,
          transactionData.tran_nature,
          transactionData.updated_by,
          transactionData.id,
        ];
      } else {
        query = `
          INSERT INTO license_tran (
            vch_no, 
            license_id, 
            tran_type, 
            product_variant_id, 
            no_of_users, 
            no_of_months, 
            dealer_id, 
            addon_id, 
            addon_plan_id, 
            remarks, 
            payment_mode, 
            payment_ref_no, 
            payment_amt, 
            scheme_id, 
            tran_nature, 
            created_by, 
            updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [
          transactionData.vch_no,
          transactionData.license_id,
          transactionData.tran_type,
          transactionData.product_variant_id,
          transactionData.no_of_users,
          transactionData.no_of_months,
          transactionData.dealer_id,
          transactionData.addon_id,
          transactionData.addon_plan_id,
          transactionData.remarks,
          transactionData.payment_mode,
          transactionData.payment_ref_no,
          transactionData.payment_amt,
          transactionData.scheme_id,
          transactionData.tran_nature,
          transactionData.created_by,
          transactionData.updated_by,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      console.log("result : ", result);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving license transaction.";
      } else {
        if (!transactionData.id) {
          transactionData.id = result.insertId;
        }
      }
    }

    if (proceed && inputMode === ADD) {
      query = `
          UPDATE license_tran SET vch_no = ? WHERE id = ?`;
      values = ["AD-" + String(transactionData.id), transactionData.id];

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error updating vch_no.";
      }
    }

    if (proceed) {
      result = await loadLicenseStatus(transactionData.license_id);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        licenseStatusData = result.data;
      }
    }

    if (
      proceed &&
      transactionData.no_of_months &&
      (transactionData.tran_type === LICENSE_TRAN_EXTEND_VALIDITY ||
        transactionData.tran_type === LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY)
    ) {
      const pendingMonths = getPendingMonthsFromExpiry(
        licenseStatusData.expiry_date
      );

      result = await getDiscountAndGrace4ExtendingValidityFromDB(
        licenseStatusData.product_variant_id,
        pendingMonths + transactionData.no_of_months
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        if (result.data) {
          licenseStatusData.grace = result.data.grace;
        }
      }
    }

    if (proceed) {
      if (transactionData.tran_type === LICENSE_TRAN_ASSIGN_DEALER_2_LICENSE) {
        licenseStatusData.last_dealer_id = transactionData.dealer_id;
      } else if (transactionData.tran_type === LICENSE_TRAN_EXTEND_VARIANT) {
        licenseStatusData.product_variant_id =
          transactionData.product_variant_id as number;
      } else if (
        transactionData.tran_type === LICENSE_TRAN_EXTEND_VALIDITY &&
        transactionData.no_of_months &&
        licenseStatusData?.expiry_date
      ) {
        licenseStatusData.expiry_date = calculateExpiryDateByMonths(
          licenseStatusData?.expiry_date,
          transactionData.no_of_months
        );
      } else if (
        transactionData.tran_type === LICENSE_TRAN_EXTEND_USERS &&
        transactionData.no_of_users
      ) {
        licenseStatusData.no_of_users =
          licenseStatusData.no_of_users + transactionData.no_of_users;
      } else if (
        transactionData.tran_type === LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY &&
        transactionData.no_of_users &&
        transactionData.no_of_months &&
        licenseStatusData?.expiry_date
      ) {
        licenseStatusData.no_of_users =
          licenseStatusData.no_of_users + transactionData.no_of_users;

        licenseStatusData.expiry_date = calculateExpiryDateByMonths(
          licenseStatusData?.expiry_date,
          transactionData.no_of_months
        );
      }
    }

    if (proceed) {
      result = await saveLicenseStatusInDB(licenseStatusData, businessDBConn);
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (proceed) {
      result = await getCurrentDealerDet();
      if (result.status) {
        dealerData = result.data;
      } else {
        proceed = false;
        errMsg = result.message;
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
      dealerCreditTranData.tran_type = DEALER_CREDIT_TRAN_CONSUME_CREDITS;
      dealerCreditTranData.license_tran_id = transactionData.id;
      dealerCreditTranData.tran_date = new Date();

      if (transactionData.payment_amt)
        dealerCreditTranData.modified_credits = -transactionData.payment_amt;

      dealerCreditTranData.dealer_id = dealerData.id;
      dealerCreditTranData.created_by = userData.id;
      dealerCreditTranData.updated_by = userData.id;
    }

    if (proceed) {
      result = await saveDealerCreditTranInDB(
        dealerCreditTranData,
        businessDBConn
      );
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      }
    }

    if (!connection) {
      if (proceed) {
        await businessDBConn.commit();
      } else {
        await businessDBConn.rollback();
      }
    }

    return {
      status: proceed,
      message: proceed ? "License transaction saved successfully." : errMsg,
      data: proceed ? transactionData.id : null,
    };
  } catch (error) {
    if (!connection && businessDBConn) {
      await businessDBConn.rollback();
    }
    console.error("Error saving license transaction:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error saving license transaction.",
      data: null,
    };
  } finally {
    if (!connection && businessDBConn) {
      await businessDBConn.end();
    }
  }
}

export async function generateLicenseNo4Product(product_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let result;
  let licenseNoIdentifier: string = "";
  let generatedLicenseCount: number = 0;
  let generatedLicenseNo: string = "";

  try {
    if (proceed) {
      query = "select license_num_identifier from product_mast where id=?";
      result = await executeQueryInBusinessDB(query, [product_id]);
      if (result.length <= 0) {
        proceed = false;
        errMsg = "Error loading license_num_identifier";
      } else {
        licenseNoIdentifier = result[0].license_num_identifier;
      }
    }

    if (proceed) {
      query = `
        SELECT COUNT(*) AS license_count 
        FROM license_det 
        WHERE product_id = ? 
        AND YEAR(created_at) = YEAR(CURRENT_DATE()) 
        AND MONTH(created_at) = MONTH(CURRENT_DATE())
      `;
      result = await executeQueryInBusinessDB(query, [product_id]);

      if (result.length <= 0) {
        proceed = false;
        errMsg = "Error loading generateLicenseCount";
      } else {
        generatedLicenseCount = result[0].license_count;
      }
    }

    if (proceed) {
      const now = new Date();
      const monthVal = String(now.getMonth() + 1).padStart(2, "0");
      const dateVal = String(now.getDate()).padStart(2, "0");
      generatedLicenseNo =
        licenseNoIdentifier +
        dateVal +
        monthVal +
        String(generatedLicenseCount + 1);
    }

    return {
      status: proceed,
      message: proceed ? "License no. generated successfully." : errMsg,
      data: proceed ? generatedLicenseNo : null,
    };
  } catch (error) {
    console.error("Error generating license no.:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error generating license no.",
      data: null,
    };
  } finally {
  }
}

export async function runDBValidationB4GeneratingLicense(
  product_id: number,
  dealer_id: number,
  product_variant_id: number
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let query: string = "";

  try {
    if (proceed) {
      query = "SELECT * from product_mast where id=?";
      result = await executeQueryInBusinessDB(query, [product_id]);
      if (result.length <= 0) {
        proceed = false;
        errMsg = "Invalid Product ID.";
      }
    }

    if (proceed) {
      query = "SELECT * from product_variants where product_id=? and id=?";
      result = await executeQueryInBusinessDB(query, [
        product_id,
        product_variant_id,
      ]);
      if (result.length <= 0) {
        proceed = false;
        errMsg = "Invalid Variant ID.";
      }
    }

    if (proceed && dealer_id) {
      query = "SELECT * from dealer_mast where id=?";
      result = await executeQueryInBusinessDB(query, [dealer_id]);
      if (result.length <= 0) {
        proceed = false;
        errMsg = "Invalid Dealer ID.";
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

export async function runDBValidationB4ValidatingLicenseExpiry(
  license_id: number
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let query: string = "";

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

export async function runDBValidationB4SavingLicenseTran(
  transactionData: licenseTranSchemaT
) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let query: string = "";

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

export async function validateLicenseExpiryFromDB(license_id: number) {
  let errMsg: string = "";
  let proceed: boolean = true;
  let result;
  let query: string = "";
  let expiryDate: Date | null = null;
  let grace: number;
  let inGracePeriod: boolean = false;

  try {
    query = "SELECT * FROM license_status WHERE id = ?";
    result = await executeQueryInBusinessDB(query, [license_id]);

    if (result.length <= 0) {
      proceed = false;
      errMsg = "Invalid License ID.";
    } else {
      const currentDate = new Date();
      expiryDate = new Date(result[0].expiry_date);
      grace = result[0].grace;

      if (currentDate > expiryDate) {
        proceed = false;
        errMsg = "License Validity Expired.";

        const expiryWithGrace = new Date(
          expiryDate.getTime() + grace * 24 * 60 * 60 * 1000
        );

        if (currentDate <= expiryWithGrace) {
          inGracePeriod = true;
        }
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: {
        expiry_date: expiryDate,
        in_grace_period: inGracePeriod,
      },
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

export async function loadLicenseList4DealerFromDB(dealer_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;

  try {
    if (proceed) {
      query = `SELECT ld.id, ld.license_no, 
                      (SELECT name FROM product_mast WHERE id = ld.product_id) AS product_name, 
                      ld.entity_identifier 
               FROM license_det AS ld, license_status AS ls 
               WHERE ld.id = ls.license_id 
                 AND ls.last_dealer_id = ?`;

      result = await executeQueryInBusinessDB(query, [dealer_id]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error fetching list.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "List loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading list:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading list.",
      data: null,
    };
  }
}

export async function loadLicenseStatusFromDB(license_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;

  try {
    if (proceed) {
      query =
        "SELECT (SELECT name FROM dealer_mast WHERE id = ls.last_dealer_id) AS dealer_name, (SELECT name FROM product_variants WHERE id = ls.product_variant_id) AS product_variant_name, ls.* FROM license_status AS ls WHERE ls.license_id = ?";
      result = await executeQueryInBusinessDB(query, [license_id]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error fetching license_status.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "license_status loaded successfully." : errMsg,
      data: proceed ? result[0] : null,
    };
  } catch (error) {
    console.error("Error loading license_status:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error loading license_status.",
      data: null,
    };
  }
}

export async function loadLicenseDetFromDB(license_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;

  try {
    if (proceed) {
      query = "select * from license_det where id=?";
      result = await executeQueryInBusinessDB(query, [license_id]);

      if (result.length <= 0) {
        proceed = false;
        errMsg = "Error fetching license_det.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "license_det loaded successfully." : errMsg,
      data: proceed ? result[0] : null,
    };
  } catch (error) {
    console.error("Error loading license_det:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading license_det.",
      data: null,
    };
  }
}

export async function loadAddonStatus4LicenseFromDB(license_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;

  try {
    if (proceed) {
      query =
        "select (select name from addon_mast where id=ads.addon_id) as addon_name, (select plan_name from addon_plan where id=ads.addon_plan_id) as addon_plan_name,  ads.* from addon_status as ads where license_id=?";
      result = await executeQueryInBusinessDB(query, [license_id]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error fetching addon.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Addon loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading addon:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading addon.",
      data: null,
    };
  }
}

export async function loadLicenseTranFromDB(tran_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;

  try {
    if (proceed) {
      query = "select * from license_tran where id=?";
      result = await executeQueryInBusinessDB(query, [tran_id]);

      if (result.length <= 0) {
        proceed = false;
        errMsg = "Error fetching license_tran.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "license_tran loaded successfully." : errMsg,
      data: proceed ? result[0] : null,
    };
  } catch (error) {
    console.error("Error loading license_tran:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading license_tran.",
      data: null,
    };
  }
}

export async function checkIfLicenseExists4ProductFromDB(product_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  let licenseExists: boolean = false;

  try {
    if (proceed) {
      query = "select * from license_det where product_id=?";
      result = await executeQueryInBusinessDB(query, [product_id]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error in checkIfLicenseExists4Product.";
      } else {
        if (result.length > 0) {
          licenseExists = true;
        }
      }
    }

    return {
      status: proceed,
      message: proceed ? "license_tran loaded successfully." : errMsg,
      data: proceed ? licenseExists : null,
    };
  } catch (error) {
    console.error("Error in checkIfLicenseExists4Product:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error in checkIfLicenseExists4Product.",
      data: null,
    };
  }
}
