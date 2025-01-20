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
import DealerModal from "../modalForms/Dealer";
import {
  deleteDealer,
  loadDealer,
  loadDealerList,
  saveDealer,
} from "@/app/controllers/dealer.controller";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { dealerSchemaT, inviteSchemaT } from "@/app/utils/models";
import {
  INVITE_STATUS_ACCEPTED,
  INVITE_STATUS_CANCELLED,
  INVITE_STATUS_DEREGISTERED,
  INVITE_STATUS_PENDING,
  INVITE_STATUS_REJECTED,
  USER_BUSINESS_MAPPING_STATUS_ACTIVE,
  USER_BUSINESS_MAPPING_STATUS_DISABLED,
} from "@/app/utils/constants";
import { updateUserBusinessMappingStatus } from "@/app/controllers/user.controller";
import { loadInvite, saveInvite } from "@/app/controllers/invite.controller";
import { initInviteData } from "@/app/utils/common";
import CategoryIcon from "@mui/icons-material/Category";

interface DealerList {
  id: number;
  name: string;
  dealerStatus: number;
  inviteStatus: number;
}

const Dealers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [dealers, setDealers] = useState<DealerList[]>([]);
  const [filteredDealers, setFilteredDealers] = useState<DealerList[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [selectedDealerStatus, setSelectedDealerStatus] = useState<
    number | null
  >(null);
  const [selectedInviteStatus, setSelectedInviteStatus] = useState<
    number | null
  >(null);
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

  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
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
      renderCell: (params: GridRenderCellParams) => {
        return (
          <>
            <IconButton
              aria-label="more"
              onClick={(event) =>
                handleMenuClick(
                  event,
                  params.row.id,
                  params.row.dealerStatus,
                  params.row.inviteStatus,
                  params.row.invite_id
                )
              }
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

              {selectedInviteStatus === INVITE_STATUS_ACCEPTED && (
                <MenuItem
                  onClick={() => {
                    handleDealerStatusUpdate();
                    handleMenuClose();
                  }}
                >
                  Enable / Disable
                </MenuItem>
              )}

              {(selectedInviteStatus === INVITE_STATUS_DEREGISTERED ||
                selectedInviteStatus === INVITE_STATUS_REJECTED ||
                selectedInviteStatus === INVITE_STATUS_PENDING ||
                selectedInviteStatus === INVITE_STATUS_CANCELLED) && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    handleInviteUpdate(INVITE_STATUS_PENDING);
                  }}
                >
                  Resend Invite
                </MenuItem>
              )}

              {selectedInviteStatus !== INVITE_STATUS_ACCEPTED &&
                selectedInviteStatus !== INVITE_STATUS_DEREGISTERED &&
                selectedInviteStatus !== INVITE_STATUS_CANCELLED && (
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      handleInviteUpdate(INVITE_STATUS_CANCELLED);
                    }}
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
          await fetchDealers();
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

  const handleDealerStatusUpdate = async () => {
    let errMsg: string = "";
    let proceed: boolean = true;
    let result;
    let dealerData: dealerSchemaT | null = null;
    let confirmMsg: string = "";
    let successMsg: string = "";

    try {
      if (selectedDealerStatus === USER_BUSINESS_MAPPING_STATUS_DISABLED) {
        confirmMsg = "Are you sure you want to enable this dealer ?";
        successMsg = "Dealer enabled successfully.";
      } else if (selectedDealerStatus === USER_BUSINESS_MAPPING_STATUS_ACTIVE) {
        confirmMsg = "Are you sure you want to disable this dealer ?";
        successMsg = "Dealer disabled successfully.";
      }

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

      if (proceed && selectedDealerId) {
        result = await loadDealer(selectedDealerId);
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          dealerData = result.data;
        }
      }

      if (proceed && dealerData && dealerData.mapped_user_id) {
        if (selectedDealerStatus === USER_BUSINESS_MAPPING_STATUS_DISABLED)
          dealerData.dealerStatus = USER_BUSINESS_MAPPING_STATUS_ACTIVE;
        else dealerData.dealerStatus = USER_BUSINESS_MAPPING_STATUS_DISABLED;

        result = await updateUserBusinessMappingStatus(
          dealerData.mapped_user_id,
          dealerData?.dealerStatus
        );
        if (!result.status) {
          proceed = false;
          errMsg = result.message;
        } else {
          await fetchDealers();
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

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    id: number,
    dealerStatus: number,
    inviteStatus: number,
    inviteId: number
  ) => {
    setSelectedDealerId(id);
    setSelectedDealerStatus(dealerStatus);
    setSelectedInviteStatus(inviteStatus);
    setSelectedInviteId(inviteId);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const result = await loadDealerList();
      console.log(result);
      if (result.status) {
        const transformedData = result.data.map((dealer: DealerList) => ({
          ...dealer,
        }));

        setDealers(transformedData);
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
      fetchDealers();
      fetchCalledRef.current = true;
    }
  }, []);

  useEffect(() => {
    setFilteredDealers(
      dealers.filter((dealer) =>
        dealer.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, dealers]);

  const handleAddDealer = () => {
    setSelectedDealerId(null);
    setIsDealerModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedDealerId(id);
    setIsDealerModalOpen(true);
  };

  const openConfirmationDialog = () => {
    setConfirmationModal((prev) => ({
      ...prev,
      open: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this dealer?",
      onConfirm: () => handleDelete(),
    }));
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (selectedDealerId) {
        const result = await deleteDealer(selectedDealerId);
        if (result.status) {
          setSnackbar({
            open: true,
            message: "Dealer deleted successfully",
            severity: "success",
          });
          await fetchDealers();
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

  const handleDealerSave = () => {
    fetchDealers();
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
              Dealers
            </Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddDealer}
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
                Add Dealer
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
              rows={filteredDealers}
              columns={columns}
              rowHeight={36}
              columnHeaderHeight={36}
              pageSizeOptions={[5, 10, 25]}
              onFilterModelChange={(newModel) => setFilterModel(newModel)}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
              getRowClassName={(params) =>
                params.row.dealerStatus ===
                USER_BUSINESS_MAPPING_STATUS_DISABLED
                  ? "disabled-row"
                  : ""
              }
              sx={{
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: "#fdfdfd",
                  fontSize: "16px",
                },
                "& .MuiDataGrid-cell": {
                  border: "none",
                  fontSize: "16px",
                },
                "& .disabled-row": {
                  bgcolor: "lightgrey",
                  "&:hover": {
                    bgcolor: "lightgrey",
                  },
                  "&.Mui-selected": {
                    bgcolor: "lightgrey",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "lightgrey",
                  },
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

      <DealerModal
        open={isDealerModalOpen}
        dealerId={selectedDealerId || undefined}
        onClose={() => setIsDealerModalOpen(false)}
        onSave={handleDealerSave}
      />
    </Layout>
  );
};

export default Dealers;
