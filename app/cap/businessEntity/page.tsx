"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  ClickAwayListener,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Layout from "../layout";
import { loadAllBusinessEntities } from "@/app/controllers/businessEntity.controller";

const columns: GridColDef[] = [
  {
    field: "name",
    headerName: "Name",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "license_no",
    headerName: "License No",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "product_name",
    headerName: "Product",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "contact_num",
    headerName: "Contact Number",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1,
    renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
  },
];

const SimpleDataGridDropdown = () => {
  const [filterText, setFilterText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [businessEntities, setBusinessEntities] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadAllBusinessEntities();
      setBusinessEntities(data || []);
    };
    fetchData();
  }, []);

  const filteredRows = businessEntities.filter((entity) =>
    Object.values(entity).some((value) =>
      String(value).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleRowClick = (row: { id: number; name: string }) => {
    setSelectedRow(row.id);
    setFilterText(row.name);
    setShowDropdown(false);
    alert(`Selected: ${row.name}`);
  };

  const debounce = (func: Function, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const debouncedSetFilterText = debounce((value: string) => {
    setFilterText(value);
  }, 300);

  useEffect(() => {
    setShowDropdown(!!filterText && filteredRows.length > 0);
  }, [filterText, filteredRows]);

  const handleClickAway = () => {
    setShowDropdown(false);
  };

  return (
    <Layout title={"Business Entities"}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          position: "relative",
        }}
      >
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          sx={{ width: 300 }}
          value={filterText}
          onChange={(e) => debouncedSetFilterText(e.target.value)}
          onFocus={handleFocus}
        />
        <Button
          variant="contained"
          sx={{ ml: 2 }}
          disabled={filteredRows.length > 0}
          onClick={() => alert("Search button clicked")}
        >
          Search
        </Button>
        {filterText ? (
          <Typography
            variant="body2"
            sx={{
              ml: 2,
              color: filteredRows.length > 0 ? "primary.main" : "error.main",
              whiteSpace: "nowrap",
            }}
          >
            {filteredRows.length > 0
              ? "Click on the business entity to view its details"
              : "No records found. Enter a license number and press 'Search' to find business entities not linked to you."}
          </Typography>
        ) : (
          <Typography
            variant="body2"
            sx={{
              ml: 2,
              color: "primary.main",
              whiteSpace: "nowrap",
            }}
          >
            Start typing to search for business entities
          </Typography>
        )}
        {showDropdown && (
          <ClickAwayListener onClickAway={handleClickAway}>
            <Box
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "100%",
                maxHeight: 300,
                zIndex: 1,
                border: "1px solid #ddd",
                borderRadius: "4px",
                boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                backgroundColor: "white",
                mt: 1,
              }}
              ref={dropdownRef}
            >
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowClassName={(params) =>
                  params.id === selectedRow ? "selected-row" : ""
                }
                onCellClick={(params) => handleRowClick(params.row)}
                rowHeight={36}
                columnHeaderHeight={36}
                disableColumnMenu
                hideFooter
              />
            </Box>
          </ClickAwayListener>
        )}
      </Box>
      <style jsx>{`
        .selected-row {
          background-color: #005a9f;
          color: white;
        }
      `}</style>
    </Layout>
  );
};

export default SimpleDataGridDropdown;
