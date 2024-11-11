import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  IconButton,
  Divider,
  InputAdornment,
} from "@mui/material";
import { saveUser, loadUser } from "@/app/controllers/user.controller";
import { userSchemaT } from "@/app/utils/models";
import { userSchema } from "@/app/utils/zodschema";
import ConfirmationModal from "./AskYesNo";
import MessageModal from "./ShowMsg";
import CloseIcon from "@mui/icons-material/Close";
import {
  MSG_ERROR,
  MSG_NORMAL,
  USER_TYPE_DEALER,
  USER_TYPE_SUB_USER,
} from "@/app/utils/constants";
import { z } from "zod";
import { VisibilityOff, Visibility } from "@mui/icons-material";

interface UserModalProps {
  open: boolean;
  userId?: number;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({
  open,
  userId,
  onClose,
  onSave,
}) => {
  const [userData, setUserData] = useState<userSchemaT | null>(null);
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

  const [showPassword, setShowPassword] = useState(false);
  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchUserData = async () => {
      let errMsg: string = "";
      let proceed: boolean = true;
      let result;

      try {
        if (proceed && userId) {
        
          result = await loadUser(userId);
          if (result.status) {
            setUserData(result.data as userSchemaT);
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
            type: MSG_NORMAL,
          });
        }
      } catch (error) {
        setMessageModal({
          open: true,
          title: "Error",
          message: String(error),
          type: MSG_NORMAL,
        });
      } finally {
        setLoading(false); 
      }
    };

    if (open && !hasLoadedData.current) {
      setLoading(true);  
      fetchUserData();  
      hasLoadedData.current = true;  
    } else if (!open) {
      setUserData(null);  
      setErrors({});  
      hasLoadedData.current = false; 
    }
  }, [userId, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    data.user_type = USER_TYPE_SUB_USER;

    const result = userSchema.safeParse(data);

    if (result.success) {
      const parsedData = result.data;

      if (userId) {
        parsedData.id = userId;
      }

      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this user?",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const confirmSave = async (parsedData: userSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveUser(parsedData);
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
        message: "Error saving user data.",
        type: MSG_ERROR,
      });
    } finally {
      setLoading(false);
    }
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
            width: 320,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
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
            <Typography
              variant="h6"
              component="h2"
              sx={{
                color: "primary.main",
                textAlign: "left",
                fontWeight: "normal",
              }}
            >
              {userId ? "Edit User" : "Add User"}
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
              fullWidth
              autoComplete="off"
              label="Email"
              name="email"
              size="small"
              margin="normal"
              required
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 1 }}
              defaultValue={userData?.email || ""}
              onChange={handleChange}
              autoFocus
            />
            <TextField
              fullWidth
              autoComplete="off"
              label="Phone"
              name="phone"
              size="small"
              margin="normal"
              error={!!errors.phone}
              helperText={errors.phone}
              sx={{ mb: 1 }}
              defaultValue={userData?.phone || ""}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              autoComplete="off"
              label="Display Name"
              name="display_name"
              size="small"
              margin="normal"
              required
              error={!!errors.display_name}
              helperText={errors.display_name}
              sx={{ mb: 1 }}
              defaultValue={userData?.display_name || ""}
              onChange={handleChange}
            />
            {!userId && (
              <TextField
                fullWidth
                autoComplete="off"
                label="Password"
                name="password"
                size="small"
                margin="normal"
                required
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mb: 1 }}
                defaultValue={""}
                type={showPassword ? "text" : "password"}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}
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

export default UserModal;
