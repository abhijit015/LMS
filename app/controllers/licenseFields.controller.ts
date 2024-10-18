'use server';

import { licenseFieldSchema } from '../zodschema/zodschema';
import { licenseFieldSchemaT } from '../models/models';
import { getSession } from '../services/session.service';
import { saveLicenseFieldsInDB, loadAllLicenseFieldsFromDB ,loadLicenseFieldBasisFromDB} from '../services/licenseFields.service';
import { ZodError, ZodIssue } from 'zod';


export async function loadLicenseFieldBasis() {
   
  try {
    const session = await getSession();

    if (!session) {
      throw new Error('Session or database info not available');
    }

    const fields = await loadLicenseFieldBasisFromDB();
    return fields;

  } 
  
  catch (error) {
    console.error('Error loading dealer:', error);
    return null;
  }
}



export async function saveLicenseFields(data: licenseFieldSchemaT[]) {
  try {
    const session = await getSession();
    if (!session) {
      return {
        status: false,
        data: [{ message: "Error: Session not found" }],
      };
    }


    const parsedData = data.map((item) => {
      const parsed = licenseFieldSchema.safeParse(item);
      if (!parsed.success) {
        const errorState = parsed.error.issues.map(issue => ({
          path: issue.path,
          message: issue.message,
          code: issue.code,  
        }));
        throw new ZodError(errorState as ZodIssue[]);
      }
      return parsed.data;
    });

    const dbResult = await saveLicenseFieldsInDB(parsedData);

    if (dbResult.affectedRows > 0) {
      return { status: true, data: parsedData };
    } else {
      return {
        status: false,
        data: "Failed to save license fields, no rows affected.",
      };
    }
  } catch (e: any) {
    return {
      status: false,
      data: [{ message: e.message || "Unknown error occurred." }],
    };
  }
}

export async function loadLicenseFields() {
  try {
    const session = await getSession();

    if (!session) {
      throw new Error('Session or database info not available');
    }

    const fields = await loadAllLicenseFieldsFromDB();
    return fields;

  } catch (error) {
    console.error('Error loading license fields:', error);
    return [];
  }
}