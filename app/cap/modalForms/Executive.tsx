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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { loadDepartmentList } from "@/app/controllers/department.controller";
import { loadRoleList } from "@/app/controllers/role.controller";
import {
  executiveSchemaT,
  inviteSchemaT,
  userSchemaT,
} from "@/app/utils/models";
import { executiveSchema } from "@/app/utils/zodschema";
import ConfirmationModal from "./AskYesNo";
import CloseIcon from "@mui/icons-material/Close";

import {
  loadExecutive,
  saveExecutive,
} from "@/app/controllers/executive.controller";
import { initExecutiveData, inviteStatusId2Name } from "@/app/utils/common";
import { loadInvite } from "@/app/controllers/invite.controller";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {
  INVITE_STATUS_PENDING,
  INVITE_STATUS_ACCEPTED,
} from "@/app/utils/constants";
import theme from "../theme/theme";

interface ExecutiveModalProps {
  open: boolean;
  executiveId?: number;
  onClose: () => void;
  onSave: () => void;
}

const ExecutiveModal: React.FC<ExecutiveModalProps> = ({
  open,
  executiveId,
  onClose,
  onSave,
}) => {
  const [executiveData, setExecutiveData] = useState<executiveSchemaT>(
    initExecutiveData()
  );
  const [inviteData, setInviteData] = useState<inviteSchemaT | null>(null);
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedDepartment, setSelectedDepartment] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [contactIdentifierModified, setContactIdentifierModified] =
    useState(false);
  const [selectedRole, setSelectedRole] = useState<{
    id: number;
    name: string;
  } | null>(null);
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
    const fetchDepartments = async () => {
      try {
        const result = await loadDepartmentList();
        if (result.status) {
          setDepartments(result.data);
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
          message: handleErrorMsg(error),
          severity: "error",
        });
      }
    };

    if (open) {
      fetchDepartments();
    }
  }, [open]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const result = await loadRoleList();
        if (result.status) {
          setRoles(result.data);
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
          message: handleErrorMsg(error),
          severity: "error",
        });
      }
    };

    if (open) {
      fetchRoles();
    }
  }, [open]);

  useEffect(() => {
    const fetchExecutiveData = async () => {
      let errMsg: string = "";
      let proceed: boolean = true;
      let result: { status: boolean; data: any; message: string } | null = null;

      try {
        setLoading(true);
        if (proceed && executiveId) {
          result = await loadExecutive(executiveId);
          if (result.status) {
            setExecutiveData(result.data as executiveSchemaT);
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (proceed && result?.data.invite_id) {
          result = await loadInvite(result.data.invite_id);
          if (result.status) {
            setInviteData(result.data as inviteSchemaT);
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
      fetchExecutiveData();
      hasLoadedData.current = true;
    } else if (!open) {
      setExecutiveData(initExecutiveData());
      setInviteData(null);
      setErrors({});
      setSelectedDepartment(null);
      setSelectedRole(null);
      setContactIdentifierModified(false);
      hasLoadedData.current = false;
    }
  }, [executiveId, open]);

  useEffect(() => {
    if (departments.length > 0 && executiveData.department_id) {
      const dept = departments.find(
        (d) => d.id === executiveData.department_id
      );
      setSelectedDepartment(dept || null);
    }
  }, [departments, executiveData.department_id]);

  useEffect(() => {
    if (roles.length > 0 && executiveData.role_id) {
      const role = roles.find((d) => d.id === executiveData.role_id);
      setSelectedRole(role || null);
    }
  }, [roles, executiveData.role_id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedDepartment) {
      setErrors((prev) => ({
        ...prev,
        department: "Department is required",
      }));
      return;
    }

    if (!selectedRole) {
      setErrors((prev) => ({
        ...prev,
        role: "Role is required",
      }));
      return;
    }

    let baseData: Record<string, any> = executiveId ? { ...executiveData } : {};

    const formData = new FormData(e.currentTarget);
    formData.forEach((value, key) => {
      baseData[key] = value;
    });

    baseData.department_id = selectedDepartment.id;
    baseData.role_id = selectedRole.id;

    if (!executiveData || contactIdentifierModified) {
      baseData.send_invitation = true;
    } else {
      baseData.send_invitation = formData.has("send_invitation");
    }

    let result = executiveSchema.safeParse(baseData);

    console.log("result : ", result);

    if (result.success) {
      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this executive?",
        onConfirm: () => confirmSave(result.data),
        onClose: () => {},
      });
    } else {
      const validationErrors = result.error.errors.reduce((acc, curr) => {
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

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value.trim() === executiveData.contact_identifier.trim()) {
      setContactIdentifierModified(false);
    } else {
      setContactIdentifierModified(true);
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const confirmSave = async (parsedExecutiveData: executiveSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal((prev) => ({ ...prev, open: false }));
      const result = await saveExecutive(parsedExecutiveData);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Executive saved successfully.",
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
        message: "Error saving executive data.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
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
            width: "500px",
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
              {executiveId ? (
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
                {executiveId ? "Edit Executive" : "Add Executive"}
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
              label="Name"
              name="name"
              size="small"
              margin="normal"
              disabled={loading}
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 3 }}
              defaultValue={executiveData.name}
              onChange={handleChange}
            />

            <Autocomplete
              id="department-select"
              options={departments}
              getOptionLabel={(option) => option.name}
              value={selectedDepartment}
              onChange={(_, newValue) => {
                setSelectedDepartment(newValue);
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.department;
                  return newErrors;
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Department"
                  required
                  size="small"
                  error={!!errors.department}
                  helperText={errors.department}
                  sx={{ mb: 3 }}
                />
              )}
              disabled={loading}
            />

            <Autocomplete
              id="role-select"
              options={roles}
              getOptionLabel={(option) => option.name}
              value={selectedRole}
              onChange={(_, newValue) => {
                setSelectedRole(newValue);
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.role;
                  return newErrors;
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Role"
                  required
                  size="small"
                  error={!!errors.role}
                  helperText={errors.role}
                  // sx={{ mb: 1 }}
                />
              )}
              disabled={loading}
            />

            <Box
              sx={{
                border: "1px solid #ccc",
                borderRadius: 2,
                padding: 2,
                mt: 3,
                position: "relative",
              }}
            >
              <legend
                style={{
                  fontSize: "0.95rem",
                  padding: "0 10px",
                  position: "absolute",
                  top: "-12px",
                  left: "10px",
                  backgroundColor: "#fff",
                  paddingRight: "10px",
                  color: theme.palette.secondary.dark,
                }}
              >
                Contact Details
              </legend>

              <TextField
                fullWidth
                autoComplete="off"
                label="Name"
                name="contact_name"
                size="small"
                margin="normal"
                disabled={loading}
                required
                error={!!errors.contact_name}
                helperText={errors.contact_name}
                sx={{ mb: 1 }}
                defaultValue={executiveData.contact_name}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                required
                autoComplete="off"
                label="Email or Phone"
                name="contact_identifier"
                size="small"
                margin="normal"
                disabled={loading}
                error={!!errors.contact_identifier}
                helperText={errors.contact_identifier}
                sx={{ mb: 2 }}
                defaultValue={executiveData.contact_identifier}
                onChange={handleContactChange}
              />

              {(!executiveId || contactIdentifierModified) && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "error.dark",
                    fontSize: "0.93rem",
                  }}
                >
                  An invitation will be sent to this contact upon saving.
                </Typography>
              )}

              <FormGroup
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  // mt: 1,
                }}
              >
                {executiveId && inviteData && !contactIdentifierModified && (
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        inviteData.status === INVITE_STATUS_ACCEPTED
                          ? "success.main"
                          : "error.main",
                      fontSize: "0.93rem",
                    }}
                  >
                    Invite Status: {inviteStatusId2Name(inviteData.status)}
                  </Typography>
                )}

                {inviteData?.status !== INVITE_STATUS_ACCEPTED &&
                  !contactIdentifierModified &&
                  executiveId && (
                    <FormControlLabel
                      control={<Checkbox defaultChecked disabled={loading} />}
                      label="Resend Invitation"
                      name="send_invitation"
                    />
                  )}
              </FormGroup>
            </Box>
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
          setConfirmationModal((prev) => ({ ...prev, open: false }))
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

export default ExecutiveModal;
