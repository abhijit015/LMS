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
  Card,
  CardContent,
} from "@mui/material";
import { loadUser, validateUser } from "../controllers/user.controller";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MessageModal from "../cap/modalForms/ShowMsg";
import { MSG_ERROR, MSG_NORMAL } from "../utils/constants";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const SignIn: React.FC = () => {
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: number;
  }>({
    open: false,
    title: "",
    message: "",
    type: MSG_NORMAL,
  });
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
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username: string = formData.get("username") as string;
    const password: string = formData.get("password") as string;

    if (!validateData(username, password)) return;

    setLoading(true);

    try {
      const validationResponse = await validateUser(username, password);
      if (validationResponse.status) {
        router.push("/cap/dashboard");
      } else {
        setModal({
          open: true,
          title: "Error",
          message: validationResponse.message,
          type: MSG_ERROR,
        });
      }
    } catch (error) {
      setModal({
        open: true,
        title: "Error",
        message:
          error instanceof Error ? error.message : "Error while signing in.",
        type: MSG_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setModal((prevState) => ({ ...prevState, open: false }));
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
          maxWidth: 500,
          borderRadius: 2,
          margin: "0 auto",
        }}
      >
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                fontWeight: "bold",
                color: "#333",
                fontSize: "1.6rem",
              }}
            >
              Sign In
            </Typography>

            <TextField
              variant="standard"
              name="username"
              label="Email or Phone"
              fullWidth
              size="medium"
              autoComplete="off"
              required
              error={!!errors.username}
              helperText={errors.username}
              sx={{ mb: 2, borderRadius: 1 }}
              autoFocus
            />

            <TextField
              variant="standard"
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              size="medium"
              autoComplete="off"
              required
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 3, borderRadius: 1 }}
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
                borderRadius: 1,
                backgroundColor: "#005a9f",
                "&:hover": {
                  backgroundColor: "#004a87",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Sign In"
              )}
            </Button>

            <Typography variant="body2" sx={{ mt: 2, color: "#555" }}>
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

          <MessageModal
            open={modal.open}
            onClose={handleModalClose}
            title={modal.title}
            message={modal.message}
            type={modal.type}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default SignIn;
