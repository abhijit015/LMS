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
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import {
  saveDepartment,
  loadDepartment,
} from "@/app/controllers/department.controller";
import { departmentSchemaT, userSchemaT } from "@/app/utils/models";
import { departmentSchema, userSchema } from "@/app/utils/zodschema";
import ConfirmationModal from "./AskYesNo";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

interface DepartmentModalProps {
  open: boolean;
  departmentId?: number;
  onClose: () => void;
  onSave: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  open,
  departmentId,
  onClose,
  onSave,
}) => {
  const [departmentData, setDepartmentData] =
    useState<departmentSchemaT | null>(null);
  const [loading, setLoading] = useState(false);
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
    const fetchDepartmentData = async () => {
      let errMsg: string = "";
      let proceed: boolean = true;
      let result;

      try {
        if (proceed && departmentId) {
          setLoading(true);
          result = await loadDepartment(departmentId);
          if (result.status) {
            setDepartmentData(result.data as departmentSchemaT);
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

    if (open && !hasLoadedData.current) {
      fetchDepartmentData();
      hasLoadedData.current = true;
    } else if (!open) {
      setDepartmentData(null);
      setErrors({});
      hasLoadedData.current = false;
    }
  }, [departmentId, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let baseData: Record<string, any> = departmentId
      ? { ...departmentData }
      : {};

    const formData = new FormData(e.currentTarget);
    formData.forEach((value, key) => {
      baseData[key] = value;
    });

    let departmentResult = departmentSchema.safeParse(baseData);

    if (departmentResult.success) {
      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this department?",
        onConfirm: () => confirmSave(departmentResult.data),
        onClose: () => {},
      });
    } else {
      const validationErrors = departmentResult.error.errors.reduce(
        (acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        },
        {} as { [key: string]: string }
      );
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

  const confirmSave = async (parsedDepartmentData: departmentSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveDepartment(parsedDepartmentData);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Department saved successfully.",
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
        message: "Error saving department data.",
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
            width: "450px",
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
              {departmentId ? (
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
                {departmentId ? "Edit Department" : "Add Department"}
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
              label="Name"
              name="name"
              size="small"
              margin="normal"
              disabled={loading}
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 2 }}
              defaultValue={departmentData?.name || ""}
              onChange={handleChange}
            />

            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}
            >
              <Button type="submit" variant="contained" disabled={loading}>
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

export default DepartmentModal;
