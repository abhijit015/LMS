"use client";

import { handleErrorMsg } from "@/app/utils/common";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Typography,
  Button,
  Autocomplete,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Layout from "../../layout";
import CategoryIcon from "@mui/icons-material/Category";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { loadLicenseHistory } from "@/app/controllers/license.controller";
import { loadDealerList } from "@/app/controllers/dealer.controller";
import { dealerSchemaT } from "@/app/utils/models";

interface ReportData {
  id: number;
  date: Date;
  particulars: string;
}

const LicenseHistoryReport = () => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(),
    dealer_id: null as number | null | undefined,
  });
  const [dealers, setDealers] = useState<dealerSchemaT[]>([]);

  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let proceed = true;
        let errMsg = "";
        let result: { status: boolean; data?: any; message: string };

        if (proceed) {
          result = await loadDealerList();
          if (result.status) {
            setDealers(result.data as unknown as dealerSchemaT[]);
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
    }
  }, []);

  const columns: GridColDef[] = [
    {
      field: "tran_date",
      headerName: "Tran. Date",
      type: "date",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "inv_date",
      headerName: "Inv. Date",
      type: "date",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "vch_no",
      headerName: "Vch. No.",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "tran_type",
      headerName: "Tran. Type",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "modified_credits",
      headerName: "Credits Modified",
      type: "number",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "particulars",
      headerName: "Particulars",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "remarks",
      headerName: "Remarks",
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!filters.dealer_id || !filters.startDate || !filters.endDate) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await loadLicenseHistory("kjkjkjk");

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
                Credit Point Ledger
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
                <Autocomplete
                  sx={{ width: "300px" }}
                  autoFocus
                  size="small"
                  disabled={loading}
                  options={dealers}
                  // value={}
                  getOptionLabel={(option) => option.name}
                  onChange={(event, newValue) => {
                    setFilters((prevFilters) => ({
                      ...prevFilters,
                      dealer_id: newValue ? newValue.id : null,
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField required {...params} label="Dealer" />
                  )}
                />

                <TextField
                  label="Start Date"
                  name="startDate"
                  size="small"
                  disabled={loading}
                  required
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />

                <TextField
                  label="End Date"
                  name="endDate"
                  size="small"
                  disabled={loading}
                  required
                  type="date"
                  value={filters.endDate}
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
