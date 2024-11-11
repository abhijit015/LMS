"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import { saveProduct, loadProduct } from "@/app/controllers/product.controller";
import { licenseParamSchemaT, productSchemaT } from "@/app/utils/models";
import { productSchema } from "@/app/utils/zodschema";
import { loadAllLicenseFields } from "@/app/controllers/license.controller";
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
  GridSlots,
} from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close";
import { randomId } from "@mui/x-data-grid-generator";
import { MSG_ERROR, MSG_NORMAL } from "@/app/utils/constants";
import ConfirmationModal from "./AskYesNo";
import MessageModal from "./ShowMsg";

interface ProductModalProps {
  open: boolean;
  productId?: number;
  onClose: () => void;
  onSave: () => void;
}

interface EditToolbarProps {
  setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setRowModesModel: (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel
  ) => void;
}

const initialRows: GridRowsProp = [];

function EditToolbar(props: EditToolbarProps) {
  const { setRows, setRowModesModel } = props;

  const handleAddRow = () => {
    const id = randomId();
    setRows((oldRows) => [
      ...oldRows,
      {
        id,
        //date: today,
        // ...Object.fromEntries(licenseParams.map((param) => [param.name, ""])),
      },
    ]);

    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "date" },
    }));
  };

  return (
    <GridToolbarContainer>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "primary.main",
            fontSize: "1.1rem",
            ml: 1,
          }}
        >
          Datewise License Parameters
        </Typography>

        <Button color="primary" startIcon={<AddIcon />} onClick={handleAddRow}>
          Add record
        </Button>
      </Box>
    </GridToolbarContainer>
  );
}

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  productId,
  onClose,
  onSave,
}) => {
  const [productData, setProductData] = useState<productSchemaT | null>(null);
  const [licenseParams, setLicenseParams] = useState<licenseParamSchemaT[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [messageModal, setMessageModal] = useState({
    open: false,
    title: "",
    message: "",
    type: MSG_NORMAL,
  });

  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchProductData = async () => {
      let errMsg: string = "";
      let proceed: boolean = true;
      let result;

      try {
        if (proceed && productId) {
          result = await loadProduct(productId);
          if (result.status) {
            setProductData(result.data as productSchemaT);
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (proceed) {
          result = await loadAllLicenseFields();
          if (result.status) {
            setLicenseParams(result.data as licenseParamSchemaT[]);
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (!proceed) {
          setMessageModal({
            open: true,
            title: "Error",
            message: errMsg,
            type: MSG_ERROR,
          });
        }
      } catch (error) {
        setMessageModal({
          open: true,
          title: "Error",
          message: String(error),
          type: MSG_ERROR,
        });
      } finally {
        setLoading(false);
      }
    };

    if (open && !hasLoadedData.current) {
      setLoading(true);
      fetchProductData();
      hasLoadedData.current = true;
    } else if (!open) {
      setProductData(null);
      setErrors({});
      hasLoadedData.current = false;
    }
  }, [productId, open]);

  const [rows, setRows] = React.useState(initialRows);
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

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleCancelClick = (id: GridRowId) => () => {
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

  const licenseParamCols: GridColDef[] = licenseParams.map((param) => ({
    field: param.name,
    headerName: param.name,
    type: "boolean",
    width: 180,
    editable: true,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const formDataObj = Object.fromEntries(formData.entries());

    const result = productSchema.safeParse(formDataObj);

    if (result.success) {
      const parsedData = result.data;

      if (productId) parsedData.id = productId;

      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this product?",
        onConfirm: () => confirmSave(parsedData),
      });
    } else {
      const validationErrors = result.error.errors.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {} as { [key: string]: string });
      setErrors(validationErrors);
    }
  };

  const confirmSave = async (parsedData: productSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveProduct(parsedData);
      if (result.status) {
        onSave();
        // setMessageModal({
        //   open: true,
        //   title: "Success",
        //   message: "Product saved successfully!",
        //   type: MSG_NORMAL,
        // });
        onClose();
      } else {
        setMessageModal({
          open: true,
          title: "Error",
          message: result.message,
          type: MSG_ERROR,
        });
      }
    } catch (error) {
      setMessageModal({
        open: true,
        title: "Error",
        message: "Error saving product data.",
        type: MSG_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "date",
      headerName: "Effective From",
      width: 180,
      editable: true,
      type: "date",
      align: "center",
      headerAlign: "center",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    ...licenseParamCols,
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
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
              sx={{
                color: "primary.main",
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
            className="textPrimary"
          />,
        ];
      },
    },
  ];

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 1500,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography
              variant="h6"
              sx={{
                color: "primary.main",
                textAlign: "left",
                fontWeight: "normal",
              }}
            >
              {productId ? "Edit Product" : "Add Product"}
            </Typography>
            <IconButton
              onClick={onClose}
              sx={{
                color: "text.primary",
                ml: 2,
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <form onSubmit={handleSubmit}>
            <TextField
              autoComplete="off"
              label="Product Name"
              name="name"
              size="small"
              margin="normal"
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 3, textTransform: "capitalize" }}
              defaultValue={productData?.name || ""}
              onChange={handleChange}
            />
            <Box
              sx={{
                height: 500,
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
                rows={rows}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                onRowEditStop={handleRowEditStop}
                processRowUpdate={processRowUpdate}
                rowHeight={36}
                columnHeaderHeight={36}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                slots={{
                  toolbar: EditToolbar as GridSlots["toolbar"],
                }}
                slotProps={{
                  toolbar: { setRows, setRowModesModel },
                }}
                sx={{
                  "& .MuiDataGrid-cell": {
                    border: "none",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    borderBottom: "none",
                  },
                  "& .MuiDataGrid-root": {
                    border: "none",
                  },
                }}
              />
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}
            >
              <Button onClick={onClose} disabled={loading}>
                Quit
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                Save
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

      <MessageModal
        open={messageModal.open}
        onClose={() =>
          setMessageModal({
            open: false,
            title: "",
            message: "",
            type: MSG_NORMAL,
          })
        }
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </>
  );
};

export default ProductModal;
