"use client";
import { handleErrorMsg } from "@/app/utils/common";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  CssBaseline,
  ThemeProvider,
  Backdrop,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import AppBarComponent from "./navbar/AppBarComponent";
import MainContent from "./navbar/MainContent";
import theme from "./theme/theme";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/en-gb";
import { businessSchemaT, dealerSchemaT, userSchemaT } from "../utils/models";
import { getCurrentUserDet } from "../controllers/user.controller";
import { getCurrentBusinessDet } from "../controllers/business.controller";
import { getCurrentUserRole } from "../controllers/business.controller";
import { ROLE_DEALER_ADMIN, ROLE_DEALER_EXECUTIVE } from "../utils/constants";
import {
  getCurrentDealerDet,
  getDealerCreditBalance,
} from "../controllers/dealer.controller";
import { initDealerData } from "../utils/common";

interface LayoutProps {
  children: React.ReactNode;
  loading: boolean;
}

export default function Layout({ children, loading }: LayoutProps) {
  const [userData, setUserData] = useState<userSchemaT | null>(null);
  const [businessData, setBusinessData] = useState<businessSchemaT | null>(
    null
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });
  const [currentUserRole, setCurrentUserRole] = useState<number>(0);
  const [isBusinessSelected, setIsBusinessSelected] = useState<boolean>(false);
  const [totalCreditsAssigned, setTotalCreditsAssigned] = useState<number>(0);
  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let proceed = true;
        let errMsg = "";
        let result: { status: boolean; data?: any; message: string };
        let currentUserRole: number = 0;
        let dealerData: dealerSchemaT = initDealerData();

        if (proceed) {
          result = await getCurrentUserDet();
          if (result.status) {
            setUserData(result.data);
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (proceed) {
          result = await getCurrentBusinessDet();
          if (result.status) {
            setIsBusinessSelected(true);
            setBusinessData(result.data);
          } else {
            proceed = false;
            errMsg = result.message;
          }
        }

        if (proceed) {
          result = await getCurrentUserRole();
          if (!result.status) {
            proceed = false;
            errMsg = result.message;
          } else {
            currentUserRole = result.data;
            setCurrentUserRole(result.data);
          }
        }

        if (
          currentUserRole === ROLE_DEALER_ADMIN ||
          currentUserRole === ROLE_DEALER_EXECUTIVE
        ) {
          if (proceed) {
            result = await getCurrentDealerDet();
            if (!result.status) {
              proceed = false;
              errMsg = result.message;
            } else {
              dealerData = result.data;
            }
          }

          if (proceed) {
            result = await getCurrentDealerDet();
            if (!result.status) {
              proceed = false;
              errMsg = result.message;
            } else {
              dealerData = result.data;
            }
          }

          if (proceed && dealerData.id) {
            result = await getDealerCreditBalance(dealerData.id);
            if (!result.status) {
              proceed = false;
              errMsg = result.message;
            } else {
              setTotalCreditsAssigned(result.data);
            }
          }
        }

        // if (!proceed) {
        //   setSnackbar({
        //     open: true,
        //     message: errMsg,
        //     severity: "error",
        //   });
        // }
      } catch (error) {
        setSnackbar({
          open: true,
          message: handleErrorMsg(error),
          severity: "error",
        });
      } finally {
      }
    };

    if (!hasLoadedData.current) {
      fetchData();
      hasLoadedData.current = true;
    } else {
      hasLoadedData.current = false;
    }
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar((prevState) => ({ ...prevState, open: false }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        <AppBarComponent
          userData={userData}
          businessData={businessData}
          isBusinessSelected={isBusinessSelected}
          currentUserRole={currentUserRole}
          totalCreditsAssigned={totalCreditsAssigned}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <MainContent>{children}</MainContent>
        </LocalizationProvider>

        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>

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
    </ThemeProvider>
  );
}
