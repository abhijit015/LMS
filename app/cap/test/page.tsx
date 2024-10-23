"use client";

import React, { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Layout from "../layout";

// Sample data for the DataGrid
const rows = [
  {
    id: 1,
    label: "Apple",
    description: "A sweet fruit",
    category: "Fruit",
    color: "Red",
    shape: "Round",
    use: "Snack",
    nutrient: "Vitamin C",
    origin: "USA",
    weight: "100g",
    price: "1.2",
  },
  {
    id: 2,
    label: "Banana",
    description: "A yellow fruit",
    category: "Fruit",
    color: "Yellow",
    shape: "Long",
    use: "Snack",
    nutrient: "Potassium",
    origin: "Ecuador",
    weight: "118g",
    price: "1.1",
  },
  {
    id: 3,
    label: "Carrot",
    description: "An orange vegetable",
    category: "Vegetable",
    color: "Orange",
    shape: "Long",
    use: "Salad",
    nutrient: "Vitamin A",
    origin: "USA",
    weight: "200g",
    price: "0.9",
  },
  {
    id: 4,
    label: "Dates",
    description: "A sweet dry fruit",
    category: "Fruit",
    color: "Brown",
    shape: "Sweet",
    use: "Dessert",
    nutrient: "Fiber",
    origin: "Egypt",
    weight: "250g",
    price: "2.8",
  },
  {
    id: 5,
    label: "Eggplant",
    description: "A purple vegetable",
    category: "Vegetable",
    color: "Purple",
    shape: "Round",
    use: "Cooked",
    nutrient: "Fiber",
    origin: "Italy",
    weight: "120g",
    price: "0.8",
  },
  {
    id: 6,
    label: "Fig",
    description: "A sweet fruit",
    category: "Fruit",
    color: "Purple",
    shape: "Round",
    use: "Dessert",
    nutrient: "Calcium",
    origin: "Turkey",
    weight: "250g",
    price: "1.5",
  },
  // Add more rows as needed
];

// Define columns for the DataGrid
const columns: GridColDef[] = [
  {
    field: "label",
    headerName: "Label",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "description",
    headerName: "Description",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "category",
    headerName: "Category",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "color",
    headerName: "Color",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "shape",
    headerName: "Shape",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "use",
    headerName: "Use",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "nutrient",
    headerName: "Nutrient",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "origin",
    headerName: "Origin",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "weight",
    headerName: "Weight",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "price",
    headerName: "Price ($)",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
];

const SimpleDataGridDropdown = () => {
  const [filterText, setFilterText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter rows based on the text input
  const filteredRows = rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  // Handle focus and blur events
  const handleFocus = () => {
    if (filterText) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setShowDropdown(false);
  };

  // Show dropdown when there's text
  useEffect(() => {
    if (filterText) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [filterText]);

  return (
    <Layout title={"DataGrid Dropdown Example"}>
      <Box sx={{ width: 600, mb: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          size="small"
          onChange={(e) => setFilterText(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Box>
      {showDropdown && filteredRows.length > 0 && (
        <div
          style={{
            height: 300,
            width: "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          <DataGrid
            rows={filteredRows}
            columns={columns}
            onRowClick={() => setShowDropdown(false)}
            rowHeight={36}
            columnHeaderHeight={36}
          />
        </div>
      )}
    </Layout>
  );
};

export default SimpleDataGridDropdown;
