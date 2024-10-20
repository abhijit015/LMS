// AppBarComponent.tsx
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Drawer,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import DrawerItems from "./DrawerItems";

const AppBarComponent: React.FC<{ title: string }> = ({ title }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(anchorEl);
  const username = "Abhijit Gupta";

  const handleDropdownClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            sx={{ mr: 2 }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {title}
          </Typography>

          <Typography
            aria-haspopup="true"
            aria-controls="simple-menu"
            onClick={handleDropdownClick}
            sx={{
              cursor: "pointer",
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
            }}
          >
            {username}
            <ArrowDropDownIcon />
          </Typography>

          <Menu
            anchorEl={anchorEl}
            open={dropdownOpen}
            onClose={handleDropdownClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={handleDropdownClose}>Profile</MenuItem>
            <MenuItem onClick={handleDropdownClose}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

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
        onClose={handleDrawerToggle}
      >
        <Toolbar />
        <DrawerItems onClose={handleDrawerToggle} />
      </Drawer>
    </>
  );
};

export default AppBarComponent;
