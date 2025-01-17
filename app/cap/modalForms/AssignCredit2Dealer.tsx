"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  saveDealerCreditTran,
  loadAssignCreditTran,
} from "@/app/controllers/credit.controller";
import { dealerCreditTranSchemaT, dealerSchemaT } from "@/app/utils/models";
import { dealerCreditTranSchema } from "@/app/utils/zodschema";
import ConfirmationModal from "./AskYesNo";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { loadDealerList } from "@/app/controllers/dealer.controller";
import { DEALER_CREDIT_TRAN_ASSIGN_CREDITS } from "@/app/utils/constants";

interface DealerCreditTranModalProps {
  open: boolean;
  dealerCreditTranId?: number;
  onClose: () => void;
  onSave: () => void;
}

const DealerCreditTranModal: React.FC<DealerCreditTranModalProps> = ({
  open,
  dealerCreditTranId,
  onClose,
  onSave,
}) => {
  const [dealerCreditTranData, setDealerCreditTranData] =
    useState<dealerCreditTranSchemaT | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dealers, setDealers] = useState<dealerSchemaT[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<number>(0);
  const [selectedDealerValue, setSelectedDealerValue] =
    useState<dealerSchemaT | null>(null);
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onClose: () => {},
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchDealerCreditTranData = async () => {
      try {
        let proceed = true;
        let errMsg = "";
        let result: { status: boolean; data?: any; message: string };
        let dealersList: dealerSchemaT[] = [];

        if (proceed) {
          result = await loadDealerList();
          if (result.status) {
            dealersList = result.data;
            setDealers(result.data as unknown as dealerSchemaT[]);
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (proceed && dealerCreditTranId) {
          result = await loadAssignCreditTran(dealerCreditTranId);
          console.log(result);
          if (result.status) {
            setDealerCreditTranData(result.data as dealerCreditTranSchemaT);
            const matchingDealer = dealersList.find(
              (d) => d.id === result.data.dealer_id
            );
            setSelectedDealerValue(matchingDealer || null);
            setSelectedDealerId(result.data.dealer_id);
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
          message: String(error),
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (open && !hasLoadedData.current) {
      fetchDealerCreditTranData();
      hasLoadedData.current = true;
    } else if (!open) {
      setDealerCreditTranData(null);
      setErrors({});
      setSelectedDealerId(0);
      setSelectedDealerValue(null);
      hasLoadedData.current = false;
    }
  }, [dealerCreditTranId, open]);

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let baseData: Record<string, any> = dealerCreditTranId
      ? { ...dealerCreditTranData }
      : {};

    const formData = new FormData(e.currentTarget);
    formData.forEach((value, key) => {
      baseData[key] = value;
    });

    if (dealerCreditTranId) {
      baseData = {
        ...dealerCreditTranData,
        ...Object.fromEntries(formData.entries()),
      };
    } else {
      baseData = {
        ...Object.fromEntries(formData.entries()),
      };
    }

    baseData.modified_credits = Number(baseData.modified_credits);
    baseData.dealer_id = selectedDealerId;
    baseData.tran_type = DEALER_CREDIT_TRAN_ASSIGN_CREDITS;
    baseData.invoice_date = new Date(baseData.invoice_date);
    baseData.tran_date = new Date(baseData.tran_date);

    let dealerCreditTranResult = dealerCreditTranSchema.safeParse(baseData);

    if (dealerCreditTranResult.success) {
      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this transaction?",
        onConfirm: () => confirmSave(dealerCreditTranResult.data),
        onClose: () => {},
      });
    } else {
      const validationErrors = dealerCreditTranResult.error.errors.reduce(
        (acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        },
        {} as { [key: string]: string }
      );
      setErrors(validationErrors);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setDealerCreditTranData((prevState) => {
      if (!prevState) return prevState;
      if (name === "invoice_date" || name === "tran_date") {
        return {
          ...prevState,
          [name]: value,
        };
      }

      return prevState;
    });

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const confirmSave = async (
    parsedDealerCreditTranData: dealerCreditTranSchemaT
  ) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveDealerCreditTran(parsedDealerCreditTranData);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Transaction saved successfully.",
          severity: "success",
        });
        onSave();
        onClose();
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
        message: "Error saving transaction data.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const handleDealerChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: any
  ) => {
    setSelectedDealerId(value?.id || 0);
    setSelectedDealerValue(value);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        BackdropProps={{
          onClick: (event) => event.stopPropagation(),
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "550px",
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
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {dealerCreditTranId ? (
                <EditIcon sx={{ color: "primary.main" }} />
              ) : (
                <AddIcon sx={{ color: "primary.main" }} />
              )}
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  color: "primary.main",
                  textAlign: "left",
                  fontWeight: "normal",
                }}
              >
                {dealerCreditTranId
                  ? "Edit Assign Credits Transaction"
                  : "Assign Credits"}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              disabled={loading}
              sx={{
                color: "text.primary",
                ml: 2,
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", gap: 2, mb: 3, mt: 3 }}>
              <TextField
                sx={{ width: "30%" }}
                type="date"
                autoComplete="off"
                size="small"
                name="tran_date"
                label="Transaction Date"
                disabled={loading}
                error={!!errors.tran_date}
                helperText={errors.tran_date}
                value={
                  dealerCreditTranData?.tran_date
                    ? formatDate(dealerCreditTranData.tran_date)
                    : formatDate(new Date())
                }
                onChange={handleChange}
              />
              <Autocomplete
                // key={`dealer-${selectedDealerValue}`}
                sx={{ width: "70%" }}
                fullWidth
                autoFocus
                size="small"
                disabled={loading}
                options={dealers}
                value={selectedDealerValue}
                defaultValue={selectedDealerValue}
                getOptionLabel={(option) => option.name}
                onChange={handleDealerChange}
                renderInput={(params) => (
                  <TextField required {...params} label="Dealer" />
                )}
              />
            </Box>

            {/* <Box sx={{ display: "flex", gap: 2, mb: 3 }}></Box> */}

            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField
                sx={{ width: "30%" }}
                fullWidth
                type="date"
                autoComplete="off"
                size="small"
                name="invoice_date"
                label="Invoice Date"
                disabled={loading}
                error={!!errors.invoice_date}
                helperText={errors.invoice_date}
                value={
                  dealerCreditTranData?.invoice_date
                    ? formatDate(dealerCreditTranData.invoice_date)
                    : formatDate(new Date())
                }
                onChange={handleChange}
              />

              <TextField
                sx={{ width: "40%" }}
                fullWidth
                autoComplete="off"
                label="Invoice No."
                name="invoice_no"
                size="small"
                disabled={loading}
                error={!!errors.invoice_no}
                helperText={errors.invoice_no}
                defaultValue={dealerCreditTranData?.invoice_no || ""}
                onChange={handleChange}
              />

              <TextField
                sx={{ width: "30%" }}
                fullWidth
                type="number"
                autoComplete="off"
                label="Credits"
                name="modified_credits"
                size="small"
                disabled={loading}
                required
                error={!!errors.modified_credits}
                helperText={errors.modified_credits}
                defaultValue={dealerCreditTranData?.modified_credits || ""}
                onChange={handleChange}
              />
            </Box>

            <TextField
              multiline
              fullWidth
              autoComplete="off"
              label="Remarks"
              name="remarks"
              size="small"
              disabled={loading}
              error={!!errors.remarks}
              helperText={errors.remarks}
              sx={{ mb: 1 }}
              defaultValue={dealerCreditTranData?.remarks || ""}
              onChange={handleChange}
            />

            {dealerCreditTranId && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mt: 2,
                }}
              >
                <Typography sx={{ fontWeight: "bold" }}>Voucher No:</Typography>
                <Typography>{dealerCreditTranData?.vch_no || ""}</Typography>
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mt: 3,
                mb: 1,
              }}
            >
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Save"
                )}
              </Button>
              <Button onClick={onClose} disabled={loading} variant="outlined">
                Quit
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <ConfirmationModal
        open={confirmationModal.open}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, open: false })
        }
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
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
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DealerCreditTranModal;
