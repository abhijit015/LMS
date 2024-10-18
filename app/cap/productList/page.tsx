"use client"; // Add this at the top of the file to mark it as a client-side component

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import the correct useRouter for Next.js app directory
import Layout from "../layout";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Box, Button, IconButton, TextField } from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";

interface Product {
  id: number;
  name: string;
}

const Products = () => {
  const router = useRouter(); // Use router for client-side navigation

  // Initial products data
  const initialProducts: Product[] = [
    { id: 1, name: "Product A" },
    { id: 2, name: "Product B" },
    { id: 3, name: "Product C" },
  ];

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");

  // Columns for the DataGrid
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <>
          <IconButton
            aria-label="edit"
            color="primary"
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="delete"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  // Filtered rows based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = () => {
    // Redirect to the product creation page
    router.push("/cap/product");
  };

  const handleEdit = (product: Product) => {
    // Edit product logic here
    console.log("Edit Product:", product);
  };

  const handleDelete = (id: number) => {
    // Delete product logic here
    setProducts(products.filter((product) => product.id !== id));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <Layout title="Products">
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        {/* Search Bar */}
        <TextField
          label="Search"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ height: 40 }} // Reduce the height
        />

        {/* Add Product Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
          size="small"
          sx={{ height: 40 }} // Reduce the height
        >
          Add Product
        </Button>
      </Box>

      {/* DataGrid */}
      <Box sx={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={filteredProducts}
          columns={columns}
          // pageSize={5}
          // rowsPerPageOptions={[5]}
          // disableSelectionOnClick
          autoHeight
        />
      </Box>
    </Layout>
  );
};

export default Products;
