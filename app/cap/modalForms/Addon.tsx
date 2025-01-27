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
import { saveAddon, loadAddon } from "@/app/controllers/addon.controller";
import { addonSchemaT } from "@/app/utils/models";
import { addonSchema } from "@/app/utils/zodschema";
import ConfirmationModal from "./AskYesNo";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import SaveIcon from "@mui/icons-material/Save";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface AddonModalProps {
  addonId?: number;
  onClose: () => void;
  onSave: () => void;
}

const AddonModal: React.FC<AddonModalProps> = ({
  addonId,
  onClose,
  onSave,
}) => {
  const [addonData, setAddonData] = useState<addonSchemaT | null>(null);
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
    const fetchAddonData = async () => {
      try {
        let proceed = true;
        let errMsg = "";
        let result;

        if (proceed && addonId) {
          result = await loadAddon(addonId);
          console.log(result);
          if (result.status) {
            setAddonData(result.data as addonSchemaT);
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

    if (!hasLoadedData.current) {
      fetchAddonData();
      hasLoadedData.current = true;
    } else if (!open) {
      setAddonData(null);
      setErrors({});
      hasLoadedData.current = false;
    }
  }, [addonId, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let baseData: Record<string, any> = addonId ? { ...addonData } : {};

    const formData = new FormData(e.currentTarget);
    formData.forEach((value, key) => {
      baseData[key] = value;
    });

    if (addonId) {
      baseData = {
        ...addonData,
        ...Object.fromEntries(formData.entries()),
      };
    } else {
      baseData = {
        ...Object.fromEntries(formData.entries()),
      };
    }

    let addonResult = addonSchema.safeParse(baseData);

    if (addonResult.success) {
      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this addon?",
        onConfirm: () => confirmSave(addonResult.data),
        onClose: () => {},
      });
    } else {
      const validationErrors = addonResult.error.errors.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {} as { [key: string]: string });
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

  const confirmSave = async (parsedAddonData: addonSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveAddon(parsedAddonData);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Addon saved successfully.",
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
        message: "Error saving addon data.",
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
              {addonId ? (
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
                {addonId ? "Edit Addon" : "Add Addon"}
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

          <Divider />

          <form onSubmit={handleSubmit}>
            {" "}
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
              sx={{ mb: 3, mt: 3 }}
              defaultValue={addonData?.name || ""}
              onChange={handleChange}
            />
            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 1 }}
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

export default AddonModal;
