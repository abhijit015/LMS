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
  dealerCreditTranSchemaT,
} from "@/app/utils/models";
import { licenseTranSchema } from "@/app/utils/zodschema";
import {
  LICENSE_TRAN_EXTEND_VARIANT,
  LICENSE_TRAN_NATURE_GENERAL,
  PAYMENT_MODE_CREDITS,
} from "@/app/utils/constants";
import { loadProduct } from "@/app/controllers/product.controller";
import {
  getCurrentDealerDet,
  getDealerCreditBalance,
} from "@/app/controllers/dealer.controller";
import theme from "../theme/theme";
import {
  formatNum,
  initDealerCreditLedgerData,
  initLicenseTranData,
} from "@/app/utils/common";
import { getCreditsReqd4ExtendingLicenseParam } from "@/app/controllers/pricing.controller";

interface ExtendAddonProps {
  open: boolean;
  licenseId: number;
  onClose: () => void;
  onSave: () => void;
}

const ExtendAddon: React.FC<ExtendAddonProps> = ({
  open,
  licenseId,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [licenseDet, setLicenseDet] = useState<licenseDetSchemaT>();
  const [dealerData, setDealerData] = useState<dealerSchemaT>();
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [requiredCredits, setRequiredCredits] = useState<number>(0);
  const [licenseStatus, setLicenseStatus] = useState<licenseStatusSchemaT>();
  const [variants, setVariants] = useState<productVariantsSchemaT[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number>(0);
  const [selectedVariantValue, setSelectedVariantValue] =
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        let proceed = true;
        let errMsg = "";
        let result: { status: boolean; data?: any; message: string };
        let productId: number = 0;
        let currentVariantId: number = 0;
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
            currentVariantId = result.data.product_variant_id;
          }
        }

        // if (proceed) {
        //   result = await loadProduct(productId);
        //   if (result.status) {
        //     const loadedVariants = result.data
        //       .variants as unknown as productVariantsSchemaT[];

        //     const filteredVariants = loadedVariants.filter(
        //       (variant) => variant.id !== currentVariantId
        //     );
        //     setVariants(filteredVariants);
        //   } else {
        //     proceed = false;
        //     errMsg = result.message;
        //   }
        // }

        if (proceed) {
          result = await loadProduct(productId);
          if (result.status) {
            const loadedVariants = result.data
              .variants as unknown as productVariantsSchemaT[];

            // Filter variants based on the condition for free variants
            const filteredVariants = loadedVariants.filter((variant) => {
              if (variant.id === currentVariantId) {
                return false; // Keep the current variant
              }
              // If the current variant is not free, filter out free variants
              return currentVariantId !== 0 && !variant.is_free_variant;
            });
            setVariants(filteredVariants);
          } else {
            proceed = false;
            errMsg = result.message;
          }
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
      setSelectedVariantId(0);
      setSelectedVariantValue(null);
      hasLoadedData.current = false;
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const licenseTranData: licenseTranSchemaT = initLicenseTranData();
    const dealerCreditTranData: dealerCreditTranSchemaT =
      initDealerCreditLedgerData();

    //license tran data-------------------------------------
    licenseTranData.product_variant_id = selectedVariantId;
    licenseTranData.tran_type = LICENSE_TRAN_EXTEND_VARIANT;
    if (licenseDet?.id) {
      licenseTranData.license_id = licenseDet?.id;
    }
    licenseTranData.tran_nature = LICENSE_TRAN_NATURE_GENERAL;
    licenseTranData.payment_amt = requiredCredits;
    licenseTranData.payment_mode = PAYMENT_MODE_CREDITS;
    //----------------------------------------------------------

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

  const confirmSave = async (parsedData: licenseTranSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveLicenseTran(parsedData);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Variant extended successfully.",
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
        message: "Error extending variant.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const handleVariantChange = async (
    event: React.SyntheticEvent<Element, Event>,
    value: any
  ) => {
    try {
      let proceed = true;
      let errMsg = "";
      let result: { status: boolean; data?: any; message: string };

      setLoading(true);

      if (value) {
        setSelectedVariantId(value.id);
        setSelectedVariantValue(value);
      } else {
        setSelectedVariantId(0);
        setSelectedVariantValue(null);
        setRequiredCredits(0);
      }

      if (proceed && value && licenseDet?.id) {
        result = await getCreditsReqd4ExtendingLicenseParam(
          licenseDet?.id,
          LICENSE_TRAN_EXTEND_VARIANT,
          value.id
        );
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setRequiredCredits(result.data);
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
                Extend Addon
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
            }}
          >
            <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
              Current Variant
            </Typography>
            <Typography sx={{ textAlign: "left" }}>:</Typography>
            <Typography sx={{ textAlign: "left" }}>
              {licenseStatus?.product_variant_name || ""}
            </Typography>
          </Box>

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
                New Variant Details
              </legend>
              <Autocomplete
                fullWidth
                autoFocus
                size="small"
                disabled={loading}
                options={variants}
                value={selectedVariantValue}
                getOptionLabel={(option) => option.name}
                onChange={handleVariantChange}
                sx={{ mt: 2 }}
                renderInput={(params) => (
                  <TextField required {...params} label="Assign New Variant" />
                )}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "150px 20px auto",
                  alignItems: "start",
                  mt: 3,
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
              sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 1 }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={
                  loading ||
                  !selectedVariantId ||
                  requiredCredits > availableCredits
                }
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Extend"
                )}
              </Button>{" "}
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

export default ExtendAddon;
