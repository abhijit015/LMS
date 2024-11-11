import { productSchemaT, userSchemaT } from "../utils/models";
import { executeQuery } from "../utils/db";
import { deleteUserFromDB, saveUserInDB } from "./user.service";

export async function loadProductFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let productData = null;

  try {
    if (proceed) {
      const query = `SELECT * FROM products WHERE id = ?`;
      const result = await executeQuery(query, [id, id]);

      if (result.length > 0) {
        productData = result[0];
      } else {
        proceed = false;
        errMsg = "Product not found.";
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

  try {
    if (proceed) {
      result = await executeQuery("delete from products where id=?", [
        productId,
      ]);
      if (result.affectedRows <= 0) {
        proceed = false;
        errMsg = "Unable to delete product.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Product deleted successfully." : errMsg,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error deleting product.",
      data: null,
    };
  }
}

export async function saveProductInDB(productData: productSchemaT) {
  let proceed: boolean = true;
  let errMsg: string = "";

  try {
    if (proceed) {
      let query: string;
      let values: any[];

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

      const result = await executeQuery(query, values);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error saving client.";
      } else {
        if (!productData.id) {
          productData.id = result.insertId;
        }
      }
    }

    return {
      status: proceed,
      message: proceed ? "Product saved successfully." : errMsg,
      data: proceed ? productData.id : null,
    };
  } catch (error) {
    console.error("Error saving product:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Error saving product.",
      data: null,
    };
  }
}
