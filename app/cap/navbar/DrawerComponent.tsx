import { Drawer, Toolbar } from "@mui/material";

interface DrawerComponentProps {
  open: boolean;
  onClose: () => void;
}

const DrawerComponent: React.FC<DrawerComponentProps> = ({ open, onClose }) => {
  return (
    <Drawer
      sx={{
        flexShrink: 0,
        "& .MuiDrawer-paper": {
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
