import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import Draggable from "react-draggable";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "16px",
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    boxShadow: theme.shadows[10],
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontWeight: "bold",
  fontSize: "1.25rem",
  color: theme.palette.primary.main,
  padding: theme.spacing(1.5),
  cursor: "move", // Add this to indicate that the title is draggable
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(1.5),
  justifyContent: "center",
  "& button": {
    minWidth: "100px",
  },
}));

// PaperComponent for Draggable functionality
function PaperComponent(props: any) {
  return (
    <Draggable
      handle="#draggable-success-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

interface SuccessModalProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  title,
  message,
  onClose,
}) => {
  return (
    <StyledDialog open={open} onClose={onClose} PaperComponent={PaperComponent}>
      <StyledDialogTitle id="draggable-success-dialog-title">
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <Typography variant="body1" sx={{ textAlign: "center" }}>
          {message}
        </Typography>
      </StyledDialogContent>
      <StyledDialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{ borderRadius: "8px", textTransform: "none", boxShadow: 3 }}
        >
          OK
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default SuccessModal;
