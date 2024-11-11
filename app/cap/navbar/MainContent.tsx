import React from "react";
import { Box } from "@mui/material";

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <Box
      component="main"
      role="main"
      aria-label="Main content"
      sx={{
        flexGrow: 1,
        p: (theme) => theme.spacing(3),
        mt: (theme) => theme.spacing(3),
        backgroundColor: "#fafafa",
        minHeight: "100vh",
      }}
    >
      {children}
    </Box>
  );
};

export default MainContent;
