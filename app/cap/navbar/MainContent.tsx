"use client";

import { Box } from "@mui/material";

const MainContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      component="main"
      role="main"
      aria-label="Main content"
      sx={{
        flexGrow: 1,
        bgcolor: (theme) => theme.palette.background.default,
        p: (theme) => theme.spacing(3),
        mt: (theme) => theme.spacing(3),
      }}
    >
      {children}
    </Box>
  );
};

export default MainContent;
