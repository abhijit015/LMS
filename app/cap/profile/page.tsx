"use client";
import { handleErrorMsg } from "@/app/utils/common";

import React, { useState, useRef, useEffect } from "react";
import Layout from "../layout";
import ConfirmationModal from "../modalForms/AskYesNo";
import {
  Card,
  CardContent,
  Button,
  Alert,
  Snackbar,
  TextField,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { getCurrentUserDet, saveUser } from "@/app/controllers/user.controller";
import { userSchemaT } from "@/app/utils/models";
import { userSchema } from "@/app/utils/zodschema";
import CategoryIcon from "@mui/icons-material/Category";

const Profile = () => {
  const [userData, setUserData] = useState<userSchemaT | null>(null);
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
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let result;
    let proceed: boolean = true;
    let errMsg: string = "";

    if (!hasLoadedData.current) {
      hasLoadedData.current = true;

      const fetchUserData = async () => {
        try {
          setLoading(true);
          if (proceed) {
            result = await getCurrentUserDet();
            console.log("result : ", result);
            if (result.status) {
              setUserData(result.data);
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

      fetchUserData();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    let data: Record<string, any>;

    data = {
      ...userData,
      ...Object.fromEntries(formData.entries()),
    };

    let result = userSchema.safeParse(data);

    console.log("result :", result);

    if (result.success) {
      setConfirmation({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save these details?",
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

  const confirmSave = async (parsedUserData: userSchemaT) => {
    try {
      setLoading(true);
      setConfirmation((prev) => ({ ...prev, open: false }));
      const result = await saveUser(parsedUserData);
      if (result.status) {
        // setSnackbar({
        //   open: true,
        //   message: "Details updated successfully.",
        //   severity: "success",
        // });

        window.location.reload();
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
        message: "Error saving dealer data.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const infoItemStyle = {
    display: "grid",
    gridTemplateColumns: "72px 1fr",
    alignItems: "center",
    mb: 1,
  };

  const labelStyle = {
    fontWeight: "bold",
  };

  return (
    <Layout loading={loading}>
      <Card
        sx={{
          height: "auto",
          borderRadius: 3,
          border: "1px solid #ddd",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
          mb: 2,
          width: "100%",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CategoryIcon />
            My Profile
          </Typography>

          <form ref={formRef} onSubmit={handleSubmit}>
            <TextField
              label="Name"
              name="name"
              size="small"
              margin="normal"
              disabled={loading}
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 2 }}
              defaultValue={userData?.name || ""}
              onChange={handleChange}
            />

            <Box sx={infoItemStyle}>
              <Typography sx={labelStyle}>Phone:</Typography>
              <Typography>
                {userData?.phone || ""}
                <IconButton size="small">
                  <EditIcon fontSize="inherit" />
                </IconButton>
              </Typography>
            </Box>

            <Box sx={infoItemStyle}>
              <Typography sx={labelStyle}>Email:</Typography>
              <Typography>
                {userData?.email || ""}
                <IconButton size="small">
                  <EditIcon fontSize="inherit" />
                </IconButton>
              </Typography>
            </Box>

            <Typography
              variant="body2"
              color="primary"
              sx={{
                mt: 2,
                cursor: "pointer",
                "&:hover": {
                  color: "error.main",
                },
              }}
            >
              Change Password
            </Typography>

            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}
            >
              <Button variant="contained" disabled={loading} type="submit">
                Save
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <ConfirmationModal
        open={confirmation.open}
        onClose={handleConfirmationClose}
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
          sx={{ width: "100%", border: "1px solid", borderRadius: 1 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default Profile;
