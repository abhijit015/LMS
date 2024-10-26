import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  IconButton,
  Typography,
  Paper,
  Autocomplete,
  Checkbox,
  Tabs,
  Tab,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useRef, useState, useEffect } from "react";
import Draggable from "react-draggable";
import { productSchema } from "@/app/zodschema/zodschema";
import { productSchemaT } from "@/app/models/models";
import {
  saveProduct,
  loadProductByID,
  loadProductLicenseParams,
  saveLicenseFields,
  getProductIDFromName,
} from "@/app/controllers/product.controller";
import ErrorModal from "@/app/cap/components/ErrorModal";
import ConfirmationDialog from "@/app/cap/components/ConfirmationDialog";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { loadLicenseFields } from "@/app/controllers/licenseFields.controller";
import * as React from "react";
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
import {
  randomCreatedDate,
  randomTraderName,
  randomId,
  randomArrayItem,
} from "@mui/x-data-grid-generator";

interface ProductModalProps {
  open: boolean;
  productId: number | null;
  onClose: () => void;
}

const PaperComponent = (props: any) => {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
};

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const roles = ["Market", "Finance", "Development"];
const randomRole = () => {
  return randomArrayItem(roles);
};

const initialRows: GridRowsProp = [
  {
    id: randomId(),
    name: randomTraderName(),
    age: 25,
    joinDate: randomCreatedDate(),
    role: randomRole(),
  },
  {
    id: randomId(),
    name: randomTraderName(),
    age: 36,
    joinDate: randomCreatedDate(),
    role: randomRole(),
  },
];

interface EditToolbarProps {
  setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setRowModesModel: (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel
  ) => void;
}

function EditToolbar(props: EditToolbarProps) {
  const { setRows, setRowModesModel } = props;

  const handleClick = () => {
    const id = randomId();
    setRows((oldRows) => [
      ...oldRows,
      { id, name: "", age: "", role: "", isNew: true },
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
    }));
  };

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        Add record
      </Button>
    </GridToolbarContainer>
  );
}

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  productId,
  onClose,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<productSchemaT | null>(null);
  const [licenseOptions, setLicenseOptions] = useState<any[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const isFetched = useRef(false);

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

  const licenseFieldCols: GridColDef[] = licenseOptions.map((option: any) => ({
    field: option.name,
    headerName: option.name,
    type: "boolean",
    width: 120,
    align: "center",
    headerAlign: "center",
    editable: true,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  }));

  const columns: GridColDef[] = [
    {
      field: "with_Effect_from",
      headerName: "With Effect From",
      type: "dateTime",
      width: 180,
      align: "left",
      headerAlign: "left",
      editable: true,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    ...licenseFieldCols,
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
          />,
        ];
      },
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      if (open && !isFetched.current) {
        isFetched.current = true;
        try {
          const licenseFieldsResponse = await loadLicenseFields();
          if (licenseFieldsResponse) {
            setLicenseOptions(licenseFieldsResponse);
          } else {
            setError("Failed to load license parameters");
          }

          if (productId) {
            const productDataResponse = await loadProductByID(productId);
            if (productDataResponse) {
              //setProductData(productDataResponse);
              //setSelectedLicenses(productDataResponse.license_params || []);
            } else {
              setError("Failed to load product data");
            }
          }
        } catch (err) {
          setError("An error occurred while fetching data");
        }
      }
    };

    loadData();
  }, [open, productId]);

  const handleClose = () => {
    setLoading(false);
    setError(null);
    onClose();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFormSubmit = async (formData: FormData) => {
    setLoading(true);
    const data = Object.fromEntries(formData);
    const validationResult = productSchema.safeParse(data);
    if (!validationResult.success) {
      const errors: { [key: string]: string } = {};
      validationResult.error.errors.forEach((error) => {
        errors[error.path[0]] = error.message;
      });
      setValidationErrors(errors);
      setLoading(false);
      return;
    }
    try {
      const response = await saveProduct({
        ...validationResult.data,
        //license_params: selectedLicenses,
      });
      if (response) {
        handleClose();
      } else {
        setError("Failed to save product");
      }
    } catch (err) {
      setError("An error occurred while saving product");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmation = (confirm: boolean) => {
    setIsConfirmationOpen(false);
    if (confirm && formData) {
      handleFormSubmit(formData);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullScreen
      PaperComponent={PaperComponent}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingY: 1,
          cursor: "move",
        }}
        id="draggable-dialog-title"
      >
        <Typography variant="h6" sx={{ color: "primary.main" }}>
          {productId ? "Modify Product" : "Add Product"}
        </Typography>
        <IconButton edge="end" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
      >
        <Tab label="Product Details" />
        <Tab label="License Parameters" />
        <Tab label="License Plans" />
      </Tabs>

      <Box
        component="form"
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleFormSubmit(formData);
        }}
        sx={{
          padding: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        {activeTab === 0 && (
          <Box>
            <TextField
              label="Name"
              name="name"
              size="small"
              required
              defaultValue={productData?.name || ""}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              variant="outlined"
              onChange={() =>
                setValidationErrors((prev) => ({ ...prev, name: "" }))
              }
            />
            <Autocomplete
              multiple
              size="small"
              id="license_param"
              fullWidth
              options={licenseOptions}
              value={selectedLicenses}
              onChange={(_, newValue) => setSelectedLicenses(newValue)}
              disableCloseOnSelect
              getOptionLabel={(option) => option.name}
              renderOption={(props, option, { selected }) => (
                <li
                  {...props}
                  style={{
                    height: "30px",
                  }}
                >
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="License Parameters"
                  placeholder="Select"
                  error={!!validationErrors.license_param}
                  helperText={validationErrors.license_param}
                />
              )}
            />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
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
              hideFooter
              slots={{
                toolbar: EditToolbar as GridSlots["toolbar"],
              }}
              slotProps={{
                toolbar: { setRows, setRowModesModel },
              }}
              sx={{
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <h1>this is a heading</h1>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mr: 2 }}
            onClick={handleClose}
            size="small"
          >
            Quit
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="small"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </Box>
      </Box>

      {error && (
        <ErrorModal
          open={!!error}
          message={error}
          title="Error"
          onClose={() => setError(null)}
        />
      )}
      <ConfirmationDialog
        open={isConfirmationOpen}
        message="Are you sure you want to save?"
        onClose={handleCloseConfirmation}
      />
    </Dialog>
  );
};

export default ProductModal;
