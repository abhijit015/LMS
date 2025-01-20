"use client";

import React, { useState } from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Divider,
  ListItemIcon,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import Link from "next/link";
import { userSchemaT } from "@/app/utils/models";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import GroupIcon from "@mui/icons-material/Group";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import ExtensionIcon from "@mui/icons-material/Extension";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";

interface DrawerItemsProps {
  onClose: () => void;
  userData: userSchemaT | null;
}

const DrawerItems: React.FC<DrawerItemsProps> = ({ onClose, userData }) => {
  const [openMasters, setOpenMasters] = useState(false);
  const [openReports, setOpenReports] = useState(false);

  const handleMastersClick = () => {
    setOpenMasters(!openMasters);
  };

  const handleReportsClick = () => {
    setOpenReports(!openReports);
  };

  return (
    <List>
      <img
        src="https://algofast.in/images/logo.png"
        alt="Algofast India Pvt. Ltd."
        style={{
          height: "90px",
          width: "210px",
          marginRight: "24px",
          marginLeft: "24px",
          marginTop: "6px",
        }}
      />

      <Divider />

      <Link href="/cap/dashboard" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </Link>

      <Link href="/cap/licenses" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemIcon>
            <VpnKeyIcon />
          </ListItemIcon>
          <ListItemText primary="Licenses" />
        </ListItemButton>
      </Link>

      <Link href="/cap/pricing" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemIcon>
            <PriceCheckIcon />
          </ListItemIcon>
          <ListItemText primary="Plans & Pricing" />
        </ListItemButton>
      </Link>

      <Divider />

      <ListItemButton onClick={handleMastersClick}>
        <ListItemIcon>
          <CategoryIcon />
        </ListItemIcon>
        <ListItemText primary="Masters" />
        {openMasters ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={openMasters} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <Link href="/cap/products" passHref>
            <ListItemButton sx={{ pl: 4 }} onClick={onClose}>
              <ListItemIcon>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary="Products" />
            </ListItemButton>
          </Link>

          <Link href="/cap/executives" passHref>
            <ListItemButton sx={{ pl: 4 }} onClick={onClose}>
              <ListItemIcon>
                <GroupIcon />
              </ListItemIcon>
              <ListItemText primary="Executives" />
            </ListItemButton>
          </Link>

          <Link href="/cap/dealers" passHref>
            <ListItemButton sx={{ pl: 4 }} onClick={onClose}>
              <ListItemIcon>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Dealers" />
            </ListItemButton>
          </Link>

          <Link href="/cap/departments" passHref>
            <ListItemButton sx={{ pl: 4 }} onClick={onClose}>
              <ListItemIcon>
                <WorkIcon />
              </ListItemIcon>
              <ListItemText primary="Departments" />
            </ListItemButton>
          </Link>

          <Link href="/cap/roles" passHref>
            <ListItemButton sx={{ pl: 4 }} onClick={onClose}>
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Roles" />
            </ListItemButton>
          </Link>

          <Link href="/cap/addons" passHref>
            <ListItemButton sx={{ pl: 4 }} onClick={onClose}>
              <ListItemIcon>
                <ExtensionIcon />
              </ListItemIcon>
              <ListItemText primary="Add-ons" />
            </ListItemButton>
          </Link>

          <Link href="#" passHref>
            <ListItemButton sx={{ pl: 4 }} onClick={onClose}>
              <ListItemIcon>
                <CardGiftcardIcon />
              </ListItemIcon>
              <ListItemText primary="Schemes" />
            </ListItemButton>
          </Link>
        </List>
      </Collapse>

      <Divider />

      <Link href="/cap/invites" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemIcon>
            <PersonAddIcon />
          </ListItemIcon>
          <ListItemText primary="Invite Management" />
        </ListItemButton>
      </Link>

      <Link href="/cap/credits" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemIcon>
            <AccountBalanceWalletIcon />
          </ListItemIcon>
          <ListItemText primary="Credits Management" />
        </ListItemButton>
      </Link>

      <Link href="/cap/rights" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemIcon>
            <AdminPanelSettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Rights Management" />
        </ListItemButton>
      </Link>

      <Divider />

      <Link href="/cap/settings" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
      </Link>

      <Divider />

      <ListItemButton onClick={handleReportsClick}>
        <ListItemIcon>
          <AssessmentIcon />
        </ListItemIcon>
        <ListItemText primary="Reports" />
        {openReports ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={openReports} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <Link href="/cap/reports/licenseHistory" passHref>
            <ListItemButton sx={{ pl: 4 }} onClick={onClose}>
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="License History" />
            </ListItemButton>
          </Link>
        </List>
      </Collapse>
    </List>
  );
};

export default DrawerItems;
