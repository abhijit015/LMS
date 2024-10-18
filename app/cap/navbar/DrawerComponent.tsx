// DrawerComponent.tsx
"use client";

import { Drawer, Toolbar } from "@mui/material";

interface DrawerComponentProps {
  open: boolean;
  onClose: () => void;
}

const DrawerComponent: React.FC<DrawerComponentProps> = ({ open, onClose }) => {
  return (
    <Drawer
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
        },
      }}
      aria-label="Side navigation"
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
    >
      <Toolbar />
    </Drawer>
  );
};

export default DrawerComponent;
