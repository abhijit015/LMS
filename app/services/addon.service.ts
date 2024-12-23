import { addonSchemaT } from "../utils/models";
import { executeQueryInBusinessDB, getBusinessDBConn } from "../utils/db";

export async function loadAddonFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let addonData: any = null;
  let result;
  let query;

  try {
    if (proceed) {
      query = `SELECT * FROM addon_mast WHERE id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        addonData = result[0];
      } else {
        proceed = false;
        errMsg = "Addon not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Addon loaded successfully." : errMsg,
      data: addonData,
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

export async function loadAddonListFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;

  try {
    if (proceed) {
      query = `SELECT * FROM addon_mast ORDER BY name`;
      result = await executeQueryInBusinessDB(query);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error fetching list.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Addons loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading addons:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error loading addons.",
      data: null,
    };
  }
}

export async function deleteAddonFromDB(addonId: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query;
  let businessDBConn;
  let values: any[];

  try {
    businessDBConn = await getBusinessDBConn();
    await businessDBConn.beginTransaction();

    if (proceed) {
      result = await executeQueryInBusinessDB(
        "delete from addon_mast where id=?",
        [addonId],
        businessDBConn
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete addon.";
      }
    }

    if (proceed) {
      await businessDBConn.commit();
    } else {
      await businessDBConn.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Addon deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (businessDBConn) await businessDBConn.rollback();
    console.error("Error deleting addon:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error deleting addon.",
      data: null,
    };
  } finally {
    if (businessDBConn) businessDBConn.end();
  }
}

export async function saveAddonInDB(addonData: addonSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let businessDBConn;
  let result;

  try {
    businessDBConn = await getBusinessDBConn();
    await businessDBConn.beginTransaction();

    if (proceed) {
      if (addonData.id) {
        query = `
            UPDATE addon_mast SET
              name = ?,
              updated_by = ?
            WHERE id = ?
          `;
        values = [addonData.name, addonData.updated_by, addonData.id];
      } else {
        query = `
            INSERT INTO addon_mast (name,created_by,updated_by)
            VALUES (?,?,?)
          `;
        values = [addonData.name, addonData.created_by, addonData.updated_by];
      }

      result = await executeQueryInBusinessDB(query, values, businessDBConn);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error saving addon.";
      } else {
        if (!addonData.id) {
          addonData.id = result.insertId;
        }
      }
    }

    if (proceed) {
      await businessDBConn.commit();
    } else {
      await businessDBConn.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Addon saved successfully." : errMsg,
      data: proceed ? addonData.id : null,
    };
  } catch (error) {
    if (businessDBConn) await businessDBConn.rollback();
    console.error("Error saving addon:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving addon.",
      data: null,
    };
  } finally {
    if (businessDBConn) businessDBConn.end();
  }
}
