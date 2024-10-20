"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../layout";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Backdrop,
  InputAdornment,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  loadAllDealers,
  deleteDealerByID,
} from "@/app/controllers/dealer.controller";
import { dealerSchemaT } from "@/app/models/models";
import ErrorModal from "@/app/cap/components/ErrorModal";
import ConfirmationDialog from "@/app/cap/components/ConfirmationDialog";
import SearchIcon from "@mui/icons-material/Search";

const Dealers = () => {
  const router = useRouter();
  const [dealers, setDealers] = useState<dealerSchemaT[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [dealerToDelete, setDealerToDelete] = useState<number | null>(null);
  const fetchCalledRef = useRef(false);

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
      renderHeader: () => <strong>Name</strong>,
    },
    {
      field: "contact_num",
      headerName: "Contact Number",
      flex: 1,
      minWidth: 150,
      renderHeader: () => <strong>Contact Number</strong>,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 200,
      renderHeader: () => <strong>Email</strong>,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderHeader: () => <strong>Actions</strong>,
      renderCell: (params: GridRenderCellParams) => (
        <>
          <IconButton
            aria-label="edit"
            //color="primary"
            onClick={() => handleEdit(params.row.id)}
            disabled={loading}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="delete"
            //color="error"
            onClick={() => openConfirmationDialog(params.row.id)}
            disabled={loading}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const filteredDealers = dealers.filter((dealer) =>
    dealer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchDealers = async () => {
      setLoading(true);
      try {
        const result = await loadAllDealers();
        console.log(result);
        if (result) {
          setDealers(result as dealerSchemaT[]);
        } else {
          handleError(result);
        }
      } catch (error) {
        setError(
          "Error fetching dealers: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };

    if (!fetchCalledRef.current) {
      fetchDealers();
      fetchCalledRef.current = true;
    }
  }, []);

  const handleAddDealer = () => {
    setLoading(true); // Set loading true
    router.push("/cap/dealer");
  };

  const handleEdit = (id: number) => {
    setLoading(true); // Set loading true
    router.push(`/cap/dealer?id=${id}`);
  };

  const openConfirmationDialog = (id: number) => {
    setDealerToDelete(id);
    setConfirmationOpen(true);
  };

  const handleDelete = async () => {
    if (dealerToDelete !== null) {
      try {
        const result = await deleteDealerByID(dealerToDelete);
        if (result?.status) {
          setDealers(dealers.filter((dealer) => dealer.id !== dealerToDelete));
        } else {
          handleError(result);
        }
      } catch (error) {
        setError(
          "Error deleting dealer: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      } finally {
        setConfirmationOpen(false);
        setDealerToDelete(null);
      }
    }
  };

  const handleError = (result: any) => {
    if (Array.isArray(result?.data)) {
      setError(result.data.map((msg: any) => msg.message).join(", "));
    } else {
      setError(result?.data || "Unknown error occurred");
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <Layout title="Dealers">
      <>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            sx={{ width: "450px" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="text"
            onClick={handleAddDealer}
            sx={{
              fontWeight: "bold",
              color: (theme) => theme.palette.primary.main,
              "&:hover": {
                color: (theme) => theme.palette.error.main,
              },
            }}
          >
            Add Dealer
          </Button>
        </Box>

        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={filteredDealers}
            columns={columns}
            rowHeight={36}
            columnHeaderHeight={36}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
            }}
          />
        </Box>

        <ConfirmationDialog
          open={confirmationOpen}
          onClose={(confirmed) => {
            if (confirmed) handleDelete();
            else setConfirmationOpen(false);
          }}
          message="Are you sure you want to delete this dealer?"
        />

        <ErrorModal
          open={Boolean(error)}
          title="Error"
          message={error || ""}
          onClose={() => setError(null)}
        />
      </>
    </Layout>
  );
};

export default Dealers;
