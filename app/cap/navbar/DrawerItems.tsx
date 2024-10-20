"use client";

import { List, ListItemButton, ListItemText } from "@mui/material";
import Link from "next/link";

interface DrawerItemsProps {
  onClose: () => void;
}

const DrawerItems: React.FC<DrawerItemsProps> = ({ onClose }) => {
  return (
    <List>
      <ListItemButton
        component={Link}
        href="/cap/licenseFields"
        onClick={onClose}
      >
        <ListItemText primary="License Fields" />
      </ListItemButton>
      <ListItemButton
        component={Link}
        href="/cap/productList"
        onClick={onClose}
      >
        <ListItemText primary="Products" />
      </ListItemButton>
      <ListItemButton component={Link} href="/cap/dealerList" onClick={onClose}>
        <ListItemText primary="Dealers" />
      </ListItemButton>
      <ListItemButton
        component={Link}
        href="/cap/businessEntityList"
        onClick={onClose}
      >
        <ListItemText primary="Business Entities" />
      </ListItemButton>
    </List>
  );
};

export default DrawerItems;
