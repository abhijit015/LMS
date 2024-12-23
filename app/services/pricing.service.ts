"use server";

import {
  addonPlansSchemaT,
  userDiscountSlabSchemaT,
  validityDiscountSlabSchemaT,
  variantPricingSchemaT,
} from "../utils/models";
import { executeQueryInBusinessDB, getBusinessDBConn } from "../utils/db";

export async function loadActiveAddonPlansFromDB(
  addon_id: number,
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";

  let result;
  let query: string;

  try {
    if (proceed) {
      query = `
      (
      SELECT *
      FROM addon_plan ap
      WHERE ap.addon_id = ?
        AND ap.product_id = ?
        AND ap.product_variant_id = ?
        AND ap.effective_from = (
            SELECT MAX(effective_from)
            FROM addon_plan
            WHERE addon_id = ?
              AND product_id = ?
              AND product_variant_id = ?
              AND effective_from <= CURDATE()
        )
      )
      UNION ALL
      (
          SELECT *
          FROM addon_plan ap
          WHERE ap.addon_id = ?
            AND ap.product_id = ?
            AND ap.product_variant_id = ?
            AND ap.effective_from > CURDATE()
          ORDER BY ap.effective_from ASC
      );

    `;
      result = await executeQueryInBusinessDB(query, [
        addon_id,
        product_id,
        product_variant_id,
        addon_id,
        product_id,
        product_variant_id,
        addon_id,
        product_id,
        product_variant_id,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading addon_plans.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "addon_plans loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading addon_plans:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading addon_plans.",
      data: null,
    };
  }
}

export async function loadActiveUserDiscountSlabsFromDB(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";

  let result;
  let query: string;

  try {
    if (proceed) {
      query = `
      (
      SELECT *
      FROM user_discount_slab ap
      WHERE ap.product_id = ?
        AND ap.product_variant_id = ?
        AND ap.effective_from = (
            SELECT MAX(effective_from)
            FROM user_discount_slab
            WHERE product_id = ?
              AND product_variant_id = ?
              AND effective_from <= CURDATE()
        )
      )
      UNION ALL
      (
          SELECT *
          FROM user_discount_slab ap
          WHERE ap.product_id = ?
            AND ap.product_variant_id = ?
            AND ap.effective_from > CURDATE()
          ORDER BY ap.effective_from ASC
      );

    `;
      result = await executeQueryInBusinessDB(query, [
        product_id,
        product_variant_id,
        product_id,
        product_variant_id,
        product_id,
        product_variant_id,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading user_discount_slabs.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "user_discount_slabs loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading user_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error loading user_discount_slabs.",
      data: null,
    };
  }
}

export async function loadActiveValidityDiscountSlabsFromDB(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";

  let result;
  let query: string;

  try {
    if (proceed) {
      query = `
      (
      SELECT *
      FROM validity_discount_slab ap
      WHERE ap.product_id = ?
        AND ap.product_variant_id = ?
        AND ap.effective_from = (
            SELECT MAX(effective_from)
            FROM validity_discount_slab
            WHERE product_id = ?
              AND product_variant_id = ?
              AND effective_from <= CURDATE()
        )
      )
      UNION ALL
      (
          SELECT *
          FROM validity_discount_slab ap
          WHERE ap.product_id = ?
            AND ap.product_variant_id = ?
            AND ap.effective_from > CURDATE()
          ORDER BY ap.effective_from ASC
      );

    `;
      result = await executeQueryInBusinessDB(query, [
        product_id,
        product_variant_id,
        product_id,
        product_variant_id,
        product_id,
        product_variant_id,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading validity_discount_slabs.";
      }
    }

    return {
      status: proceed,
      message: proceed
        ? "validity_discount_slabs loaded successfully."
        : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading validity_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error loading validity_discount_slabs.",
      data: null,
    };
  }
}

export async function loadActiveVariantPricingFromDB(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";

  let result;
  let query: string;

  try {
    if (proceed) {
      query = `
      (
      SELECT *
      FROM variant_pricing ap
      WHERE ap.product_id = ?
        AND ap.product_variant_id = ?
        AND ap.effective_from = (
            SELECT MAX(effective_from)
            FROM variant_pricing
            WHERE product_id = ?
              AND product_variant_id = ?
              AND effective_from <= CURDATE()
        )
      )
      UNION ALL
      (
          SELECT *
          FROM variant_pricing ap
          WHERE ap.product_id = ?
            AND ap.product_variant_id = ?
            AND ap.effective_from > CURDATE()
          ORDER BY ap.effective_from ASC
      );

    `;
      result = await executeQueryInBusinessDB(query, [
        product_id,
        product_variant_id,
        product_id,
        product_variant_id,
        product_id,
        product_variant_id,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading variant_pricing.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "variant_pricing loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading variant_pricing:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error loading variant_pricing.",
      data: null,
    };
  }
}

export async function loadPrevAddonPlansFromDB(
  addon_id: number,
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      const query = `
        SELECT *
        FROM addon_plan ap
        WHERE ap.addon_id = ?
          AND ap.product_id = ?
          AND ap.product_variant_id = ?
          AND ap.effective_from <= CURDATE()
          AND ap.effective_from < (
            SELECT MAX(effective_from)
            FROM addon_plan
            WHERE addon_id = ?
              AND product_id = ?
              AND product_variant_id = ?
              AND effective_from <= CURDATE())
        ORDER BY ap.effective_from DESC;
      `;

      result = await executeQueryInBusinessDB(query, [
        addon_id,
        product_id,
        product_variant_id,
        addon_id,
        product_id,
        product_variant_id,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading previous addon plans.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Addon plans loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading addon plans:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error loading addon plans.",
      data: null,
    };
  }
}

export async function loadPrevUserDiscountSlabsFromDB(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      const query = `
        SELECT *
        FROM user_discount_slab uds
        WHERE uds.product_id = ?
          AND uds.product_variant_id = ?
          AND uds.effective_from <= CURDATE()
          AND uds.effective_from < (
            SELECT MAX(effective_from)
            FROM user_discount_slab
            WHERE product_id = ?
              AND product_variant_id = ?
              AND effective_from <= CURDATE())
        ORDER BY uds.effective_from DESC;
      `;

      result = await executeQueryInBusinessDB(query, [
        product_id,
        product_variant_id,
        product_id,
        product_variant_id,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading user discount slabs.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "User discount slabs loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading user discount slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error loading user discount slabs.",
      data: null,
    };
  }
}

export async function loadPrevValidityDiscountSlabsFromDB(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      const query = `
        SELECT *
        FROM validity_discount_slab vds
        WHERE vds.product_id = ?
          AND vds.product_variant_id = ?
          AND vds.effective_from <= CURDATE()
          AND vds.effective_from < (
            SELECT MAX(effective_from)
            FROM validity_discount_slab
            WHERE product_id = ?
              AND product_variant_id = ?
              AND effective_from <= CURDATE())
        ORDER BY vds.effective_from DESC;
      `;

      result = await executeQueryInBusinessDB(query, [
        product_id,
        product_variant_id,
        product_id,
        product_variant_id,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading previous validity discount slabs.";
      }
    }

    return {
      status: proceed,
      message: proceed
        ? "Validity discount slabs loaded successfully."
        : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading validity discount slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error loading validity discount slabs.",
      data: null,
    };
  }
}

export async function loadPrevVariantPricingFromDB(
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;

  try {
    if (proceed) {
      const query = `
        SELECT *
        FROM variant_pricing vp
        WHERE vp.product_id = ?
          AND vp.product_variant_id = ?
          AND vp.effective_from <= CURDATE()
          AND vp.effective_from < (
            SELECT MAX(effective_from)
            FROM variant_pricing
            WHERE product_id = ?
              AND product_variant_id = ?
              AND effective_from <= CURDATE())
        ORDER BY vp.effective_from DESC;
      `;

      result = await executeQueryInBusinessDB(query, [
        product_id,
        product_variant_id,
        product_id,
        product_variant_id,
      ]);

      if (result.length < 0) {
        proceed = false;
        errMsg = "Error loading previous variant pricing.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Variant pricing loaded successfully." : errMsg,
      data: proceed ? result : null,
    };
  } catch (error) {
    console.error("Error loading variant pricing:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error loading variant pricing.",
      data: null,
    };
  }
}

export async function saveVariantPricingInDB(
  variantPricingData: variantPricingSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query: string;
  let connection;

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed) {
      query = `
        DELETE FROM variant_pricing 
        WHERE product_id = ? 
          AND product_variant_id = ?
          AND (
            effective_from > CURDATE() OR
            effective_from = (
              SELECT MAX(effective_from)
              FROM variant_pricing
              WHERE product_id = ?
                AND product_variant_id = ?
                AND effective_from <= CURDATE()
            )
          )
      `;
      result = await executeQueryInBusinessDB(
        query,
        [product_id, product_variant_id, product_id, product_variant_id],
        connection
      );

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error deleting validity_discount_slabs.";
      }
    }

    if (proceed) {
      query = `
        INSERT INTO variant_pricing ( product_id,product_variant_id, effective_from, price,early_discount_percentage,  created_by)
        VALUES (?, ?, ?, ?,?,?)
      `;

      for (const plan of variantPricingData) {
        const values = [
          plan.product_id,
          plan.product_variant_id,
          plan.effective_from,
          plan.price,
          plan.early_discount_percentage,
          plan.created_by,
        ];

        result = await executeQueryInBusinessDB(query, values, connection);

        if (result.affectedRows < 1) {
          proceed = false;
          errMsg = "Error saving one of the variant_pricing.";
          break;
        } else {
          if (!plan.id) {
            plan.id = result.insertId;
          }
        }
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "variant_pricing saved successfully." : errMsg,
      data: proceed ? variantPricingData.map((plan) => plan.id) : null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error saving variant_pricing:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error saving variant_pricing.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

export async function saveUserDiscountSlabsInDB(
  userDiscountSlabsData: userDiscountSlabSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query: string;
  let connection;

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed) {
      query = `
        DELETE FROM user_discount_slab 
        WHERE product_id = ? 
          AND product_variant_id = ?
          AND (
            effective_from > CURDATE() OR
            effective_from = (
              SELECT MAX(effective_from)
              FROM user_discount_slab
              WHERE product_id = ?
                AND product_variant_id = ?
                AND effective_from <= CURDATE()
            )
          )
      `;
      result = await executeQueryInBusinessDB(
        query,
        [product_id, product_variant_id, product_id, product_variant_id],
        connection
      );

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error deleting validity_discount_slabs.";
      }
    }

    if (proceed) {
      query = `
        INSERT INTO user_discount_slab ( product_id,product_variant_id, effective_from, start_value, end_value, discount_percentage,  created_by)
        VALUES (?, ?, ?, ?,?,?,?)
      `;

      for (const plan of userDiscountSlabsData) {
        const values = [
          plan.product_id,
          plan.product_variant_id,
          plan.effective_from,
          plan.start_value,
          plan.end_value,
          plan.discount_percentage,
          plan.created_by,
        ];

        result = await executeQueryInBusinessDB(query, values, connection);

        if (result.affectedRows < 1) {
          proceed = false;
          errMsg = "Error saving one of the user_discount_slabs.";
          break;
        } else {
          if (!plan.id) {
            plan.id = result.insertId;
          }
        }
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "user_discount_slabs saved successfully." : errMsg,
      data: proceed ? userDiscountSlabsData.map((plan) => plan.id) : null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error saving user_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error saving user_discount_slabs.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

export async function saveValidityDiscountSlabsInDB(
  validityDiscountSlabsData: validityDiscountSlabSchemaT[],
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query: string;
  let connection;

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed) {
      query = `
        DELETE FROM validity_discount_slab 
        WHERE product_id = ? 
          AND product_variant_id = ?
          AND (
            effective_from > CURDATE() OR
            effective_from = (
              SELECT MAX(effective_from)
              FROM validity_discount_slab
              WHERE product_id = ?
                AND product_variant_id = ?
                AND effective_from <= CURDATE()
            )
          )
      `;
      result = await executeQueryInBusinessDB(
        query,
        [product_id, product_variant_id, product_id, product_variant_id],
        connection
      );

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error deleting validity_discount_slabs.";
      }
    }

    if (proceed) {
      query = `
        INSERT INTO validity_discount_slab (
          product_id, 
          product_variant_id, 
          effective_from, 
          start_value, 
          end_value, 
          discount_percentage, 
          grace, 
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const plan of validityDiscountSlabsData) {
        const values = [
          plan.product_id,
          plan.product_variant_id,
          plan.effective_from,
          plan.start_value,
          plan.end_value,
          plan.discount_percentage,
          plan.grace,
          plan.created_by,
        ];

        result = await executeQueryInBusinessDB(query, values, connection);

        if (result.affectedRows < 1) {
          proceed = false;
          errMsg = "Error saving one of the validity_discount_slabs.";
          break;
        } else {
          if (!plan.id) {
            plan.id = result.insertId;
          }
        }
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "validity_discount_slabs saved successfully." : errMsg,
      data: proceed ? validityDiscountSlabsData.map((plan) => plan.id) : null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error saving validity_discount_slabs:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Error saving validity_discount_slabs.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

export async function saveAddonPlansInDB(
  addonPlansData: addonPlansSchemaT[],
  addon_id: number,
  product_id: number,
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let query: string;
  let connection;

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed) {
      query = `
        DELETE FROM addon_plan 
        WHERE addon_id = ? 
          AND product_id = ? 
          AND product_variant_id = ?
          AND (
              effective_from > CURDATE() OR
              effective_from = (
                  SELECT MAX(effective_from)
                  FROM addon_plan
                  WHERE addon_id = ?
                    AND product_id = ?
                    AND product_variant_id = ?
                    AND effective_from <= CURDATE()
              )
          )
      `;
      result = await executeQueryInBusinessDB(
        query,
        [
          addon_id,
          product_id,
          product_variant_id,
          addon_id,
          product_id,
          product_variant_id,
        ],
        connection
      );

      if (result.affectedRows < 0) {
        proceed = false;
        errMsg = "Error deleting addon_plans.";
      }
    }

    if (proceed) {
      query = `
        INSERT INTO addon_plan (addon_id, product_id,product_variant_id, effective_from, plan_name, value, price, grace, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const plan of addonPlansData) {
        const values = [
          plan.addon_id,
          plan.product_id,
          plan.product_variant_id,
          plan.effective_from,
          plan.plan_name,
          plan.value,
          plan.price,
          plan.grace,
          plan.created_by,
        ];

        result = await executeQueryInBusinessDB(query, values, connection);

        if (result.affectedRows < 1) {
          proceed = false;
          errMsg = "Error saving one of the addon_plans.";
          break;
        } else {
          if (!plan.id) {
            plan.id = result.insertId;
          }
        }
      }
    }

    if (proceed) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return {
      status: proceed,
      message: proceed ? "addon_plans saved successfully." : errMsg,
      data: proceed ? addonPlansData.map((plan) => plan.id) : null,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error saving addon_plans:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error saving addon_plans.",
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}
