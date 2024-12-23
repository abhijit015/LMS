"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Alert,
  Snackbar,
} from "@mui/material";
import { userSchema } from "../utils/zodschema";
import { z } from "zod";
import { userSchemaT } from "../utils/models";
import ConfirmationModal from "../cap/modalForms/AskYesNo";
import Link from "next/link";
import { VisibilityOff, Visibility } from "@mui/icons-material";
import {
  checkIfMailExists,
  checkIfPhoneExists,
  saveOTPEntry,
  saveUser,
} from "../controllers/user.controller";
import { sendEmail, sendWhatsapp } from "../utils/notification";
import OTPModal from "../cap/modalForms/OTP";
import { useRouter } from "next/navigation";

const SignUp: React.FC = () => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [confirmation, setConfirmation] = useState({
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

  const [userData, setUserData] = useState<userSchemaT>();
  const [otpModal, setOtpModal] = useState({
    open: false,
    email: "",
    phone: "",
  });

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

  const router = useRouter();

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const handleOTPVerification = async (isVerified: boolean) => {
    let proceed: boolean = true;
    let errMsg: string = "";
    let result;

    setOtpModal({ open: false, email: "", phone: "" });
    setLoading(true);

    if (isVerified && userData) {
      if (proceed) {
        result = await saveUser(userData);
        if (!result.status) {
          errMsg = result.message;
          proceed = false;
        }
      }
    } else {
      errMsg = "User data is missing or OTP not verified.";
      proceed = false;
    }

    if (proceed) {
      setSnackbar({
        open: true,
        message: "Registration Successful. Redirecting to Sign In.",
        severity: "success",
      });
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } else {
      setSnackbar({
        open: true,
        message: errMsg,
        severity: "error",
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    let proceed: boolean = true;
    let errMsg: string = "";
    let parsedUserData: userSchemaT;
    let result;
    let emailOTP: string = "";
    let phoneOTP: string = "";

    try {
      setLoading(true);

      result = validateUserData(data as userSchemaT);
      if (result) {
        parsedUserData = result;
        setUserData(parsedUserData);
      } else {
        proceed = false;
        setLoading(false);
        return;
      }

      if (proceed) {
        result = await checkIfPhoneExists(parsedUserData.phone);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        result = await checkIfMailExists(parsedUserData.email);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        setLoading(false);

        proceed = await new Promise<boolean>((resolve) => {
          setConfirmation({
            open: true,
            title: "Confirmation",
            message:
              "An OTP would be sent to your Email ID and Phone Number for verification. Do you want to proceed for registration ?",
            onConfirm: () => {
              setLoading(true);
              setConfirmation({
                open: false,
                title: "",
                message: "",
                onConfirm: () => {},
                onClose: () => {},
              });
              resolve(true);
            },
            onClose: () => {
              proceed = false;
              setConfirmation({
                open: false,
                title: "",
                message: "",
                onConfirm: () => {},
                onClose: () => {},
              });
              resolve(false);
            },
          });
        });
      }

      if (proceed) {
        emailOTP = String(Math.floor(100000 + Math.random() * 900000));
        result = await sendEmail(
          parsedUserData.email,
          "LMS Email Verification",
          `<p>Your OTP for LMS email verification is <strong>${emailOTP}</strong></p>`
        );

        if (!result.status) {
          proceed = false;
          errMsg = result.message || "Failed to send Email.";
        }
      }

      if (proceed) {
        phoneOTP = String(Math.floor(100000 + Math.random() * 900000));
        result = await sendWhatsapp(parsedUserData.phone, phoneOTP);

        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        result = await saveOTPEntry(
          parsedUserData.email,
          parsedUserData.phone,
          emailOTP,
          phoneOTP
        );
      }

      if (proceed) {
        setOtpModal({
          open: true,
          email: parsedUserData.email,
          phone: parsedUserData.phone,
        });
      }

      if (!proceed && errMsg) {
        setSnackbar({
          open: true,
          message: errMsg,
          severity: "error",
        });
      }

      return {
        status: proceed,
        message: proceed ? "Success" : errMsg,
        data: null,
      };
    } catch (error) {
      console.error("Error during form submission:", error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        severity: "error",
      });

      return {
        status: false,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        data: null,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof userSchemaT) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
      setUserData(
        (prevData) =>
          ({
            ...prevData,
            [field]: event.target.value,
          } as userSchemaT)
      );
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
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 3,
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fefefe",
          padding: 4,
          border: "1px solid #ddd",
        }}
      >
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                fontWeight: "bold",
                color: "#005a9f",
                textAlign: "center",
              }}
            >
              Register with LMS
            </Typography>

            <TextField
              autoFocus
              name="name"
              label="Name"
              fullWidth
              size="medium"
              disabled={loading}
              autoComplete="off"
              required
              error={!!errors.name}
              helperText={errors.name}
              onChange={handleInputChange("name")}
              sx={{
                mb: 2,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              name="email"
              label="Email Address"
              fullWidth
              size="medium"
              disabled={loading}
              autoComplete="off"
              required
              error={!!errors.email}
              helperText={errors.email}
              onChange={handleInputChange("email")}
              type="email"
              sx={{
                mb: 2,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              name="phone"
              label="Contact Number"
              fullWidth
              type="number"
              size="medium"
              disabled={loading}
              required
              autoComplete="off"
              error={!!errors.phone}
              helperText={errors.phone}
              onChange={handleInputChange("phone")}
              sx={{
                mb: 2,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              name="password"
              label="Create Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              autoComplete="off"
              required
              size="medium"
              disabled={loading}
              error={!!errors.password}
              helperText={errors.password}
              onChange={handleInputChange("password")}
              sx={{
                mb: 3,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                      aria-label="toggle password visibility"
                      disabled={loading}
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
                height: 50,
                fontSize: "1rem",
                fontWeight: "bold",
                mb: 2,
                textTransform: "none",
                position: "relative",
                borderRadius: 3,
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Sign Up"
              )}
            </Button>

            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: "#555",
                textAlign: "center",
              }}
            >
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
          </form>
        </CardContent>
      </Card>

      <ConfirmationModal
        open={confirmation.open}
        onClose={() =>
          setConfirmation({
            open: false,
            title: "",
            message: "",
            onConfirm: () => {},
            onClose: () => {},
          })
        }
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
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
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <OTPModal
        open={otpModal.open}
        email={otpModal.email}
        phone={otpModal.phone}
        onClose={() => setOtpModal({ open: false, email: "", phone: "" })}
        onConfirm={handleOTPVerification}
      />
    </Box>
  );
};

export default SignUp;
