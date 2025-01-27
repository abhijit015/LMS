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
import { roleSchema } from "@/app/utils/zodschema";
import { roleSchemaT } from "@/app/utils/models";
import { saveRole, loadRole } from "@/app/controllers/role.controller";
import ConfirmationModal from "./AskYesNo";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";

interface RoleModalProps {
  roleId: number | null;
  onClose: () => void;
  onSave: () => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ roleId, onClose, onSave }) => {
  const [roleData, setRoleData] = useState<roleSchemaT | null>(null);
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
    const fetchRoleData = async () => {
      if (roleId) {
        setLoading(true);
        try {
          const result = await loadRole(roleId);
          if (result.status) {
            setRoleData(result.data as roleSchemaT);
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
            message: "Error fetching Role data.",
            severity: "error",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    if (!hasLoadedData.current) {
      fetchRoleData();
      hasLoadedData.current = true;
    } else if (!open) {
      setRoleData(null);
      setErrors({});
      hasLoadedData.current = false;
    }
  }, [roleId, open]);

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

  const handleSaveRole = async (data: roleSchemaT) => {
    handleConfirmationClose();
    setLoading(true);
    try {
      const result = await saveRole(data);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Role saved successfully.",
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
        message: "Error saving Role data.",
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

    if (roleId && roleData) {
      data = {
        ...roleData,
        ...Object.fromEntries(formData.entries()),
      };
    } else {
      data = Object.fromEntries(formData.entries());
    }

    const result = roleSchema.safeParse(data);

    if (result.success) {
      setErrors({});
      setConfirmation({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this role data?",
        onConfirm: () => handleSaveRole(result.data),
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
            width: "400px",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
            outline: "none",
            textAlign: "center",
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
              {roleId ? (
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
                {roleId ? "Edit Role" : "Add Role"}
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
              label=" Role Name"
              name="name"
              size="small"
              margin="normal"
              disabled={loading}
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 1 }}
              defaultValue={roleData?.name || ""}
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
          sx={{ width: "100%", border: "1px solid", borderRadius: 1 }}
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

export default RoleModal;
