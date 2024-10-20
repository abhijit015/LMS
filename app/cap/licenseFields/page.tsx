"use client";

import Layout from "../layout";
import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import {
  GridRowModesModel,
  GridRowModes,
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowEditStopReasons,
  GridColumnHeaderParams,
} from "@mui/x-data-grid";
import { licenseFieldSchemaT } from "../../models/models";
import {
  loadLicenseFields,
  saveLicenseFields,
  loadLicenseFieldBasis,
} from "../../controllers/licenseFields.controller";
import { ZodError } from "zod";
import { licenseFieldSchema } from "@/app/zodschema/zodschema";
import ErrorModal from "@/app/cap/components/ErrorModal";
import SuccessModal from "@/app/cap/components/SuccessModal";
import ConfirmationDialog from "@/app/cap/components/ConfirmationDialog";

export default function LicenseFields() {
  const [rows, setRows] = React.useState<licenseFieldSchemaT[]>([]);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );
  const [loading, setLoading] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [basisOptions, setBasisOptions] = React.useState<
    { id: number; name: string }[]
  >([]);
  const fetchedDataRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!fetchedDataRef.current) {
        fetchedDataRef.current = true;
        setLoading(true);
        try {
          const [loadedFields, loadedBasis] = await Promise.all([
            loadLicenseFields(),
            loadLicenseFieldBasis(),
          ]);

          if (loadedFields) {
            setRows(loadedFields);
          }
          if (loadedBasis) {
            setBasisOptions(loadedBasis);
          }
        } catch (error) {
          setError("Error loading data.");
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, []);

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [id]: { mode: GridRowModes.Edit },
    }));
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [id]: { mode: GridRowModes.View },
    }));
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setRows((prevRows) => {
      const filteredRows = prevRows.filter((row) => row.id !== id);
      return filteredRows.map((row, index) => ({ ...row, id: index + 1 }));
    });
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow?.isNew) {
      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow: licenseFieldSchemaT) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === newRow.id ? updatedRow : row))
    );
    return updatedRow;
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setConfirmationOpen(true);
  };

  const handleConfirmSave = async (confirmed: boolean) => {
    setConfirmationOpen(false);
    if (!confirmed) return;

    const errorMessages: string[] = [];
    rows.forEach((row, index) => {
      try {
        licenseFieldSchema.parse(row);
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach((err) => {
            const rowIndex = index + 1;
            errorMessages.push(`Row ${rowIndex}: ${err.message}`);
          });
        }
      }
    });

    if (errorMessages.length > 0) {
      setError(errorMessages.join(", "));
    } else {
      setSaving(true);
      try {
        const response = await saveLicenseFields(rows);
        if (response.status) {
          setSuccess("License fields saved successfully.");
        } else {
          setError("Error saving license fields.");
        }
      } catch (error) {
        setError("Error saving license fields.");
        console.error(error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleQuit = () => {
    console.log("Quit button clicked");
  };

  const handleAddRecord = () => {
    const id =
      rows.length > 0 ? Math.max(...rows.map((row) => row.id || 0)) + 1 : 1;
    setRows((oldRows) => [
      ...oldRows,
      { id, name: "", basis: "", isNew: true },
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
    }));
  };

  const columns: GridColDef[] = [
    {
      field: "sNo",
      headerName: "S.No",
      width: 70,
      renderCell: (params) => params.row.id,
      renderHeader: () => <strong>S.No</strong>,
    },
    {
      field: "name",
      headerName: "Name",
      width: 540,
      editable: true,
      renderHeader: () => <strong>Name</strong>,
    },
    {
      field: "basis",
      headerName: "Basis",
      width: 150,
      editable: true,
      type: "singleSelect",
      valueOptions: basisOptions.map((option) => option.name),
      renderHeader: () => <strong>Basis</strong>,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      renderHeader: () => <strong>Actions</strong>,
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        return isInEditMode
          ? [
              <GridActionsCellItem
                icon={<SaveIcon />}
                label="Save"
                onClick={handleSaveClick(id)}
                color="primary"
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                onClick={handleCancelClick(id)}
                color="inherit"
              />,
            ]
          : [
              <GridActionsCellItem
                icon={<EditIcon />}
                label="Edit"
                onClick={handleEditClick(id)}
                color="inherit"
              />,
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={handleDeleteClick(id)}
                color="inherit"
              />,
            ];
      },
    },
  ];

  return (
    <Layout title="License Fields">
      <form onSubmit={handleFormSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box
              sx={{
                height: 400,
                width: "100%",
                border: "1px solid #ccc",
                position: "relative",
              }}
            >
              {loading && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    zIndex: 1,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
              <DataGrid
                autoHeight={false}
                rows={rows}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={setRowModesModel}
                onRowEditStop={handleRowEditStop}
                processRowUpdate={processRowUpdate}
                rowHeight={36}
                columnHeaderHeight={36}
                // pageSizeOptions={[5, 10, 25]}
                // initialState={{
                //   pagination: { paginationModel: { pageSize: 5 } },
                // }}
                hideFooter
              />
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <Button
              variant="text"
              onClick={handleAddRecord}
              sx={{
                fontWeight: "bold",
                color: (theme) => theme.palette.primary.main,
                "&:hover": {
                  color: (theme) => theme.palette.error.main,
                },
              }}
            >
              Insert Row
            </Button>

            <Box>
              <Button
                type="submit"
                variant="contained"
                sx={{ mr: 1 }}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outlined" color="primary" onClick={handleQuit}>
                Quit
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      {error && (
        <ErrorModal
          open={Boolean(error)}
          onClose={() => setError(null)}
          title="Error"
          message={error}
        />
      )}
      {success && (
        <SuccessModal
          open={Boolean(success)}
          onClose={() => setSuccess(null)}
          title="Success"
          message={success}
        />
      )}
      <ConfirmationDialog
        open={confirmationOpen}
        onClose={handleConfirmSave}
        message="Are you sure you want to save the changes?"
      />
    </Layout>
  );
}
