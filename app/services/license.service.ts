"use server";

import { executeQuery } from "../utils/db";

export async function loadAllLicenseFieldsFromDB(client_id: number) {
  try {
    const query = `SELECT * FROM license_params where client_id=? order by name`;
    const result = await executeQuery(query, [client_id]);
    return {
      status: true,
      message: "All license fields loaded successfully.",
      data: result,
    };
  } catch (error) {
    console.error("Error loading license fields:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Database error occurred while loading products.",
      data: null,
    };
  }
}
