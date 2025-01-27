"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { formatDate, formatNum, handleErrorMsg } from "@/app/utils/common";
import {
  GridRowsProp,
  DataGrid,
  GridColDef,
  GridRowModes,
  GridSlotProps,
  GridToolbarContainer,
  GridRowModesModel,
} from "@mui/x-data-grid";
import ConfirmationModal from "./AskYesNo";
import {
  loadLicenseDet,
  loadLicenseStatus,
} from "@/app/controllers/license.controller";
import {
  loadActiveUserDiscountSlabs,
  loadActiveValidityDiscountSlabs,
  loadActiveVariantPricing,
} from "@/app/controllers/pricing.controller";
import {
  dealerSchemaT,
  licenseDetSchemaT,
  licenseStatusSchemaT,
} from "@/app/utils/models";
import {
  getCurrentDealerDet,
  getDealerCreditBalance,
} from "@/app/controllers/dealer.controller";

interface ExtendUsersProps {
  licenseId: number;
  onClose: () => void;
  onSave: () => void;
}

const ExtendUsers: React.FC<ExtendUsersProps> = ({
  licenseId,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [dealerData, setDealerData] = useState<dealerSchemaT>();
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [licenseDet, setLicenseDet] = useState<licenseDetSchemaT>();
  const [licenseStatus, setLicenseStatus] = useState<licenseStatusSchemaT>();
  const [rows4Variant, setRows4Variant] = React.useState<GridRowsProp>([]);
  const [rowModesModel4Variant, setRowModesModel4Variant] =
    React.useState<GridRowModesModel>({});
  const [rows4Users, setRows4Users] = React.useState<GridRowsProp>([]);
  const [rows4Validity, setRows4Validity] = React.useState<GridRowsProp>([]);
  const [rows4Addon, setRows4Addon] = React.useState<GridRowsProp>([]);
  const [rowModesModel4Users, setRowModesModel4Users] =
    React.useState<GridRowModesModel>({});
  const [rowModesModel4Validity, setRowModesModel4Validity] =
    React.useState<GridRowModesModel>({});
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

  const fetchCalledRef = useRef(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let proceed = true;
      let errMsg = "";
      let result;
      let productId: number = 0;
      let variantId: number = 0;
      let dealerId: number = 0;

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
          variantId = result.data.product_variant_id;
        }
      }

      if (proceed) {
        result = await loadActiveUserDiscountSlabs(productId, variantId);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setRows4Users(result.data);
        }
      }

      if (proceed) {
        result = await loadActiveValidityDiscountSlabs(productId, variantId);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setRows4Validity(result.data);
        }
      }

      if (proceed) {
        result = await loadActiveVariantPricing(productId, variantId);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          setRows4Variant(result.data);
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
          setAvailableCredits(result.data as number);
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
    if (!fetchCalledRef.current) {
      fetchData();
      fetchCalledRef.current = true;
    }
  }, []);

  const getColumns4VariantConfiguration = (): GridColDef[] => {
    const columns: GridColDef[] = [];

    columns.push(
      {
        field: "effective_from",
        headerName: "Effective From",
        width: 140,
        editable: false,
        type: "date",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "price",
        headerName: "Price",
        type: "number",
        width: 100,
        editable: false,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "early_discount_percentage",
        headerName: "Early Discount %",
        type: "number",
        width: 150,
        editable: false,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      }
    );

    return columns;
  };

  const getColumns4UsersConfiguration = (): GridColDef[] => {
    const columns: GridColDef[] = [];

    columns.push(
      {
        field: "effective_from",
        headerName: "Effective From",
        width: 140,
        editable: false,
        type: "date",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "start_value",
        headerName: "From (Users)",
        type: "number",
        width: 150,
        editable: false,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "end_value",
        headerName: "To (Users)",
        type: "number",
        width: 150,
        editable: false,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "discount_percentage",
        headerName: "Discount %",
        type: "number",
        width: 150,
        editable: false,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      }
    );

    return columns;
  };

  const getColumns4ValidityConfiguration = (): GridColDef[] => {
    const columns: GridColDef[] = [];

    columns.push(
      {
        field: "effective_from",
        headerName: "Effective From",
        width: 140,
        editable: false,
        type: "date",
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "start_value",
        headerName: "From (Months)",
        type: "number",
        width: 180,
        editable: false,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "end_value",
        headerName: "To (Months)",
        type: "number",
        width: 180,
        editable: false,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "discount_percentage",
        headerName: "Discount %",
        type: "number",
        width: 140,
        editable: false,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      },
      {
        field: "grace",
        headerName: "Grace (Days)",
        type: "number",
        width: 140,
        editable: false,
        renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      }
    );

    return columns;
  };

  function EditToolbar4Variant(props: GridSlotProps["toolbar"]) {
    const { setRows4Variant, setRowModesModel4Variant } = props;

    const handleAddRecord = () => {
      const id = Math.floor(Math.random() * 10000);

      let newEffectiveDate = new Date();

      if (rows4Variant.length > 0) {
        newEffectiveDate = new Date(rows4Variant[0].effective_from);
      }

      setRows4Variant((oldRows) => [
        ...oldRows,
        {
          id,
          effective_from: newEffectiveDate,
          isNew: true,
          price: 0,
          early_discount_percentage: 0,
        },
      ]);

      setRowModesModel4Variant((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: "effective_from" },
      }));
    };

    return (
      <GridToolbarContainer>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          minHeight="36px"
        >
          <Typography color="primary">Unit Price (1 User, 1 Month)</Typography>
        </Box>
      </GridToolbarContainer>
    );
  }

  function EditToolbar4Users(props: GridSlotProps["toolbar"]) {
    const { setRows4Users, setRowModesModel4Users } = props;

    const handleAddRecord = () => {
      const id = Math.floor(Math.random() * 10000);

      let newEffectiveDate = new Date();

      if (rows4Users.length > 0) {
        newEffectiveDate = new Date(rows4Users[0].effective_from);
      }

      setRows4Users((oldRows) => [
        ...oldRows,
        {
          id,
          effective_from: newEffectiveDate,
          isNew: true,
          start_value: 0,
          end_value: 0,
          discount_percentage: 0,
        },
      ]);

      setRowModesModel4Users((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: "effective_from" },
      }));
    };

    return (
      <GridToolbarContainer>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          minHeight="36px"
        >
          <Typography color="primary">User-wise Discount Slabs</Typography>
        </Box>
      </GridToolbarContainer>
    );
  }

  function EditToolbar4Validity(props: GridSlotProps["toolbar"]) {
    const { setRows4Validity, setRowModesModel4Validity } = props;

    const handleAddRecord = () => {
      const id = Math.floor(Math.random() * 10000);

      let newEffectiveDate = new Date();

      if (rows4Validity.length > 0) {
        newEffectiveDate = new Date(rows4Validity[0].effective_from);
      }

      setRows4Validity((oldRows) => [
        ...oldRows,
        {
          id,
          effective_from: newEffectiveDate,
          isNew: true,
          start_value: 0,
          end_value: 0,
          grace: 0,
          discount_percentage: 0,
        },
      ]);

      setRowModesModel4Validity((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: "effective_from" },
      }));
    };

    return (
      <GridToolbarContainer>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          minHeight="36px"
        >
          <Typography color="primary">
            Validity Extension Discount Slabs
          </Typography>
        </Box>
      </GridToolbarContainer>
    );
  }

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: "background.paper",
            p: 2,
            overflow: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="h6">Extend Users</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Box
              sx={{
                flex: 1,
                border: "1px solid #ccc",
                borderRadius: 2,
                p: 3,
                position: "relative",
              }}
            >
              <Typography
                sx={{
                  position: "absolute",
                  top: -10,
                  left: 10,
                  px: 1,
                  bgcolor: "background.paper",
                  color: "secondary.dark",
                }}
              >
                Extension Details
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                border: "1px solid #ccc",
                borderRadius: 2,
                p: 3,
                position: "relative",
              }}
            >
              <Typography
                sx={{
                  position: "absolute",
                  top: -10,
                  left: 10,
                  px: 1,
                  bgcolor: "background.paper",
                  color: "secondary.dark",
                }}
              >
                Required Credits Breakdown
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "150px 20px 100px",
                  alignItems: "start",
                  mt: 1,
                }}
              >
                <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                  Credits Available
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "right" }}>
                  {formatNum(availableCredits)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "150px 20px 100px",
                  alignItems: "start",
                  mt: 2,
                }}
              >
                <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                  Credits Available
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "right" }}>
                  {formatNum(availableCredits)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "150px 20px 100px",
                  alignItems: "start",
                  mt: 2,
                }}
              >
                <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                  Credits Available
                </Typography>
                <Typography sx={{ textAlign: "left" }}>:</Typography>
                <Typography sx={{ textAlign: "right" }}>
                  {formatNum(5656565)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              border: "1px solid #ccc",
              borderRadius: 2,
              p: 3,
              position: "relative",
              mb: 3,
            }}
          >
            <Typography
              sx={{
                position: "absolute",
                top: -10,
                left: 10,
                px: 1,
                bgcolor: "background.paper",
                color: "secondary.dark",
              }}
            >
              License Plans & Pricing
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <DataGrid
                rows={rows4Variant}
                columns={getColumns4VariantConfiguration()}
                slots={{ toolbar: EditToolbar4Variant }}
                slotProps={{
                  toolbar: { setRows4Variant, setRowModesModel4Variant },
                }}
                rowHeight={39}
                columnHeaderHeight={39}
                hideFooter
                sx={{
                  flex: 0.7,
                  "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                  "& .MuiDataGrid-cell": {
                    border: "none",
                    fontSize: "16px",
                  },
                  height: "360px",
                }}
              />
              <DataGrid
                rows={rows4Users}
                columns={getColumns4UsersConfiguration()}
                slots={{ toolbar: EditToolbar4Users }}
                slotProps={{
                  toolbar: { setRows4Users, setRowModesModel4Users },
                }}
                rowHeight={39}
                columnHeaderHeight={39}
                hideFooter
                sx={{
                  flex: 1,
                  "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                  "& .MuiDataGrid-cell": {
                    border: "none",
                    fontSize: "16px",
                  },
                  height: "360px",
                }}
              />
              <DataGrid
                rows={rows4Validity}
                columns={getColumns4ValidityConfiguration()}
                slots={{ toolbar: EditToolbar4Validity }}
                slotProps={{
                  toolbar: { setRows4Validity, setRowModesModel4Validity },
                }}
                rowHeight={39}
                columnHeaderHeight={39}
                hideFooter
                sx={{
                  flex: 1.3,
                  "& .MuiDataGrid-columnHeader": { fontSize: "16px" },
                  "& .MuiDataGrid-cell": {
                    border: "none",
                    fontSize: "16px",
                  },
                  height: "360px",
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              type="submit"
              startIcon={<SaveIcon />}
              variant="contained"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Extend"
              )}
            </Button>
            <Button variant="outlined" onClick={onClose}>
              Quit
            </Button>
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
    </>
  );
};

export default ExtendUsers;
