"use client";

import dynamic from "next/dynamic";
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
  Avatar,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useState, useEffect, type ReactNode } from "react";
import DrawerItems from "./DrawerItems";
import { redirect } from "next/navigation";
import { businessSchemaT, userSchemaT } from "@/app/utils/models";
import { clearUserIdCookie, clearBusinessCookie } from "@/app/utils/cookies";
import Link from "next/link";

const NoSSR = dynamic(
  () =>
    Promise.resolve(({ children }: { children: ReactNode }) => <>{children}</>),
  { ssr: false }
);

const AppBarComponent: React.FC<{
  userData: userSchemaT | null;
  businessData: businessSchemaT | null;
  isBusinessSelected: boolean;
}> = ({ userData, businessData, isBusinessSelected }) => {
  const [isClient, setIsClient] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    setLoading(true);
    handleClose();
    await clearUserIdCookie();
    redirect("/");
  };

  const handleProfile = async () => {
    setLoading(true);
    handleClose();
    redirect("/cap/profile");
  };

  const handleBusiness = async () => {
    setLoading(true);
    handleClose();
    await clearBusinessCookie();
    redirect("/cap/business");
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          // bgcolor: "#fefefe",
          bgcolor: "white",
          color: "#444444",
          borderBottom: "1px solid #e0e0e0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isBusinessSelected && isClient && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Link
              href="https://algofast.in/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              <img
                src="https://media.licdn.com/dms/image/v2/D4D0BAQGFtmPASqsUdw/company-logo_200_200/company-logo_200_200/0/1719309870864?e=1741219200&v=beta&t=9rykagSCqVKY6FPfrBDz3g0eKD-Ax8pf3qOnyAnoxvI"
                alt="Algofast India Pvt. Ltd."
                style={{
                  height: "40px",
                  width: "auto",
                  marginRight: "8px",
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: "primary.main",
                  fontWeight: 500,
                }}
              >
                License Management System
              </Typography>
            </Link>
          </Box>

          {isBusinessSelected && businessData?.name && (
            <Typography
              variant="h6"
              sx={{
                color: "primary.dark",
                // fontWeight: 550,
                // color: "#2A2A2A",
                // color: "#1F2F5C",
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              {businessData.name}
            </Typography>
          )}

          <NoSSR>
            {userData?.name && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.dark",
                    width: 40,
                    height: 35,
                  }}
                >
                  {getInitials(userData.name)}
                </Avatar>
                <Box
                  onClick={handleClick}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <Typography
                    sx={{
                      color: "primary.main",
                      "&:hover": {
                        color: "error.main",
                      },
                    }}
                  >
                    {userData.name}
                    <ArrowDropDownIcon />
                  </Typography>
                </Box>
              </Box>
            )}

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleProfile}>My Profile</MenuItem>
              {isBusinessSelected && (
                <MenuItem onClick={handleBusiness}>Switch Business</MenuItem>
              )}
              <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
            </Menu>
          </NoSSR>
        </Toolbar>
      </AppBar>

      {isClient && (
        <>
          <Drawer
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                minWidth: "210px",
                // bgcolor: "#1F2F5C",
                color: "#FFFFFF",
                bgcolor: "primary.dark",
              },
            }}
            variant="temporary"
            anchor="left"
            open={open}
            onClose={handleDrawerToggle}
          >
            <DrawerItems onClose={handleDrawerToggle} userData={userData} />
          </Drawer>

          <Backdrop
            sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={loading}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        </>
      )}
    </>
  );
};

export default AppBarComponent;
