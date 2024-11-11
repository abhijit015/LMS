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
import { MSG_ERROR, MSG_NORMAL } from "@/app/utils/constants";

interface MessageModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: number;
}

const MessageModal: React.FC<MessageModalProps> = ({
  open,
  onClose,
  title,
  message,
  type = MSG_NORMAL,
}) => {
  const getColor = () => {
    if (type === MSG_ERROR) {
      return "error.main";
    }
    return "primary.main";
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-message"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 320,
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
            id="modal-title"
            variant="h6"
            component="h2"
            sx={{
              color: getColor(),
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
          id="modal-message"
          variant="body1"
          sx={{
            mb: 4,
          }}
        >
          {message}
        </Typography>

        <Button
          variant="contained"
          onClick={onClose}
          fullWidth
          color={type === MSG_ERROR ? "error" : "primary"}
          sx={{
            boxShadow: "none",
            py: 1.2,
          }}
        >
          OK
        </Button>
      </Box>
    </Modal>
  );
};

export default MessageModal;
