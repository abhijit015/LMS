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
import ProductModal from "../modalForms/Product";
import {
  deleteProduct,
  loadProductList,
} from "@/app/controllers/product.controller";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";

interface ProductList {
  id: number;
  name: string;
}

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductList[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
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

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
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
    setSelectedProductId(id);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await loadProductList();
      if (result.status) {
        setProducts(result.data as ProductList[]);
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

  const openConfirmationDialog = () => {
    setConfirmationModal((prev) => ({
      ...prev,
      open: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this product?",
      onConfirm: () => handleDelete(),
    }));
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (selectedProductId) {
        const result = await deleteProduct(selectedProductId);
        if (result.status) {
          setSnackbar({
            open: true,
            message: "Product deleted successfully",
            severity: "success",
          });
          await fetchProducts();
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

  const handleProductSave = () => {
    fetchProducts();
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
              Products
            </Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddProduct}
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
                Add Product
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
              rows={filteredProducts}
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
