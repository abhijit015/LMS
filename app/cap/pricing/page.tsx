"use client";

import { handleErrorMsg } from "@/app/utils/common";
import {
  Card,
  CardContent,
  Typography,
  Snackbar,
  Alert,
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Box } from "@mui/system";
import { useEffect, useRef, useState } from "react";
import Layout from "../layout";
import * as React from "react";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  GridRowsProp,
  GridRowModesModel,
  GridRowModes,
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowModel,
  GridRowEditStopReasons,
  GridSlotProps,
} from "@mui/x-data-grid";
import {
  addonPlansSchemaT,
  addonSchemaT,
  productSchemaT,
  userDiscountSlabSchemaT,
  validityDiscountSlabSchemaT,
  variantPricingSchemaT,
  productVariantsSchemaT,
} from "@/app/utils/models";
import { loadProductList } from "@/app/controllers/product.controller";
import ConfirmationModal from "../modalForms/AskYesNo";
import {
  addonPlansSchema,
  userDiscountSlabSchema,
  validityDiscountSlabSchema,
  variantPricingSchema,
} from "@/app/utils/zodschema";
import {
  loadActiveAddonPlans,
  loadActiveUserDiscountSlabs,
  loadActiveValidityDiscountSlabs,
  loadActiveVariantPricing,
  loadPrevAddonPlans,
  loadPrevUserDiscountSlabs,
  loadPrevValidityDiscountSlabs,
  loadPrevVariantPricing,
  savePricingData,
} from "@/app/controllers/pricing.controller";
import CategoryIcon from "@mui/icons-material/Category";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import {
  addonName2Code,
  loadAddonList,
} from "@/app/controllers/addon.controller";

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows4Variant: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel4Variant: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;

    setRows4Users: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel4Users: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;

    setRows4Validity: (
      newRows: (oldRows: GridRowsProp) => GridRowsProp
    ) => void;
    setRowModesModel4Validity: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;

    setRows4Addon: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel4Addon: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }
}

const VIEW_MODE_CONFIG: number = 1;
const VIEW_MODE_HISTORY: number = 2;

const Pricing = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [variantPricingHistory, setVariantPricingHistory] = useState<
    variantPricingSchemaT[]
  >([]);
  const [userDiscountSlabHistory, setUserDiscountSlabHistory] = useState<
    userDiscountSlabSchemaT[]
  >([]);
  const [validityDiscountSlabHistory, setValidityDiscountSlabHistory] =
    useState<validityDiscountSlabSchemaT[]>([]);
  const [addonPlansHistory, setAddonPlansHistory] = useState<
    addonPlansSchemaT[]
  >([]);
  const [confirmation, setConfirmation] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onClose: () => {},
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const [addons, setAddons] = useState<addonSchemaT[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number>(0);
  const [rows4Variant, setRows4Variant] = React.useState<GridRowsProp>([]);
  const [rows4Users, setRows4Users] = React.useState<GridRowsProp>([]);
  const [rows4Validity, setRows4Validity] = React.useState<GridRowsProp>([]);
  const [rows4Addon, setRows4Addon] = React.useState<GridRowsProp>([]);
  const [rowModesModel4Variant, setRowModesModel4Variant] =
    React.useState<GridRowModesModel>({});
  const [rowModesModel4Users, setRowModesModel4Users] =
    React.useState<GridRowModesModel>({});
  const [rowModesModel4Validity, setRowModesModel4Validity] =
    React.useState<GridRowModesModel>({});
  const [rowModesModel4Addon, setRowModesModel4Addon] =
    React.useState<GridRowModesModel>({});
  const [selectedVariantValue, setSelectedVariantValue] =
    useState<productVariantsSchemaT | null>(null);

  const [selectedAddonValue, setSelectedAddonValue] =
    useState<addonSchemaT | null>(null);

  const [products, setProducts] = useState<productSchemaT[]>([]);

  const [selectedProductId, setSelectedProductId] = useState<number>(0);

  const [selectedProductValue, setSelectedProductValue] =
    useState<productSchemaT | null>(null);

  const [viewMode, setViewMode] = React.useState(VIEW_MODE_CONFIG);

  const fetchCalledRef = useRef(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let proceed = true;
      let errMsg = "";
      let result;

      if (proceed) {
        result = await loadAddonList();
        if (result.status) {
          setAddons(result.data as addonSchemaT[]);
        } else {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        result = await loadProductList();
        if (result.status) {
          setProducts(result.data as unknown as productSchemaT[]);
        } else {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (!proceed) {
        setSnackbar({
          open: true,
          message: errMsg,
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: handleErrorMsg(error),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchCalledRef.current) {
      fetchData();
      fetchCalledRef.current = true;
    }
  }, []);

  const handleProductChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: any
  ) => {
    setSelectedProductId(value?.id || 0);
    setSelectedProductValue(value);
    setSelectedVariantId(0);
    setSelectedVariantValue(null);
  };

  const handleVariantChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: any
  ) => {
    setSelectedVariantId(value?.id || 0);
    setSelectedVariantValue(value);
  };

  const handleSearch = async () => {
    let proceed = true;
    let errMsg = "";
    let result;

    try {
      setLoading(true);

      if (proceed) {
        result = await loadActiveAddonPlans(
          selectedProductId,
          selectedVariantId
        );
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setRows4Addon(result.data);
        }
      }

      if (proceed) {
        result = await loadPrevAddonPlans(selectedProductId, selectedVariantId);
        console.log("result : ", result);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setAddonPlansHistory(result.data);
        }
      }

      if (proceed) {
        result = await loadActiveUserDiscountSlabs(
          selectedProductId,
          selectedVariantId
        );
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setRows4Users(result.data);
        }
      }

      if (proceed) {
        result = await loadPrevUserDiscountSlabs(
          selectedProductId,
          selectedVariantId
        );
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setUserDiscountSlabHistory(result.data);
        }
      }

      if (proceed) {
        result = await loadActiveValidityDiscountSlabs(
          selectedProductId,
          selectedVariantId
        );
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setRows4Validity(result.data);
        }
      }

      if (proceed) {
        result = await loadPrevValidityDiscountSlabs(
          selectedProductId,
          selectedVariantId
        );
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setValidityDiscountSlabHistory(result.data);
        }
      }

      if (proceed) {
        result = await loadActiveVariantPricing(
          selectedProductId,
          selectedVariantId
        );
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setRows4Variant(result.data);
        }
      }

      if (proceed) {
        result = await loadPrevVariantPricing(
          selectedProductId,
          selectedVariantId
        );
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setVariantPricingHistory(result.data);
        }
      }

      if (proceed) {
        setSearchMode(true);
      } else {
        setSnackbar({
          open: true,
          message: errMsg,
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: handleErrorMsg(error),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateGridData4Variant = (): {
    status: boolean;
    message: string;
    parsedData?: any[];
  } => {
    let validationErrors = "";
    const parsedData: any[] = [];

    console.log("rows : ", rows4Variant);

    rows4Variant.forEach((row, rowIndex) => {
      row.rowIndex = rowIndex + 1;
      row.product_id = selectedProductId;
      row.product_variant_id = selectedVariantId;

      const parsed = variantPricingSchema.safeParse(row);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        validationErrors += `Row ${rowIndex + 1}: ${issues} | `;
      } else {
        parsedData.push({ ...parsed.data, rowIndex: rowIndex + 1 });
      }
    });

    if (validationErrors) {
      return {
        status: false,
        message: validationErrors.trimEnd().replace(/\|$/, ""),
      };
    }

    return { status: true, message: "", parsedData };
  };

  const validateGridData4Validity = (): {
    status: boolean;
    message: string;
    parsedData?: any[];
  } => {
    let validationErrors = "";
    const parsedData: any[] = [];

    console.log("rows : ", rows4Validity);

    rows4Validity.forEach((row, rowIndex) => {
      row.rowIndex = rowIndex + 1;
      row.product_id = selectedProductId;
      row.product_variant_id = selectedVariantId;

      const parsed = validityDiscountSlabSchema.safeParse(row);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        validationErrors += `Row ${rowIndex + 1}: ${issues} | `;
      } else {
        parsedData.push({ ...parsed.data, rowIndex: rowIndex + 1 });
      }
    });

    const groupedByDate: Record<string, typeof parsedData> = parsedData.reduce(
      (acc, row) => {
        const dateKey = row.effective_from.toISOString();
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(row);
        return acc;
      },
      {} as Record<string, typeof parsedData>
    );

    Object.entries(groupedByDate).forEach(([effectiveDate, rowsForDate]) => {
      // Sort rows by start_value
      const sortedRows = rowsForDate.sort(
        (a, b) => a.start_value - b.start_value
      );

      for (let i = 0; i < sortedRows.length - 1; i++) {
        const currentRow = sortedRows[i];
        const nextRow = sortedRows[i + 1];

        // Check for overlaps - any shared number between ranges is an overlap
        if (currentRow.end_value >= nextRow.start_value) {
          validationErrors += `Overlap detected: Row ${currentRow.rowIndex} ends at ${currentRow.end_value} while Row ${nextRow.rowIndex} starts at ${nextRow.start_value} | `;
        }

        // Check for gaps - difference must be more than 1 to be a gap
        else if (nextRow.start_value - currentRow.end_value > 1) {
          const missingRange = `${currentRow.end_value + 1} to ${
            nextRow.start_value - 1
          }`;
          validationErrors += `Gap detected: Missing values ${missingRange} between Row ${currentRow.rowIndex} and Row ${nextRow.rowIndex} | `;
        }
      }
    });

    if (validationErrors) {
      return {
        status: false,
        message: validationErrors.trimEnd().replace(/\|$/, ""),
      };
    }

    return { status: true, message: "", parsedData };
  };

  const validateGridData4Users = (): {
    status: boolean;
    message: string;
    parsedData?: any[];
  } => {
    let validationErrors = "";
    const parsedData: any[] = [];

    console.log("rows : ", rows4Users);

    rows4Users.forEach((row, rowIndex) => {
      row.rowIndex = rowIndex + 1;
      row.product_id = selectedProductId;
      row.product_variant_id = selectedVariantId;

      const parsed = userDiscountSlabSchema.safeParse(row);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        validationErrors += `Row ${rowIndex + 1}: ${issues} | `;
      } else {
        parsedData.push({ ...parsed.data, rowIndex: rowIndex + 1 });
      }
    });

    const groupedByDate: Record<string, typeof parsedData> = parsedData.reduce(
      (acc, row) => {
        const dateKey = row.effective_from.toISOString();
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(row);
        return acc;
      },
      {} as Record<string, typeof parsedData>
    );

    Object.entries(groupedByDate).forEach(([effectiveDate, rowsForDate]) => {
      // Sort rows by start_value
      const sortedRows = rowsForDate.sort(
        (a, b) => a.start_value - b.start_value
      );

      for (let i = 0; i < sortedRows.length - 1; i++) {
        const currentRow = sortedRows[i];
        const nextRow = sortedRows[i + 1];

        // Check for overlaps - any shared number between ranges is an overlap
        if (currentRow.end_value >= nextRow.start_value) {
          validationErrors += `Overlap detected: Row ${currentRow.rowIndex} ends at ${currentRow.end_value} while Row ${nextRow.rowIndex} starts at ${nextRow.start_value} | `;
        }

        // Check for gaps - difference must be more than 1 to be a gap
        else if (nextRow.start_value - currentRow.end_value > 1) {
          const missingRange = `${currentRow.end_value + 1} to ${
            nextRow.start_value - 1
          }`;
          validationErrors += `Gap detected: Missing values ${missingRange} between Row ${currentRow.rowIndex} and Row ${nextRow.rowIndex} | `;
        }
      }
    });

    if (validationErrors) {
      return {
        status: false,
        message: validationErrors.trimEnd().replace(/\|$/, ""),
      };
    }

    return { status: true, message: "", parsedData };
  };

  const validateGridData4Addon = async (): Promise<{
    status: boolean;
    message: string;
    parsedData?: any[];
  }> => {
    let validationErrors = "";
    const parsedData: any[] = [];

    console.log("rows4Addon : ", rows4Addon);

    try {
      setLoading(true);

      for (const [rowIndex, row] of rows4Addon.entries()) {
        const result = await addonName2Code(row.addon_name);

        if (!result.status) {
          return {
            status: false,
            message: `Row ${rowIndex + 1}: ${result.message}`,
          };
        }

        console.log("row.addon_id : ", result.data);

        // Update row data with resolved addon_id
        row.addon_id = result.data;
        row.rowIndex = rowIndex + 1;
        row.product_id = selectedProductId;
        row.product_variant_id = selectedVariantId;

        const parsed = addonPlansSchema.safeParse(row);

        if (!parsed.success) {
          const issues = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ");
          validationErrors += `Row ${rowIndex + 1}: ${issues} | `;
        } else {
          parsedData.push({ ...parsed.data, rowIndex: rowIndex + 1 });
        }
      }

      if (validationErrors) {
        return {
          status: false,
          message: validationErrors.trimEnd().replace(/\|$/, ""),
        };
      }

      return { status: true, message: "", parsedData };
    } catch (error) {
      return { status: false, message: handleErrorMsg(error) };
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    let proceed = true;
    let errMsg = "";
    let result;
    let addonPlansData: addonPlansSchemaT[] | null = null;
    let variantPricingData: variantPricingSchemaT[] | null = null;
    let userDiscountSlabData: userDiscountSlabSchemaT[] | null = null;
    let validityDiscountSlabData: validityDiscountSlabSchemaT[] | null = null;

    try {
      if (proceed) {
        result = validateGridData4Variant();
        if (!result.status) {
          proceed = false;
          errMsg = "Variant Grid Errors : " + result.message;
        } else {
          variantPricingData = result.parsedData as variantPricingSchemaT[];
        }
      }

      if (proceed) {
        result = validateGridData4Users();
        if (!result.status) {
          proceed = false;
          errMsg = "User Discount Slab Grid Errors : " + result.message;
        } else {
          userDiscountSlabData = result.parsedData as userDiscountSlabSchemaT[];
        }
      }

      if (proceed) {
        result = validateGridData4Validity();
        if (!result.status) {
          proceed = false;
          errMsg = "Validity Discount Slab Grid Errors : " + result.message;
        } else {
          validityDiscountSlabData =
            result.parsedData as validityDiscountSlabSchemaT[];
        }
      }

      if (proceed) {
        result = await validateGridData4Addon();
        if (!result.status) {
          proceed = false;
          errMsg = "Addon Grid Errors : " + result.message;
        } else {
          addonPlansData = result.parsedData as addonPlansSchemaT[];
        }
      }

      if (proceed) {
        proceed = await new Promise<boolean>((resolve) => {
          setConfirmation({
            open: true,
            title: "Confirmation",
            message: "Are you sure you want to save this data ?",
            onConfirm: () => {
              setLoading(true);
              setConfirmation({
                open: false,
                title: "",
                message: "",
                onConfirm: () => {},
                onClose: () => {},
              });
              resolve(true);
            },
            onClose: () => {
              setConfirmation({
                open: false,
                title: "",
                message: "",
                onConfirm: () => {},
                onClose: () => {},
              });
              resolve(false);
            },
          });
        });
      }

      if (
        proceed &&
        addonPlansData &&
        variantPricingData &&
        userDiscountSlabData &&
        validityDiscountSlabData
      ) {
        setLoading(true);
        result = await savePricingData(
          selectedProductId,
          selectedVariantId,
          addonPlansData,
          variantPricingData,
          userDiscountSlabData,
          validityDiscountSlabData
        );

        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        setSnackbar({
          open: true,
          message: "Data saved successfully",
          severity: "success",
        });
        handleConfirmCancel();
      } else {
        if (errMsg) {
          setSnackbar({
            open: true,
            message: errMsg,
            severity: "error",
          });
        }
        setLoading(false);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: handleErrorMsg(error),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = async () => {
    let proceed: boolean = true;

    if (proceed) {
      proceed = await new Promise<boolean>((resolve) => {
        setConfirmation({
          open: true,
          title: "Confirmation",
          message:
            "All unsaved changes will be cleared. Do you want to proceed ?",
          onConfirm: () => {
            setConfirmation({
              open: false,
              title: "",
              message: "",
              onConfirm: () => {},
              onClose: () => {},
            });
            resolve(true);
          },
          onClose: () => {
            proceed = false;
            setConfirmation({
              open: false,
              title: "",
              message: "",
              onConfirm: () => {},
              onClose: () => {},
            });
            resolve(false);
          },
        });
      });
    }

    if (proceed) {
      handleConfirmCancel();
    }
  };

  const handleConfirmCancel = () => {
    setSearchMode(false);
    setRows4Variant([]);
    setRowModesModel4Variant({});
    setRows4Validity([]);
    setRowModesModel4Validity({});
    setRows4Users([]);
    setRowModesModel4Users({});
    setRows4Addon([]);
    setRowModesModel4Addon({});
  };

  const getColumns4VariantConfiguration = (): GridColDef[] => {
    const columns: GridColDef[] = [];

    columns.push(
      {
        field: "effective_from",
        headerName: "Effective From",
        width: 140,
        editable: viewMode === VIEW_MODE_CONFIG,
        type: "date",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "price",
        headerName: "Price",
        type: "number",
        width: 100,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "early_discount_percentage",
        headerName: "Early Discount %",
        type: "number",
        width: 150,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      }
    );

    if (viewMode === VIEW_MODE_CONFIG) {
      columns.push({
        field: "actions",
        type: "actions",
        headerName: " ",
        width: 75,
        cellClassName: "actions",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        getActions: ({ id }) => {
          const isInEditMode =
            rowModesModel4Variant[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<SaveIcon />}
                label="Save"
                sx={{ color: "primary.main" }}
                onClick={handleSaveRowClick4Variant(id)}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                onClick={handleCancelRowClick4Variant(id)}
                color="inherit"
              />,
            ];
          }

          return [
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={handleEditClick4Variant(id)}
              color="inherit"
              className="textPrimary"
            />,
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              sx={{ color: "error.main" }}
              onClick={handleDeleteClick4Variant(id)}
              color="inherit"
            />,
          ];
        },
      });
    }

    return columns;
  };

  const getColumns4UsersConfiguration = (): GridColDef[] => {
    const columns: GridColDef[] = [];

    columns.push(
      {
        field: "effective_from",
        headerName: "Effective From",
        width: 140,
        editable: viewMode === VIEW_MODE_CONFIG,
        type: "date",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "start_value",
        headerName: "From (Users)",
        type: "number",
        width: 150,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "end_value",
        headerName: "To (Users)",
        type: "number",
        width: 150,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "discount_percentage",
        headerName: "Discount %",
        type: "number",
        width: 150,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      }
    );

    if (viewMode === VIEW_MODE_CONFIG) {
      columns.push({
        field: "actions",
        type: "actions",
        headerName: " ",
        width: 75,
        cellClassName: "actions",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        getActions: ({ id }) => {
          const isInEditMode =
            rowModesModel4Users[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<SaveIcon />}
                label="Save"
                sx={{ color: "primary.main" }}
                onClick={handleSaveRowClick4Users(id)}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                onClick={handleCancelRowClick4Users(id)}
                color="inherit"
              />,
            ];
          }

          return [
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={handleEditClick4Users(id)}
              color="inherit"
              className="textPrimary"
            />,
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              sx={{ color: "error.main" }}
              onClick={handleDeleteClick4Users(id)}
              color="inherit"
            />,
          ];
        },
      });
    }

    return columns;
  };

  const getColumns4ValidityConfiguration = (): GridColDef[] => {
    const columns: GridColDef[] = [];

    columns.push(
      {
        field: "effective_from",
        headerName: "Effective From",
        width: 140,
        editable: viewMode === VIEW_MODE_CONFIG,
        type: "date",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "start_value",
        headerName: "From (Months)",
        type: "number",
        width: 180,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "end_value",
        headerName: "To (Months)",
        type: "number",
        width: 180,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "discount_percentage",
        headerName: "Discount %",
        type: "number",
        width: 140,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "grace",
        headerName: "Grace (Days)",
        type: "number",
        width: 140,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      }
    );

    if (viewMode === VIEW_MODE_CONFIG) {
      columns.push({
        field: "actions",
        type: "actions",
        headerName: " ",
        width: 75,
        cellClassName: "actions",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        getActions: ({ id }) => {
          const isInEditMode =
            rowModesModel4Validity[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<SaveIcon />}
                label="Save"
                sx={{ color: "primary.main" }}
                onClick={handleSaveRowClick4Validity(id)}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                onClick={handleCancelRowClick4Validity(id)}
                color="inherit"
              />,
            ];
          }

          return [
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={handleEditClick4Validity(id)}
              color="inherit"
              className="textPrimary"
            />,
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              sx={{ color: "error.main" }}
              onClick={handleDeleteClick4Validity(id)}
              color="inherit"
            />,
          ];
        },
      });
    }

    return columns;
  };

  const getColumns4AddonConfiguration = (): GridColDef[] => {
    const columns: GridColDef[] = [];

    columns.push(
      {
        field: "addon_name",
        headerName: "Add-on",
        width: 150,
        editable: viewMode === VIEW_MODE_CONFIG,
        type: "singleSelect",
        valueOptions: addons.map((addon) => addon.name),
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "effective_from",
        headerName: "Effective From",
        width: 130,
        editable: viewMode === VIEW_MODE_CONFIG,
        type: "date",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "plan_name",
        headerName: "Plan Name",
        width: 170,
        editable: viewMode === VIEW_MODE_CONFIG,
        type: "string",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "value",
        headerName: "Value",
        type: "number",
        width: 75,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "price",
        headerName: "Price",
        type: "number",
        width: 75,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "grace",
        headerName: "Grace",
        type: "number",
        width: 75,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "valid_months",
        headerName: "Months Validity",
        type: "number",
        width: 140,
        editable: viewMode === VIEW_MODE_CONFIG,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      }
    );

    if (viewMode === VIEW_MODE_CONFIG) {
      columns.push({
        field: "actions",
        type: "actions",
        headerName: " ",
        width: 75,
        cellClassName: "actions",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        getActions: ({ id }) => {
          const isInEditMode =
            rowModesModel4Addon[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<SaveIcon />}
                label="Save"
                sx={{ color: "primary.main" }}
                onClick={handleSaveRowClick4Addon(id)}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                onClick={handleCancelRowClick4Addon(id)}
                color="inherit"
              />,
            ];
          }

          return [
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={handleEditClick4Addon(id)}
              color="inherit"
              className="textPrimary"
            />,
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              sx={{ color: "error.main" }}
              onClick={handleDeleteClick4Addon(id)}
              color="inherit"
            />,
          ];
        },
      });
    }

    return columns;
  };

  function EditToolbar4Variant(props: GridSlotProps["toolbar"]) {
    const { setRows4Variant, setRowModesModel4Variant } = props;

    const handleAddRecord = () => {
      const id = Math.floor(Math.random() * 10000);

      let newEffectiveDate = new Date();

      if (rows4Variant.length > 0) {
        newEffectiveDate = new Date(rows4Variant[0].effective_from);
      }

      setRows4Variant((oldRows) => [
        ...oldRows,
        {
          id,
          effective_from: newEffectiveDate,
          isNew: true,
          price: 0,
          early_discount_percentage: 0,
        },
      ]);

      setRowModesModel4Variant((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: "effective_from" },
      }));
    };

    return (
      <GridToolbarContainer>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          minHeight="36px"
        >
          <Typography color="primary">Unit Price (1 User, 1 Month)</Typography>

          {viewMode === VIEW_MODE_CONFIG && (
            <Button
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddRecord}
            >
              Insert Row
            </Button>
          )}
        </Box>
      </GridToolbarContainer>
    );
  }

  function EditToolbar4Users(props: GridSlotProps["toolbar"]) {
    const { setRows4Users, setRowModesModel4Users } = props;

    const handleAddRecord = () => {
      const id = Math.floor(Math.random() * 10000);

      let newEffectiveDate = new Date();

      if (rows4Users.length > 0) {
        newEffectiveDate = new Date(rows4Users[0].effective_from);
      }

      setRows4Users((oldRows) => [
        ...oldRows,
        {
          id,
          effective_from: newEffectiveDate,
          isNew: true,
          start_value: 0,
          end_value: 0,
          discount_percentage: 0,
        },
      ]);

      setRowModesModel4Users((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: "effective_from" },
      }));
    };

    return (
      <GridToolbarContainer>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          minHeight="36px"
        >
          <Typography color="primary">User-wise Discount Slabs</Typography>

          {viewMode === VIEW_MODE_CONFIG && (
            <Button
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddRecord}
            >
              Insert Row
            </Button>
          )}
        </Box>
      </GridToolbarContainer>
    );
  }

  function EditToolbar4Validity(props: GridSlotProps["toolbar"]) {
    const { setRows4Validity, setRowModesModel4Validity } = props;

    const handleAddRecord = () => {
      const id = Math.floor(Math.random() * 10000);

      let newEffectiveDate = new Date();

      if (rows4Validity.length > 0) {
        newEffectiveDate = new Date(rows4Validity[0].effective_from);
      }

      setRows4Validity((oldRows) => [
        ...oldRows,
        {
          id,
          effective_from: newEffectiveDate,
          isNew: true,
          start_value: 0,
          end_value: 0,
          grace: 0,
          discount_percentage: 0,
        },
      ]);

      setRowModesModel4Validity((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: "effective_from" },
      }));
    };

    return (
      <GridToolbarContainer>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          minHeight="36px"
        >
          <Typography color="primary">
            Validity Extension Discount Slabs
          </Typography>

          {viewMode === VIEW_MODE_CONFIG && (
            <Button
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddRecord}
            >
              Insert Row
            </Button>
          )}
        </Box>
      </GridToolbarContainer>
    );
  }

  function EditToolbar4Addon(props: GridSlotProps["toolbar"]) {
    const { setRows4Addon, setRowModesModel4Addon } = props;

    const handleAddRecord = () => {
      const id = Math.floor(Math.random() * 10000);

      let newEffectiveDate = new Date();
      let newAddonName = addons.length > 0 ? addons[0].name : "";

      if (rows4Addon.length > 0) {
        newEffectiveDate = new Date(
          rows4Addon[rows4Addon.length - 1].effective_from
        );
        if (rows4Addon[rows4Addon.length - 1].addon_name)
          newAddonName = rows4Addon[rows4Addon.length - 1].addon_name;
      }

      setRows4Addon((oldRows) => [
        ...oldRows,
        {
          id,
          effective_from: newEffectiveDate,
          addon_name: newAddonName,
          isNew: true,
          grace: 0,
          price: 0,
          value: 0,
          valid_months: 1,
        },
      ]);

      setRowModesModel4Addon((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: "addon_name" },
      }));
    };

    return (
      <GridToolbarContainer>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          minHeight="36px"
        >
          <Typography color="primary">Add-on Plans</Typography>

          {viewMode === VIEW_MODE_CONFIG && (
            <Button
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddRecord}
            >
              Insert Row
            </Button>
          )}
        </Box>
      </GridToolbarContainer>
    );
  }

  const handleRowEditStop4Variant: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick4Variant = (id: GridRowId) => () => {
    setRowModesModel4Variant({
      ...rowModesModel4Variant,
      [id]: { mode: GridRowModes.Edit },
    });
  };

  const handleSaveRowClick4Variant = (id: GridRowId) => () => {
    setRowModesModel4Variant({
      ...rowModesModel4Variant,
      [id]: { mode: GridRowModes.View },
    });
  };

  const handleDeleteClick4Variant = (id: GridRowId) => () => {
    setRows4Variant(rows4Variant.filter((row) => row.id !== id));
  };

  const handleCancelRowClick4Variant = (id: GridRowId) => () => {
    setRowModesModel4Variant({
      ...rowModesModel4Variant,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows4Variant.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows4Variant(rows4Variant.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate4Variant = (newRow: GridRowModel) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows4Variant(
      rows4Variant.map((row) => (row.id === newRow.id ? updatedRow : row))
    );

    return updatedRow;
  };

  const handleRowModesModelChange4Variant = (
    newRowModesModel: GridRowModesModel
  ) => {
    setRowModesModel4Variant(newRowModesModel);
  };

  const handleRowEditStop4Users: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick4Users = (id: GridRowId) => () => {
    setRowModesModel4Users({
      ...rowModesModel4Users,
      [id]: { mode: GridRowModes.Edit },
    });
  };

  const handleSaveRowClick4Users = (id: GridRowId) => () => {
    setRowModesModel4Users({
      ...rowModesModel4Users,
      [id]: { mode: GridRowModes.View },
    });
  };

  const handleDeleteClick4Users = (id: GridRowId) => () => {
    setRows4Users(rows4Users.filter((row) => row.id !== id));
  };

  const handleCancelRowClick4Users = (id: GridRowId) => () => {
    setRowModesModel4Users({
      ...rowModesModel4Users,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows4Users.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows4Users(rows4Users.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate4Users = (newRow: GridRowModel) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows4Users(
      rows4Users.map((row) => (row.id === newRow.id ? updatedRow : row))
    );

    return updatedRow;
  };

  const handleRowModesModelChange4Users = (
    newRowModesModel: GridRowModesModel
  ) => {
    setRowModesModel4Users(newRowModesModel);
  };

  const handleRowEditStop4Validity: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick4Validity = (id: GridRowId) => () => {
    setRowModesModel4Validity({
      ...rowModesModel4Validity,
      [id]: { mode: GridRowModes.Edit },
    });
  };

  const handleSaveRowClick4Validity = (id: GridRowId) => () => {
    setRowModesModel4Validity({
      ...rowModesModel4Validity,
      [id]: { mode: GridRowModes.View },
    });
  };

  const handleDeleteClick4Validity = (id: GridRowId) => () => {
    setRows4Validity(rows4Validity.filter((row) => row.id !== id));
  };

  const handleCancelRowClick4Validity = (id: GridRowId) => () => {
    setRowModesModel4Validity({
      ...rowModesModel4Validity,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows4Validity.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows4Validity(rows4Validity.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate4Validity = (newRow: GridRowModel) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows4Validity(
      rows4Validity.map((row) => (row.id === newRow.id ? updatedRow : row))
    );

    return updatedRow;
  };

  const handleRowModesModelChange4Validity = (
    newRowModesModel: GridRowModesModel
  ) => {
    setRowModesModel4Validity(newRowModesModel);
  };

  const handleRowEditStop4Addon: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick4Addon = (id: GridRowId) => () => {
    setRowModesModel4Addon({
      ...rowModesModel4Addon,
      [id]: { mode: GridRowModes.Edit },
    });
  };

  const handleSaveRowClick4Addon = (id: GridRowId) => () => {
    setRowModesModel4Addon({
      ...rowModesModel4Addon,
      [id]: { mode: GridRowModes.View },
    });
  };

  const handleDeleteClick4Addon = (id: GridRowId) => () => {
    setRows4Addon(rows4Addon.filter((row) => row.id !== id));
  };

  const handleCancelRowClick4Addon = (id: GridRowId) => () => {
    setRowModesModel4Addon({
      ...rowModesModel4Addon,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows4Addon.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows4Addon(rows4Addon.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate4Addon = (newRow: GridRowModel) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows4Addon(
      rows4Addon.map((row) => (row.id === newRow.id ? updatedRow : row))
    );

    return updatedRow;
  };

  const handleRowModesModelChange4Addon = (
    newRowModesModel: GridRowModesModel
  ) => {
    setRowModesModel4Addon(newRowModesModel);
  };

  const handleToggleChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: number
  ) => {
    setViewMode(newViewMode);
  };

  return (
    <Layout loading={loading}>
      <Card
        sx={{
          borderRadius: 3,
          border: "1px solid #ddd",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
          width: "100%",
          mb: 2,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CategoryIcon />
              Plans & Pricing
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 2,
                flex: 1,
              }}
            >
              <Autocomplete
                disabled={loading || searchMode}
                size="small"
                options={products}
                value={selectedProductValue}
                getOptionLabel={(option) => option.name}
                sx={{ width: 300 }}
                onChange={handleProductChange}
                renderInput={(params) => (
                  <TextField {...params} label="Product" />
                )}
              />

              <Autocomplete
                disabled={loading || searchMode || !selectedProductId}
                size="small"
                options={selectedProductValue?.variants ?? []}
                value={selectedVariantValue}
                getOptionLabel={(option) => option.name}
                sx={{ width: 300 }}
                onChange={handleVariantChange}
                renderInput={(params) => (
                  <TextField {...params} label="Variant" />
                )}
              />

              {!searchMode && (
                <Button
                  variant="contained"
                  startIcon={<VisibilityIcon />}
                  disabled={
                    loading ||
                    !selectedProductId ||
                    !selectedVariantId ||
                    searchMode
                  }
                  onClick={handleSearch}
                  sx={{
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.main",
                    },
                  }}
                >
                  Details
                </Button>
              )}

              {searchMode && (
                <Button
                  variant="contained"
                  disabled={loading || !searchMode}
                  onClick={handleCancelClick}
                  startIcon={<ChangeCircleIcon />}
                  sx={{
                    backgroundColor: "error.light",
                    "&:hover": {
                      backgroundColor: "error.main",
                    },
                  }}
                >
                  Change
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {searchMode && (
        <Card
          sx={{
            width: "100%",
            borderRadius: 3,
            border: "1px solid #ddd",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              {/* <Typography variant="body1" color="secondary">
                Some Information Here
              </Typography> */}

              <ToggleButtonGroup
                color="primary"
                value={viewMode}
                exclusive
                aria-label="Platform"
                onChange={handleToggleChange}
              >
                <ToggleButton
                  value={VIEW_MODE_CONFIG}
                  sx={{
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <EditIcon />
                  Configure
                </ToggleButton>
                <ToggleButton
                  value={VIEW_MODE_HISTORY}
                  sx={{
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <HistoryIcon />
                  History
                </ToggleButton>
              </ToggleButtonGroup>

              {viewMode === VIEW_MODE_CONFIG && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2,
                  }}
                >
                  <Button
                    onClick={handleSave}
                    startIcon={<SaveIcon />}
                    variant="contained"
                    disabled={loading || !searchMode}
                    sx={{
                      backgroundColor: "primary.light",
                      "&:hover": {
                        backgroundColor: "primary.main",
                      },
                    }}
                  >
                    Update
                  </Button>
                </Box>
              )}
            </Box>
            <Grid container spacing={2}>
              {viewMode === VIEW_MODE_CONFIG && (
                <Grid size={6}>
                  <DataGrid
                    rows={rows4Variant}
                    columns={getColumns4VariantConfiguration()}
                    editMode="row"
                    rowModesModel={rowModesModel4Variant}
                    onRowModesModelChange={handleRowModesModelChange4Variant}
                    onRowEditStop={handleRowEditStop4Variant}
                    processRowUpdate={processRowUpdate4Variant}
                    slots={{ toolbar: EditToolbar4Variant }}
                    slotProps={{
                      toolbar: { setRows4Variant, setRowModesModel4Variant },
                    }}
                    rowHeight={39}
                    columnHeaderHeight={39}
                    hideFooter
                    sx={{
                      "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                      "& .MuiDataGrid-cell": {
                        border: "none",
                        fontSize: "16px",
                      },
                      height: "285px",
                    }}
                  />
                </Grid>
              )}
              {viewMode === VIEW_MODE_CONFIG && (
                <Grid size={6}>
                  <DataGrid
                    rows={rows4Users}
                    columns={getColumns4UsersConfiguration()}
                    editMode="row"
                    rowModesModel={rowModesModel4Users}
                    onRowModesModelChange={handleRowModesModelChange4Users}
                    onRowEditStop={handleRowEditStop4Users}
                    processRowUpdate={processRowUpdate4Users}
                    slots={{ toolbar: EditToolbar4Users }}
                    slotProps={{
                      toolbar: { setRows4Users, setRowModesModel4Users },
                    }}
                    rowHeight={39}
                    columnHeaderHeight={39}
                    hideFooter
                    sx={{
                      "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                      "& .MuiDataGrid-cell": {
                        border: "none",
                        fontSize: "16px",
                      },
                      height: "285px",
                    }}
                  />
                </Grid>
              )}
              {viewMode === VIEW_MODE_CONFIG && (
                <Grid size={6}>
                  <DataGrid
                    rows={rows4Validity}
                    columns={getColumns4ValidityConfiguration()}
                    editMode="row"
                    rowModesModel={rowModesModel4Validity}
                    onRowModesModelChange={handleRowModesModelChange4Validity}
                    onRowEditStop={handleRowEditStop4Validity}
                    processRowUpdate={processRowUpdate4Validity}
                    slots={{ toolbar: EditToolbar4Validity }}
                    slotProps={{
                      toolbar: { setRows4Validity, setRowModesModel4Validity },
                    }}
                    rowHeight={39}
                    columnHeaderHeight={39}
                    hideFooter
                    sx={{
                      "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                      "& .MuiDataGrid-cell": {
                        border: "none",
                        fontSize: "16px",
                      },
                      height: "285px",
                    }}
                  />
                </Grid>
              )}
              {viewMode === VIEW_MODE_CONFIG && (
                <Grid size={6}>
                  <DataGrid
                    rows={rows4Addon}
                    columns={getColumns4AddonConfiguration()}
                    editMode="row"
                    rowModesModel={rowModesModel4Addon}
                    onRowModesModelChange={handleRowModesModelChange4Addon}
                    onRowEditStop={handleRowEditStop4Addon}
                    processRowUpdate={processRowUpdate4Addon}
                    slots={{ toolbar: EditToolbar4Addon }}
                    slotProps={{
                      toolbar: { setRows4Addon, setRowModesModel4Addon },
                    }}
                    rowHeight={39}
                    columnHeaderHeight={39}
                    hideFooter
                    sx={{
                      "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                      "& .MuiDataGrid-cell": {
                        border: "none",
                        fontSize: "16px",
                      },
                      height: "285px",
                    }}
                  />
                </Grid>
              )}
              {viewMode === VIEW_MODE_HISTORY && (
                <Grid size={6}>
                  <DataGrid
                    rows={variantPricingHistory}
                    columns={getColumns4VariantConfiguration()}
                    editMode="row"
                    rowModesModel={rowModesModel4Variant}
                    onRowModesModelChange={handleRowModesModelChange4Variant}
                    onRowEditStop={handleRowEditStop4Variant}
                    processRowUpdate={processRowUpdate4Variant}
                    slots={{ toolbar: EditToolbar4Variant }}
                    slotProps={{
                      toolbar: { setRows4Variant, setRowModesModel4Variant },
                    }}
                    rowHeight={39}
                    columnHeaderHeight={39}
                    hideFooter
                    sx={{
                      "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                      "& .MuiDataGrid-cell": {
                        border: "none",
                        fontSize: "16px",
                      },
                      height: "285px",
                    }}
                  />
                </Grid>
              )}
              {viewMode === VIEW_MODE_HISTORY && (
                <Grid size={6}>
                  <DataGrid
                    rows={userDiscountSlabHistory}
                    columns={getColumns4UsersConfiguration()}
                    editMode="row"
                    rowModesModel={rowModesModel4Users}
                    onRowModesModelChange={handleRowModesModelChange4Users}
                    onRowEditStop={handleRowEditStop4Users}
                    processRowUpdate={processRowUpdate4Users}
                    slots={{ toolbar: EditToolbar4Users }}
                    slotProps={{
                      toolbar: { setRows4Users, setRowModesModel4Users },
                    }}
                    rowHeight={39}
                    columnHeaderHeight={39}
                    hideFooter
                    sx={{
                      "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                      "& .MuiDataGrid-cell": {
                        border: "none",
                        fontSize: "16px",
                      },
                      height: "285px",
                    }}
                  />
                </Grid>
              )}
              {viewMode === VIEW_MODE_HISTORY && (
                <Grid size={6}>
                  <DataGrid
                    rows={validityDiscountSlabHistory}
                    columns={getColumns4ValidityConfiguration()}
                    editMode="row"
                    rowModesModel={rowModesModel4Validity}
                    onRowModesModelChange={handleRowModesModelChange4Validity}
                    onRowEditStop={handleRowEditStop4Validity}
                    processRowUpdate={processRowUpdate4Validity}
                    slots={{ toolbar: EditToolbar4Validity }}
                    slotProps={{
                      toolbar: { setRows4Validity, setRowModesModel4Validity },
                    }}
                    rowHeight={39}
                    columnHeaderHeight={39}
                    hideFooter
                    sx={{
                      "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                      "& .MuiDataGrid-cell": {
                        border: "none",
                        fontSize: "16px",
                      },
                      height: "285px",
                    }}
                  />
                </Grid>
              )}
              {viewMode === VIEW_MODE_HISTORY && (
                <Grid size={6}>
                  <DataGrid
                    rows={addonPlansHistory}
                    columns={getColumns4AddonConfiguration()}
                    editMode="row"
                    rowModesModel={rowModesModel4Addon}
                    onRowModesModelChange={handleRowModesModelChange4Addon}
                    onRowEditStop={handleRowEditStop4Addon}
                    processRowUpdate={processRowUpdate4Addon}
                    slots={{ toolbar: EditToolbar4Addon }}
                    slotProps={{
                      toolbar: { setRows4Addon, setRowModesModel4Addon },
                    }}
                    rowHeight={39}
                    columnHeaderHeight={39}
                    hideFooter
                    sx={{
                      "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                      "& .MuiDataGrid-cell": {
                        border: "none",
                        fontSize: "16px",
                      },
                      height: "285px",
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmationModal
        open={confirmation.open}
        onClose={() =>
          setConfirmation({
            open: false,
            title: "",
            message: "",
            onConfirm: () => {},
            onClose: () => {},
          })
        }
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
      />
    </Layout>
  );
};

export default Pricing;
