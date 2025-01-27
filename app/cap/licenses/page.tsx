"use client";
import { handleErrorMsg } from "@/app/utils/common";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Typography,
  Link,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import Layout from "../layout";
import ConfirmationModal from "../modalForms/AskYesNo";
import LicenseModal from "../modalForms/License";
import { loadLicenseList4Dealer } from "@/app/controllers/license.controller";
import CategoryIcon from "@mui/icons-material/Category";
import { useRouter } from "next/navigation";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";

interface LicenseList {
  id: number;
  license_no: string;
  product_name: string;
  entity_identifier: string;
}

const Licenses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<LicenseList[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<LicenseList[]>([]);
  const [selectedLicenseId, setSelectedLicenseId] = useState<number>(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const router = useRouter();

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

  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fetchCalledRef = useRef(false);

  const columns: GridColDef[] = [
    {
      field: "license_no",
      headerName: "License No.",
      width: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      // renderCell: (params) => (
      //   <Link
      //     onClick={() => openLicenseHistory(params.row.license_no)}
      //     sx={{
      //       color: "primary.main",
      //       cursor: "pointer",
      //       textDecoration: "none",
      //       "&:hover": {
      //         color: "error.main",
      //       },
      //     }}
      //   >
      //     {params.value}
      //   </Link>
      // ),
    },
    {
      field: "product_name",
      headerName: "Product",
      width: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "entity_identifier",
      headerName: "Business",
      width: 150,
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
                handleEdit(params.row.id);
                handleMenuClose();
              }}
            >
              Extend
            </MenuItem>
            <MenuItem
              onClick={() => {
                openLicenseHistory(params.row.license_no);
                handleMenuClose();
              }}
            >
              License History
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
    setSelectedLicenseId(id);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const result = await loadLicenseList4Dealer();
      if (result.status) {
        setLicenses(result.data as LicenseList[]);
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
        message: handleErrorMsg(error),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchCalledRef.current) {
      fetchLicenses();
      fetchCalledRef.current = true;
    }
  }, []);

  useEffect(() => {
    setFilteredLicenses(
      licenses.filter(
        (license) =>
          license.license_no
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          license.product_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          license.entity_identifier
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, licenses]);

  const handleEdit = (id: number) => {
    setSelectedLicenseId(id);
    setIsLicenseModalOpen(true);
  };

  const openLicenseHistory = (licenseNo: string) => {
    setLoading(true);
    const updatedUrl = `/cap/reports/licenseHistory?licenseNo=${encodeURIComponent(
      licenseNo
    )}`;
    router.push(updatedUrl);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
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
            <Typography
              variant="h6"
              sx={{
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CategoryIcon />
              Linked Licenses
            </Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
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
              rows={filteredLicenses}
              columns={columns}
              rowHeight={36}
              columnHeaderHeight={36}
              pageSizeOptions={[5, 10, 25]}
              onFilterModelChange={(newModel) => setFilterModel(newModel)}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
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
          sx={{ width: "100%", border: "1px solid", borderRadius: 1 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {isLicenseModalOpen && (
        <LicenseModal
          licenseId={selectedLicenseId}
          onClose={() => setIsLicenseModalOpen(false)}
        />
      )}
    </Layout>
  );
};

export default Licenses;
