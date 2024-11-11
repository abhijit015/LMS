"use client";
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
  Paper,
  FormGroup,
  InputAdornment,
} from "@mui/material";
import { saveDealer, loadDealer } from "@/app/controllers/dealer.controller";
import { loadProductList } from "@/app/controllers/product.controller"; // Import the product controller
import { dealerSchemaT, userSchemaT } from "@/app/utils/models";
import { dealerSchema, userSchema } from "@/app/utils/zodschema";
import ConfirmationModal from "./AskYesNo";
import MessageModal from "./ShowMsg";
import CloseIcon from "@mui/icons-material/Close";
import { MSG_ERROR, MSG_NORMAL, USER_TYPE_DEALER } from "@/app/utils/constants";
import { VisibilityOff, Visibility } from "@mui/icons-material";

interface DealerModalProps {
  open: boolean;
  dealerId?: number;
  onClose: () => void;
  onSave: () => void;
}

const DealerModal: React.FC<DealerModalProps> = ({
  open,
  dealerId,
  onClose,
  onSave,
}) => {
  const [dealerData, setDealerData] = useState<dealerSchemaT | null>(null);
  const [userData, setUserData] = useState<userSchemaT | null>(null);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [messageModal, setMessageModal] = useState({
    open: false,
    title: "",
    message: "",
    type: MSG_NORMAL,
  });

  const [showPassword, setShowPassword] = useState(false);
  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchDealerData = async () => {
      let errMsg: string = "";
      let proceed: boolean = true;
      let result;

      try {
        if (proceed && dealerId) {
          result = await loadDealer(dealerId);
          if (result.status) {
            setDealerData(result.data as dealerSchemaT);
            setUserData(result.data as userSchemaT);
            setSelectedProducts(result.data.products || []);
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (proceed) {
          result = await loadProductList();
          if (result.status) {
            setProducts(result.data);
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (!proceed) {
          setMessageModal({
            open: true,
            title: "Error",
            message: errMsg,
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

    if (open && !hasLoadedData.current) {
      setLoading(true);
      fetchDealerData();
      hasLoadedData.current = true;
    } else if (!open) {
      setDealerData(null);
      setUserData(null);
      setErrors({});
      setSelectedProducts([]);
      hasLoadedData.current = false;
    }
  }, [dealerId, open]);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    let parsedDealerData: dealerSchemaT;
    let parsedUserData: userSchemaT;

    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    data.user_type = USER_TYPE_DEALER;
    data.products = selectedProducts;

    let dealerResult = dealerSchema.safeParse(data);

    if (dealerResult.success) {
      parsedDealerData = dealerResult.data;
      if (dealerId) {
        parsedDealerData.id = dealerId;
      }
    } else {
      const validationErrors = dealerResult.error.errors.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {} as { [key: string]: string });
      setErrors(validationErrors);
    }

    let userResult = userSchema.safeParse(data);

    if (userResult.success) {
      parsedUserData = userResult.data as userSchemaT;
      if (userData) {
        parsedUserData.id = userData.id;
      }
    } else {
      const validationErrors = userResult.error.errors.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {} as { [key: string]: string });
      setErrors(validationErrors);
    }

    if (dealerResult.success && userResult.success) {
      setConfirmationModal({
        open: true,
        title: "Confirm Save",
        message: "Are you sure you want to save this dealer?",
        onConfirm: () => confirmSave(parsedDealerData, parsedUserData),
      });
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

  const handleProductSelection = (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: number
  ) => {
    setSelectedProducts((prevSelected) =>
      e.target.checked
        ? [...prevSelected, productId]
        : prevSelected.filter((id) => id !== productId)
    );
  };

  const confirmSave = async (
    parsedDealerData: dealerSchemaT,
    parsedUserData: userSchemaT
  ) => {
    try {
      setLoading(true);
      setConfirmationModal({ ...confirmationModal, open: false });

      const result = await saveDealer(parsedDealerData, parsedUserData);
      if (result.status) {
        onSave();
        onClose();
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
        message: "Error saving dealer data.",
        type: MSG_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 320,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            outline: "none",
            textAlign: "center",
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
            <IconButton
              onClick={onClose}
              sx={{
                color: "text.primary",
                ml: 2,
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <form onSubmit={handleSubmit}>
            {/* Dealer and User Fields */}
            <TextField
              fullWidth
              autoComplete="off"
              label="Dealer Name"
              name="display_name"
              size="small"
              margin="normal"
              required
              error={!!errors.display_name}
              helperText={errors.display_name}
              sx={{ mb: 1 }}
              defaultValue={userData?.display_name || ""}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              autoComplete="off"
              label="Email"
              name="email"
              size="small"
              margin="normal"
              required
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 1 }}
              defaultValue={userData?.email || ""}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              autoComplete="off"
              label="Phone"
              name="phone"
              size="small"
              margin="normal"
              error={!!errors.phone}
              helperText={errors.phone}
              sx={{ mb: 1 }}
              defaultValue={userData?.phone || ""}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              autoComplete="off"
              label="Contact Person"
              name="contact_person"
              size="small"
              margin="normal"
              error={!!errors.contact_person}
              helperText={errors.phone}
              sx={{ mb: 1 }}
              defaultValue={dealerData?.contact_person || ""}
              onChange={handleChange}
            />
            {!dealerId && (
              <TextField
                fullWidth
                autoComplete="off"
                label="Password"
                name="password"
                size="small"
                margin="normal"
                required
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mb: 1 }}
                defaultValue={""}
                type={showPassword ? "text" : "password"}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
            <Box
              sx={{
                border: "1px solid #ddd",
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
                  color: "#005a9f",
                }}
              >
                Map to Products
              </legend>

              <FormGroup>
                {products.map((product) => (
                  <FormControlLabel
                    key={product.id}
                    control={
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => handleProductSelection(e, product.id)}
                      />
                    }
                    label={product.name}
                  />
                ))}
              </FormGroup>
            </Box>

            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}
            >
              <Button onClick={onClose} disabled={loading}>
                Quit
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                Save
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <ConfirmationModal
        open={confirmationModal.open}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, open: false })
        }
        onConfirm={confirmationModal.onConfirm}
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
            type: MSG_NORMAL,
          })
        }
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </>
  );
};

export default DealerModal;
