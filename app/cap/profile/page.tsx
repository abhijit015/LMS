"use client";

import React, { useState } from "react";
import Layout from "../layout";
import { MSG_NORMAL } from "@/app/utils/constants";
import ConfirmationModal from "../modalForms/AskYesNo";
import MessageModal from "../modalForms/ShowMsg";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [messageModal, setMessageModal] = useState({
    open: false,
    title: "",
    message: "",
    type: MSG_NORMAL,
  });
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmationModal({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const showMessage = (title: string, message: string, type: number) => {
    setMessageModal({
      open: true,
      title,
      message,
      type,
    });
  };

  return (
    <Layout title="My Profile" loading={loading}>
      <Card
        sx={{
          maxWidth: 600,
          width: "100%",
          marginLeft: 0,
          marginRight: "auto",
          borderRadius: 2,
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Basic Information
          </Typography>
          <TextField
            fullWidth
            autoComplete="off"
            label="Display Name"
            name="name"
            size="small"
            margin="normal"
            required
          />
          <TextField
            fullWidth
            autoComplete="off"
            label="Email"
            name="name"
            size="small"
            margin="normal"
            required
          />
          <TextField
            fullWidth
            autoComplete="off"
            label="Phone"
            name="name"
            size="small"
            margin="normal"
            required
            sx={{ mb: 4 }}
          />

          <Box
            component="form"
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", gap: 3 }}>
              <Button color="primary">Reset</Button>
              <Button variant="contained">Save</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4 }}>
        <Card
          sx={{
            maxWidth: 600,
            width: "100%",
            marginLeft: 0,
            marginRight: "auto",
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Security
            </Typography>
            <Button
              variant="outlined"
              onClick={() =>
                showMessage(
                  "Change Password",
                  "Password change functionality not implemented yet",
                  MSG_NORMAL
                )
              }
            >
              Change Password
            </Button>
          </CardContent>
        </Card>
      </Box>

      <ConfirmationModal
        open={confirmationModal.open}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, open: false })
        }
        onConfirm={() => {
          confirmationModal.onConfirm();
          setConfirmationModal({ ...confirmationModal, open: false });
        }}
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
    </Layout>
  );
};

export default Profile;
