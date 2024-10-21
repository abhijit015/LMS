import { productSchemaT } from '../models/models';
import {executeQuery} from "../utils/db"


export async function getProductIDByNameFromDB(name: string): Promise<number | null> {
  try {
    const query = `SELECT ID FROM products WHERE name = ?`;
    const result = await executeQuery(query, [name]);

    return result[0].ID;
  } catch (error) {
    console.error("Error fetching product ID by name:", error);
    throw error;   
  }
}



export async function saveProductInDB(
  data: productSchemaT
) {
  try {
    const query = `
      INSERT INTO products (id, name)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name);
    `;

    const values = [
      data.id || null,
      data.name,
    ];

    const result = await executeQuery(query,values);

    return result;

  } catch (error) {
    console.error("Error saving product:", error);
    throw error;
  }
}





export async function deleteProductByIDFromDB(id: number) {
    try {
      let result = await executeQuery('DELETE FROM products WHERE id = ?', [id]);
      result = await executeQuery('DELETE FROM product_license_param WHERE product_id = ?', [id]);
      return result;
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
  }



  export async function loadProductByIDFromDB(id:number) {
    try {
      const query = `SELECT * FROM products where id=?`;
      const result = await executeQuery(query,[id]);
  
      return result;
  
    } catch (error) {
      console.error("Error loading product:", error);
      throw error;
    }
  }
  


export async function loadAllProductsFromDB() {
  try {
    const query = `SELECT * FROM products`;
    const result = await executeQuery(query);
    
    return result;

  } catch (error) {
    console.error("Error loading products:", error);
    throw error;
  }
}



export async function loadProductLicenseParamsFromDB(product_id:number) {
  try {
    const query = `SELECT * FROM license_fields where id in (select license_field_id from product_license_param where product_id = ?)`;
    const result = await executeQuery(query,[product_id]);
    
    console.log("loadProductLicenseParamsFromDB result :",result);
    return result;

  } catch (error) {
    console.error("Error loading products license params :", error);
    throw error;
  }
}



export async function saveProductLicenseParamsInDB(product_id: number, data: number[]) {
  try {
    await executeQuery('DELETE FROM product_license_param WHERE product_id = ?', [product_id]);

    if (data.length === 0) {
      return { 
        affectedRows: 1,
        insertId: null,
        message: "License params deleted for the specified product_id." 
      };
    }

    const values = data.map((licenseFieldId) => `(${product_id}, ${licenseFieldId})`).join(', ');
    console.log("values : ",values);
    const insertQry = `INSERT INTO product_license_param (product_id, license_field_id) VALUES ${values}`;
    console.log("insertQry : ",insertQry);
    const result = await executeQuery(insertQry);

    return {
      affectedRows: result.affectedRows,
      message: "License params saved successfully."
    };
  } catch (error) {
    throw new Error('Failed to save product license parameters.');
  }
}



