'use server';

import { productSchema } from '../zodschema/zodschema';
import { productSchemaT } from '../models/models';
import { getSession } from '../services/session.service';
import { loadProductByIDFromDB,saveProductInDB, loadAllProductsFromDB, deleteProductByIDFromDB } from '../services/product.service';


export async function saveProduct(data: productSchemaT) {
  let result;
  let proceed = true;

  try {

    if (proceed) {
      const session = await getSession();
      if (!session) {
        return {
          status: false,
          data: [{ message: "Error: Session not found" }],
        };
      }
    }

    if (proceed) {
      const parsed = productSchema.safeParse(data);

      if (!parsed.success) {
        const errorState = parsed.error.issues.map(issue => ({
          path: issue.path,
          message: issue.message,
        }));
        return { status: false, data: errorState };
      }

      if (parsed.success && parsed.data) {
        const dbResult = await saveProductInDB(parsed.data);

        if (dbResult.affectedRows > 0) {
          result = { status: true, data: parsed.data };
        } else {
          result = { status: false, data: "Failed to save product, no rows affected." };
        }
      }
    }
  } catch (e: any) {
    result = {
      status: false,
      data: [{  message: e.message || "Unknown error occurred." }],
    };
  }

  return result;
}





export async function deleteProductByID(id: number) {
    try {
      const session = await getSession();
      if (!session) {
        return { status: false, data: "Session not available" };
      }
  
      const dbResult = await deleteProductByIDFromDB(id);
  
      if (dbResult.affectedRows > 0) {
        return { status: true };
      } else {
        return { status: false, data: "Error deleting product" };
      }
    } catch (e) {
      console.error("Error in deleteProductByID controller:", e);
      return {
         status: false, 
        data: "Error: Unknown Error" 
      };
    }
  }



  export async function loadProductByID(id:number) {
   
    try {
      const session = await getSession();
      
      if (!session) {
        return { status: false, data: "Session not available" };
      }
  
      const fields = await loadProductByIDFromDB(id);
      if (fields.length > 0) {
        return { status: true, data: fields[0] };
      } else {
        return { status: false, data: "Product not found" };
      }
    } 
    
    catch (error) {
      return { status: false, data: "Error loading product: " + error };
    }
  }  
  



export async function loadAllProducts() {
   
  try {
    const session = await getSession();

    if (!session) {
      throw new Error('Session or database info not available');
    }

    const fields = await loadAllProductsFromDB();
    return fields;

  } 
  
  catch (error) {
    console.error('Error loading product:', error);
    return null;
  }

}


