"use client";
import { handleErrorMsg } from "@/app/utils/common";
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  IconButton,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { loadProductList } from "@/app/controllers/product.controller";
import { dealerSchemaT, inviteSchemaT, userSchemaT } from "@/app/utils/models";
import { dealerSchema } from "@/app/utils/zodschema";
import ConfirmationModal from "./AskYesNo";
import CloseIcon from "@mui/icons-material/Close";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { loadDealer, saveDealer } from "@/app/controllers/dealer.controller";
import { initDealerData, inviteStatusId2Name } from "@/app/utils/common";
import { loadInvite } from "@/app/controllers/invite.controller";
import { INVITE_STATUS_ACCEPTED } from "@/app/utils/constants";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import theme from "../theme/theme";
import SaveIcon from "@mui/icons-material/Save";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface DealerModalProps {
  dealerId?: number;
  onClose: () => void;
  onSave: () => void;
}

const DealerModal: React.FC<DealerModalProps> = ({
  dealerId,
  onClose,
  onSave,
}) => {
  const [dealerData, setDealerData] = useState<dealerSchemaT>(initDealerData());
  const [inviteData, setInviteData] = useState<inviteSchemaT | null>(null);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [contactIdentifierModified, setContactIdentifierModified] =
    useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onClose: () => {},
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchDealerData = async () => {
      let errMsg: string = "";
      let proceed: boolean = true;
      let result;

      try {
        if (proceed && dealerId) {
          if (proceed) {
            result = await loadDealer(dealerId);
            if (result.status) {
              console.log("result : ", result.data);
              setDealerData(result.data as dealerSchemaT);
              setSelectedProducts(result.data.products || []);
            } else {
              proceed = false;
              errMsg = result.message;
            }
          } else {
            setDealerData(initDealerData());
            setSelectedProducts([]);
          }
        }

        if (proceed && result?.data.invite_id) {
          if (proceed) {
            result = await loadInvite(result.data.invite_id);
            if (result.status) {
              console.log("result : ", result.data);
              setInviteData(result.data as inviteSchemaT);
            } else {
              proceed = false;
              errMsg = result.message;
            }
          }
        }

        // if (proceed) {
        //   result = await loadProductList();
        //   if (result.status) {
        //     setProducts(result.data);
        //   } else {
        //     proceed = false;
        //     errMsg = result.message;
        //   }
        // }

        if (proceed) {
          result = await loadProductList();
          if (result.status) {
            setProducts(
              result.data
                ?.filter(
                  (product: any) =>
                    product.id !== undefined &&
                    typeof product.id === "number" &&
                    product.name
                )
                .map((product: any) => ({
                  id: product.id,
                  name: product.name,
                })) || []
            );
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (!proceed) {
          setSnackbar({
            open: true,
            message: errMsg,
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

    if (!hasLoadedData.current) {
      setLoading(true);
      fetchDealerData();
      hasLoadedData.current = true;
    } else if (!open) {
      setDealerData(initDealerData());
      setInviteData(null);
      setErrors({});
      setSelectedProducts([]);
      setContactIdentifierModified(false);
      hasLoadedData.current = false;
    }
  }, [dealerId, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    let data: Record<string, any>;

    if (dealerId) {
      data = {
        ...dealerData,
        ...Object.fromEntries(formData.entries()),
        products: selectedProducts,
      };
    } else {
      data = {
        ...Object.fromEntries(formData.entries()),
        products: selectedProducts,
      };
    }

    if (!dealerId || contactIdentifierModified) {
      data.send_invitation = true;
    } else {
      data.send_invitation = formData.has("send_invitation");
    }

    let result = dealerSchema.safeParse(data);

    if (result.success) {
      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this dealer?",
        onConfirm: () => confirmSave(result.data),
        onClose: () => {},
      });
    } else {
      const validationErrors = result.error.errors.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {} as { [key: string]: string });
      setErrors(validationErrors);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value.trim() === dealerData.contact_identifier.trim()) {
      setContactIdentifierModified(false);
    } else {
      setContactIdentifierModified(true);
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const confirmSave = async (parsedDealerData: dealerSchemaT) => {
    try {
      setLoading(true);
      setConfirmationModal((prev) => ({ ...prev, open: false }));
      const result = await saveDealer(parsedDealerData);
      if (result.status) {
        setSnackbar({
          open: true,
          message: "Dealer saved successfully.",
          severity: "success",
        });
        onSave();
        onClose();
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
        message: "Error saving dealer data.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        BackdropProps={{
          onClick: (event) => event.stopPropagation(),
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "500px",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
            outline: "none",
            textAlign: "center",
            border: "1px solid",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {dealerId ? (
                <EditIcon sx={{ color: "primary.main" }} />
              ) : (
                <AddIcon sx={{ color: "primary.main" }} />
              )}
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  color: "primary.main",
                  textAlign: "left",
                  fontWeight: "normal",
                }}
              >
                {dealerId ? "Edit Dealer" : "Add Dealer"}
              </Typography>
            </Box>

            <IconButton
              onClick={onClose}
              disabled={loading}
              sx={{
                color: "text.primary",
                ml: 2,
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 1 }} />

          <form onSubmit={handleSubmit}>
            <TextField
              autoFocus
              fullWidth
              label="Name"
              name="name"
              size="small"
              margin="normal"
              disabled={loading}
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 3 }}
              defaultValue={dealerData.name}
              onChange={handleChange}
            />

            <Autocomplete
              multiple
              id="checkboxes-tags-trial"
              size="small"
              options={products}
              disabled={loading}
              disableCloseOnSelect
              getOptionLabel={(option) => option.name}
              value={products.filter((product) =>
                selectedProducts.includes(product.id)
              )}
              onChange={(event, newValue) => {
                setSelectedProducts(newValue.map((product) => product.id));
              }}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={option.id} {...optionProps}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.name}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Map to Products"
                  placeholder="Select Products"
                />
              )}
            />

            <Box
              sx={{
                border: "1px solid #ccc",
                borderRadius: 2,
                padding: 2,
                mt: 3,
                position: "relative",
              }}
            >
              <legend
                style={{
                  fontSize: "0.95rem",
                  padding: "0 10px",
                  position: "absolute",
                  top: "-12px",
                  left: "10px",
                  backgroundColor: "#fff",
                  paddingRight: "10px",
                  color: theme.palette.secondary.dark,
                }}
              >
                Contact Details
              </legend>

              <TextField
                fullWidth
                autoComplete="off"
                label="Name"
                name="contact_name"
                size="small"
                margin="normal"
                disabled={loading}
                required
                error={!!errors.contact_name}
                helperText={errors.contact_name}
                sx={{ mb: 1 }}
                defaultValue={dealerData.contact_name}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                required
                autoComplete="off"
                label="Email or Phone"
                name="contact_identifier"
                size="small"
                margin="normal"
                disabled={loading}
                error={!!errors.contact_identifier}
                helperText={errors.contact_identifier}
                sx={{ mb: 2 }}
                defaultValue={dealerData.contact_identifier}
                onChange={handleContactChange}
              />

              {(!dealerId || contactIdentifierModified) && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "error.dark",
                    fontSize: "0.93rem",
                  }}
                >
                  An invitation will be sent to this contact upon saving.
                </Typography>
              )}

              <FormGroup
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {dealerId && inviteData && !contactIdentifierModified && (
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        inviteData.status === INVITE_STATUS_ACCEPTED
                          ? "success.dark"
                          : "error.dark",
                      fontSize: "0.93rem",
                    }}
                  >
                    Invite Status: {inviteStatusId2Name(inviteData.status)}
                  </Typography>
                )}

                {inviteData?.status !== INVITE_STATUS_ACCEPTED &&
                  !contactIdentifierModified &&
                  dealerId && (
                    <FormControlLabel
                      control={<Checkbox defaultChecked disabled={loading} />}
                      label="Resend Invitation"
                      name="send_invitation"
                    />
                  )}
              </FormGroup>
            </Box>

            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}
            >
              <Button
                startIcon={<SaveIcon />}
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Save"
                )}
              </Button>{" "}
              <Button onClick={onClose} disabled={loading} variant="outlined">
                Quit
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <ConfirmationModal
        open={confirmationModal.open}
        onClose={() =>
          setConfirmationModal((prev) => ({ ...prev, open: false }))
        }
        onConfirm={confirmationModal.onConfirm}
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
    </>
  );
};

export default DealerModal;
