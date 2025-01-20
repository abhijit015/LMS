import { productSchemaT, productVariantsSchemaT } from "../utils/models";
import { executeQueryInBusinessDB, getBusinessDBConn } from "../utils/db";
import { handleErrorMsg } from "../utils/common";

export async function loadProductFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let productData: any = null;
  let result;
  let query;

  try {
    if (proceed) {
      query = `SELECT * FROM product_mast WHERE id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        productData = result[0];
      } else {
        proceed = false;
        errMsg = "Product not found.";
      }
    }

    if (proceed && productData) {
      query = `SELECT * FROM product_variants WHERE product_id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length >= 0) {
        productData.variants = result.map(
          (variant: productVariantsSchemaT) => ({
            ...variant,
            is_free_variant: Boolean(variant.is_free_variant),
          })
        );
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
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadVariantFromDB(id: number) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let variantData: any = null;
  let result;
  let query;

  try {
    if (proceed) {
      query = `SELECT * FROM product_variants WHERE id = ?`;
      result = await executeQueryInBusinessDB(query, [id]);

      if (result.length > 0) {
        variantData = result[0];
      } else {
        proceed = false;
        errMsg = "Variant not found.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Variant loaded successfully." : errMsg,
      data: variantData,
    };
  } catch (error) {
    console.error("Error loading Variant:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function loadProductListFromDB() {
  let proceed: boolean = true;
  let errMsg: string = "";
  let query;
  let result;
  let productsWithVariants: productVariantsSchemaT[] = [];

  try {
    if (proceed) {
      query = `SELECT * FROM product_mast ORDER BY name`;
      result = await executeQueryInBusinessDB(query);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading products.";
      } else {
        if (result.length > 0) {
          for (const product of result) {
            const productWithVariants = { ...product, variants: [] };

            query = `SELECT * FROM product_variants WHERE product_id = ?`;
            const variantResult = await executeQueryInBusinessDB(query, [
              product.id,
            ]);

            productWithVariants.variants = variantResult.map(
              (variant: productVariantsSchemaT) => ({
                ...variant,
                is_free_variant: Boolean(variant.is_free_variant),
              })
            );

            productsWithVariants.push(productWithVariants);
          }
        }
      }
    }
    return {
      status: proceed,
      message: proceed ? "Products loaded successfully." : errMsg,
      data: proceed ? productsWithVariants : null,
    };
  } catch (error) {
    console.error("Error loading products:", error);
    return {
      status: false,
      message: handleErrorMsg(error),
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
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed) {
      query = `DELETE FROM product_variants WHERE product_id = ?`;
      result = await executeQueryInBusinessDB(query, [productId], connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error deleting product_variants.";
      }
    }

    if (proceed) {
      result = await executeQueryInBusinessDB(
        "delete from product_mast where id=?",
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
      message: handleErrorMsg(error),
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
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed) {
      if (productData.id) {
        query = `
            UPDATE product_mast SET
              name = ?,
              license_num_identifier = ?,
              updated_by = ?
            WHERE id = ?
          `;
        values = [
          productData.name,
          productData.license_num_identifier,
          productData.updated_by,
          productData.id,
        ];
      } else {
        query = `
            INSERT INTO product_mast (name,license_num_identifier, created_by,updated_by)
            VALUES (?,?,?, ?)
          `;
        values = [
          productData.name,
          productData.license_num_identifier,
          productData.created_by,
          productData.updated_by,
        ];
      }

      result = await executeQueryInBusinessDB(query, values, connection);

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error saving product.";
      } else {
        if (!productData.id) {
          productData.id = result.insertId;
        }
      }
    }

    if (proceed && productData.variants) {
      query = `SELECT id FROM product_variants WHERE product_id = ?`;
      const existingVariants = await executeQueryInBusinessDB(
        query,
        [productData.id],
        connection
      );

      const existingVariantIds = existingVariants.map(
        (variant: productVariantsSchemaT) => variant.id
      );
      const newVariantIds = productData.variants
        .map((variant) => variant.id)
        .filter(Boolean);

      const variantsToDelete = existingVariantIds.filter(
        (id: number) => !newVariantIds.includes(id)
      );

      if (variantsToDelete.length > 0) {
        query = `DELETE FROM product_variants WHERE id IN (?)`;
        result = await executeQueryInBusinessDB(
          query,
          [variantsToDelete],
          connection
        );

        if (result.affectedRows < 0) {
          proceed = false;
          errMsg = "Error deleting obsolete product_variants.";
        }
      }

      for (const variant of productData.variants) {
        if (variant.id && existingVariantIds.includes(variant.id)) {
          query = `
            UPDATE product_variants SET
              name = ?,
              is_free_variant = ?,
              no_of_users = ?,
              no_of_days = ?,
              updated_by = ?
            WHERE id = ?
          `;
          values = [
            variant.name,
            variant.is_free_variant,
            variant.no_of_users,
            variant.no_of_days,
            productData.updated_by,
            variant.id,
          ];
        } else {
          query = `
            INSERT INTO product_variants (name, product_id, is_free_variant, no_of_users, no_of_days, created_by,updated_by)
            VALUES (?, ?, ?, ?, ?, ?,?)
          `;
          values = [
            variant.name,
            productData.id,
            variant.is_free_variant,
            variant.no_of_users,
            variant.no_of_days,
            productData.created_by,
            productData.updated_by,
          ];
        }

        result = await executeQueryInBusinessDB(query, values, connection);

        if (result.affectedRows < 1) {
          proceed = false;
          errMsg = "Error saving one of the product_variants.";
          break;
        } else if (!variant.id) {
          variant.id = result.insertId;
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
      message: handleErrorMsg(error),
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}
