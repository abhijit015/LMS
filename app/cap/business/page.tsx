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
import BusinessModal from "../modalForms/Business";
import {
  deleteBusiness,
  deregisterFromBusiness,
  loadBusinessList,
} from "@/app/controllers/business.controller";
import { setBusinessIdCookie } from "@/app/utils/cookies";
import { useRouter } from "next/navigation";
import { roleId2Name, roleName2Id } from "@/app/utils/common";
import {
  INVITE_STATUS_ACCEPTED,
  INVITE_STATUS_REJECTED,
  ROLE_BUSINESS_ADMIN,
} from "@/app/utils/constants";
import {
  loadInvite,
  loadInvite4CurrentUser,
  saveInvite,
} from "@/app/controllers/invite.controller";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";

interface businessRowData {
  id: number;
  name: string;
  role: number;
}

interface inviteRowData {
  id: number;
  business_name: string;
  role: number;
}

const Business = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null
  );
  const [businessRowData, setBusinessRowData] = useState<businessRowData[]>([]);
  const [inviteRowData, setInviteRowData] = useState<inviteRowData[]>([]);
  const [menuState, setMenuState] = useState<{
    anchorEl: HTMLElement | null;
    businessId: number | null;
  }>({
    anchorEl: null,
    businessId: null,
  });

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

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

  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const fetchCalledRef = useRef(false);

  const router = useRouter();

  const handleEnterBusiness = async (businessId: number) => {
    setLoading(true);
    try {
      await setBusinessIdCookie(businessId);
      router.push("/cap/dashboard");
    } catch (error) {
      console.error("Error setting business  cookie:", error);
      setSnackbar({
        open: true,
        message: "Failed to enter business ",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Business",
      flex: 1,
      minWidth: 50,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params) => (
        <Link
          onClick={() => handleEnterBusiness(params.row.id)}
          sx={{
            color: "primary.main",
            //color: "#1F2F5C",
            //fontWeight: "bold",
            textDecoration: "none",
            cursor: "pointer",
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
      field: "role",
      headerName: "Role",
      flex: 1,
      minWidth: 50,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "actions",
      headerName: "",
      minWidth: 50,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params: GridRenderCellParams) => {
        const role = roleName2Id(params.row.role);

        return (
          <div>
            <IconButton
              aria-label="more"
              onClick={(event) => handleMenuClick(event, params.row.id)}
              disabled={loading}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuState.anchorEl}
              open={Boolean(menuState.anchorEl)}
              onClose={handleMenuClose}
              MenuListProps={{ "aria-labelledby": "basic-button" }}
            >
              {role === ROLE_BUSINESS_ADMIN && menuState.businessId && (
                <div>
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      if (menuState.businessId !== null) {
                        handleEdit(menuState.businessId);
                      }
                    }}
                  >
                    Edit Details
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      if (menuState.businessId !== null) {
                        confirmDeletion(menuState.businessId);
                      }
                    }}
                    sx={{ color: "error.main" }}
                  >
                    Delete Business
                  </MenuItem>
                </div>
              )}

              {role !== ROLE_BUSINESS_ADMIN && menuState.businessId && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    if (menuState.businessId !== null) {
                      confirmDeregister(menuState.businessId);
                    }
                  }}
                  sx={{ color: "error.main" }}
                >
                  Deregister
                </MenuItem>
              )}
            </Menu>
          </div>
        );
      },
    },
  ];

  const inviteColumns: GridColDef[] = [
    {
      field: "business_name",
      headerName: "Business",
      flex: 1,
      minWidth: 100,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 1,
      minWidth: 100,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "actions",
      headerName: "",
      width: 200,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography
            component="span"
            sx={{
              color: "primary.main",
              textDecoration: "none",
              cursor: "pointer",
              marginRight: 2,
              "&:hover": {
                // textDecoration: "underline",
                // color: "primary.main",
                fontWeight: "bold",
              },
            }}
            onClick={() => confirmAction("Accept", params.row.id)}
          >
            Accept
          </Typography>
          <Typography
            component="span"
            sx={{
              color: "error.main",
              textDecoration: "none",
              cursor: "pointer",
              "&:hover": {
                // textDecoration: "underline",
                // color: "error.dark",
                fontWeight: "bold",
              },
            }}
            onClick={() => confirmAction("Reject", params.row.id)}
          >
            Reject
          </Typography>
        </Box>
      ),
    },
  ];

  const confirmAction = (action: string, id: number) => {
    setSelectedBusinessId(id);
    setConfirmationModal((prev) => ({
      ...prev,
      open: true,
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action.toLowerCase()} this invitation?`,
      onConfirm: () => handleActionConfirmation(action, id),
      onClose: () =>
        setConfirmationModal((prev) => ({
          ...prev,
          open: false,
        })),
    }));
  };

  const handleActionConfirmation = async (action: string, id: number) => {
    setConfirmationModal((prev) => ({
      ...prev,
      open: false,
    }));

    let proceed: boolean = true;
    let errMsg: string = "";
    let result;
    let inviteData;
    setLoading(true);

    try {
      if (proceed) {
        result = await loadInvite(id);
        if (result.status) {
          inviteData = result.data;
        } else {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        if (action === "Accept") {
          inviteData.status = INVITE_STATUS_ACCEPTED;
        } else {
          inviteData.status = INVITE_STATUS_REJECTED;
        }

        result = await saveInvite(inviteData);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        fetchBusiness();
        setSnackbar({
          open: true,
          message:
            inviteData.status === INVITE_STATUS_ACCEPTED
              ? "Invite has been accepted successfully"
              : "Invite has been rejected successfully",
          severity: "success",
        });
      } else {
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

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    businessId: number
  ) => {
    setMenuState({
      anchorEl: event.currentTarget,
      businessId: businessId,
    });
  };

  const handleMenuClose = () => {
    setMenuState({
      anchorEl: null,
      businessId: null,
    });
  };

  const fetchBusiness = async () => {
    let proceed: boolean = true;
    let errMsg: string = "";
    let result;
    setLoading(true);

    try {
      if (proceed) {
        result = await loadBusinessList();
        if (result.status) {
          const transformedData = result.data.map(
            (business: businessRowData) => ({
              ...business,
              role: roleId2Name(business.role),
            })
          );
          setBusinessRowData(transformedData);
        } else {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        result = await loadInvite4CurrentUser();
        if (result.status) {
          const transformedData = result.data.map(
            (business: businessRowData) => ({
              ...business,
              role: roleId2Name(business.role),
            })
          );
          setInviteRowData(transformedData);
        } else {
          proceed = false;
          errMsg = result.message;
        }
      }

      if (proceed) {
        // if (
        //   businessRowData.length === 0 &&
        //   inviteRowData.length === 0 &&
        //   !businessModalOpened.current
        // ) {
        //   setIsBusinessModalOpen(true);
        // }
      } else {
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
      fetchBusiness();
      // businessModalOpened.current = true;
      fetchCalledRef.current = true;
    }
  }, []);

  const handleAddBusiness = () => {
    setSelectedBusinessId(null);
    setIsBusinessModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedBusinessId(id);
    setIsBusinessModalOpen(true);
  };

  const confirmDeletion = (id: number) => {
    setSelectedBusinessId(id);
    setConfirmationModal((prev) => ({
      ...prev,
      open: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this Business ?",
      onConfirm: () => handleDelete(id),
      onClose: () =>
        setConfirmationModal((prev) => ({
          ...prev,
          open: false,
        })),
    }));
  };

  const confirmDeregister = (id: number) => {
    setSelectedBusinessId(id);
    setConfirmationModal((prev) => ({
      ...prev,
      open: true,
      title: "Confirm Deregistration",
      message: "Are you sure you want to deregister from this Business ?",
      onConfirm: () => handleDeregistration(id),
      onClose: () =>
        setConfirmationModal((prev) => ({
          ...prev,
          open: false,
        })),
    }));
  };

  const handleDelete = async (id: number) => {
    setLoading(true);

    setConfirmationModal((prev) => ({
      ...prev,
      open: false,
    }));

    try {
      const result = await deleteBusiness(id);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Business deleted successfully.",
          severity: "success",
        });
        await fetchBusiness();
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

  const handleDeregistration = async (id: number) => {
    setLoading(true);

    setConfirmationModal((prev) => ({
      ...prev,
      open: false,
    }));

    try {
      const result = await deregisterFromBusiness(id);
      if (result.status) {
        setSnackbar({
          open: true,
          message:
            "You have been successfully deregistered from this business.",
          severity: "success",
        });
        await fetchBusiness();
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleInviteSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInviteSearchQuery(event.target.value);
  };

  const handleBusinessSave = () => {
    fetchBusiness();
  };

  const filteredBusiness = businessRowData.filter((business) =>
    business.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvites = inviteRowData.filter((invite) =>
    invite.business_name.toLowerCase().includes(inviteSearchQuery.toLowerCase())
  );

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
              Linked Businesses
            </Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddBusiness}
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
                Add Business
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
              rows={filteredBusiness}
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

      <Card
        sx={{
          height: "auto",
          borderRadius: 3,
          border: "1px solid #ddd",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
          mt: 3,
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
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
              Invitations
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Search"
                value={inviteSearchQuery}
                onChange={handleInviteSearchChange}
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
              rows={filteredInvites}
              columns={inviteColumns}
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

      {confirmationModal.open && (
        <ConfirmationModal
          open={confirmationModal.open}
          title={confirmationModal.title}
          message={confirmationModal.message}
          onClose={confirmationModal.onClose}
          onConfirm={confirmationModal.onConfirm}
        />
      )}

      {isBusinessModalOpen && (
        <BusinessModal
          businessId={selectedBusinessId || null}
          onClose={() => setIsBusinessModalOpen(false)}
          onSave={handleBusinessSave}
        />
      )}

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

export default Business;
