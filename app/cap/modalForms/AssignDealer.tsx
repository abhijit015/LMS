"use client";
import { handleErrorMsg } from "@/app/utils/common";
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
import ConfirmationModal from "./AskYesNo";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {
  loadLicenseDet,
  loadLicenseStatus,
  saveLicenseTran,
} from "@/app/controllers/license.controller";
import {
  dealerSchemaT,
  licenseDetSchemaT,
  licenseStatusSchemaT,
  licenseTranSchemaT,
} from "@/app/utils/models";
import { licenseTranSchema } from "@/app/utils/zodschema";
import {
  LICENSE_TRAN_ASSIGN_DEALER_2_LICENSE,
  LICENSE_TRAN_NATURE_GENERAL,
} from "@/app/utils/constants";
import { loadDealerList } from "@/app/controllers/dealer.controller";
import { initLicenseTranData } from "@/app/utils/common";
import SaveIcon from "@mui/icons-material/Save";

interface AssignDealerProps {
  licenseId: number;
  onClose: () => void;
  onSave: () => void;
}

const AssignDealer: React.FC<AssignDealerProps> = ({
  licenseId,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [licenseDet, setLicenseDet] = useState<licenseDetSchemaT>();
  const [licenseStatus, setLicenseStatus] = useState<licenseStatusSchemaT>();
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
    const fetchData = async () => {
      try {
        let proceed = true;
        let errMsg = "";
        let result: { status: boolean; data?: any; message: string };
        let currentDealerId: number = 0;

        setLoading(true);

        if (proceed) {
          result = await loadLicenseDet(licenseId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setLicenseDet(result.data as licenseDetSchemaT);
          }
        }

        if (proceed) {
          result = await loadLicenseStatus(licenseId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setLicenseStatus(result.data as licenseStatusSchemaT);
            currentDealerId = result.data.last_dealer_id;
          }
        }

        if (proceed) {
          result = await loadDealerList();
          console.log("dealers : ", result);
          if (result.status) {
            const loadedDealers = result.data as unknown as dealerSchemaT[];

            const filteredDealers = loadedDealers.filter(
              (dealer) => dealer.id !== currentDealerId
            );
            setDealers(filteredDealers);
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
          message: handleErrorMsg(error),
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!hasLoadedData.current) {
      fetchData();
      hasLoadedData.current = true;
    } else if (!open) {
      setErrors({});
      setSelectedDealerId(0);
      setSelectedDealerValue(null);
      hasLoadedData.current = false;
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const licenseTranData: licenseTranSchemaT = initLicenseTranData();

    licenseTranData.dealer_id = selectedDealerId;
    licenseTranData.tran_type = LICENSE_TRAN_ASSIGN_DEALER_2_LICENSE;
    licenseTranData.tran_nature = LICENSE_TRAN_NATURE_GENERAL;
    if (licenseDet?.id) {
      licenseTranData.license_id = licenseDet?.id;
    }

    let result = licenseTranSchema.safeParse(licenseTranData);

    console.log("result : ", result);

    if (result.success) {
      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this transaction?",
        onConfirm: () => confirmSave(result.data),
        onClose: () => {},
      });
    } else {
      const validationErrors = result.error.errors.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {} as { [key: string]: string });
      setErrors(validationErrors);
    }
  };

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name } = e.target;
  //   setErrors((prevErrors) => {
  //     const newErrors = { ...prevErrors };
  //     delete newErrors[name];
  //     return newErrors;
  //   });
  // };

  const confirmSave = async (parsedData: licenseTranSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveLicenseTran(parsedData);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Dealer assigned successfully.",
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
        message: "Error assigning dealer.",
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
         open={true}
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
            width: "450px",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
            outline: "none",
            textAlign: "center",
            border: "1px solid",
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
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  color: "primary.main",
                  textAlign: "left",
                  fontWeight: "normal",
                }}
              >
                Assign Dealer
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

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "120px 20px auto",
              alignItems: "start",
              mb: 2,
              mt: 3,
            }}
          >
            <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
              Last Dealer
            </Typography>
            <Typography sx={{ textAlign: "left" }}>:</Typography>
            <Typography sx={{ textAlign: "left" }}>
              {licenseStatus?.dealer_name || ""}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            {" "}
            <Box sx={{ display: "flex", gap: 2, mb: 4, mt: 3 }}>
              <Autocomplete
                fullWidth
                autoFocus
                size="small"
                disabled={loading}
                options={dealers}
                value={selectedDealerValue}
                getOptionLabel={(option) => option.name}
                onChange={handleDealerChange}
                renderInput={(params) => (
                  <TextField required {...params} label="Assign New Dealer" />
                )}
              />
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 1 }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !selectedDealerId}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Assign"
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
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%", border: "1px solid", borderRadius: 1 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AssignDealer;
