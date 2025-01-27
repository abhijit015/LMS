"use client";

import { handleErrorMsg } from "@/app/utils/common";
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Modal,
  Typography,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  Button,
} from "@mui/material";
import ConfirmationModal from "./AskYesNo";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  loadAllAddonStatus4License,
  loadLicenseDet,
  loadLicenseStatus,
} from "@/app/controllers/license.controller";
import {
  licenseDetSchemaT,
  licenseStatusSchemaT,
  productVariantsSchemaT,
} from "@/app/utils/models";
import { formatDate, licenseParamId2Name } from "@/app/utils/common";
import {
  LICENSE_PARAM_USERS,
  LICENSE_PARAM_VALIDITY,
  LICENSE_PARAM_VARIANT,
} from "@/app/utils/constants";
import { loadVariant } from "@/app/controllers/product.controller";
import AssignDealer from "./AssignDealer";
import ExtendVariant from "./ExtendVariant";
import ExtendValidity from "./ExtendValidity";
import ExtendUsers from "./ExtendUsers";
import ExtendAddon from "./ExtendAddon";

interface LicenseModalProps {
  licenseId: number;
  onClose: () => void;
}

interface AddonStatusList {
  id: number;
  addon_name: string;
  addon_plan_name: string;
  balance_addon_value: number;
  grace: number;
}

const LicenseModal: React.FC<LicenseModalProps> = ({ licenseId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [addonStatus, setAddonStatus] = useState<AddonStatusList[]>([]);
  const [addonId, setAddonId] = useState<number>(0);
  const [licenseDet, setLicenseDet] = useState<licenseDetSchemaT>();
  const [licenseStatus, setLicenseStatus] = useState<licenseStatusSchemaT>();
  const [variantData, setVariantData] = useState<productVariantsSchemaT>();
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onClose: () => {},
  });
  const [isAssignDealerModalOpen, setIsAssignDealerModalOpen] = useState(false);
  const [isExtendVariantModalOpen, setIsExtendVariantModalOpen] =
    useState(false);
  const [isExtendAddonModalOpen, setIsExtendAddonModalOpen] = useState(false);
  const [isExtendValidityModalOpen, setIsExtendValidityModalOpen] =
    useState(false);
  const [isExtendUsersModalOpen, setIsExtendUsersModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const hasLoadedData = useRef(false);

  const fetchLicenseData = async () => {
    let errMsg: string = "";
    let proceed: boolean = true;
    let result;
    let variantId;

    try {
      if (proceed) {
        result = await loadAllAddonStatus4License(licenseId);

        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setAddonStatus(result.data as AddonStatusList[]);
        }
      }

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
          const formattedData = {
            ...result.data,
            expiry_date: formatDate(result.data.expiry_date),
          };
          setLicenseStatus(formattedData);
          variantId = result.data.product_variant_id;
        }
      }

      if (proceed) {
        result = await loadVariant(variantId);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setVariantData(result.data as productVariantsSchemaT);
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

  useEffect(() => {
    if (!hasLoadedData.current) {
      fetchLicenseData();
      hasLoadedData.current = true;
    } else if (!open) {
      hasLoadedData.current = false;
    }
  }, [licenseId, open]);

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const licenseColumns: GridColDef[] = [
    {
      field: "parameter",
      headerName: "Parameter",
      width: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "particulars",
      headerName: "Particulars",
      width: 600,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "extend",
      headerName: " ",
      headerAlign: "center",
      align: "center",
      width: 100,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params) => {
        if (
          params.row.id === LICENSE_PARAM_VARIANT ||
          !variantData?.is_free_variant
        ) {
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  fontWeight: "bold",
                  "&:hover": { color: "error.main" },
                }}
                onClick={() => handleExtendLicenseParam(params.row.id)}
              >
                Extend
              </Typography>
            </Box>
          );
        }
        return null;
      },
    },
  ];

  const licenseRows = [
    {
      id: LICENSE_PARAM_VARIANT,
      parameter: licenseParamId2Name(LICENSE_PARAM_VARIANT),
      particulars: licenseStatus?.product_variant_name,
    },
    {
      id: LICENSE_PARAM_VALIDITY,
      parameter: licenseParamId2Name(LICENSE_PARAM_VALIDITY),
      particulars: variantData?.is_free_variant
        ? "Lifetime"
        : [
            licenseStatus?.expiry_date
              ? `Valid Upto : ${String(licenseStatus.expiry_date)}`
              : "",
            // licenseStatus?.grace !== null && licenseStatus?.grace !== undefined
            //   ? `Grace: ${String(licenseStatus.grace)} Days`
            //   : "",
          ]
            .filter(Boolean)
            .join(" | "),
    },
    {
      id: LICENSE_PARAM_USERS,
      parameter: licenseParamId2Name(LICENSE_PARAM_USERS),
      particulars: "Current Users : " + String(licenseStatus?.no_of_users),
    },
  ];

  const addonColumns: GridColDef[] = [
    {
      field: "addon_name",
      headerName: "Add-on",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "addon_plan_name",
      headerName: "Current Plan",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "balance_addon_value",
      headerName: "Balance Left",
      type: "number",
      flex: 1,
      minWidth: 100,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "grace",
      headerName: "Grace",
      type: "number",
      flex: 1,
      minWidth: 100,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "expiry_date",
      headerName: "Valid Upto",
      type: "date",
      width: 100,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "extend",
      headerName: " ",
      headerAlign: "center",
      align: "center",
      width: 100,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params) => {
        {
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  fontWeight: "bold",
                  "&:hover": { color: "error.main" },
                }}
                onClick={() => handleExtendAddon(params.row.addon_id)}
              >
                Extend
              </Typography>
            </Box>
          );
        }
      },
    },
  ];

  const handleAssignDealer = () => {
    setIsAssignDealerModalOpen(true);
  };

  const handleExtendLicenseParam = (license_param_id: number) => {
    const modalMap = {
      [LICENSE_PARAM_VARIANT]: setIsExtendVariantModalOpen,
      [LICENSE_PARAM_VALIDITY]: setIsExtendValidityModalOpen,
      [LICENSE_PARAM_USERS]: setIsExtendUsersModalOpen,
    };

    modalMap[license_param_id]?.(true);
  };

  const handleExtendAddon = (addon_id: number) => {
    setAddonId(addon_id);
    setIsExtendAddonModalOpen(true);
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
            width: "900px",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
            outline: "none",
            // textAlign: "center",
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
                License Details
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

          <Divider sx={{ mb: 1 }} />

          <Box sx={{ display: "flex", flexDirection: "column", mt: 2, mb: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "120px 10px auto",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Typography sx={{ fontWeight: "bold" }}>License No.</Typography>
              <Typography>:</Typography>
              <Typography>{licenseDet?.license_no || ""}</Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "120px 10px auto",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography sx={{ fontWeight: "bold" }}>Last Dealer</Typography>
              <Typography>:</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography>
                  {licenseStatus?.dealer_name || "No Dealer Assigned"}
                </Typography>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    fontWeight: "bold",
                    cursor: "pointer",
                    lineHeight: "normal",
                    "&:hover": {
                      color: "error.main",
                    },
                  }}
                  onClick={handleAssignDealer}
                >
                  Assign Dealer
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ height: "auto", mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{ color: "primary.main", mb: 1 }}
            >
              License Parameters
            </Typography>
            <DataGrid
              rows={licenseRows}
              columns={licenseColumns}
              rowHeight={36}
              columnHeaderHeight={36}
              hideFooter
              sx={{
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: "#fdfdfd",
                  fontSize: "16px",
                },
                "& .MuiDataGrid-cell": {
                  border: "none",
                  fontSize: "16px",
                },
              }}
            />
          </Box>

          <Box sx={{ height: "auto", mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ color: "primary.main" }}>
                Add-ons
              </Typography>

              <Button
                variant="contained"
                onClick={() => handleExtendAddon(0)}
                disabled={loading}
                size="small"
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: "primary.main",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                }}
              >
                Add Add-on
              </Button>
            </Box>
            <DataGrid
              rows={addonStatus}
              columns={addonColumns}
              rowHeight={36}
              columnHeaderHeight={36}
              hideFooter
              sx={{
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: "#fdfdfd",
                  fontSize: "16px",
                },
                "& .MuiDataGrid-cell": {
                  border: "none",
                  fontSize: "16px",
                },
              }}
            />
          </Box>
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

      {isAssignDealerModalOpen && (
        <AssignDealer
          licenseId={licenseId}
          onClose={() => setIsAssignDealerModalOpen(false)}
          onSave={() => fetchLicenseData()}
        />
      )}

      {isExtendVariantModalOpen && (
        <ExtendVariant
          licenseId={licenseId}
          onClose={() => setIsExtendVariantModalOpen(false)}
          onSave={() => fetchLicenseData()}
        />
      )}

      {isExtendValidityModalOpen && (
        <ExtendValidity
          licenseId={licenseId}
          onClose={() => setIsExtendValidityModalOpen(false)}
          onSave={() => fetchLicenseData()}
        />
      )}

      {isExtendUsersModalOpen && (
        <ExtendUsers
          licenseId={licenseId}
          onClose={() => setIsExtendUsersModalOpen(false)}
          onSave={() => fetchLicenseData()}
        />
      )}

      {isExtendAddonModalOpen && (
        <ExtendAddon
          licenseId={licenseId}
          addonId={addonId}
          onClose={() => setIsExtendAddonModalOpen(false)}
          onSave={() => fetchLicenseData()}
        />
      )}
    </>
  );
};

export default LicenseModal;
