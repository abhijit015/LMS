import mariadb from 'mariadb';


const pool = mariadb.createPool({
  host: 'localhost', 
  user: 'abhijit',  
  password: 'qq',  
  database: 'LMS',  
  connectionLimit: 5,  
});


export async function executeQuery(query: string, values?: any[]) {

  let connection;
  
  try {
    connection = await pool.getConnection();
    const results = await connection.query(query, values);
    return results;
  }
  
  catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
  
  finally {
    if (connection) connection.end();
  }

}