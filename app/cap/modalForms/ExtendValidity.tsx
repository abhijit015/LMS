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
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import ConfirmationModal from "./AskYesNo";
import CloseIcon from "@mui/icons-material/Close";
import {
  loadLicenseDet,
  loadLicenseStatus,
  saveLicenseTran,
} from "@/app/controllers/license.controller";
import {
  productVariantsSchemaT,
  licenseDetSchemaT,
  licenseStatusSchemaT,
  licenseTranSchemaT,
  dealerSchemaT,
  productSchemaT,
} from "@/app/utils/models";
import { licenseTranSchema } from "@/app/utils/zodschema";
import {
  LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY,
  LICENSE_TRAN_EXTEND_VALIDITY,
  LICENSE_TRAN_NATURE_GENERAL,
  PAYMENT_MODE_CREDITS,
} from "@/app/utils/constants";
import {
  calculateExpiryDateByMonths,
  formatDate,
  formatNum,
  initLicenseTranData,
} from "@/app/utils/common";
import theme from "../theme/theme";
import {
  getCurrentDealerDet,
  getDealerCreditBalance,
} from "@/app/controllers/dealer.controller";
import { loadProduct } from "@/app/controllers/product.controller";
import { getCreditsReqd4ExtendingLicenseParam } from "@/app/controllers/pricing.controller";

interface ExtendValidityProps {
  open: boolean;
  licenseId: number;
  onClose: () => void;
  onSave: () => void;
}

const ExtendValidity: React.FC<ExtendValidityProps> = ({
  open,
  licenseId,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [licenseDet, setLicenseDet] = useState<licenseDetSchemaT>();
  const [licenseStatus, setLicenseStatus] = useState<licenseStatusSchemaT>();
  const [dealerData, setDealerData] = useState<dealerSchemaT>();
  const [productData, setProductData] = useState<productSchemaT>();
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [additionalUsers, setAdditionalUsers] = useState<number>(0);
  const [additionalMonths, setAdditionalMonths] = useState<number>(0);
  const [newTotalUsers, setNewTotalUsers] = useState<number>(0);
  const [newExpiry, setNewExpiry] = useState<Date | null>(null);
  const [productUsers, setProductUsers] = useState<number>(0);
  const [requiredCredits, setRequiredCredits] = useState<number>(0);
  const [extendUsers, setExtendUsers] = useState<boolean>(false);
  useState<productVariantsSchemaT | null>(null);
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
  const debounceTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        let proceed = true;
        let errMsg = "";
        let result: { status: boolean; data?: any; message: string };
        let productId: number = 0;
        let dealerId: number = 0;

        setLoading(true);

        if (proceed) {
          result = await loadLicenseDet(licenseId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setLicenseDet(result.data as licenseDetSchemaT);
            productId = result.data.product_id;
          }
        }

        if (proceed) {
          result = await loadLicenseStatus(licenseId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setLicenseStatus(result.data as licenseStatusSchemaT);
            setNewExpiry(result.data.expiry_date);
            setNewTotalUsers(result.data.no_of_users);
          }
        }

        if (proceed) {
          result = await loadProduct(productId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setProductData(result.data as productSchemaT);
          }
        }

        if (proceed) {
          setProductUsers(75);
        }

        if (proceed) {
          result = await getCurrentDealerDet();
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setDealerData(result.data as dealerSchemaT);
            dealerId = result.data.id;
          }
        }

        if (proceed) {
          result = await getDealerCreditBalance(dealerId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setAvailableCredits(result.data);
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
      fetchData();
      hasLoadedData.current = true;
    } else if (!open) {
      setErrors({});
      setAvailableCredits(0);
      setRequiredCredits(0);
      setExtendUsers(false);
      hasLoadedData.current = false;
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const licenseTranData: licenseTranSchemaT = initLicenseTranData();

    licenseTranData.tran_type = extendUsers
      ? LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY
      : LICENSE_TRAN_EXTEND_VALIDITY;
    if (licenseDet?.id) {
      licenseTranData.license_id = licenseDet?.id;
    }
    licenseTranData.tran_nature = LICENSE_TRAN_NATURE_GENERAL;
    licenseTranData.no_of_users = additionalUsers;
    licenseTranData.no_of_months = additionalMonths;
    licenseTranData.payment_amt = requiredCredits;
    licenseTranData.payment_mode = PAYMENT_MODE_CREDITS;

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

  const updateCredits = async (addedUsers: number, addedMonths: number) => {
    try {
      setLoading(true);

      let result = await getCreditsReqd4ExtendingLicenseParam(
        licenseDet?.id || 0,
        LICENSE_TRAN_EXTEND_USERS_AND_VALIDITY,
        undefined,
        addedUsers,
        addedMonths
      );
      if (result.status) {
        if (result.data) {
          setRequiredCredits(result.data);
        } else {
          setRequiredCredits(0);
        }
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
        message: String(error),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUsersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const addedUsers = Number(value);
    setAdditionalUsers(addedUsers);

    if (licenseStatus?.no_of_users)
      setNewTotalUsers(licenseStatus?.no_of_users + addedUsers);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      updateCredits(addedUsers, additionalMonths);
    }, 500);
  };

  const handleValidityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const addedMonths = Number(value);
    setAdditionalMonths(addedMonths);

    if (licenseStatus?.expiry_date) {
      const newExpiryDate = calculateExpiryDateByMonths(
        licenseStatus?.expiry_date,
        addedMonths
      );

      setNewExpiry(newExpiryDate);
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      updateCredits(additionalUsers, addedMonths);
    }, 500);
  };

  const confirmSave = async (parsedData: licenseTranSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveLicenseTran(parsedData);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Validity extended successfully.",
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
        message: "Error extending validity.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const handleExtendUsersChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setExtendUsers(checked);
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
            width: "450px",
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
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  color: "primary.main",
                  textAlign: "left",
                  fontWeight: "normal",
                }}
              >
                Extend Validity
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

          <FormGroup
            sx={{
              mt: 1,
              mb: 1,
              // display: "flex",
              // justifyContent: "center",
              // alignItems: "center",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={extendUsers}
                  onChange={handleExtendUsersChange}
                />
              }
              label="Extend Users Along with Validity"
            />
          </FormGroup>

          <Divider />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "120px 20px auto",
              alignItems: "start",
              mb: 2,
              mt: 2,
            }}
          >
            <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
              License No.
            </Typography>
            <Typography sx={{ textAlign: "left" }}>:</Typography>
            <Typography sx={{ textAlign: "left" }}>
              {licenseDet?.license_no || ""}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "120px 20px auto",
              alignItems: "start",
              mb: 2,
            }}
          >
            <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
              Current Expiry
            </Typography>
            <Typography sx={{ textAlign: "left" }}>:</Typography>
            <Typography sx={{ textAlign: "left" }}>
              {formatDate(licenseStatus?.expiry_date)}
            </Typography>
          </Box>

          {extendUsers && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "120px 20px auto",
                alignItems: "start",
                mb: 2,
              }}
            >
              <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                Current Users
              </Typography>
              <Typography sx={{ textAlign: "left" }}>:</Typography>
              <Typography sx={{ textAlign: "left" }}>
                {licenseStatus?.no_of_users}
              </Typography>
            </Box>
          )}

          {extendUsers && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "120px 20px auto",
                alignItems: "start",
                mb: 2,
              }}
            >
              <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                {productData?.name} Users
              </Typography>
              <Typography sx={{ textAlign: "left" }}>:</Typography>
              <Typography sx={{ textAlign: "left" }}>
                {formatNum(productUsers)}
              </Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            {" "}
            <Box
              sx={{
                border: "1px solid #ccc",
                borderRadius: 2,
                padding: 2,
                mt: 4,
                mb: 3,
                position: "relative",
              }}
            >
              <legend
                style={{
                  fontSize: "0.95rem",
                  padding: "0 10px",
                  position: "absolute",
                  top: "-12px",
                  left: "10px",
                  backgroundColor: "#fff",
                  paddingRight: "10px",
                  color: theme.palette.secondary.main,
                }}
              >
                Extension Details
              </legend>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  mt: 2,
                }}
              >
                <TextField
                  type="number"
                  autoComplete="off"
                  label="Specify Months"
                  name="no_of_months"
                  size="small"
                  disabled={loading}
                  required
                  onChange={handleValidityChange}
                  error={!!errors.no_of_months}
                  helperText={errors.no_of_months}
                />
                {extendUsers && (
                  <TextField
                    type="number"
                    autoComplete="off"
                    label="Specify Users"
                    name="no_of_users"
                    size="small"
                    disabled={loading}
                    required
                    onChange={handleUsersChange}
                    error={!!errors.no_of_users}
                    helperText={errors.no_of_users}
                  />
                )}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "150px 20px auto",
                  alignItems: "start",
                  mt: 3,
                }}
              >
                <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                  New Expiry
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "left" }}>
                  {formatDate(newExpiry)}
                </Typography>
              </Box>

              {extendUsers && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "150px 20px auto",
                    alignItems: "start",
                    mt: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                    New Users
                  </Typography>
                  <Typography sx={{ textAlign: "left" }}>:</Typography>
                  <Typography sx={{ textAlign: "left" }}>
                    {formatNum(newTotalUsers)}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "150px 20px auto",
                  alignItems: "start",
                  mt: 2,
                }}
              >
                <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                  Credits Required
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "left" }}>
                  {formatNum(requiredCredits)}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "150px 20px auto",
                  alignItems: "start",
                  mt: 2,
                }}
              >
                <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                  Credits Available
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "left" }}>
                  {formatNum(availableCredits)}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mb: 1,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={
                  loading ||
                  additionalMonths <= 0 ||
                  !newExpiry ||
                  requiredCredits > availableCredits ||
                  newTotalUsers <= 0 ||
                  newTotalUsers < productUsers ||
                  additionalUsers === 0
                }
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Extend"
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

export default ExtendValidity;
