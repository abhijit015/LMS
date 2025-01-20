"use client";
import { handleErrorMsg } from "@/app/utils/common";

import {
  Card,
  CardContent,
  Typography,
  Snackbar,
  Alert,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Autocomplete,
  TextField,
} from "@mui/material";
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
import SearchIcon from "@mui/icons-material/Search";
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
  GridFilterModel,
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
import { loadAddonList } from "@/app/controllers/addon.controller";
import { loadProductList } from "@/app/controllers/product.controller";
import { loadLicenseParams } from "@/app/utils/common";
import ConfirmationModal from "../modalForms/AskYesNo";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  LICENSE_PARAM_USERS,
  LICENSE_PARAM_VALIDITY,
  LICENSE_PARAM_VARIANT,
  USER_BUSINESS_MAPPING_STATUS_DISABLED,
} from "@/app/utils/constants";
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
  saveAddonPlans,
  saveUserDiscountSlabs,
  saveValidityDiscountSlabs,
  saveVariantPricing,
} from "@/app/controllers/pricing.controller";
import CategoryIcon from "@mui/icons-material/Category";

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }
}

const PARAMETER_TYPE_LICENSE = 1;
const PARAMETER_TYPE_ADDON = 2;

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

  const [parameterType, setParameterType] = useState(PARAMETER_TYPE_LICENSE);
  const [selectedParameterId, setSelectedParameterId] = useState<number>(0);

  const [selectedVariantId, setSelectedVariantId] = useState<number>(0);
  const [rows, setRows] = React.useState<GridRowsProp>([]);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );
  const [selectedVariantValue, setSelectedVariantValue] =
    useState<productVariantsSchemaT | null>(null);

  const [selectedAddonValue, setSelectedAddonValue] =
    useState<addonSchemaT | null>(null);

  const [products, setProducts] = useState<productSchemaT[]>([]);

  const [selectedProductId, setSelectedProductId] = useState<number>(0);

  const [selectedProductValue, setSelectedProductValue] =
    useState<productSchemaT | null>(null);

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

  const licenseParams = loadLicenseParams();

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setParameterType(Number(event.target.value));
    setSelectedParameterId(0);
    setSelectedAddonValue(null);
  };

  const handleParameterChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: any
  ) => {
    setSelectedParameterId(value?.id || 0);

    if (parameterType === PARAMETER_TYPE_ADDON) {
      setSelectedAddonValue(value);
    }
  };

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

      if (parameterType === PARAMETER_TYPE_ADDON) {
        if (proceed) {
          result = await loadActiveAddonPlans(
            selectedParameterId,
            selectedProductId,
            selectedVariantId
          );
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setRows(result.data);
          }
        }

        if (proceed) {
          result = await loadPrevAddonPlans(
            selectedParameterId,
            selectedProductId,
            selectedVariantId
          );
          console.log("result : ", result);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setAddonPlansHistory(result.data);
          }
        }
      } else {
        if (selectedParameterId === LICENSE_PARAM_USERS) {
          if (proceed) {
            result = await loadActiveUserDiscountSlabs(
              selectedProductId,
              selectedVariantId
            );
            if (!result.status) {
              proceed = false;
              errMsg = result.message;
            } else {
              setRows(result.data);
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
        } else if (selectedParameterId === LICENSE_PARAM_VALIDITY) {
          if (proceed) {
            result = await loadActiveValidityDiscountSlabs(
              selectedProductId,
              selectedVariantId
            );
            if (!result.status) {
              proceed = false;
              errMsg = result.message;
            } else {
              setRows(result.data);
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
        } else if (selectedParameterId === LICENSE_PARAM_VARIANT) {
          if (proceed) {
            result = await loadActiveVariantPricing(
              selectedProductId,
              selectedVariantId
            );
            if (!result.status) {
              proceed = false;
              errMsg = result.message;
            } else {
              setRows(result.data);
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
        }
      }

      if (proceed) {
        setLoading(true);
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

  const validateGridData = (
    schema: Zod.Schema<any>
  ): { status: boolean; message: string; parsedData?: any[] } => {
    let validationErrors = "";
    const parsedData: any[] = [];

    console.log("rows : ", rows);

    rows.forEach((row, rowIndex) => {
      row.rowIndex = rowIndex + 1;
      row.product_id = selectedProductId;
      row.product_variant_id = selectedVariantId;

      if (parameterType === PARAMETER_TYPE_ADDON) {
        row.addon_id = selectedParameterId;
      }

      const parsed = schema.safeParse(row);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        validationErrors += `Row ${rowIndex + 1}: ${issues} | `;
      } else {
        parsedData.push({ ...parsed.data, rowIndex: rowIndex + 1 });
      }
    });

    if (
      selectedParameterId === LICENSE_PARAM_USERS ||
      selectedParameterId === LICENSE_PARAM_VALIDITY
    ) {
      const groupedByDate: Record<string, typeof parsedData> =
        parsedData.reduce((acc, row) => {
          const dateKey = row.effective_from.toISOString();
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(row);
          return acc;
        }, {} as Record<string, typeof parsedData>);

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
    }

    if (validationErrors) {
      return {
        status: false,
        message: validationErrors.trimEnd().replace(/\|$/, ""),
      };
    }

    return { status: true, message: "", parsedData };
  };

  const handleSave = async () => {
    let proceed = true;
    let errMsg = "";
    let result;

    try {
      if (proceed) {
        if (parameterType === PARAMETER_TYPE_ADDON) {
          result = validateGridData(addonPlansSchema);
        } else {
          if (selectedParameterId === LICENSE_PARAM_USERS) {
            result = validateGridData(userDiscountSlabSchema);
          } else if (selectedParameterId === LICENSE_PARAM_VALIDITY) {
            result = validateGridData(validityDiscountSlabSchema);
          } else {
            result = validateGridData(variantPricingSchema);
          }
        }
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
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

      if (proceed && result?.parsedData) {
        setLoading(true);

        if (parameterType === PARAMETER_TYPE_ADDON) {
          result = await saveAddonPlans(
            result.parsedData,
            selectedParameterId,
            selectedProductId,
            selectedVariantId
          );
        } else {
          if (selectedParameterId === LICENSE_PARAM_USERS) {
            result = await saveUserDiscountSlabs(
              result.parsedData,
              selectedProductId,
              selectedVariantId
            );
          } else if (selectedParameterId === LICENSE_PARAM_VALIDITY) {
            result = await saveValidityDiscountSlabs(
              result.parsedData,
              selectedProductId,
              selectedVariantId
            );
          } else {
            result = await saveVariantPricing(
              result.parsedData,
              selectedProductId,
              selectedVariantId
            );
          }
        }

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
    setRows([]);
    setRowModesModel({});
  };

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  const getColumns4Configuration = (): GridColDef[] => {
    const columns: GridColDef[] = [];

    columns.push({
      field: "effective_from",
      headerName: "Effective From",
      width: 140,
      editable: true,
      type: "date",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    });

    if (parameterType === PARAMETER_TYPE_LICENSE) {
      switch (selectedParameterId) {
        case LICENSE_PARAM_VARIANT:
          columns.push(
            {
              field: "price",
              headerName: "Price",
              type: "number",
              width: 100,
              editable: true,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "early_discount_percentage",
              headerName: "Early Discount %",
              type: "number",
              width: 150,
              editable: true,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            }
          );
          break;
        case LICENSE_PARAM_USERS:
          columns.push(
            {
              field: "start_value",
              headerName: "Start Value",
              type: "number",
              width: 150,
              editable: true,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "end_value",
              headerName: "End Value",
              type: "number",
              width: 150,
              editable: true,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "discount_percentage",
              headerName: "Discount %",
              type: "number",
              width: 150,
              editable: true,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            }
          );
          break;
        case LICENSE_PARAM_VALIDITY:
          columns.push(
            {
              field: "start_value",
              headerName: "Start Value (Months)",
              type: "number",
              width: 180,
              editable: true,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "end_value",
              headerName: "End Value (Months)",
              type: "number",
              width: 180,
              editable: true,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "discount_percentage",
              headerName: "Discount %",
              type: "number",
              width: 140,
              editable: true,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "grace",
              headerName: "Grace (Days)",
              type: "number",
              width: 140,
              editable: true,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            }
          );
          break;
        default:
          break;
      }
    } else if (parameterType === PARAMETER_TYPE_ADDON) {
      columns.push(
        {
          field: "plan_name",
          headerName: "Plan Name",
          width: 340,
          editable: true,
          type: "string",
          renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        },
        {
          field: "value",
          headerName: "Value",
          type: "number",
          width: 100,
          editable: true,
          renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        },
        {
          field: "price",
          headerName: "Price",
          type: "number",
          width: 100,
          editable: true,
          renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        },
        {
          field: "grace",
          headerName: "Grace",
          type: "number",
          width: 100,
          editable: true,
          renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        }
      );
    }

    columns.push({
      field: "actions",
      type: "actions",
      headerName: " ",
      width: 100,
      cellClassName: "actions",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{ color: "primary.main" }}
              onClick={handleSaveRowClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              onClick={handleCancelRowClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            onClick={handleEditClick(id)}
            color="inherit"
            className="textPrimary"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            sx={{ color: "error.main" }}
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    });

    return columns;
  };

  const getColumns4History = (): GridColDef[] => {
    const columns: GridColDef[] = [];

    columns.push({
      field: "effective_from",
      headerName: "Effective From",
      width: 140,
      type: "date",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    });

    if (parameterType === PARAMETER_TYPE_LICENSE) {
      switch (selectedParameterId) {
        case LICENSE_PARAM_VARIANT:
          columns.push(
            {
              field: "price",
              headerName: "Price",
              type: "number",
              width: 100,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "early_discount_percentage",
              headerName: "Early Discount %",
              type: "number",
              width: 150,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            }
          );
          break;
        case LICENSE_PARAM_USERS:
          columns.push(
            {
              field: "start_value",
              headerName: "Start Value",
              type: "number",
              width: 150,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "end_value",
              headerName: "End Value",
              type: "number",
              width: 150,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "discount_percentage",
              headerName: "Discount %",
              type: "number",
              width: 150,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            }
          );
          break;
        case LICENSE_PARAM_VALIDITY:
          columns.push(
            {
              field: "start_value",
              headerName: "Start Value (Months)",
              type: "number",
              width: 180,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "end_value",
              headerName: "End Value (Months)",
              type: "number",
              width: 180,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "discount_percentage",
              headerName: "Discount %",
              type: "number",
              width: 140,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            },
            {
              field: "grace",
              headerName: "Grace (Days)",
              type: "number",
              width: 140,
              renderHeader: (params) => (
                <strong>{params.colDef.headerName}</strong>
              ),
            }
          );
          break;
        default:
          break;
      }
    } else if (parameterType === PARAMETER_TYPE_ADDON) {
      columns.push(
        {
          field: "plan_name",
          headerName: "Plan Name",
          width: 340,
          type: "string",
          renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        },
        {
          field: "value",
          headerName: "Value",
          type: "number",
          width: 100,
          renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        },
        {
          field: "price",
          headerName: "Price",
          type: "number",
          width: 100,
          renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        },
        {
          field: "grace",
          headerName: "Grace",
          type: "number",
          width: 100,
          renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
        }
      );
    }

    return columns;
  };

  function EditToolbar(props: GridSlotProps["toolbar"]) {
    const { setRows, setRowModesModel } = props;

    const handleAddRecord = () => {
      const id = Math.floor(Math.random() * 10000);

      let newEffectiveDate = new Date();

      if (rows.length > 0) {
        newEffectiveDate = new Date(rows[0].effective_from);
      }

      setRows((oldRows) => [
        ...oldRows,
        {
          id,
          effective_from: newEffectiveDate,
          isNew: true,
          start_value: 0,
          end_value: 0,
          grace: 0,
          price: 0,
          value: 0,
          discount_percentage: 0,
          early_discount_percentage: 0,
        },
      ]);

      setRowModesModel((oldModel) => ({
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
        >
          <Typography color="primary">
            Configure Active & Future Plans
          </Typography>

          <Button
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddRecord}
          >
            Insert Row
          </Button>
        </Box>
      </GridToolbarContainer>
    );
  }

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveRowClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleCancelRowClick = (id: GridRowId) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));

    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const getRows4History = () => {
    if (parameterType === PARAMETER_TYPE_ADDON) {
      return addonPlansHistory;
    } else {
      switch (selectedParameterId) {
        case LICENSE_PARAM_USERS:
          return userDiscountSlabHistory;
        case LICENSE_PARAM_VALIDITY:
          return validityDiscountSlabHistory;
        case LICENSE_PARAM_VARIANT:
          return variantPricingHistory;
        default:
          return [];
      }
    }
  };

  const handleRefresh = async () => {
    let proceed = true;
    let errMsg = "";
    let result;

    try {
      setLoading(true);

      if (parameterType === PARAMETER_TYPE_ADDON) {
        if (proceed) {
          result = await loadActiveAddonPlans(
            selectedParameterId,
            selectedProductId,
            selectedVariantId
          );
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setRows(result.data);
          }
        }

        if (proceed) {
          result = await loadPrevAddonPlans(
            selectedParameterId,
            selectedProductId,
            selectedVariantId
          );

          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setAddonPlansHistory(result.data);
          }
        }
      } else {
        if (selectedParameterId === LICENSE_PARAM_USERS) {
          if (proceed) {
            result = await loadActiveUserDiscountSlabs(
              selectedProductId,
              selectedVariantId
            );
            if (!result.status) {
              proceed = false;
              errMsg = result.message;
            } else {
              setRows(result.data);
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
        } else if (selectedParameterId === LICENSE_PARAM_VALIDITY) {
          if (proceed) {
            result = await loadActiveValidityDiscountSlabs(
              selectedProductId,
              selectedVariantId
            );
            if (!result.status) {
              proceed = false;
              errMsg = result.message;
            } else {
              setRows(result.data);
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
        } else if (selectedParameterId === LICENSE_PARAM_VARIANT) {
          if (proceed) {
            result = await loadActiveVariantPricing(
              selectedProductId,
              selectedVariantId
            );
            if (!result.status) {
              proceed = false;
              errMsg = result.message;
            } else {
              setRows(result.data);
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
        }
      }

      if (!proceed) {
        setSnackbar({
          open: true,
          message: errMsg,
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Data refreshed successfully",
          severity: "success",
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

  return (
    <Layout loading={loading}>
      <Card
        sx={{
          height: "auto",
          borderRadius: 3,
          border: "1px solid #ddd",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
          mb: 2,
          // width: "1550px",
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
          </Box>

          <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
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

            <FormControl
              component="fieldset"
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <RadioGroup
                row
                name="row-radio-buttons-group"
                id="parameter-type-radio"
                value={parameterType}
                onChange={handleRadioChange}
              >
                <FormControlLabel
                  value={PARAMETER_TYPE_LICENSE}
                  control={<Radio disabled={loading || searchMode} />}
                  label="License"
                />
                <FormControlLabel
                  value={PARAMETER_TYPE_ADDON}
                  control={<Radio disabled={loading || searchMode} />}
                  label="Add-ons"
                />
              </RadioGroup>
            </FormControl>

            {parameterType === PARAMETER_TYPE_LICENSE && (
              <Autocomplete
                disabled={loading || searchMode}
                size="small"
                options={licenseParams}
                getOptionLabel={(option) => option.name}
                sx={{ width: 300 }}
                onChange={handleParameterChange}
                renderInput={(params) => (
                  <TextField {...params} label="License Parameters" />
                )}
              />
            )}

            {parameterType === PARAMETER_TYPE_ADDON && (
              <Autocomplete
                disabled={loading || searchMode}
                size="small"
                options={addons}
                getOptionLabel={(option) => option.name}
                value={selectedAddonValue}
                sx={{ width: 300 }}
                onChange={handleParameterChange}
                renderInput={(params) => (
                  <TextField {...params} label="Add-ons" />
                )}
              />
            )}

            <Button
              size="small"
              variant="contained"
              disabled={
                loading ||
                !selectedParameterId ||
                !selectedProductId ||
                !selectedVariantId ||
                searchMode
              }
              onClick={handleSearch}
            >
              Show Details
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={loading || !searchMode}
              onClick={handleCancelClick}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "flex",
          gap: 2,
        }}
      >
        {searchMode && (
          <Card
            sx={{
              flex: 1,
              height: "auto",
              borderRadius: 3,
              border: "1px solid #ddd",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
              backgroundColor: "#fff",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  width: "100%",
                  "& .actions": { color: "text.secondary" },
                  "& .textPrimary": { color: "text.primary" },
                }}
              >
                <DataGrid
                  autoHeight
                  rows={rows}
                  columns={getColumns4Configuration()}
                  editMode="row"
                  rowModesModel={rowModesModel}
                  onRowModesModelChange={handleRowModesModelChange}
                  onRowEditStop={handleRowEditStop}
                  processRowUpdate={processRowUpdate}
                  slots={{ toolbar: EditToolbar }}
                  slotProps={{ toolbar: { setRows, setRowModesModel } }}
                  rowHeight={39}
                  columnHeaderHeight={39}
                  hideFooter
                  sx={{
                    "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                    "& .MuiDataGrid-cell": { border: "none", fontSize: "16px" },
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 2,
                    gap: 2,
                  }}
                >
                  <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading || !searchMode}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {searchMode && (
          <Card
            sx={{
              flex: 1,
              height: "auto",
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
                  mb: 1,
                }}
              >
                <Typography variant="h6" sx={{ color: "primary.main" }}>
                  History
                </Typography>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleRefresh}
                    disabled={loading}
                    size="small"
                    startIcon={<RefreshIcon />}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              <Box sx={{ height: "auto" }}>
                <DataGrid
                  rows={getRows4History()}
                  columns={getColumns4History()}
                  rowHeight={36}
                  columnHeaderHeight={36}
                  pageSizeOptions={[10, 20, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                  sx={{
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: "#fdfdfd",
                      fontSize: "16px",
                    },
                    "& .MuiDataGrid-cell": {
                      border: "none",
                      fontSize: "16px",
                    },
                    "& .disabled-row": {
                      bgcolor: "lightgrey",
                      "&:hover": {
                        bgcolor: "lightgrey",
                      },
                      "&.Mui-selected": {
                        bgcolor: "lightgrey",
                      },
                      "&.Mui-selected:hover": {
                        bgcolor: "lightgrey",
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

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
