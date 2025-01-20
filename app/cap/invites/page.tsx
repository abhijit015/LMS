"use client";
import { handleErrorMsg } from "@/app/utils/common";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
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
import {
  loadInvite,
  loadInvite4CurrentBusiness,
  saveInvite,
} from "@/app/controllers/invite.controller";
import {
  initInviteData,
  inviteStatusId2Name,
  roleId2Name,
} from "@/app/utils/common";
import {
  INVITE_STATUS_ACCEPTED,
  INVITE_STATUS_CANCELLED,
  INVITE_STATUS_DEREGISTERED,
  INVITE_STATUS_PENDING,
  INVITE_STATUS_REJECTED,
} from "@/app/utils/constants";
import { inviteSchemaT, userSchemaT } from "@/app/utils/models";
import CategoryIcon from "@mui/icons-material/Category";

interface InviteList {
  id: number;
  name: string;
  identifier: string;
  role: number | string;
  status: number | string;
}

const Users = () => {
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<InviteList[]>([]);
  const [filteredInvites, setFilteredInvites] = useState<InviteList[]>([]);
  const [selectedInviteId, setSelectedInviteId] = useState<number | null>(null);

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

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fetchCalledRef = useRef(false);

  const inviteColumns: GridColDef[] = [
    {
      field: "identifier",
      headerName: "Email or Phone",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "status",
      headerName: "Status",
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
      renderCell: (params: GridRenderCellParams) => {
        const status = params.row.status;

        if (status === inviteStatusId2Name(INVITE_STATUS_ACCEPTED)) {
          return null;
        }

        return (
          <>
            <IconButton
              aria-label="more"
              onClick={(event) => handleInviteMenuClick(event, params.row.id)}
              disabled={loading}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl) && selectedInviteId === params.row.id}
              onClose={handleMenuClose}
              MenuListProps={{ "aria-labelledby": "basic-button" }}
            >
              {(status === inviteStatusId2Name(INVITE_STATUS_DEREGISTERED) ||
                status === inviteStatusId2Name(INVITE_STATUS_REJECTED) ||
                status === inviteStatusId2Name(INVITE_STATUS_PENDING) ||
                status === inviteStatusId2Name(INVITE_STATUS_CANCELLED)) && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    handleInviteUpdate(INVITE_STATUS_PENDING);
                  }}
                >
                  Resend Invite
                </MenuItem>
              )}

              {status !== inviteStatusId2Name(INVITE_STATUS_ACCEPTED) &&
                status !== inviteStatusId2Name(INVITE_STATUS_DEREGISTERED) &&
                status !== inviteStatusId2Name(INVITE_STATUS_CANCELLED) && (
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      handleInviteUpdate(INVITE_STATUS_CANCELLED);
                    }}
                    sx={{ color: "error.main" }}
                  >
                    Cancel Invite
                  </MenuItem>
                )}
            </Menu>
          </>
        );
      },
    },
  ];

  const handleInviteUpdate = async (invite_status: number) => {
    let errMsg: string = "";
    let proceed: boolean = true;
    let result;
    let inviteData: inviteSchemaT;
    let confirmMsg: string = "";
    let successMsg: string = "";

    try {
      if (invite_status === INVITE_STATUS_PENDING) {
        confirmMsg = "Are you sure you want to resend this invite ?";
        successMsg = "Invite resent successfully.";
      } else if (invite_status === INVITE_STATUS_CANCELLED) {
        confirmMsg = "Are you sure you want to cancel this invite ?";
        successMsg = "Invite cancelled successfully.";
      }

      inviteData = initInviteData();

      if (proceed) {
        proceed = await new Promise<boolean>((resolve) => {
          setConfirmationModal({
            open: true,
            title: "Confirmation",
            message: confirmMsg,
            onConfirm: () => {
              setLoading(true);
              setConfirmationModal({
                open: false,
                title: "",
                message: "",
                onConfirm: () => {},
                onClose: () => {},
              });
              resolve(true);
            },
            onClose: () => {
              setConfirmationModal({
                open: false,
                title: "",
                message: "",
                onConfirm: () => {},
                onClose: () => {},
              });
              resolve(false);
            },
          });
        });
      }

      if (proceed && selectedInviteId) {
        result = await loadInvite(selectedInviteId);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          inviteData = result.data;
        }
      }

      if (proceed) {
        inviteData.status = invite_status;
        result = await saveInvite(inviteData);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          await fetchData();
        }
      }

      if (proceed) {
        setSnackbar({
          open: true,
          message: successMsg,
          severity: "success",
        });
      } else {
        if (errMsg) {
          setSnackbar({
            open: true,
            message: errMsg,
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

  const handleInviteMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    id: number
  ) => {
    setSelectedInviteId(id);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const fetchData = async () => {
    let proceed: boolean = true;
    let errMsg: string = "";
    let result;

    setLoading(true);
    try {
      if (proceed) {
        result = await loadInvite4CurrentBusiness();
        if (result.status) {
          const transformedData = result.data.map((invite: InviteList) => ({
            ...invite,
            role: roleId2Name(invite.role as number),
            status: inviteStatusId2Name(invite.status as number),
          }));
          setInvites(transformedData);
          setFilteredInvites(transformedData);
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

  useEffect(() => {
    if (!fetchCalledRef.current) {
      fetchData();
      fetchCalledRef.current = true;
    }
  }, []);

  useEffect(() => {
    const inviteSearchLower = inviteSearchQuery.toLowerCase();
    const filteredInvite = invites.filter(
      (invite) =>
        invite.identifier.toLowerCase().includes(inviteSearchLower) ||
        String(invite.role).toLowerCase().includes(inviteSearchLower) ||
        String(invite.status).toLowerCase().includes(inviteSearchLower)
    );
    setFilteredInvites(filteredInvite);
  }, [inviteSearchQuery, invites]);

  const handleInviteSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInviteSearchQuery(event.target.value);
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
              Invite Management
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

      <ConfirmationModal
        open={confirmationModal.open}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onClose={confirmationModal.onClose}
        onConfirm={confirmationModal.onConfirm}
      />
    </Layout>
  );
};

export default Users;
