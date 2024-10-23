'use server';

import { dealerSchema } from '../zodschema/zodschema';
import { dealerSchemaT } from '../models/models';
import { getSession } from '../services/session.service';
import { loadDealerByIDFromDB,saveDealerInDB, loadAllDealersFromDB, deleteDealerByIDFromDB } from '../services/dealer.service';


export async function saveDealer(data: dealerSchemaT) {
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
      const parsed = dealerSchema.safeParse(data);

      if (!parsed.success) {
        const errorState = parsed.error.issues.map(issue => ({
          path: issue.path,
          message: issue.message,
        }));
        return { status: false, data: errorState };
      }

      if (parsed.success && parsed.data) {
        const dbResult = await saveDealerInDB(parsed.data);

        if (dbResult.affectedRows > 0) {
          result = { status: true, data: parsed.data };
        } else {
          result = { status: false, data: "Failed to save dealer, no rows affected." };
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





export async function deleteDealerByID(id: number) {
    try {
      const session = await getSession();
      if (!session) {
        return { status: false, data: "Session not available" };
      }
  
      const dbResult = await deleteDealerByIDFromDB(id);
  
      if (dbResult.affectedRows > 0) {
        return { status: true };
      } else {
        return { status: false, data: "Error deleting dealer" };
      }
    } catch (e) {
      console.error("Error in deleteDealerByID controller:", e);
      return {
         status: false, 
        data: "Error: Unknown Error" 
      };
    }
  }



  export async function loadDealerByID(id:number) {
   
    try {
      const session = await getSession();
      
      if (!session) {
        return { status: false, data: "Session not available" };
      }
  
      const fields = await loadDealerByIDFromDB(id);
      if (fields.length > 0) {
        return { status: true, data: fields[0] };
      } else {
        return { status: false, data: "Dealer not found" };
      }
    } 
    
    catch (error) {
      return { status: false, data: "Error loading dealer: " + error };
    }
  }  
  



export async function loadAllDealers() {
   
  try {
    const session = await getSession();

    if (!session) {
      throw new Error('Session or database info not available');
    }

    const fields = await loadAllDealersFromDB();
    return fields;

  } 
  
  catch (error) {
    console.error('Error loading dealer:', error);
    return null;
  }

}


