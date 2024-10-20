"use client";

import { List, ListItemButton, ListItemText } from "@mui/material";
import Link from "next/link";

interface DrawerItemsProps {
  onClose: () => void;
}

const DrawerItems: React.FC<DrawerItemsProps> = ({ onClose }) => {
  return (
    <List>
      <Link href="/cap/licenseFields" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="License Fields" />
        </ListItemButton>
      </Link>
      <Link href="/cap/dealer" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Dealers" />
        </ListItemButton>
      </Link>
      <Link href="/cap/product" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Products" />
        </ListItemButton>
      </Link>
      <Link href="/cap/businessEntityList" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Business Entities" />
        </ListItemButton>
      </Link>
    </List>
  );
};

export default DrawerItems;
