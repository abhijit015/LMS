"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  CssBaseline,
  ThemeProvider,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import AppBarComponent from "./navbar/AppBarComponent";
import MainContent from "./navbar/MainContent";
import theme from "./theme/theme";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/en-gb";
import { businessSchemaT, userSchemaT } from "../utils/models";
import { getCurrentUserDet } from "../controllers/user.controller";
import { getCurrentBusinessDet } from "../controllers/business.controller";

interface LayoutProps {
  children: React.ReactNode;
  loading: boolean;
  isBusinessSelected?: boolean;
}

export default function Layout({
  children,
  loading,
  isBusinessSelected = true,
}: LayoutProps) {
  const [userData, setUserData] = useState<userSchemaT | null>(null);
  const [businessData, setBusinessData] = useState<businessSchemaT | null>(
    null
  );
  const fetchCalled = useRef(false);

  useEffect(() => {
    let result;

    if (!fetchCalled.current) {
      fetchCalled.current = true;

      const fetchUserData = async () => {
        result = await getCurrentUserDet();
        if (result.status) {
          setUserData(result.data);
        }
      };

      const fetchBusinessData = async () => {
        if (isBusinessSelected) {
          result = await getCurrentBusinessDet();
          if (result.status) {
            setBusinessData(result.data);
          }
        }
      };

      fetchUserData();
      fetchBusinessData();
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        <AppBarComponent
          userData={userData}
          businessData={businessData}
          isBusinessSelected={isBusinessSelected}
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
    </ThemeProvider>
  );
}
