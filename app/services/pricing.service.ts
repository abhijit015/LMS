"use server";

import { handleErrorMsg } from "../utils/common";
import {
  addonPlansSchemaT,
  userDiscountSlabSchemaT,
  validityDiscountSlabSchemaT,
  variantPricingSchemaT,
} from "../utils/models";
import { executeQueryInBusinessDB, getBusinessDBConn } from "../utils/db";

export async function loadCurrentAddonPlansFromDB(
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
        );
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
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

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
      message: handleErrorMsg(error),
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
      message: handleErrorMsg(error),
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
      message: handleErrorMsg(error),
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
      message: handleErrorMsg(error),
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
      message: handleErrorMsg(error),
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
      message: handleErrorMsg(error),
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
      message: handleErrorMsg(error),
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
      message: handleErrorMsg(error),
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
  let values: any[];

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed && variantPricingData) {
      query = `
        SELECT id 
        FROM variant_pricing 
        WHERE product_id = ? AND product_variant_id = ?
      `;
      const existingPricing = await executeQueryInBusinessDB(
        query,
        [product_id, product_variant_id],
        connection
      );

      const existingPricingIds = existingPricing.map(
        (pricing: { id: number }) => pricing.id
      );
      const newPricingIds = variantPricingData
        .map((pricing) => pricing.id)
        .filter(Boolean);

      const pricingToDelete = existingPricingIds.filter(
        (id: number) => !newPricingIds.includes(id)
      );

      if (pricingToDelete.length > 0) {
        query = `DELETE FROM variant_pricing WHERE id IN (?)`;
        result = await executeQueryInBusinessDB(
          query,
          [pricingToDelete],
          connection
        );

        if (result.affectedRows < 0) {
          proceed = false;
          errMsg = "Error deleting obsolete variant_pricing.";
        }
      }

      for (const pricing of variantPricingData) {
        if (pricing.id && existingPricingIds.includes(pricing.id)) {
          query = `
            UPDATE variant_pricing SET
              effective_from = ?,
              price = ?,
              early_discount_percentage = ?,
              updated_by = ?
            WHERE id = ?
          `;
          values = [
            pricing.effective_from,
            pricing.price,
            pricing.early_discount_percentage,
            pricing.updated_by,
            pricing.id,
          ];
        } else {
          query = `
            INSERT INTO variant_pricing (
              product_id, 
              product_variant_id, 
              effective_from, 
              price, 
              early_discount_percentage, 
              created_by, 
              updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          values = [
            pricing.product_id,
            pricing.product_variant_id,
            pricing.effective_from,
            pricing.price,
            pricing.early_discount_percentage,
            pricing.created_by,
            pricing.updated_by,
          ];
        }

        result = await executeQueryInBusinessDB(query, values, connection);

        if (result.affectedRows < 1) {
          proceed = false;
          errMsg = "Error saving one of the variant_pricing.";
          break;
        } else if (!pricing.id) {
          pricing.id = result.insertId;
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
      message: handleErrorMsg(error),
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
  let values: any[];

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed && userDiscountSlabsData) {
      query = `
        SELECT id 
        FROM user_discount_slab 
        WHERE product_id = ? AND product_variant_id = ?
      `;
      const existingSlabs = await executeQueryInBusinessDB(
        query,
        [product_id, product_variant_id],
        connection
      );

      const existingSlabIds = existingSlabs.map(
        (slab: { id: number }) => slab.id
      );
      const newSlabIds = userDiscountSlabsData
        .map((slab) => slab.id)
        .filter(Boolean);

      const slabsToDelete = existingSlabIds.filter(
        (id: number) => !newSlabIds.includes(id)
      );

      if (slabsToDelete.length > 0) {
        query = `DELETE FROM user_discount_slab WHERE id IN (?)`;
        result = await executeQueryInBusinessDB(
          query,
          [slabsToDelete],
          connection
        );

        if (result.affectedRows < 0) {
          proceed = false;
          errMsg = "Error deleting obsolete user_discount_slabs.";
        }
      }

      for (const slab of userDiscountSlabsData) {
        if (slab.id && existingSlabIds.includes(slab.id)) {
          query = `
            UPDATE user_discount_slab SET
              effective_from = ?,
              start_value = ?,
              end_value = ?,
              discount_percentage = ?,
              updated_by = ?
            WHERE id = ?
          `;
          values = [
            slab.effective_from,
            slab.start_value,
            slab.end_value,
            slab.discount_percentage,
            slab.updated_by,
            slab.id,
          ];
        } else {
          query = `
            INSERT INTO user_discount_slab (
              product_id, 
              product_variant_id, 
              effective_from, 
              start_value, 
              end_value, 
              discount_percentage, 
              created_by, 
              updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          values = [
            slab.product_id,
            slab.product_variant_id,
            slab.effective_from,
            slab.start_value,
            slab.end_value,
            slab.discount_percentage,
            slab.created_by,
            slab.updated_by,
          ];
        }

        result = await executeQueryInBusinessDB(query, values, connection);

        if (result.affectedRows < 1) {
          proceed = false;
          errMsg = "Error saving one of the user_discount_slabs.";
          break;
        } else if (!slab.id) {
          slab.id = result.insertId;
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
      message: handleErrorMsg(error),
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
  let values: any[];

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed && validityDiscountSlabsData) {
      query = `
        SELECT id 
        FROM validity_discount_slab 
        WHERE product_id = ? AND product_variant_id = ?
      `;
      const existingSlabs = await executeQueryInBusinessDB(
        query,
        [product_id, product_variant_id],
        connection
      );

      const existingSlabIds = existingSlabs.map(
        (slab: { id: number }) => slab.id
      );
      const newSlabIds = validityDiscountSlabsData
        .map((slab) => slab.id)
        .filter(Boolean);

      const slabsToDelete = existingSlabIds.filter(
        (id: number) => !newSlabIds.includes(id)
      );

      if (slabsToDelete.length > 0) {
        query = `DELETE FROM validity_discount_slab WHERE id IN (?)`;
        result = await executeQueryInBusinessDB(
          query,
          [slabsToDelete],
          connection
        );

        if (result.affectedRows < 0) {
          proceed = false;
          errMsg = "Error deleting obsolete validity_discount_slabs.";
        }
      }

      for (const slab of validityDiscountSlabsData) {
        if (slab.id && existingSlabIds.includes(slab.id)) {
          query = `
            UPDATE validity_discount_slab SET
              effective_from = ?,
              start_value = ?,
              end_value = ?,
              discount_percentage = ?,
              grace = ?,
              updated_by = ?
            WHERE id = ?
          `;
          values = [
            slab.effective_from,
            slab.start_value,
            slab.end_value,
            slab.discount_percentage,
            slab.grace,
            slab.updated_by,
            slab.id,
          ];
        } else {
          query = `
            INSERT INTO validity_discount_slab (
              product_id, 
              product_variant_id, 
              effective_from, 
              start_value, 
              end_value, 
              discount_percentage, 
              grace, 
              created_by, 
              updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          values = [
            slab.product_id,
            slab.product_variant_id,
            slab.effective_from,
            slab.start_value,
            slab.end_value,
            slab.discount_percentage,
            slab.grace,
            slab.created_by,
            slab.updated_by,
          ];
        }

        result = await executeQueryInBusinessDB(query, values, connection);

        if (result.affectedRows < 1) {
          proceed = false;
          errMsg = "Error saving one of the validity_discount_slabs.";
          break;
        } else if (!slab.id) {
          slab.id = result.insertId;
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
      message: handleErrorMsg(error),
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
  let values: any[];

  try {
    connection = await getBusinessDBConn();
    await connection.beginTransaction();

    if (proceed && addonPlansData) {
      query = `
        SELECT id 
        FROM addon_plan 
        WHERE addon_id = ? AND product_id = ? AND product_variant_id = ?
      `;
      const existingAddonPlans = await executeQueryInBusinessDB(
        query,
        [addon_id, product_id, product_variant_id],
        connection
      );

      const existingAddonPlanIds = existingAddonPlans.map(
        (plan: { id: number }) => plan.id
      );
      const newAddonPlanIds = addonPlansData
        .map((plan) => plan.id)
        .filter(Boolean);

      const addonPlansToDelete = existingAddonPlanIds.filter(
        (id: number) => !newAddonPlanIds.includes(id)
      );

      if (addonPlansToDelete.length > 0) {
        query = `DELETE FROM addon_plan WHERE id IN (?)`;
        result = await executeQueryInBusinessDB(
          query,
          [addonPlansToDelete],
          connection
        );

        if (result.affectedRows < 0) {
          proceed = false;
          errMsg = "Error deleting obsolete addon_plans.";
        }
      }

      for (const plan of addonPlansData) {
        if (plan.id && existingAddonPlanIds.includes(plan.id)) {
          query = `
            UPDATE addon_plan SET
              effective_from = ?,
              plan_name = ?,
              value = ?,
              price = ?,
              grace = ?,
              updated_by = ?
            WHERE id = ?
          `;
          values = [
            plan.effective_from,
            plan.plan_name,
            plan.value,
            plan.price,
            plan.grace,
            plan.updated_by,
            plan.id,
          ];
        } else {
          query = `
            INSERT INTO addon_plan (
              addon_id, product_id, product_variant_id, effective_from, 
              plan_name, value, price, grace, created_by, updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          values = [
            plan.addon_id,
            plan.product_id,
            plan.product_variant_id,
            plan.effective_from,
            plan.plan_name,
            plan.value,
            plan.price,
            plan.grace,
            plan.created_by,
            plan.updated_by,
          ];
        }

        result = await executeQueryInBusinessDB(query, values, connection);

        if (result.affectedRows < 1) {
          proceed = false;
          errMsg = "Error saving one of the addon_plans.";
          break;
        } else if (!plan.id) {
          plan.id = result.insertId;
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
      message: handleErrorMsg(error),
      data: null,
    };
  } finally {
    if (connection) connection.end();
  }
}

export async function getUnitPriceAndEarlyDiscount4VariantFromDB(
  product_variant_id: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let unitPrice: number = 0;
  let earlyDiscount: number = 0;
  let query: string = "";

  try {
    if (proceed) {
      query = `
        SELECT vp.price, vp.early_discount_percentage
        FROM variant_pricing vp
        WHERE vp.product_variant_id = ?
        AND vp.effective_from <= CURDATE()  
        ORDER BY vp.effective_from ASC   
        LIMIT 1;
      `;

      result = await executeQueryInBusinessDB(query, [product_variant_id]);

      if (result.length > 0) {
        unitPrice = result[0].price;
        earlyDiscount = result[0].early_discount_percentage;
      } else if (result.length === 0) {
        // proceed = false;
        // errMsg = "No prices configured for this variant.";
      } else {
        proceed = false;
        errMsg = "Error in getUnitPriceAndEarlyDiscount4VariantFromDB.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? { unitPrice, earlyDiscount } : null,
    };
  } catch (error) {
    console.error(
      "Error in getUnitPriceAndEarlyDiscount4VariantFromDB : ",
      error
    );
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function getDiscount4ExtendingUsersFromDB(
  product_variant_id: number,
  no_of_users: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let discount: number = 0;
  let query: string = "";

  try {
    if (proceed) {
      query = `
        SELECT uds.discount_percentage
        FROM user_discount_slab uds
        WHERE uds.product_variant_id = ?
        AND uds.effective_from <= CURDATE()  
        AND start_value >= ?
        AND end_value <= ?
        ORDER BY uds.effective_from ASC   
        LIMIT 1;
      `;

      result = await executeQueryInBusinessDB(query, [
        product_variant_id,
        no_of_users,
        no_of_users,
      ]);

      if (result.length > 0) {
        discount = result[0].price;
      } else if (result.length === 0) {
      } else {
        proceed = false;
        errMsg = "Error in getDiscount4ExtendingUsersFromDB.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? discount : null,
    };
  } catch (error) {
    console.error("Error in getDiscount4ExtendingUsersFromDB : ", error);
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}

export async function getDiscountAndGrace4ExtendingValidityFromDB(
  product_variant_id: number,
  no_of_months: number
) {
  let proceed: boolean = true;
  let errMsg: string = "";
  let result;
  let discount: number = 0;
  let grace: number = 0;
  let query: string = "";

  try {
    if (proceed) {
      query = `
        SELECT vds.discount_percentage, vds.grace
        FROM validity_discount_slab vds
        WHERE vds.product_variant_id = ?
        AND vds.effective_from <= CURDATE()  
        AND start_value >= ?
        AND end_value <= ?
        ORDER BY vds.effective_from ASC   
        LIMIT 1;
      `;

      result = await executeQueryInBusinessDB(query, [
        product_variant_id,
        no_of_months,
        no_of_months,
      ]);

      if (result.length > 0) {
        discount = result[0].price;
        grace = result[0].grace;
      } else if (result.length === 0) {
      } else {
        proceed = false;
        errMsg = "Error in getDiscountAndGrace4ExtendingValidityFromDB.";
      }
    }

    return {
      status: proceed,
      message: proceed ? "Success" : errMsg,
      data: proceed ? { discount, grace } : null,
    };
  } catch (error) {
    console.error(
      "Error in getDiscountAndGrace4ExtendingValidityFromDB : ",
      error
    );
    return {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };
  }
}
