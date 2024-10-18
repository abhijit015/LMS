import { dealerSchemaT } from '../models/models';
import {executeQuery} from "../utils/db"


export async function saveDealerInDB(
  data: dealerSchemaT
) {
  try {
    const query = `
      INSERT INTO dealers (id, name, contact_num, email)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        contact_num = VALUES(contact_num),
        email = VALUES(email)
    `;

    const values = [
      data.id || null,
      data.name,
      data.contact_num,
      data.email,
    ];

    const result = await executeQuery(query,values);

    return result;

  } catch (error) {
    console.error("Error saving dealer:", error);
    throw error;
  }
}



export async function deleteDealerByIDFromDB(id: number) {
    try {
      const result = await executeQuery('DELETE FROM dealers WHERE id = ?', [id]);
      return result;
    } catch (error) {
        console.error("Error deleting dealer:", error);
        throw error;
    }
  }



  export async function loadDealerByIDFromDB(id:number) {
    try {
      const query = `SELECT * FROM dealers where id=?`;
      const result = await executeQuery(query,[id]);
  
      return result;
  
    } catch (error) {
      console.error("Error loading dealer:", error);
      throw error;
    }
  }
  


export async function loadAllDealersFromDB() {
  try {
    const query = `SELECT * FROM dealers`;
    const result = await executeQuery(query);
    
    return result;

  } catch (error) {
    console.error("Error loading dealers:", error);
    throw error;
  }
}

