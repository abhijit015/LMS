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
import { loadRoleList } from "@/app/controllers/role.controller";
import { roleSchemaT } from "@/app/utils/models";
import ConfirmationModal from "../modalForms/AskYesNo";
import RoleModal from "../modalForms/Role";
import CategoryIcon from "@mui/icons-material/Category";

const Roles = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<roleSchemaT[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<roleSchemaT[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
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

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

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
      field: "hierarchy",
      headerName: "Hierarchy",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "actions",
      headerName: "",
      minWidth: 50,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
  ];

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    id: number
  ) => {
    setSelectedRoleId(id);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const result = await loadRoleList();
      if (result.status) {
        setRoles(result.data as roleSchemaT[]);
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
      fetchRoles();
      fetchCalledRef.current = true;
    }
  }, []);

  useEffect(() => {
    setFilteredRoles(
      roles.filter((role) =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, roles]);

  const handleAddRole = () => {
    setSelectedRoleId(null);
    setIsRoleModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedRoleId(id);
    setIsRoleModalOpen(true);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleRoleSave = () => {
    fetchRoles();
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
              Roles
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
              rows={filteredRoles}
              columns={columns}
              onFilterModelChange={(newModel) => setFilterModel(newModel)}
              rowHeight={36}
              columnHeaderHeight={36}
              pageSizeOptions={[5, 10, 25]}
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

      {isRoleModalOpen && (
        <RoleModal
          roleId={selectedRoleId || null}
          onClose={() => setIsRoleModalOpen(false)}
          onSave={handleRoleSave}
        />
      )}
    </Layout>
  );
};

export default Roles;
