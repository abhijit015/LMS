import {
  licenseParamSchemaT,
  productLicenseParamsSchemaT,
  productSchemaT,
  userSchemaT,
} from "../utils/models";
import { executeQuery, getDBConn } from "../utils/db";
import { deleteUserFromDB, saveUserInDB } from "./user.service";

export async function loadProductFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let productData: any = null;
  let result;
  let query;

  try {
    if (proceed) {
      query = `SELECT * FROM products WHERE id = ?`;
      result = await executeQuery(query, [id]);

      if (result.length > 0) {
        productData = result[0];
      } else {
        proceed = false;
        errMsg = "Product not found.";
      }
    }

    if (proceed) {
      query = `
        SELECT plp.id AS product_license_param_id, plp.product_id, plp.license_param_id, 
               plp.effective_from, plp.selected, lp.name AS license_name, lp.client_id, lp.basis
        FROM product_license_params AS plp
        JOIN license_params AS lp ON lp.id = plp.license_param_id
        WHERE plp.product_id = ?
        ORDER BY plp.effective_from DESC
      `;
      result = await executeQuery(query, [id]);

      console.log("load result : ", result);

      if (result.length > 0) {
        const groupedLicenseParams: { [key: string]: any[] } = {};

        result.forEach((row: any) => {
          const effectiveFrom = row.effective_from;

          if (!groupedLicenseParams[effectiveFrom]) {
            groupedLicenseParams[effectiveFrom] = [];
          }

          groupedLicenseParams[effectiveFrom].push({
            id: row.license_param_id,
            name: row.license_name,
            client_id: row.client_id,
            selected: row.selected === 1,
            basis: row.basis,
          });
        });

        productData.productLicenseParams = Object.keys(
          groupedLicenseParams
        ).map((effectiveFrom) => ({
          product_id: productData.id,
          licenseParams: groupedLicenseParams[effectiveFrom],
          effective_from: new Date(effectiveFrom),
        }));
      } else {
        productData.productLicenseParams = [];
      }
    }

    return {
      status: proceed,
      message: proceed ? "Product loaded successfully." : errMsg,
      data: productData,
    };
  } catch (error) {
    console.error("Error loading product:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading product.",
      data: null,
    };
  }
}

export async function loadProductListFromDB(client_id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  try {
    if (proceed) {
      query = `SELECT * from products where client_id=? order by name`;
      result = await executeQuery(query, [client_id]);
    }

    return {
      status: proceed,
      message: proceed ? "Products loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading products:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading products.",
      data: null,
    };
  }
}

export async function deleteProductFromDB(productId: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query;
  let connection;
  let values: any[];

  try {
    connection = await getDBConn();
    await connection.beginTransaction();

    if (proceed) {
      query = `
      DELETE FROM product_license_params WHERE product_id = ?
    `;
      values = [productId];
      result = await executeQuery(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error deleting old product license parameters.";
      }
    }

    if (proceed) {
      result = await executeQuery(
        "delete from products where id=?",
        [productId],
        connection
      );
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete product.";
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "Product deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error deleting product:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error deleting product.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

export async function saveProductInDB(productData: productSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query: string;
  let values: any[];
  let connection;
  let result;

  try {
    connection = await getDBConn();
    await connection.beginTransaction();

    if (proceed) {
      if (productData.id) {
        query = `
            UPDATE products SET
              name = ?,
              updated_by = ?
            WHERE id = ?
          `;
        values = [productData.name, productData.updated_by, productData.id];
      } else {
        query = `
            INSERT INTO products (name,client_id,created_by,updated_by)
            VALUES (?,?,?,?)
          `;
        values = [
          productData.name,
          productData.client_id,
          productData.created_by,
          productData.updated_by,
        ];
      }

      result = await executeQuery(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error saving client.";
      } else {
        if (!productData.id) {
          productData.id = result.insertId;
        }
      }
    }

    if (proceed) {
      query = `
      DELETE FROM product_license_params WHERE product_id = ?
    `;
      values = [productData.id];
      result = await executeQuery(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error deleting old product license parameters.";
      }
    }

    if (
      proceed &&
      productData.productLicenseParams &&
      productData.productLicenseParams.length > 0
    ) {
      for (const licenseParams of productData.productLicenseParams) {
        for (const licenseParam of licenseParams.licenseParams) {
          query = `
            INSERT INTO product_license_params (product_id, license_param_id, effective_from, selected)
            VALUES (?, ?, ?, ?)
          `;
          values = [
            productData.id,
            licenseParam.id,
            licenseParams.effective_from,
            licenseParam.selected,
          ];

          result = await executeQuery(query, values, connection);

          if (result.affectedRows < 0) {
            proceed = false;
            errMsg = "Error saving product license parameters.";
            break;
          }
        }

        if (!proceed) {
          break;
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
      message: proceed ? "Product saved successfully." : errMsg,
      data: proceed ? productData.id : null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error saving product:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving product.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}
