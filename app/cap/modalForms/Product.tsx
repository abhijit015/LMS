import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  IconButton,
  Divider,
  Checkbox,
} from "@mui/material";
import { saveProduct, loadProduct } from "@/app/controllers/product.controller";
import {
  licenseParamSchemaT,
  productLicenseParamsSchemaT,
  productSchemaT,
} from "@/app/utils/models";
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
import DoneIcon from "@mui/icons-material/Done";

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
  const [rows, setRows] = React.useState<productLicenseParamsSchemaT[]>([]);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

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

            if (
              result.data.productLicenseParams &&
              result.data.productLicenseParams.length > 0
            ) {
              const rowsData = result.data.productLicenseParams.map(
                (licenseParamGroup: productLicenseParamsSchemaT) => ({
                  id: randomId(),
                  effective_from: licenseParamGroup.effective_from,
                  product_id: productId ? productId : 0,
                  licenseParams: licenseParamGroup.licenseParams.map(
                    (param) => ({
                      ...param,
                      selected: param.selected,
                    })
                  ),
                })
              );

              setRows(rowsData);

              console.log("rows data : ", rowsData);
            }
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
      setRows([]);
      hasLoadedData.current = false;
    }
  }, [productId, open]);

  function EditToolbar(props: EditToolbarProps) {
    //const { setRows, setRowModesModel } = props;

    return (
      <GridToolbarContainer>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "primary.main", fontSize: "1.1rem", ml: 1 }}
          >
            Datewise License Parameters
          </Typography>

          <Button
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
          >
            Add record
          </Button>
        </Box>
      </GridToolbarContainer>
    );
  }

  //add row in end
  // const handleAddRow = () => {
  //   const id = randomId();

  //   const newLicenseParams = licenseParams.map((field) => ({
  //     id: field.id,
  //     name: field.name,
  //     basis: field.basis,
  //     client_id: field.client_id,
  //     selected: false,
  //   }));

  //   setRows((oldRows) => [
  //     ...oldRows,
  //     {
  //       id,
  //       effective_from: new Date(),
  //       licenseParams: newLicenseParams,
  //       product_id: productId ? productId : 0,
  //       isNew: true,
  //     },
  //   ]);

  //   setRowModesModel((oldModel) => ({
  //     ...oldModel,
  //     [id]: { mode: GridRowModes.Edit, fieldToFocus: "effective_from" },
  //   }));
  // };

  //add row in starting
  const handleAddRow = () => {
    const id = randomId();

    const newLicenseParams = licenseParams.map((field) => ({
      id: field.id,
      name: field.name,
      basis: field.basis,
      client_id: field.client_id,
      selected: false,
    }));

    setRows((oldRows) => [
      {
        id,
        effective_from: new Date(),
        licenseParams: newLicenseParams,
        product_id: productId ? productId : 0,
        isNew: true,
      },
      ...oldRows,
    ]);

    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "effective_from" },
    }));
  };

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit },
    }));
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.View },
    }));

    setRows((prevRows) => {
      return prevRows.map((row) => {
        if (row.id === id) {
          const editedRow = prevRows.find((r) => r.id === id);
          if (!editedRow) return row;

          const updatedLicenseParams = licenseParams.map((param) => ({
            id: param.id,
            name: param.name,
            basis: param.basis,
            client_id: param.client_id,
            selected: editedRow[param.name as keyof typeof editedRow] === true,
          }));

          return {
            ...row,
            ...editedRow,
            licenseParams: updatedLicenseParams,
            isNew: false,
          };
        }
        return row;
      });
    });
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setConfirmationModal({
      open: true,
      title: "Confirm Delete",
      message: "Are you sure you want to delete this row?",
      onConfirm: () => {
        setRows((prevRows) => prevRows.filter((row) => row.id !== id));
        setConfirmationModal((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));

    setRows((prevRows) => {
      const editedRow = prevRows.find((row) => row.id === id);
      if (editedRow?.isNew) {
        return prevRows.filter((row) => row.id !== id);
      }
      return prevRows.map((row) =>
        row.id === id
          ? {
              ...row,
              ...prevRows.find((originalRow) => originalRow.id === id),
            }
          : row
      );
    });
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    console.log("processRowUpdate : ", newRow);

    const updatedLicenseParams = licenseParams.map((param) => ({
      id: param.id,
      name: param.name,
      basis: param.basis,
      client_id: param.client_id,
      selected: newRow[param.name as keyof typeof newRow] === true,
    }));

    const updatedRow: productLicenseParamsSchemaT = {
      ...newRow,
      licenseParams: updatedLicenseParams,
      product_id: productId ? productId : 0,
      effective_from: newRow.effective_from,
    };

    setRows((prevRows) =>
      prevRows.map((row) => (row.id === newRow.id ? updatedRow : row))
    );

    return updatedRow;
  };

 

  const licenseParamCols: GridColDef[] = licenseParams.map(
    (param: licenseParamSchemaT) => ({
      field: param.name,
      headerName: param.name,
      type: "boolean",
      width: 180,
      editable: true,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,

      renderCell: (params) => {
        const isInEditMode =
          rowModesModel[params.row.id]?.mode === GridRowModes.Edit;

        const selectedParam = params.row.licenseParams.find(
          (param: licenseParamSchemaT) => param.name === params.field
        );
        const isSelected: boolean = selectedParam
          ? selectedParam.selected
          : false;

        if (isInEditMode) {
          return (
            <Checkbox
              defaultChecked={true}
              // checked={true}
            />
          );
        } else {
          return (
            <Typography variant="body2">
              {isSelected && <DoneIcon fontSize="small" />}
            </Typography>
          );
        }
      },
    })
  );

  const columns: GridColDef[] = [
    {
      field: "effective_from",
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

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isAnyRowInEditMode = Object.values(rowModesModel).some(
      (mode) => mode.mode === GridRowModes.Edit
    );

    if (isAnyRowInEditMode) {
      setMessageModal({
        open: true,
        title: "Error",
        message:
          "Please save or cancel all changes in Datewise License Parameters before saving.",
        type: MSG_ERROR,
      });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const formDataObj = Object.fromEntries(formData.entries());

    let result = productSchema.safeParse(formDataObj);

    if (result.success) {
      const parsedData = result.data;

      parsedData.productLicenseParams = rows;

      if (productId) {
        parsedData.id = productId;
      }

      console.log("parsedData : ", parsedData);

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
        message: String(error),
        type: MSG_ERROR,
      });
    } finally {
      setLoading(false);
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

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "75%",
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
              autoFocus
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
