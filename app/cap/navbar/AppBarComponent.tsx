"use client";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Drawer,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useState } from "react";
import DrawerItems from "./DrawerItems";
import { clearCookies } from "@/app/controllers/cookies.controller";
import { redirect } from "next/navigation";
import { userSchemaT } from "@/app/utils/models";

const AppBarComponent: React.FC<{
  title: string;
  userData: userSchemaT | null;
}> = ({ title, userData }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(anchorEl);

  const handleDropdownClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    setLoading(true);
    await clearCookies();
    redirect("/");
  };

  const handleProfile = async () => {
    setLoading(true);
    redirect("/cap/profile");
  };

  const handlePassword = async () => {
    setLoading(true);
    redirect("/cap/password");
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
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
            {userData?.display_name} <ArrowDropDownIcon />
          </Typography>

          <Menu
            anchorEl={anchorEl}
            open={dropdownOpen}
            onClose={handleDropdownClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={handleProfile}>My Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
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
        <DrawerItems onClose={handleDrawerToggle} userData={userData} />
      </Drawer>

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default AppBarComponent;
