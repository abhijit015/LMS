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
import {
  loadLicenseDet,
  loadAllAddonStatus4License,
  saveLicenseTran,
  loadAddonStatus4License,
  loadLicenseStatus,
} from "@/app/controllers/license.controller";
import {
  productVariantsSchemaT,
  licenseDetSchemaT,
  addonStatusSchemaT,
  licenseTranSchemaT,
  dealerSchemaT,
  dealerCreditTranSchemaT,
  addonSchemaT,
  addonPlansSchemaT,
} from "@/app/utils/models";
import { licenseTranSchema } from "@/app/utils/zodschema";
import {
  LICENSE_TRAN_EXTEND_ADD_ON,
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
import {
  getCreditsReqd4ExtendingLicenseParam,
  loadCurrentAddonPlans,
} from "@/app/controllers/pricing.controller";
import { loadAddon, loadAddonList } from "@/app/controllers/addon.controller";

interface ExtendAddonProps {
  open: boolean;
  licenseId: number;
  addonId?: number;
  onClose: () => void;
  onSave: () => void;
}

const ExtendAddon: React.FC<ExtendAddonProps> = ({
  open,
  licenseId,
  addonId,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [licenseDet, setLicenseDet] = useState<licenseDetSchemaT>();
  const [dealerData, setDealerData] = useState<dealerSchemaT>();
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [requiredCredits, setRequiredCredits] = useState<number>(0);
  const [addonStatus, setAddonStatus] = useState<addonStatusSchemaT|null>(null);
  const [addons, setAddons] = useState<addonSchemaT[]>([]);
  const [addonPlans, setAddonPlans] = useState<addonPlansSchemaT[]>([]);
  const [productId, setProductId] = useState<number>(0);
  const [variantId, setVariantId] = useState<number>(0);
  const [selectedAddonId, setSelectedAddonId] = useState<number>(0);
  const [selectedAddonValue, setSelectedAddonValue] =
    useState<addonSchemaT | null>(null);
  const [selectedAddonPlanId, setSelectedAddonPlanId] = useState<number>(0);
  const [selectedAddonPlanValue, setSelectedAddonPlanValue] =
    useState<addonPlansSchemaT | null>(null);
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
    console.log(addonId);
    const fetchData = async () => {
      try {
        let proceed = true;
        let errMsg = "";
        let result: { status: boolean; data?: any; message: string };
        let dealerId: number = 0;
        let productId: number = 0;
        let variantId: number = 0;

        setLoading(true);

        if (proceed) {
          result = await loadLicenseDet(licenseId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setLicenseDet(result.data as licenseDetSchemaT);
            productId = result.data.product_id;
            setProductId(productId);
          }
        }

        if (proceed) {
          result = await loadLicenseStatus(licenseId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            variantId = result.data.product_variant_id;
            setVariantId(variantId);
          }
        }

        if (proceed && addonId) {
          result = await loadCurrentAddonPlans(addonId, productId, variantId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setAddonPlans(result.data as addonPlansSchemaT[]);
          }
        }

        if (proceed && addonId) {
          result = await loadAddonStatus4License(licenseId, addonId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setAddonStatus(result.data as addonStatusSchemaT);
          }
        }

        if (proceed && addonId) {
          result = await loadAddon(addonId);
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setSelectedAddonValue(result.data as addonSchemaT);
            setSelectedAddonId(addonId);
          }
        }

        if (proceed && !addonId) {
          result = await loadAddonList();
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            setAddons(result.data as addonSchemaT[]);
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
          message: handleErrorMsg(error),
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
      setSelectedAddonId(0);
      setSelectedAddonValue(null);
      setSelectedAddonPlanId(0);
      setSelectedAddonPlanValue(null);
      setAddonStatus(null);
      hasLoadedData.current = false;
    }
  }, [open]);

  const handleAddonChange = async (
    event: React.SyntheticEvent<Element, Event>,
    value: any
  ) => {
    try {
      let proceed = true;
      let errMsg = "";
      let result: { status: boolean; data?: any; message: string };

      setLoading(true);

      if (value) {
        setSelectedAddonId(value.id);
        setSelectedAddonValue(value);
      } else {
        setSelectedAddonId(0);
        setSelectedAddonValue(null);
      }

      if (proceed && value) {
        result = await loadCurrentAddonPlans(value.id, productId, variantId);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setAddonPlans(result.data as addonPlansSchemaT[]);
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

  const handlePlanChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: any
  ) => {
    if (value) {
      setSelectedAddonPlanId(value.id);
      setSelectedAddonPlanValue(value);
    } else {
      setSelectedAddonPlanId(0);
      setSelectedAddonPlanValue(null);
    }

    setRequiredCredits(value.price);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const licenseTranData: licenseTranSchemaT = initLicenseTranData();
    const dealerCreditTranData: dealerCreditTranSchemaT =
      initDealerCreditLedgerData();

    //license tran data-------------------------------------
    // licenseTranData.product_variant_id = selectedAddonId;
    licenseTranData.tran_type = LICENSE_TRAN_EXTEND_ADD_ON;
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
                {addonId ? "Extend Add-on" : "Add Add-on"}
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

          {addonId !== 0 && addonStatus && (
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
                  color: theme.palette.secondary.dark,
                }}
              >
                Current Add-on Plan Details
              </legend>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "120px 20px auto",
                  alignItems: "start",
                  mb: 2,
                  mt: 1,
                }}
              >
                <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                  Add-on
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "left" }}>
                  {selectedAddonValue?.name}
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
                  Current Plan
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "left" }}>
                  {addonStatus.addon_plan_name}
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
                  Plan Value
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "left" }}>
                  {formatNum(addonStatus.addon_plan_value)}
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
                  Balance
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "left" }}>
                  {formatNum(addonStatus.balance_addon_value)}
                </Typography>
              </Box>
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
                  color: theme.palette.secondary.dark,
                }}
              >
                New Add-on Plan Details
              </legend>

              {!addonId && (
                <Autocomplete
                  fullWidth
                  autoFocus
                  size="small"
                  disabled={loading}
                  options={addons}
                  value={selectedAddonValue}
                  getOptionLabel={(option) => option.name}
                  onChange={handleAddonChange}
                  sx={{ mt: 2 }}
                  renderInput={(params) => (
                    <TextField required {...params} label="Select Add-on" />
                  )}
                />
              )}

              <Autocomplete
                fullWidth
                autoFocus
                size="small"
                disabled={loading || !selectedAddonValue}
                options={addonPlans}
                value={selectedAddonPlanValue}
                getOptionLabel={(option) => option.plan_name}
                onChange={handlePlanChange}
                sx={{ mt: 2 }}
                renderInput={(params) => (
                  <TextField required {...params} label="Select Plan" />
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
                  Plan Value
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "left" }}>
                  {formatNum(selectedAddonPlanValue?.value)}
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
                  New Balance
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "left" }}>
                  {formatNum(
                    (selectedAddonPlanValue?.value || 0) +
                      (addonStatus?.balance_addon_value || 0)
                  )}
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
                  !selectedAddonId ||
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
          sx={{ width: "100%", border: "1px solid", borderRadius: 1 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ExtendAddon;
