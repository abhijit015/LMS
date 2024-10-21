"use client";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  IconButton,
  Typography,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useRef, useState, useEffect } from "react";
import Draggable from "react-draggable";
import { dealerSchema } from "@/app/zodschema/zodschema";
import { dealerSchemaT } from "@/app/models/models";
import {
  saveDealer,
  loadDealerByID,
} from "@/app/controllers/dealer.controller";
import ErrorModal from "@/app/cap/components/ErrorModal";
import ConfirmationDialog from "@/app/cap/components/ConfirmationDialog";

interface DealerModalProps {
  open: boolean;
  dealerId: number | null;
  onClose: () => void;
}

const PaperComponent = (props: any) => {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
};

const DealerModal: React.FC<DealerModalProps> = ({
  open,
  dealerId,
  onClose,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dealerData, setDealerData] = useState<dealerSchemaT | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const isFetched = useRef(false);

  useEffect(() => {
    const fetchDealer = async () => {
      if (open && dealerId && !isFetched.current) {
        isFetched.current = true;
        try {
          const response = await loadDealerByID(dealerId);
          if (response.status) {
            setDealerData(response.data);
          } else {
            setError(
              typeof response.data === "string"
                ? response.data
                : "Error loading dealer data."
            );
          }
        } catch (error) {
          setError(String(error));
        }
      } else {
        setDealerData(null);
        isFetched.current = false;
      }
    };
    fetchDealer();
  }, [open, dealerId]);

  const handleFormSubmit = (formData: FormData) => {
    setFormData(formData);
    setIsConfirmationOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData) return;

    setLoading(true);
    setError(null);
    setValidationErrors({});
    const data = Object.fromEntries(formData.entries());

    try {
      const parsedData = dealerSchema.safeParse(data);

      if (!parsedData.success) {
        const fieldErrors = parsedData.error.flatten().fieldErrors;
        setValidationErrors(
          Object.fromEntries(
            Object.entries(fieldErrors).map(([key, value]) => [
              key,
              value?.join(", ") || "",
            ])
          )
        );
      } else {
        if (dealerId) {
          parsedData.data.id = Number(dealerId);
        }
        const response = await saveDealer(parsedData.data);

        if (response && response.status) {
          onClose();
        } else if (response) {
          const errorMessages = Array.isArray(response.data)
            ? response.data
                .map((err) =>
                  typeof err.message === "string"
                    ? err.message
                    : "Unknown error"
                )
                .join(", ")
            : typeof response.data === "string"
            ? response.data
            : "Unexpected error format.";
          setError(errorMessages);
        } else {
          setError("Unexpected error: No response from server.");
        }
      }
    } catch (error) {
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmation = (confirmed: boolean) => {
    if (confirmed) {
      handleSubmit();
    }
    setIsConfirmationOpen(false);
  };

  const handleClose = () => {
    onClose();
    setDealerData(null);
    setValidationErrors({});
    setFormData(null);
    isFetched.current = false;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperComponent={PaperComponent}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingY: 1,
          cursor: "move",
        }}
        id="draggable-dialog-title"
      >
        <Typography variant="h6" sx={{ color: "primary.main" }}>
          {dealerId ? "Modify Dealer" : "Add Dealer"}
        </Typography>
        <IconButton edge="end" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box
        component="form"
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleFormSubmit(formData);
        }}
        sx={{
          padding: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <TextField
          label="Name"
          name="name"
          size="small"
          required
          defaultValue={dealerData?.name || ""}
          error={!!validationErrors.name}
          helperText={validationErrors.name}
          variant="outlined"
          onChange={() =>
            setValidationErrors((prev) => ({ ...prev, name: "" }))
          }
        />
        <TextField
          label="Contact Number"
          name="contact_num"
          size="small"
          defaultValue={dealerData?.contact_num || ""}
          error={!!validationErrors.contact_num}
          helperText={validationErrors.contact_num}
          variant="outlined"
          onChange={() =>
            setValidationErrors((prev) => ({ ...prev, contact_num: "" }))
          }
        />
        <TextField
          label="Email"
          name="email"
          size="small"
          defaultValue={dealerData?.email || ""}
          error={!!validationErrors.email}
          helperText={validationErrors.email}
          variant="outlined"
          onChange={() =>
            setValidationErrors((prev) => ({ ...prev, email: "" }))
          }
        />
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{ marginRight: 1 }}
          >
            Quit
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
          >
            Save
          </Button>
        </Box>
      </Box>

      <ErrorModal
        open={Boolean(error)}
        title="Error"
        message={error || ""}
        onClose={() => setError(null)}
      />
      <ConfirmationDialog
        open={isConfirmationOpen}
        onClose={handleCloseConfirmation}
        message={
          dealerId
            ? "Are you sure you want to modify this dealer?"
            : "Are you sure you want to add this dealer?"
        }
      />
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Dialog>
  );
};

export default DealerModal;
