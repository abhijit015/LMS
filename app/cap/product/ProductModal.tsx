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
  const isFetched = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      if (open && !isFetched.current) {
        isFetched.current = true;
        try {
          const licenseFieldsResponse = await loadLicenseFields();
          if (licenseFieldsResponse) {
            setLicenseOptions(licenseFieldsResponse);
          } else {
            setError("Error loading license fields.");
          }

          if (productId) {
            const [productResponse, licenseParamsResponse] = await Promise.all([
              loadProductByID(productId),
              loadProductLicenseParams(productId),
            ]);

            if (productResponse.status) {
              setProductData(productResponse.data);
            } else {
              setError("Error loading product data.");
            }

            if (licenseParamsResponse) {
              const selectedIds = licenseParamsResponse.map(
                (license: { id: any }) => license.id
              );
              const selected = licenseFieldsResponse.filter(
                (license: { id: any }) => selectedIds.includes(license.id)
              );
              setSelectedLicenses(selected);
            } else {
              setError("Error loading product license parameters.");
            }
          } else {
            setProductData(null);
            setSelectedLicenses([]);
          }
        } catch (error) {
          setError(String(error));
        }
      }
    };

    if (open) {
      loadData();
    }

    return () => {
      isFetched.current = false;
    };
  }, [open, productId]);

  const handleFormSubmit = (formData: FormData) => {
    setFormData(formData);
    setIsConfirmationOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData) return;

    setLoading(true);
    setError(null);
    setValidationErrors({});
    const data = Object.fromEntries(formData.entries());

    try {
      const parsedData = productSchema.safeParse(data);

      if (!parsedData.success) {
        const fieldErrors = parsedData.error.flatten().fieldErrors;
        setValidationErrors(
          Object.fromEntries(
            Object.entries(fieldErrors).map(([key, value]) => [
              key,
              value?.join(", ") || "",
            ])
          )
        );
      } else {
        if (productId) {
          parsedData.data.id = Number(productId);
        }
        const response = await saveProduct(parsedData.data);

        if (response && response.status) {
          if (!productId) {
            const productResult = await getProductIDFromName(
              parsedData.data.name
            );

            if (productResult.status) {
              productId = Number(productResult.data);
            }
          }

          if (productId) {
            const licenseIds = selectedLicenses.map((license) => license.id);
            await saveLicenseFields(productId, licenseIds);
          } else {
            setError("Unable to save product");
          }
          onClose();
        } else if (response) {
          const errorMessages = Array.isArray(response.data)
            ? response.data
                .map((err) =>
                  typeof err.message === "string"
                    ? err.message
                    : "Unknown error"
                )
                .join(", ")
            : typeof response.data === "string"
            ? response.data
            : "Unexpected error format.";
          setError(errorMessages);
        } else {
          setError("Unexpected error: No response from server.");
        }
      }
    } catch (error) {
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmation = (confirmed: boolean) => {
    if (confirmed) {
      handleSubmit();
    }
    setIsConfirmationOpen(false);
  };

  const handleClose = () => {
    onClose();
    setProductData(null);
    setValidationErrors({});
    setFormData(null);
    isFetched.current = false;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
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
              label="License Parameters"
              placeholder="Add License Parameters"
            />
          )}
        />

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{ marginRight: 1 }}
          >
            Quit
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
          >
            Save
          </Button>
        </Box>
      </Box>

      <ErrorModal
        open={Boolean(error)}
        title="Error"
        message={error || ""}
        onClose={() => setError(null)}
      />
      <ConfirmationDialog
        open={isConfirmationOpen}
        onClose={handleCloseConfirmation}
        message={
          productId
            ? "Are you sure you want to modify this product?"
            : "Are you sure you want to add this product?"
        }
      />
    </Dialog>
  );
};

export default ProductModal;
