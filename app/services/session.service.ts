import { getServerSession } from "next-auth/next"
import { options } from '../api/auth/[...nextauth]/options';

export async function getSession() {
    
    try {
      const session = await getServerSession(options);
      return session;
    }
    
    catch (e) {
      console.log(e);
      return null;  
    }
    
  }
  