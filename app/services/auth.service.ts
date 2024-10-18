'use server';

import { executeQuery } from '../utils/db';

export async function authenticateUser(email: string, password: string) {

  try {
    
    const query = "select * from users where username = ?;";

    const result = await executeQuery(query, [email]);

    if (result.length > 0) {
      if (password === result[0].password) {
        return { 
            id: result[0].id, 
        }; 
      }
    }

  } 
  
  catch (e) {
    console.error('Error authenticating user:', e);
  }

  return null; 

}

