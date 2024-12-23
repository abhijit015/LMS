"use client";

import React, { useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Card, CardContent } from "@mui/material";

const ConditionalEditGrid = () => {
  // Sample initial data
  const initialRows = [
    { id: 1, isFirstEnabled: false, secondColumn: "", thirdColumn: "" },
    { id: 2, isFirstEnabled: true, secondColumn: "Data 2", thirdColumn: "" },
    { id: 3, isFirstEnabled: false, secondColumn: "", thirdColumn: "Data 3" },
  ];

  const [rows, setRows] = useState(initialRows);

  const columns: GridColDef[] = [
    {
      field: "isFirstEnabled",
      headerName: "Enable/Disable",
      width: 130,
      type: "boolean",
      editable: true,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
    },
    {
      field: "secondColumn",
      headerName: "Second Column",
      width: 150,
      editable: true,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params) => {
        const isEditable = params.row.isFirstEnabled;
        return (
          <div className={!isEditable ? "text-gray-400" : ""}>
            {params.value || "-"}
          </div>
        );
      },
      preProcessEditCellProps: (params) => {
        return { ...params.props, editable: params.row.isFirstEnabled };
      },
    },
    {
      field: "thirdColumn",
      headerName: "Third Column",
      width: 150,
      editable: true,
      renderHeader: (params) => <strong>{params.colDef.headerName}</strong>,
      renderCell: (params) => {
        const isEditable = !params.row.isFirstEnabled;
        return (
          <div className={!isEditable ? "text-gray-400" : ""}>
            {params.value || "-"}
          </div>
        );
      },
      preProcessEditCellProps: (params) => {
        return { ...params.props, editable: !params.row.isFirstEnabled };
      },
    },
  ];

  const handleProcessRowUpdate = (newRow: any, oldRow: any) => {
    const updatedRows = rows.map((row) =>
      row.id === newRow.id ? newRow : row
    );
    setRows(updatedRows);
    return newRow;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardContent>
        <DataGrid
          rows={rows}
          columns={columns}
          processRowUpdate={handleProcessRowUpdate}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          autoHeight
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          sx={{
            mt: 10,
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#f9fafb",
              fontSize: "16px",
            },
            "& .MuiDataGrid-cell": {
              fontSize: "14px",
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default ConditionalEditGrid;
