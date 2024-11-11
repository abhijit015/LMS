import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-message"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
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
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            id="confirmation-modal-title"
            variant="h6"
            component="h2"
            sx={{
              color: "primary.main",
              textAlign: "left",
              flexGrow: 1,
            }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: "text.primary",
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography
          id="confirmation-modal-message"
          variant="body1"
          sx={{
            mb: 4,
            textAlign: "center",
          }}
        >
          {message}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Button
            color="primary"
            onClick={onClose}
            sx={{
              width: 100,
            }}
          >
            No
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onConfirm}
            sx={{
              width: 100,
              boxShadow: "none",
            }}
          >
            Yes
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ConfirmationModal;
