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
import DrawerComponent from "./navbar/DrawerComponent";
import MainContent from "./navbar/MainContent";
import theme from "./theme/theme";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/en-gb";
import { userSchemaT } from "../utils/models";
import { getCurrentUserDet, loadUser } from "../controllers/user.controller";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  loading: boolean;
}

export default function Layout({ children, title, loading }: LayoutProps) {
  const [userData, setUserData] = useState<userSchemaT | null>(null);
  const fetchCalled = useRef(false);

  useEffect(() => {
    if (!fetchCalled.current) {
      fetchCalled.current = true;

      const fetchUserData = async () => {
        const result = await getCurrentUserDet();
        if (result.status) {
          setUserData(result.data);
        }
      };

      fetchUserData();
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        <AppBarComponent title={title} userData={userData} />
        <DrawerComponent open={false} onClose={() => {}} />

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
