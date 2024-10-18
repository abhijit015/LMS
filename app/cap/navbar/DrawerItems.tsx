"use client";

import { List, ListItemButton, ListItemText } from "@mui/material";
import Link from "next/link";

const DrawerItems = () => {
  return (
    <List>
      <ListItemButton component={Link} href="/cap/licenseFields">
        <ListItemText primary="License Fields" />
      </ListItemButton>
      <ListItemButton component={Link} href="/cap/productList">
        <ListItemText primary="Products" />
      </ListItemButton>
      <ListItemButton component={Link} href="/cap/dealerList">
        <ListItemText primary="Dealers" />
      </ListItemButton>
      <ListItemButton component={Link} href="/cap/businessEntityList">
        <ListItemText primary="Business Entities" />
      </ListItemButton>
      <ListItemButton component={Link} href="#">
        <ListItemText primary="Rate Card" />
      </ListItemButton>
      <ListItemButton component={Link} href="#">
        <ListItemText primary="Users" />
      </ListItemButton>
    </List>
  );
};

export default DrawerItems;
