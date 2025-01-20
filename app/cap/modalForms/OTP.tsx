import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { validateOTP } from "@/app/controllers/user.controller";
import { handleErrorMsg } from "@/app/utils/common";

interface OTPModalProps {
  open: boolean;
  email: string;
  phone: string;
  onClose: () => void;
  onConfirm: (isVerified: boolean) => void;
}

const OTPModal: React.FC<OTPModalProps> = ({
  open,
  email,
  phone,
  onClose,
  onConfirm,
}) => {
  const [emailOTP, setEmailOTP] = useState<string>("");
  const [phoneOTP, setPhoneOTP] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const handleOnClose = () => {
    setEmailOTP("");
    setPhoneOTP("");
    onClose();
  };

  const handleConfirm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let proceed: boolean = true;
    let errMsg: string = "";

    setLoading(true);

    try {
      if (proceed) {
        if (emailOTP.trim().length !== 6 || phoneOTP.trim().length !== 6) {
          proceed = false;
          errMsg = "Both OTPs must be 6 digits long.";
        }
      }

      if (proceed) {
        let result = await validateOTP(email, phone, emailOTP, phoneOTP);

        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        onConfirm(true);
        setEmailOTP("");
        setPhoneOTP("");
      } else {
        setSnackbar({
          open: true,
          message: errMsg,
          severity: "error",
        });
      }

      setLoading(false);
    } catch (error) {
      proceed = false;
      errMsg = handleErrorMsg(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleOnClose}
        BackdropProps={{
          onClick: (event) => event.stopPropagation(),
        }}
        aria-labelledby="otp-modal-title"
        aria-describedby="otp-modal-message"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 420,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 3,
            outline: "none",
            textAlign: "center",
            border: "1px solid",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              id="otp-modal-title"
              variant="h6"
              component="h2"
              sx={{
                color: "primary.main",
                textAlign: "left",
                flexGrow: 1,
              }}
            >
              OTP Verification
            </Typography>
            <IconButton
              onClick={handleOnClose}
              disabled={loading}
              sx={{
                color: "text.primary",
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography
            id="otp-modal-message"
            variant="body1"
            sx={{
              mb: 4,
              color: "text.secondary",
              textAlign: "center",
            }}
          >
            Please enter the OTPs sent to your Email and Phone. They are valid
            for next 5 minutes only.
          </Typography>

          <form onSubmit={handleConfirm}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mb: 4,
                justifyContent: "center",
              }}
            >
              <TextField
                autoFocus
                type="number"
                required
                label="Email OTP"
                disabled={loading}
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value)}
                inputProps={{
                  maxLength: 6,
                }}
                sx={{
                  "& .MuiInputBase-root": {
                    borderRadius: "12px",
                  },
                }}
              />
              <TextField
                type="number"
                required
                label="Phone OTP"
                disabled={loading}
                value={phoneOTP}
                onChange={(e) => setPhoneOTP(e.target.value)}
                inputProps={{
                  maxLength: 6,
                }}
                sx={{
                  "& .MuiInputBase-root": {
                    borderRadius: "12px",
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Confirm"}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OTPModal;
