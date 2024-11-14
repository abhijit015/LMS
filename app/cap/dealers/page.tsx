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
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import Layout from "../layout";
import { MSG_ERROR, MSG_NORMAL, MSG_SUCCESS } from "@/app/utils/constants";
import {
  loadDealerList,
  deleteDealer,
} from "@/app/controllers/dealer.controller";
import ConfirmationModal from "../modalForms/AskYesNo";
import MessageModal from "../modalForms/ShowMsg";
import DealerModal from "../modalForms/Dealer";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleIcon from "@mui/icons-material/AddCircle";

interface DealerList {
  id: number;
  display_name: string;
}

const Dealers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [dealers, setDealers] = useState<DealerList[]>([]);
  const [filteredDealers, setFilteredDealers] = useState<DealerList[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [messageModal, setMessageModal] = useState({
    open: false,
    title: "",
    message: "",
    type: MSG_NORMAL,
  });

  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);

  const fetchCalledRef = useRef(false);

  const columns: GridColDef[] = [
    {
      field: "display_name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params: GridRenderCellParams) => (
        <>
          <IconButton
            aria-label="edit"
            onClick={() => handleEdit(params.row.id)}
            disabled={loading}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="delete"
            onClick={() => openConfirmationDialog(params.row.id)}
            disabled={loading}
            sx={{ color: "error.main" }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const result = await loadDealerList();
      if (result.status) {
        setDealers(result.data as DealerList[]);
      } else {
        setMessageModal({
          open: true,
          title: "Error",
          message: result.message,
          type: MSG_ERROR,
        });
      }
    } catch (error) {
      setMessageModal({
        open: true,
        title: "Error",
        message: String(error),
        type: MSG_ERROR,
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
        dealer.display_name.toLowerCase().includes(searchQuery.toLowerCase())
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

  const openConfirmationDialog = (id: number) => {
    setSelectedDealerId(id);
    setConfirmationModal((prev) => ({
      ...prev,
      open: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this dealer?",
      onConfirm: () => handleDelete(id),
    }));
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      const result = await deleteDealer(id);
      if (result.status) {
        // setMessageModal({
        //   open: true,
        //   title: "Information",
        //   message: "Dealer deleted successfully",
        //   type: MSG_SUCCESS,
        // });
        await fetchDealers();
      } else {
        setMessageModal({
          open: true,
          title: "Error",
          message: result.message,
          type: MSG_ERROR,
        });
      }
    } catch (error) {
      setMessageModal({
        open: true,
        title: "Error",
        message: String(error),
        type: MSG_ERROR,
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
    <Layout title="Dealers" loading={loading}>
      <Card
        sx={{
          height: "auto",
          borderRadius: 2,
          border: "1px solid #fafafa",
          boxShadow: "none",
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
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
            <IconButton
              onClick={handleAddDealer}
              disabled={loading}
              size="small"
              sx={{ mr: 1, color: "primary.main" }}
            >
              <AddCircleIcon />
            </IconButton>
          </Box>
          <Box sx={{ height: "auto" }}>
            <DataGrid
              rows={filteredDealers}
              columns={columns}
              rowHeight={36}
              columnHeaderHeight={36}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              sx={{
                "& .MuiDataGrid-cell": {
                  border: "none",
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

      <MessageModal
        open={messageModal.open}
        onClose={() =>
          setMessageModal({
            open: false,
            title: "",
            message: "",
            type: 0,
          })
        }
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />

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
