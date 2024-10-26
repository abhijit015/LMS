"use client";

import React, { useEffect, useRef, useState } from "react";
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
  loadAllProducts,
  deleteProductByID,
} from "@/app/controllers/product.controller";
import { productSchemaT } from "@/app/models/models";
import ErrorModal from "@/app/cap/components/ErrorModal";
import ConfirmationDialog from "@/app/cap/components/ConfirmationDialog";
import SearchIcon from "@mui/icons-material/Search";
import ProductModal from "@/app/cap/product1/ProductModal";
import Layout from "../layout";

const Products = () => {
  const [products, setProducts] = useState<productSchemaT[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
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
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const result = await loadAllProducts();
        if (result) {
          setProducts(result as productSchemaT[]);
        } else {
          handleError(result);
        }
      } catch (error) {
        setError(
          "Error fetching products: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };

    if (!fetchCalledRef.current) {
      fetchProducts();
      fetchCalledRef.current = true;
    }
  }, []);

  const handleAddProduct = () => {
    setSelectedProductId(null);
    setIsProductModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedProductId(id);
    setIsProductModalOpen(true);
  };

  const openConfirmationDialog = (id: number) => {
    setProductToDelete(id);
    setConfirmationOpen(true);
  };

  const handleDelete = async () => {
    if (productToDelete !== null) {
      try {
        const result = await deleteProductByID(productToDelete);
        if (result?.status) {
          setProducts(
            products.filter((product) => product.id !== productToDelete)
          );
        } else {
          handleError(result);
        }
      } catch (error) {
        setError(
          "Error deleting product: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      } finally {
        setConfirmationOpen(false);
        setProductToDelete(null);
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

  const handleModalClose = () => {
    setIsProductModalOpen(false);
    loadAllProducts().then((result) => {
      if (result) setProducts(result as productSchemaT[]);
    });
  };

  return (
    <Layout title={"Products"}>
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
            onClick={handleAddProduct}
            sx={{
              fontWeight: "bold",
              color: (theme) => theme.palette.primary.main,
              "&:hover": {
                color: (theme) => theme.palette.error.main,
              },
            }}
          >
            Add Product
          </Button>
        </Box>

        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={filteredProducts}
            columns={columns}
            rowHeight={36}
            columnHeaderHeight={36}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
          />
        </Box>

        <ConfirmationDialog
          open={confirmationOpen}
          onClose={(confirmed) => {
            if (confirmed) handleDelete();
            else setConfirmationOpen(false);
          }}
          message="Are you sure you want to delete this product?"
        />

        <ErrorModal
          open={Boolean(error)}
          title="Error"
          message={error || ""}
          onClose={() => setError(null)}
        />

        <ProductModal
          open={isProductModalOpen}
          productId={selectedProductId}
          onClose={handleModalClose}
        />
      </>
    </Layout>
  );
};

export default Products;
