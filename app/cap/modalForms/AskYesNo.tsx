import React, { useEffect, useRef, useState } from "react";
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
  const yesButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            if (
              yesButtonRef.current &&
              document.contains(yesButtonRef.current)
            ) {
              yesButtonRef.current.focus();
              yesButtonRef.current.classList.add("Mui-focusVisible");
              observer.disconnect();
            }
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        if (yesButtonRef.current) {
          yesButtonRef.current.classList.remove("Mui-focusVisible");
        }
        observer.disconnect();
      };
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      BackdropProps={{
        onClick: (event) => event.stopPropagation(),
      }}
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
          p: 2,
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
            tabIndex={-1}
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
            color: "text.secondary",
            textAlign: "center",
            padding: "3px",
          }}
        >
          {message}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            mb: 1,
          }}
        >
          <Button
            ref={yesButtonRef}
            autoFocus
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
          <Button
            color="primary"
            variant="outlined"
            onClick={onClose}
            sx={{
              width: 100,
              "&.Mui-focusVisible": {
                outline: "2px solid",
                outlineOffset: 2,
                outlineColor: "primary.main",
              },
            }}
          >
            No
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ConfirmationModal;
