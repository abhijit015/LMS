"use server";
import { handleErrorMsg } from "../utils/common";

import { departmentSchemaT } from "../utils/models";
import {
  executeQueryInBusinessDB,
  getBusinessDBConn,
  getUserDBConn,
} from "../utils/db";
import { getCurrentUserRole } from "../controllers/business.controller";
import { getCurrentDealerDet } from "../controllers/dealer.controller";
import { ROLE_DEALER_ADMIN } from "../utils/constants";

export async function loadDepartmentFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let departmentData;
  let result;
  let query;

  try {
    if (proceed) {
      query = `SELECT * FROM department_mast WHERE id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        departmentData = result[0];
      } else {
        proceed = false;
        errMsg = "Department not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Department loaded successfully." : errMsg,
      data: proceed ? departmentData : null,
    };
  } catch (error) {
    console.error("Error loading department:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadDepartmentListFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  let currentRole;
  let dealerData;

  try {
    if (proceed) {
      result = await getCurrentUserRole();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        currentRole = result.data;
      }
    }

    if (proceed && currentRole === ROLE_DEALER_ADMIN) {
      result = await getCurrentDealerDet();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        dealerData = result.data;
      }
    }

    if (proceed) {
      if (currentRole === ROLE_DEALER_ADMIN) {
        query = `SELECT * from department_mast where dealer_id=? order by name`;
        result = await executeQueryInBusinessDB(query, [dealerData.id]);
      } else {
        query = `SELECT * from department_mast where dealer_id=0 or dealer_id IS NULL order by name`;
        result = await executeQueryInBusinessDB(query);
      }
      if (result.length < 0) {
        proceed = false;
        errMsg = "Error fetching list.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Departments loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading departments:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function deleteDepartmentFromDB(departmentId: number) {
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
        "delete from department_mast where id=?",
        [departmentId],
        connection
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete department.";
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Department deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error deleting department:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

export async function saveDepartmentInDB(departmentData: departmentSchemaT) {
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
      if (departmentData.id) {
        query = `
              UPDATE department_mast SET
                name = ?,
                updated_by = ?
              WHERE id = ?
            `;
        values = [
          departmentData.name,
          departmentData.updated_by,
          departmentData.id,
        ];
      } else {
        query = `
              INSERT INTO department_mast (name,dealer_id,created_by,updated_by)
              VALUES (?,?,?,?)
            `;
        values = [
          departmentData.name,
          departmentData.dealer_id,
          departmentData.created_by,
          departmentData.updated_by,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error saving department.";
      } else {
        if (!departmentData.id) {
          departmentData.id = result.insertId;
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
      message: proceed ? "Department saved successfully." : errMsg,
      data: proceed ? departmentData.id : null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error saving department:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}
