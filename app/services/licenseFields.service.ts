import {executeQuery} from "../utils/db"
import { licenseFieldSchemaT } from '../models/models';


export async function loadLicenseFieldBasisFromDB() {
  try {
    const query = `SELECT * FROM license_field_basis order by name`;
    const result = await executeQuery(query);
    return result;

  } catch (error) {
    console.error("Error loading license field basis : ", error);
    throw error;
  }
}


export async function saveLicenseFieldsInDB(data: licenseFieldSchemaT[]) {
  try {
    const truncateQry = 'TRUNCATE TABLE license_fields';

    if (data.length === 0) {
      await executeQuery(truncateQry);
      return {
        affectedRows: 1,
        insertId: null,
        warningStatus: 0,
        message: "Table truncated, no data to save."
      };
    } else {
      await executeQuery(truncateQry);
    }

    const basisNames = [...new Set(data.map((item) => item.basis))];
    const basisIdMap = new Map<string, number>();

    if (basisNames.length > 0) {
      const basisQry = `SELECT id, name FROM license_field_basis WHERE name IN (${basisNames.map(() => '?').join(', ')})`;
      const basisResults = await executeQuery(basisQry, basisNames);
      basisResults.forEach((row: { id: number; name: string }) => {
        basisIdMap.set(row.name, row.id);
      });
    }

    const insertQry = `INSERT INTO license_fields (name, license_field_basis_id) VALUES ${data.map(() => "(?, ?)").join(", ")}`;
    const values = data.flatMap((item: licenseFieldSchemaT) => [
      item.name,
      basisIdMap.get(item.basis) || null,
    ]);

    const result = await executeQuery(insertQry, values);
    console.log("result : ", result);
    return result;
  } catch (error) {
    console.error("Error saving license fields:", error);
    throw error;
  }
}









export async function loadAllLicenseFieldsFromDB() {
  try {

    const query = `
      SELECT lf.id, lf.name, lfb.name AS basis
      FROM license_fields lf
      LEFT JOIN license_field_basis lfb ON lf.license_field_basis_id = lfb.id
    `;
    
    const result = await executeQuery(query);
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      basis: row.basis,
      isNew: false, 
    }));
  } catch (error) {
    console.error("Error loading license fields:", error);
    throw error;
  }
}