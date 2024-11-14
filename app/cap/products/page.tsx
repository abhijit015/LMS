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
  loadProductList,
  deleteProduct,
} from "@/app/controllers/product.controller";
import { productSchemaT } from "@/app/utils/models";
import ConfirmationModal from "../modalForms/AskYesNo";
import MessageModal from "../modalForms/ShowMsg";
import ProductModal from "../modalForms/Product";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleIcon from "@mui/icons-material/AddCircle";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<productSchemaT[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<productSchemaT[]>(
    []
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
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

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const fetchCalledRef = useRef(false);

  const columns: GridColDef[] = [
    {
      field: "name",
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await loadProductList();
      if (result.status) {
        setProducts(result.data as productSchemaT[]);
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
      fetchProducts();
      fetchCalledRef.current = true;
    }
  }, []);

  useEffect(() => {
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, products]);

  const handleAddProduct = () => {
    setSelectedProductId(null);
    setIsProductModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedProductId(id);
    setIsProductModalOpen(true);
  };

  const openConfirmationDialog = (id: number) => {
    setSelectedProductId(id);
    setConfirmationModal((prev) => ({
      ...prev,
      open: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this product?",
      onConfirm: () => handleDelete(id),
    }));
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      const result = await deleteProduct(id);
      if (result.status) {
        // setMessageModal({
        //   open: true,
        //   title: "Information",
        //   message: "Product deleted successfully",
        //   type: MSG_SUCCESS,
        // });
        await fetchProducts();
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

  const handleProductSave = () => {
    fetchProducts();
  };

  return (
    <Layout title="Products" loading={loading}>
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
              onClick={handleAddProduct}
              disabled={loading}
              size="small"
              sx={{ mr: 1, color: "primary.main" }}
            >
              <AddCircleIcon />
            </IconButton>
          </Box>
          <Box sx={{ height: "auto" }}>
            <DataGrid
              rows={filteredProducts}
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

      <ProductModal
        open={isProductModalOpen}
        productId={selectedProductId || undefined}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleProductSave}
      />
    </Layout>
  );
};

export default Products;
