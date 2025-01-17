import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { businessSchema } from "@/app/utils/zodschema";
import { businessSchemaT } from "@/app/utils/models";
import {
  saveBusiness,
  loadBusiness,
} from "@/app/controllers/business.controller";
import ConfirmationModal from "./AskYesNo";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

interface BusinessModalProps {
  open: boolean;
  businessId: number | null;
  onClose: () => void;
  onSave: () => void;
}

const BusinessModal: React.FC<BusinessModalProps> = ({
  open,
  businessId,
  onClose,
  onSave,
}) => {
  const [businessData, setBusinessData] = useState<businessSchemaT | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const [confirmation, setConfirmation] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onClose: () => {},
  });

  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (businessId) {
        setLoading(true);
        try {
          const result = await loadBusiness(businessId);
          if (result.status) {
            setBusinessData(result.data as businessSchemaT);
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
            message: "Error fetching Business data.",
            severity: "error",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    if (open && !hasLoadedData.current) {
      fetchBusinessData();
      hasLoadedData.current = true;
    } else if (!open) {
      setBusinessData(null);
      setErrors({});
      hasLoadedData.current = false;
    }
  }, [businessId, open]);

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const handleConfirmationClose = () => {
    setConfirmation({
      open: false,
      title: "",
      message: "",
      onConfirm: () => {},
      onClose: () => {},
    });
  };

  const handleSaveBusiness = async (data: businessSchemaT) => {
    handleConfirmationClose();
    setLoading(true);
    try {
      const result = await saveBusiness(data);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Business saved successfully.",
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
        message: "Error saving Business data.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    let data: Record<string, any>;

    if (businessId && businessData) {
      data = {
        ...businessData,
        ...Object.fromEntries(formData.entries()),
      };
    } else {
      data = Object.fromEntries(formData.entries());
    }

    const result = businessSchema.safeParse(data);

    if (result.success) {
      setErrors({});
      setConfirmation({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this business data?",
        onConfirm: () => handleSaveBusiness(result.data),
        onClose: handleConfirmationClose,
      });
    } else {
      const validationErrors: { [key: string]: string } = {};
      result.error.errors.forEach((err) => {
        validationErrors[err.path[0]] = err.message;
      });
      setErrors(validationErrors);
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
      <Modal
        open={open}
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
            width: "400px",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
            outline: "none",
            textAlign: "center",
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
              {businessId ? (
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
                {businessId ? "Edit Business" : "Add Business"}
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
              fullWidth
              autoComplete="off"
              label=" Business Name"
              name="name"
              size="small"
              margin="normal"
              disabled={loading}
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 1 }}
              defaultValue={businessData?.name || ""}
              onChange={handleChange}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mt: 2,
                mb: 1,
              }}
            >
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Save"
                )}
              </Button>
              <Button variant="outlined" onClick={onClose} disabled={loading}>
                Quit
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmationModal
        open={confirmation.open}
        onClose={handleConfirmationClose}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
      />
    </>
  );
};

export default BusinessModal;
