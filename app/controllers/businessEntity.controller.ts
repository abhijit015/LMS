'use server';

import { getSession } from '../services/session.service';
import { loadBusinessEntityByIDFromDB, loadAllBusinessEntitiesFromDB } from '../services/businessEntity.service';



  export async function loadBusinessEntityByID(id:number) {
   
    try {
      const session = await getSession();
      
      if (!session) {
        return { status: false, data: "Session not available" };
      }
  
      const fields = await loadBusinessEntityByIDFromDB(id);
      if (fields.length > 0) {
        return { status: true, data: fields[0] };
      } else {
        return { status: false, data: "BusinessEntity not found" };
      }
    } 
    
    catch (error) {
      return { status: false, data: "Error loading businessEntity: " + error };
    }
  }  
  



export async function loadAllBusinessEntities() {
   
  try {
    const session = await getSession();

    if (!session) {
      throw new Error('Session or database info not available');
    }

    const fields = await loadAllBusinessEntitiesFromDB();
    return fields;

  } 
  
  catch (error) {
    console.error('Error loading businessEntity:', error);
    return null;
  }

}


