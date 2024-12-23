import {
  licenseDetSchemaT,
  licenseSchemaT,
  licenseStatusSchemaT,
  licenseTranSchemaT,
} from "../utils/models";
import { executeQueryInBusinessDB, getBusinessDBConn } from "../utils/db";
import { Connection } from "mariadb";

export async function loadLicenseFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let licenseData: any = null;
  let result;
  let query;

  try {
    if (proceed) {
      query = `SELECT * FROM license_mast WHERE id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        licenseData = result[0];
      } else {
        proceed = false;
        errMsg = "License not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "License loaded successfully." : errMsg,
      data: licenseData,
    };
  } catch (error) {
    console.error("Error loading license:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading license.",
      data: null,
    };
  }
}

export async function loadLicenseListFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  try {
    if (proceed) {
      query = `SELECT * from license_mast`;
      result = await executeQueryInBusinessDB(query);
      if (result.length < 0) {
        proceed = false;
        errMsg = "Error fetching list.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Licenses loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading licenses:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading licenses.",
      data: null,
    };
  }
}

export async function deleteLicenseFromDB(licenseId: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query;
  let connection;
  let values: any[];

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed) {
      result = await executeQueryInBusinessDB(
        "delete from license_mast where id=?",
        [licenseId],
        connection
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete license.";
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "License deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error deleting license:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error deleting license.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

export async function saveLicenseInDB(licenseData: licenseSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let connection;
  let result;

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed) {
      if (licenseData.id) {
        query = `
            UPDATE license_mast SET
              name = ?,
              updated_by = ?
            WHERE id = ?
          `;
        values = [licenseData.name, licenseData.updated_by, licenseData.id];
      } else {
        query = `
            INSERT INTO license_mast (name,created_by,updated_by)
            VALUES (?,?,?)
          `;
        values = [
          licenseData.name,
          licenseData.created_by,
          licenseData.updated_by,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error saving license.";
      } else {
        if (!licenseData.id) {
          licenseData.id = result.insertId;
        }
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "License saved successfully." : errMsg,
      data: proceed ? licenseData.id : null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error saving license:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving license.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

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
      result = await saveLicenseTransactionInDB(
        licenseTranData,
        businessDBConn
      );
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
            dealer_id = ?,
            expiry_date_with_grace = ?,
            expiry_date_without_grace = ?
          WHERE id = ?
        `;
        values = [
          statusData.license_id,
          statusData.product_variant_id,
          statusData.no_of_users,
          statusData.current_users,
          statusData.dealer_id,
          statusData.expiry_date_with_grace,
          statusData.expiry_date_without_grace,
          statusData.id,
        ];
      } else {
        query = `
          INSERT INTO license_status (
            license_id, product_variant_id, no_of_users, current_users,
            dealer_id, expiry_date_with_grace, expiry_date_without_grace,
            created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [
          statusData.license_id,
          statusData.product_variant_id,
          statusData.no_of_users,
          statusData.current_users,
          statusData.dealer_id,
          statusData.expiry_date_with_grace,
          statusData.expiry_date_without_grace,
          statusData.created_by,
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

export async function saveLicenseTransactionInDB(
  transactionData: licenseTranSchemaT,
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
      if (transactionData.id) {
        query = `
          UPDATE license_tran SET
            license_id = ?,
            tran_type = ?,
            old_product_variant_id = ?,
            new_product_variant_id = ?,
            current_no_of_users = ?,
            modifed_no_of_users = ?,
            balance_no_of_users = ?,
            current_no_of_months = ?,
            modifed_no_of_months = ?,
            balance_no_of_months = ?,
            old_dealer_id = ?,
            new_dealer_id = ?,
            current_expiry_date_with_grace = ?,
            current_expiry_date_without_grace = ?,
            new_expiry_date_with_grace = ?,
            new_expiry_date_without_grace = ?,
            addon_id = ?,
            current_addon_plan_id = ?,
            new_addon_plan_id = ?,
            remarks = ?,
            payment_type = ?,
            payment_ref_no = ?,
            payment_amt = ?,
            tran_nature = ?,
            scheme_id = ?,
            updated_by = ?
          WHERE id = ?
        `;
        values = [
          transactionData.license_id,
          transactionData.tran_type,
          transactionData.old_product_variant_id,
          transactionData.new_product_variant_id,
          transactionData.current_no_of_users,
          transactionData.modifed_no_of_users,
          transactionData.balance_no_of_users,
          transactionData.current_no_of_months,
          transactionData.modifed_no_of_months,
          transactionData.balance_no_of_months,
          transactionData.old_dealer_id,
          transactionData.new_dealer_id,
          transactionData.current_expiry_date_with_grace,
          transactionData.current_expiry_date_without_grace,
          transactionData.new_expiry_date_with_grace,
          transactionData.new_expiry_date_without_grace,
          transactionData.addon_id,
          transactionData.current_addon_plan_id,
          transactionData.new_addon_plan_id,
          transactionData.remarks,
          transactionData.payment_type,
          transactionData.payment_ref_no,
          transactionData.payment_amt,
          transactionData.tran_nature,
          transactionData.scheme_id,
          transactionData.updated_by,
          transactionData.id,
        ];
      } else {
        query = `
          INSERT INTO license_tran (
            license_id, tran_type, old_product_variant_id, new_product_variant_id,
            current_no_of_users, modifed_no_of_users, balance_no_of_users,
            current_no_of_months, modifed_no_of_months, balance_no_of_months,
            old_dealer_id, new_dealer_id, current_expiry_date_with_grace,
            current_expiry_date_without_grace, new_expiry_date_with_grace,
            new_expiry_date_without_grace, addon_id, current_addon_plan_id,
            new_addon_plan_id, remarks, payment_type, payment_ref_no,
            payment_amt, scheme_id, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [
          transactionData.license_id,
          transactionData.tran_type,
          transactionData.old_product_variant_id,
          transactionData.new_product_variant_id,
          transactionData.current_no_of_users,
          transactionData.modifed_no_of_users,
          transactionData.balance_no_of_users,
          transactionData.current_no_of_months,
          transactionData.modifed_no_of_months,
          transactionData.balance_no_of_months,
          transactionData.old_dealer_id,
          transactionData.new_dealer_id,
          transactionData.current_expiry_date_with_grace,
          transactionData.current_expiry_date_without_grace,
          transactionData.new_expiry_date_with_grace,
          transactionData.new_expiry_date_without_grace,
          transactionData.addon_id,
          transactionData.current_addon_plan_id,
          transactionData.new_addon_plan_id,
          transactionData.remarks,
          transactionData.payment_type,
          transactionData.payment_ref_no,
          transactionData.payment_amt,
          transactionData.scheme_id,
          transactionData.created_by,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving license transaction.";
      } else {
        if (!transactionData.id) {
          transactionData.id = result.insertId;
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
  let generateLicenseCount: number = 0;
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
      query =
        "select count(*) AS license_count from license_det where product_id=? AND DATE(created_at) = CURRENT_DATE()";
      result = await executeQueryInBusinessDB(query, [product_id]);
      if (result.length <= 0) {
        proceed = false;
        errMsg = "Error loading generateLicenseCount";
      } else {
        generateLicenseCount = result[0].license_count;
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
        String(generateLicenseCount + 1);
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
