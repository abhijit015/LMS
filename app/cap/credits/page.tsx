"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  Typography,
  Link,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import Layout from "../layout";
import ConfirmationModal from "../modalForms/AskYesNo";
import CreditModal from "../modalForms/AssignCredit2Dealer";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {
  deleteAssignCreditTran,
  loadAssignCreditList,
} from "@/app/controllers/credit.controller";

interface CreditList {
  id: number;
  dealer_name: string;
  modified_credits: number;
  remarks: string;
  invoice_no: string;
  invoice_date: Date;
  tran_date: Date;
}

const Credits = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<CreditList[]>([]);
  const [filteredCredits, setFilteredCredits] = useState<CreditList[]>([]);
  const [selectedCreditId, setSelectedCreditId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onClose: () => {},
  });

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fetchCalledRef = useRef(false);

  const columns: GridColDef[] = [
    {
      field: "vch_no",
      headerName: "Voucher No.",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params) => (
        <Link
          onClick={() => handleEdit(params.row.id)}
          sx={{
            color: "primary.main",
            cursor: "pointer",
            textDecoration: "none",
            "&:hover": {
              color: "error.main",
            },
          }}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: "dealer_name",
      headerName: "Dealer",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "modified_credits",
      headerName: "Credits Assigned",
      type: "number",
      flex: 1,
      minWidth: 150,
      align: "right",
      headerAlign: "right",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "invoice_no",
      headerName: "Invoice No.",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "remarks",
      headerName: "Remarks",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "invoice_date",
      headerName: "Invoice Date",
      type: "date",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "tran_date",
      headerName: "Transaction Date",
      type: "date",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "actions",
      headerName: "",
      minWidth: 50,
      align: "center",
      headerAlign: "center",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params: GridRenderCellParams) => (
        <>
          <IconButton
            aria-label="more"
            onClick={(event) => handleMenuClick(event, params.row.id)}
            disabled={loading}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            MenuListProps={{ "aria-labelledby": "basic-button" }}
          >
            <MenuItem
              onClick={() => {
                openConfirmationDialog();
                handleMenuClose();
              }}
              sx={{ color: "error.main" }}
            >
              Delete
            </MenuItem>
          </Menu>
        </>
      ),
    },
  ];

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    id: number
  ) => {
    setSelectedCreditId(id);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const result = await loadAssignCreditList();
      if (result.status) {
        setCredits(result.data as CreditList[]);
        // const formattedData = result.data.map((credit: CreditList) => ({
        //   ...credit,
        //   invoice_date: formatDate(credit.invoice_date),
        //   tran_date: formatDate(credit.tran_date),
        // }));
        // setCredits(formattedData);
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

  useEffect(() => {
    if (!fetchCalledRef.current) {
      fetchCredits();
      fetchCalledRef.current = true;
    }
  }, []);

  useEffect(() => {
    setFilteredCredits(
      credits.filter(
        (credit) =>
          credit.dealer_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          credit.modified_credits
            .toString()
            .includes(searchQuery.toLowerCase()) ||
          credit.remarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
          credit.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
          credit.invoice_date
            .toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          credit.tran_date
            .toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, credits]);

  const handleAddCredit = () => {
    setSelectedCreditId(null);
    setIsCreditModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedCreditId(id);
    setIsCreditModalOpen(true);
  };

  const openConfirmationDialog = () => {
    setConfirmationModal((prev) => ({
      ...prev,
      open: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this transaction?",
      onConfirm: () => handleDelete(),
    }));
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (selectedCreditId) {
        const result = await deleteAssignCreditTran(selectedCreditId);
        if (result.status) {
          setSnackbar({
            open: true,
            message: "Transaction deleted successfully",
            severity: "success",
          });
          await fetchCredits();
        } else {
          setSnackbar({
            open: true,
            message: result.message,
            severity: "error",
          });
        }
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCreditSave = () => {
    fetchCredits();
  };

  return (
    <Layout loading={loading}>
      <Card
        sx={{
          height: "auto",
          borderRadius: 3,
          border: "1px solid #ddd",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="h6" sx={{ color: "primary.main" }}>
              Credits Management
            </Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleAddCredit}
                disabled={loading}
                size="small"
                startIcon={<AddIcon />}
              >
                Assign Credits
              </Button>

              <TextField
                label="Search"
                value={searchQuery}
                onChange={handleSearchChange}
                autoComplete="off"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <Box sx={{ height: "auto" }}>
            <DataGrid
              rows={filteredCredits}
              columns={columns}
              rowHeight={36}
              columnHeaderHeight={36}
              pageSizeOptions={[10, 25, 50]}
              onFilterModelChange={(newModel) => setFilterModel(newModel)}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
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
        </CardContent>
      </Card>

      <ConfirmationModal
        open={confirmationModal.open}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, open: false })
        }
        onConfirm={() => {
          confirmationModal.onConfirm();
          setConfirmationModal({ ...confirmationModal, open: false });
        }}
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

      <CreditModal
        open={isCreditModalOpen}
        dealerCreditTranId={selectedCreditId || undefined}
        onClose={() => setIsCreditModalOpen(false)}
        onSave={handleCreditSave}
      />
    </Layout>
  );
};

export default Credits;
