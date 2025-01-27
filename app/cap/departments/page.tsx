"use client";
import { handleErrorMsg } from "@/app/utils/common";
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
import DepartmentModal from "../modalForms/Department";
import {
  deleteDepartment,
  loadDepartmentList,
} from "@/app/controllers/department.controller";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";

interface DepartmentList {
  id: number;
  name: string;
}

const Departments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentList[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<
    DepartmentList[]
  >([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
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

  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fetchCalledRef = useRef(false);

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
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
    setSelectedDepartmentId(id);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const result = await loadDepartmentList();
      if (result.status) {
        setDepartments(result.data as DepartmentList[]);
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
      fetchDepartments();
      fetchCalledRef.current = true;
    }
  }, []);

  useEffect(() => {
    setFilteredDepartments(
      departments.filter((department) =>
        department.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, departments]);

  const handleAddDepartment = () => {
    setSelectedDepartmentId(null);
    setIsDepartmentModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedDepartmentId(id);
    setIsDepartmentModalOpen(true);
  };

  const openConfirmationDialog = () => {
    setConfirmationModal((prev) => ({
      ...prev,
      open: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this department?",
      onConfirm: () => handleDelete(),
    }));
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (selectedDepartmentId) {
        const result = await deleteDepartment(selectedDepartmentId);
        if (result.status) {
          setSnackbar({
            open: true,
            message: "Department deleted successfully",
            severity: "success",
          });
          await fetchDepartments();
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
        message: handleErrorMsg(error),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleDepartmentSave = () => {
    fetchDepartments();
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
              Departments
            </Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddDepartment}
                disabled={loading}
                size="small"
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: "primary.light",
                  "&:hover": {
                    backgroundColor: "primary.main",
                  },
                }}
              >
                Add Department
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
              rows={filteredDepartments}
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

      {isDepartmentModalOpen && (
        <DepartmentModal
          departmentId={selectedDepartmentId || undefined}
          onClose={() => setIsDepartmentModalOpen(false)}
          onSave={handleDepartmentSave}
        />
      )}
    </Layout>
  );
};

export default Departments;
