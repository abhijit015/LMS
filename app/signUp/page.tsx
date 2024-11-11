"use client";

import React, { useState } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { userSchema } from "../utils/zodschema";
import { clientSchema } from "../utils/zodschema";
import { z } from "zod";
import { clientSchemaT, userSchemaT } from "../utils/models";
import {
  MSG_ERROR,
  MSG_NORMAL,
  MSG_SUCCESS,
  USER_TYPE_CLIENT,
} from "../utils/constants";
import ConfirmationModal from "../cap/modalForms/AskYesNo";
import MessageModal from "../cap/modalForms/ShowMsg";
import { saveClient } from "../controllers/client.controller";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VisibilityOff, Visibility } from "@mui/icons-material";

const SignUp: React.FC = () => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [confirmation, setConfirmation] = useState({
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

  const [userData, setUserData] = useState<userSchemaT>({
    email: "",
    password: "",
    display_name: "",
    user_type: USER_TYPE_CLIENT,
  });

  const [clientData, setClientData] = useState<clientSchemaT>({});

  const validateUserData = (data: userSchemaT) => {
    try {
      const parsedData = userSchema.parse(data);
      setErrors({});
      return parsedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: { [key: string]: string } = {};
        error.errors.forEach((issue) => {
          validationErrors[issue.path[0]] = issue.message;
        });
        setErrors(validationErrors);
      }
      return null;
    }
  };

  const validateClientData = (data: clientSchemaT) => {
    try {
      const parsedData = clientSchema.parse(data);
      setErrors({});
      return parsedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: { [key: string]: string } = {};
        error.errors.forEach((issue) => {
          validationErrors[issue.path[0]] = issue.message;
        });
        setErrors(validationErrors);
      }
      return null;
    }
  };

  const handleConfirm = async () => {
    setConfirmation({
      open: false,
      title: "",
      message: "",
      onConfirm: () => {},
    });
    setLoading(true);

    try {
      const result = await saveClient(clientData, userData);
      if (result.status) {
        setMessageModal({
          open: true,
          title: "Success",
          message: "Sign up successful! Redirecting...",
          type: MSG_SUCCESS,
        });
        setTimeout(() => {
          redirect("/");
        }, 2000);
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
        message:
          error instanceof Error ? error.message : "Error during sign up.",
        type: MSG_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const data: Record<string, any> = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    data.user_type = USER_TYPE_CLIENT;

    const parsedUserData = validateUserData(data as userSchemaT);
    if (!parsedUserData) return;

    const parsedClientData = validateClientData({
      contact_person: data.contact_person,
    } as clientSchemaT);
    if (!parsedClientData) return;

    setUserData(parsedUserData);
    setClientData(parsedClientData);
    setConfirmation({
      open: true,
      title: "Confirm",
      message: "Proceed with sign-up?",
      onConfirm: handleConfirm,
    });
  };

  const handleInputChange =
    (field: keyof userSchemaT) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
      setUserData((prevData) => ({
        ...prevData,
        [field]: event.target.value,
      }));
    };

  const handleClientInputChange =
    (field: keyof clientSchemaT) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setClientData((prevData) => ({
        ...prevData,
        [field]: event.target.value,
      }));
    };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
      }}
    >
      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: 400,
            padding: 4,
            backgroundColor: "#fff",
            borderRadius: 2,
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h5"
            sx={{ mb: 3, fontWeight: "600", color: "#333" }}
          >
            Register Now With LMS
          </Typography>

          <TextField
            name="display_name"
            label="Client Name"
            fullWidth
            size="small"
            autoComplete="off"
            required
            error={!!errors.display_name}
            helperText={errors.display_name}
            onChange={handleInputChange("display_name")}
            sx={{ mb: 2 }}
            autoFocus
          />

          <TextField
            name="email"
            label="Email"
            fullWidth
            size="small"
            autoComplete="off"
            required
            error={!!errors.email}
            helperText={errors.email}
            onChange={handleInputChange("email")}
            sx={{ mb: 2 }}
          />

          <TextField
            name="phone"
            label="Phone Number"
            fullWidth
            size="small"
            autoComplete="off"
            error={!!errors.phone}
            helperText={errors.phone}
            onChange={handleInputChange("phone")}
            sx={{ mb: 2 }}
          />

          <TextField
            name="contact_person"
            label="Contact Person"
            fullWidth
            size="small"
            autoComplete="off"
            error={!!errors.contact_person}
            helperText={errors.contact_person}
            onChange={handleClientInputChange("contact_person")}
            sx={{ mb: 2 }}
          />

          <TextField
            name="password"
            label="Password"
            type="password"
            fullWidth
            autoComplete="off"
            required
            size="small"
            error={!!errors.password}
            helperText={errors.password}
            onChange={handleInputChange("password")}
            sx={{ mb: 3 }}
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

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{
              height: 48,
              fontSize: "1rem",
              fontWeight: "bold",
              mb: 2,
              position: "relative",
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Sign Up"
            )}
          </Button>

          <Typography variant="body2" sx={{ mt: 2, color: "#555" }}>
            Already have an account?{" "}
            <Link href="/" passHref>
              <Typography
                component="span"
                sx={{
                  color: "#005a9f",
                  fontWeight: "bold",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Sign In
              </Typography>
            </Link>
          </Typography>
        </Box>
      </form>

      <ConfirmationModal
        open={confirmation.open}
        onClose={() =>
          setConfirmation({
            open: false,
            title: "",
            message: "",
            onConfirm: () => {},
          })
        }
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
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
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
      />
    </Box>
  );
};

export default SignUp;
