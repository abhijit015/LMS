"use server";

import { Connection } from "mariadb";
import {
  ADD,
  DEALER_CREDIT_TRAN_ASSIGN_CREDITS,
  MODIFY,
} from "../utils/constants";
import { executeQueryInBusinessDB, getBusinessDBConn } from "../utils/db";
import { dealerCreditTranSchemaT } from "../utils/models";

export async function loadAssignCreditTranFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  try {
    if (proceed) {
      query = `
        SELECT 
          (SELECT name FROM dealer_mast WHERE id = dealer_credit_tran.dealer_id) as dealer_name,
          dealer_credit_tran.* 
        FROM dealer_credit_tran 
        WHERE id = ?
      `;
      result = await executeQueryInBusinessDB(query, [id]);
      if (result.length <= 0) {
        proceed = false;
        errMsg = "Error fetching tran.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? result[0] : null,
    };
  } catch (error) {
    console.error("Error loading tran:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading tran.",
      data: null,
    };
  }
}

export async function loadAssignCreditListFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let result;

  try {
    if (proceed) {
      query = `
        SELECT 
          (SELECT name FROM dealer_mast WHERE id = dealer_credit_tran.dealer_id) as dealer_name,
          dealer_credit_tran.* 
        FROM dealer_credit_tran 
        WHERE tran_type = ?
      `;

      result = await executeQueryInBusinessDB(query, [
        DEALER_CREDIT_TRAN_ASSIGN_CREDITS,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading list.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
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

export async function deleteAssignCreditTranFromDB(
  id: number,
  connection?: Connection
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let businessDBConn;

  try {
    if (connection) {
      businessDBConn = connection;
    } else {
      businessDBConn = await getBusinessDBConn();
      await businessDBConn.beginTransaction();
    }

    if (proceed) {
      result = await executeQueryInBusinessDB(
        "delete from dealer_credit_tran where id=?",
        [id],
        connection
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete dealer_credit_tran.";
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
      message: proceed ? "dealer_credit_tran deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (!connection && businessDBConn) {
      await businessDBConn.rollback();
    }
    console.error("Error deleting dealer_credit_tran:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error deleting dealer_credit_tran.",
      data: null,
    };
  } finally {
    if (!connection && businessDBConn) {
      await businessDBConn.end();
    }
  }
}

export async function saveDealerCreditTranInDB(
  creditTranData: dealerCreditTranSchemaT,
  connection?: Connection
) {
  let proceed = true;
  let errMsg = "";
  let query: string;
  let values: any[];
  let businessDBConn;
  let result;
  let inputMode: number = 0;

  try {
    if (connection) {
      businessDBConn = connection;
    } else {
      businessDBConn = await getBusinessDBConn();
      await businessDBConn.beginTransaction();
    }

    if (creditTranData.id) {
      inputMode = MODIFY;
    } else {
      inputMode = ADD;
    }

    if (proceed) {
      if (inputMode === MODIFY) {
        query = `
          UPDATE dealer_credit_tran SET
            dealer_id = ?,
            tran_type = ?,
            license_tran_id = ?,
            modified_credits = ?,
            invoice_no = ?,
            invoice_date = ?,
            tran_date = ?,
            remarks = ?,
            updated_by = ?
          WHERE id = ?
        `;
        values = [
          creditTranData.dealer_id,
          creditTranData.tran_type,
          creditTranData.license_tran_id,
          creditTranData.modified_credits,
          creditTranData.invoice_no,
          creditTranData.invoice_date,
          creditTranData.tran_date,
          creditTranData.remarks,
          creditTranData.updated_by,
          creditTranData.id,
        ];
      } else {
        query = `
          INSERT INTO dealer_credit_tran (
            dealer_id, tran_type, license_tran_id, modified_credits, 
            invoice_no, invoice_date, tran_date, remarks, created_by, updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [
          creditTranData.dealer_id,
          creditTranData.tran_type,
          creditTranData.license_tran_id,
          creditTranData.modified_credits,
          creditTranData.invoice_no,
          creditTranData.invoice_date,
          creditTranData.tran_date,
          creditTranData.remarks,
          creditTranData.created_by,
          creditTranData.updated_by,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error saving dealer credit transaction.";
      } else {
        if (!creditTranData.id) {
          creditTranData.id = result.insertId;
        }
      }

      if (proceed && inputMode === ADD) {
        if (creditTranData.tran_type === DEALER_CREDIT_TRAN_ASSIGN_CREDITS) {
          query = `
          UPDATE dealer_credit_tran SET vch_no = ? WHERE id = ?`;
          values = ["AC-" + String(creditTranData.id), creditTranData.id];
        } else {
          query = `
          UPDATE dealer_credit_tran SET vch_no = ? WHERE id = ?`;
          values = ["CC-" + String(creditTranData.id), creditTranData.id];
        }
      }

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Error updating vch_no.";
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
      message: proceed
        ? "Dealer credit transaction saved successfully."
        : errMsg,
      data: proceed ? creditTranData.id : null,
    };
  } catch (error) {
    if (!connection && businessDBConn) {
      await businessDBConn.rollback();
    }
    console.error("Error saving dealer credit transaction:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error saving dealer credit transaction.",
      data: null,
    };
  } finally {
    if (!connection && businessDBConn) {
      await businessDBConn.end();
    }
  }
}
