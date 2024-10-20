import { productSchemaT } from '../models/models';
import {executeQuery} from "../utils/db"


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
      const result = await executeQuery('DELETE FROM products WHERE id = ?', [id]);
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

