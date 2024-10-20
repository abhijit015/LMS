"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Button,
  TextField,
  Box,
  Container,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Link,
  Backdrop,
  CircularProgress,
  Typography,
  Fade,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ErrorOutline from "@mui/icons-material/ErrorOutline";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Both email and password are required.");
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/cap/dashboard");
    }

    setLoading(false);
  };

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box
        sx={{
          background: "linear-gradient(135deg, #005a9f 30%, #e05a5a 100%)",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 2,
        }}
      >
        <Container component="main" maxWidth="sm">
          {" "}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Card
              sx={{
                minWidth: "100%",
                maxWidth: 500,
                borderRadius: 3,
                padding: 4,
                backgroundColor: "#ffffff",
                boxShadow: "0 8px 24px rgba(0, 90, 159, 0.3)",
                border: "1px solid rgba(0, 90, 159, 0.2)",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-5px)",
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 3,
                  }}
                >
                  <img
                    src="https://algofast.in/images/logo.png"
                    alt="Company Logo"
                    style={{ width: "160px" }}
                  />
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    type="username"
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="off"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: "#f9f9f9",
                        "& fieldset": {
                          borderColor: "rgba(0, 90, 159, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "#005a9f",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#005a9f",
                        },
                      },
                      "& label.Mui-focused": {
                        color: "#005a9f",
                      },
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: "#f9f9f9",
                        "& fieldset": {
                          borderColor: "rgba(0, 90, 159, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "#005a9f",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#005a9f",
                        },
                      },
                      "& label.Mui-focused": {
                        color: "#005a9f",
                      },
                    }}
                  />
                  <Link
                    href="#"
                    variant="body2"
                    sx={{
                      float: "right",
                      mt: 1,
                      color: "#e05a5a",
                      textDecoration: "none",
                      fontWeight: 500,
                      "&:hover": {
                        textDecoration: "underline",
                        color: "#ff7676",
                      },
                    }}
                  >
                    Forgot Password?
                  </Link>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.5,
                      fontWeight: "bold",
                      backgroundColor: "#005a9f",
                      color: "#fff",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                      "&:hover": {
                        backgroundColor: "#004080",
                      },
                    }}
                  >
                    Sign In
                  </Button>
                </Box>

                {error && (
                  <Fade in={Boolean(error)} timeout={500}>
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ErrorOutline
                        sx={{ mr: 1, color: "#e05a5a", fontSize: 24 }}
                      />
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#e05a5a",
                          fontWeight: 500,
                        }}
                      >
                        {error}
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default SignIn;
