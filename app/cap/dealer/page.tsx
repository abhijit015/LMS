"use client";

import { Box, TextField, Button, CircularProgress } from "@mui/material";
import { useRef, useState, useEffect } from "react";
import Layout from "../layout";
import { dealerSchema } from "@/app/zodschema/zodschema";
import { dealerSchemaT } from "@/app/models/models";
import {
  saveDealer,
  loadDealerByID,
} from "@/app/controllers/dealer.controller";
import ErrorModal from "@/app/components/errorModal";
import ConfirmationDialog from "@/app/components/confirmationDialog";
import { useSearchParams, useRouter } from "next/navigation";

const Dealers = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dealerData, setDealerData] = useState<dealerSchemaT | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const searchParams = useSearchParams();
  const dealerId = searchParams.get("id");
  const router = useRouter();
  const isFetched = useRef(false);

  useEffect(() => {
    const fetchDealer = async () => {
      if (dealerId && !isFetched.current) {
        isFetched.current = true;
        try {
          const response = await loadDealerByID(Number(dealerId));
          if (response.status) {
            setDealerData(response.data);
          } else {
            setError(
              typeof response.data === "string"
                ? response.data
                : "Error loading dealer data."
            );
          }
        } catch (error) {
          setError(String(error));
        }
      }
    };
    fetchDealer();
  }, [dealerId]);

  const handleReset = () => {
    formRef.current?.reset();
    setDealerData(null);
    setValidationErrors({});
    setError(null);
  };

  const handleFormSubmit = (formData: FormData) => {
    setFormData(formData);
    setIsConfirmationOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData) return;

    setLoading(true);
    setError(null);
    setValidationErrors({});
    const data: Record<string, any> = Object.fromEntries(formData.entries());

    try {
      const parsedData = dealerSchema.safeParse(data);

      if (!parsedData.success) {
        const fieldErrors: Record<string, string> = {};
        parsedData.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as string] = issue.message;
          }
        });
        setValidationErrors(fieldErrors);
        setLoading(false);
        return;
      }

      const dealerData: dealerSchemaT = parsedData.data;
      if (dealerId) {
        dealerData.id = Number(dealerId);
      }
      const response = await saveDealer(dealerData);

      if (response && response.status) {
        handleReset();
        router.push("/cap/dealerList");
      } else if (response) {
        if (Array.isArray(response.data)) {
          const errorMessages = response.data
            .map((err) =>
              typeof err.message === "string" ? err.message : "Unknown error"
            )
            .join(", ");
          setError(errorMessages);
        } else if (typeof response.data === "string") {
          setError(response.data);
        } else {
          setError("Unexpected error format.");
        }
      } else {
        setError("Unexpected error: No response from server.");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Server Error: Unable to save data."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={dealerId ? "Modify Dealer" : "Add Dealer"}>
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleFormSubmit(formData);
        }}
      >
        <Box
          sx={{
            maxWidth: 400,
            padding: 1,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <TextField
            name="name"
            label="Name"
            variant="outlined"
            fullWidth
            required
            size="small"
            defaultValue={dealerData?.name || ""}
            error={Boolean(validationErrors.name)}
            helperText={validationErrors.name}
            onChange={() =>
              setValidationErrors((prev) => ({ ...prev, name: "" }))
            }
          />
          <TextField
            name="contact_num"
            label="Contact Number"
            variant="outlined"
            fullWidth
            size="small"
            defaultValue={dealerData?.contact_num || ""}
            error={Boolean(validationErrors.contact_num)}
            helperText={validationErrors.contact_num}
            onChange={() =>
              setValidationErrors((prev) => ({ ...prev, contact_num: "" }))
            }
          />
          <TextField
            name="email"
            label="Email Address"
            variant="outlined"
            fullWidth
            size="small"
            defaultValue={dealerData?.email || ""}
            error={Boolean(validationErrors.email)}
            helperText={validationErrors.email}
            onChange={() =>
              setValidationErrors((prev) => ({ ...prev, email: "" }))
            }
          />
          <Box
            sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? "Saving..." : "SAVE"}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleReset}
              disabled={loading}
            >
              RESET
            </Button>
          </Box>
        </Box>
      </form>
      <ErrorModal
        open={Boolean(error)}
        title="Error"
        message={error || ""}
        onClose={() => setError(null)}
      />
      <ConfirmationDialog
        open={isConfirmationOpen}
        onClose={(confirmed) => {
          setIsConfirmationOpen(false);
          if (confirmed) handleSubmit();
        }}
        message={
          dealerId
            ? "Are you sure you want to modify this dealer?"
            : "Are you sure you want to add this dealer?"
        }
      />
    </Layout>
  );
};

export default Dealers;
