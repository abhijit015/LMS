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
  Typography,
  Box,
} from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";

const Settings = () => {
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
            Settings
          </Typography>

          <form ref={formRef}>
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

export default Settings;
