import {executeQuery} from "../utils/db"



  export async function loadBusinessEntityByIDFromDB(id:number) {
    try {
      const query = `SELECT * FROM business_entity where id=?`;
      const result = await executeQuery(query,[id]);
  
      return result;
  
    } catch (error) {
      console.error("Error loading businessEntity:", error);
      throw error;
    }
  }
  


export async function loadAllBusinessEntitiesFromDB() {
  try {
    const query = `SELECT *, (select name from products where id=product_id) as product_name FROM business_entity`;
    const result = await executeQuery(query);
    
    return result;

  } catch (error) {
    console.error("Error loading Business Entities:", error);
    throw error;
  }
}

