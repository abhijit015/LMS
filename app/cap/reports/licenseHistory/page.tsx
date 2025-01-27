"use client";

import { handleErrorMsg } from "@/app/utils/common";
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Typography,
  Button,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Layout from "../../layout";
import CategoryIcon from "@mui/icons-material/Category";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { loadLicenseHistory } from "@/app/controllers/license.controller";
import { useSearchParams } from "next/navigation";

interface ReportData {
  id: number;
  date: Date;
  particulars: string;
}

const LicenseHistoryReport = () => {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const licenseNoFromUrl = searchParams.get("licenseNo") || "";
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [filters, setFilters] = useState({
    licenseNo: licenseNoFromUrl,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (licenseNoFromUrl) {
        await loadData();
      }
    };

    fetchData();
  }, [licenseNoFromUrl]);

  const columns: GridColDef[] = [
    {
      field: "date",
      headerName: "Date",
      type: "date",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "vch_no",
      headerName: "Vch. No.",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "particulars",
      headerName: "Particulars",
      width: 1000,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "remarks",
      headerName: "Remarks",
      width: 600,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
  ];

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const result = await loadLicenseHistory(filters.licenseNo);

      if (!result.status) {
        setSnackbar({
          open: true,
          message: result.message,
          severity: "error",
        });
      } else {
        setReportData(result.data as ReportData[]);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadData();
  };

  return (
    <Layout loading={loading}>
      <form onSubmit={handleSubmit}>
        <Card
          sx={{
            borderRadius: 3,
            border: "1px solid #ddd",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
            width: "100%",
            mb: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
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
                License History
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 2,
                  flex: 1,
                }}
              >
                <TextField
                  autoFocus
                  label="License No."
                  name="licenseNo"
                  size="small"
                  disabled={loading}
                  required
                  value={filters.licenseNo}
                  onChange={handleFilterChange}
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<FilterAltIcon />}
                  disabled={loading}
                  sx={{
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.main",
                    },
                  }}
                >
                  Apply Filters
                </Button>
              </Box>
            </Box>

            <DataGrid
              rows={reportData}
              columns={columns}
              rowHeight={36}
              columnHeaderHeight={36}
              pageSizeOptions={[10, 25, 50]}
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
                mt: 2,
                height: "690px",
                maxHeight: "690px",
              }}
            />
          </CardContent>
        </Card>
      </form>

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
    </Layout>
  );
};

export default LicenseHistoryReport;
