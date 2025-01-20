"use client";
import { handleErrorMsg } from "@/app/utils/common";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { validateSignIn } from "../controllers/user.controller";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { checkIfBusinessLoggedIn } from "../controllers/business.controller";

const SignIn: React.FC = () => {
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const validateData = (username: string, password: string): boolean => {
    const validationErrors: { username?: string; password?: string } = {};
    if (!username.trim()) validationErrors.username = "Username is required";
    if (!password.trim()) validationErrors.password = "Password is required";
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    let result;
    let proceed: boolean = true;
    let errMsg: string = "";

    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!validateData(username, password)) return;

    setLoading(true);

    try {
      if (proceed) {
        result = await validateSignIn(username, password);

        if (!result.status) {
          setSnackbar({
            open: true,
            message: result.message,
            severity: "error",
          });
        }
      }

      if (proceed) {
        result = await checkIfBusinessLoggedIn();
        if (result.status) {
          router.push("/cap/dashboard");
        } else {
          router.push("/cap/business");
        }
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

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const togglePasswordVisibility = () => {
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
              Sign In to LMS
            </Typography>

            <TextField
              autoFocus
              name="username"
              label="Email or Phone"
              fullWidth
              size="medium"
              disabled={loading}
              autoComplete="off"
              required
              error={!!errors.username}
              helperText={errors.username}
              sx={{
                mb: 2,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              size="medium"
              disabled={loading}
              autoComplete="off"
              required
              error={!!errors.password}
              helperText={errors.password}
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
                      onClick={togglePasswordVisibility}
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
                "Sign In"
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
              Don't have an account?{" "}
              <Link href="/signUp" passHref>
                <Typography
                  component="span"
                  sx={{
                    color: "#005a9f",
                    fontWeight: "bold",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Sign Up
                </Typography>
              </Link>
            </Typography>
          </form>
        </CardContent>
      </Card>

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
    </Box>
  );
};

export default SignIn;
