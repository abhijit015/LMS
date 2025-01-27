"use client";
import { handleErrorMsg } from "@/app/utils/common";
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { saveProduct, loadProduct } from "@/app/controllers/product.controller";
import {
  productSchemaT,
  productVariantsSchemaT,
  userSchemaT,
} from "@/app/utils/models";
import {
  productSchema,
  productVariantsSchema,
  userSchema,
} from "@/app/utils/zodschema";
import ConfirmationModal from "./AskYesNo";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {
  GridRowsProp,
  GridRowModesModel,
  GridSlotProps,
  GridRowModes,
  GridToolbarContainer,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowId,
  GridRowModel,
  GridColDef,
  GridActionsCellItem,
  DataGrid,
} from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { randomId } from "@mui/x-data-grid-generator";
import { checkIfLicenseExists4Product } from "@/app/controllers/license.controller";

interface ProductModalProps {
  productId?: number;
  onClose: () => void;
  onSave: () => void;
}

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }
}

function EditToolbar(props: GridSlotProps["toolbar"]) {
  const { setRows, setRowModesModel } = props;

  const handleAddRecord = () => {
    const id = randomId();
    setRows((oldRows) => [
      ...oldRows,
      {
        id,
        name: "",
        is_free_variant: false,
        no_of_users: 1,
        no_of_days: 0,
        isNew: true,
      },
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
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
        <Typography color="primary">Configure Variants</Typography>

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

const ProductModal: React.FC<ProductModalProps> = ({
  productId,
  onClose,
  onSave,
}) => {
  const [productData, setProductData] = useState<productSchemaT | null>(null);
  const [loading, setLoading] = useState(false);
  const [licenseExists, setLicenseExists] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmationModal, setConfirmationModal] = useState({
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

  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchProductData = async () => {
      let errMsg: string = "";
      let proceed: boolean = true;
      let result;

      try {
        if (proceed && productId) {
          setLoading(true);
          result = await loadProduct(productId);
          console.log("result : ", result);
          if (result.status) {
            setProductData(result.data as productSchemaT);
            setRows(result.data.variants);
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (proceed && productId) {
          setLoading(true);
          result = await checkIfLicenseExists4Product(productId);
          if (result.status) {
            setLicenseExists(result.data as boolean);
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

    if ( !hasLoadedData.current) {
      fetchProductData();
      hasLoadedData.current = true;
    } else if (!open) {
      setProductData(null);
      setLicenseExists(false);
      setErrors({});
      setRows([]);
      hasLoadedData.current = false;
    }
  }, [productId, open]);

  const [rows, setRows] = React.useState<GridRowsProp>([]);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

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

  const validateVariantGridData = (): {
    status: boolean;
    message: string;
    parsedData?: productVariantsSchemaT[];
  } => {
    let validationErrors = "";
    const parsedData: any[] = [];

    console.log("rows : ", rows);

    rows.forEach((row, rowIndex) => {
      if (productId) row.product_id = productId;
      const parsed = productVariantsSchema.safeParse(row);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        validationErrors += `Row ${rowIndex + 1}: ${issues} | `;
      } else {
        parsedData.push(parsed.data);
      }
    });

    // Check that only one variant is marked as free
    const freeVariants = parsedData.filter(
      (variant) => variant.is_free_variant
    );
    if (freeVariants.length > 1) {
      validationErrors += "Only one product variant can be marked as free. | ";
    }

    if (validationErrors) {
      return {
        status: false,
        message: validationErrors.trimEnd().replace(/\|$/, ""),
      };
    }

    return { status: true, message: "", parsedData };
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Variant",
      width: 300,
      editable: true,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "is_free_variant",
      headerName: "Free",
      type: "boolean",
      width: 100,
      editable: !licenseExists,
      align: "center",
      headerAlign: "center",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "no_of_users",
      headerName: "Free / Trial Users",
      type: "number",
      width: 150,
      editable: true,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "no_of_days",
      headerName: "Trial Days",
      width: 150,
      editable: true,
      type: "number",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
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
    },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    let proceed: boolean = true;
    let errMsg: string = "";
    let result;
    let finalProductData: productSchemaT | undefined;

    e.preventDefault();

    console.log("rows : ", rows);
    let baseData: Record<string, any> = productId ? { ...productData } : {};

    const formData = new FormData(e.currentTarget);
    formData.forEach((value, key) => {
      baseData[key] = value;
    });

    if (proceed) {
      result = productSchema.safeParse(baseData);
      console.log("result :", result);
      if (!result.success) {
        proceed = false;
        const validationErrors = result.error.errors.reduce((acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {} as { [key: string]: string });
        setErrors(validationErrors);
      } else {
        finalProductData = result.data;
      }
    }

    if (proceed && finalProductData) {
      result = validateVariantGridData();
      if (!result.status) {
        proceed = false;
        errMsg = result.message;
      } else {
        finalProductData.variants = result.parsedData;
      }
    }

    console.log("finalProductData : ", finalProductData);

    if (proceed && finalProductData) {
      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this product?",
        onConfirm: () => confirmSave(finalProductData),
        onClose: () => {},
      });
    } else {
      if (errMsg) {
        setSnackbar({
          open: true,
          message: errMsg,
          severity: "error",
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const confirmSave = async (parsedProductData: productSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveProduct(parsedProductData);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Product saved successfully.",
          severity: "success",
        });
        onSave();
        onClose();
      } else {
        setSnackbar({
          open: true,
          message: result.message,
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error saving product data.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        BackdropProps={{
          onClick: (event) => event.stopPropagation(),
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "850px",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
            outline: "none",
            border: "1px solid",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {productId ? (
                <EditIcon sx={{ color: "primary.main" }} />
              ) : (
                <AddIcon sx={{ color: "primary.main" }} />
              )}
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  color: "primary.main",
                  textAlign: "left",
                  fontWeight: "normal",
                }}
              >
                {productId ? "Edit Product" : "Add Product"}
              </Typography>
            </Box>

            <IconButton
              onClick={onClose}
              disabled={loading}
              sx={{
                color: "text.primary",
                ml: 2,
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 1 }} />

          <form onSubmit={handleSubmit}>
            <TextField
              autoFocus
              autoComplete="off"
              label="Name"
              name="name"
              size="small"
              margin="normal"
              disabled={loading}
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mr: 2 }}
              defaultValue={productData?.name || ""}
              onChange={handleChange}
            />

            <TextField
              autoComplete="off"
              label="License No. Identifier"
              name="license_num_identifier"
              size="small"
              margin="normal"
              disabled={loading || licenseExists}
              required
              error={!!errors.license_num_identifier}
              helperText={errors.license_num_identifier || "Max 2 Characters"}
              defaultValue={productData?.license_num_identifier || ""}
              onChange={handleChange}
              inputProps={{
                style: { textTransform: "uppercase" },
                maxLength: 2,
              }}
            />

            <Box
              sx={{
                width: "100%",
                "& .actions": {
                  color: "text.secondary",
                },
                "& .textPrimary": {
                  color: "text.primary",
                },
              }}
            >
              <DataGrid
                autoHeight
                rows={rows}
                columns={columns}
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
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mt: 3,
                mb: 1,
              }}
            >
              <Button
                startIcon={<SaveIcon />}
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Save"
                )}
              </Button>
              <Button onClick={onClose} disabled={loading} variant="outlined">
                Quit
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <ConfirmationModal
        open={confirmationModal.open}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, open: false })
        }
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%", border: "1px solid", borderRadius: 1 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProductModal;
