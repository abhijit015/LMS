"use client";

import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import AppBarComponent from "./navbar/AppBarComponent";
import DrawerComponent from "./navbar/DrawerComponent";
import MainContent from "./navbar/MainContent";
import { redirect } from "next/navigation";
import { getSession } from "../services/session.service";
import theme from "./theme/theme";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/en-gb";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  // const session = await getSession();

  // console.log("session value : ", session);

  // if (!session) {
  //   redirect("/");
  // }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex" }}>
          <CssBaseline />
          <AppBarComponent title={title} />
          <DrawerComponent
            open={false}
            onClose={function (): void {
              throw new Error("Function not implemented.");
            }}
          />
          <MainContent>{children}</MainContent>
        </Box>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
