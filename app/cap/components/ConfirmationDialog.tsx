import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

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

interface ConfirmationDialogProps {
  open: boolean;
  onClose: (confirmed: boolean) => void;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  message,
}) => {
  return (
    <StyledDialog open={open} onClose={() => onClose(false)}>
      <StyledDialogTitle>
        <Typography variant="h6">Confirm Action</Typography>
        <IconButton onClick={() => onClose(false)} color="inherit">
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <Box sx={{ textAlign: "center" }}>
          <DialogContentText variant="body1">{message}</DialogContentText>
        </Box>
      </StyledDialogContent>
      <StyledDialogActions>
        <Button
          onClick={() => onClose(true)}
          variant="contained"
          color="primary"
          sx={{ borderRadius: "8px", textTransform: "none", boxShadow: 3 }}
        >
          Yes
        </Button>
        <Button
          onClick={() => onClose(false)}
          variant="outlined"
          color="primary"
          sx={{ borderRadius: "8px", textTransform: "none" }}
        >
          No
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default ConfirmationDialog;
