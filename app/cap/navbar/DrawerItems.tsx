"use client";

import React, { useState } from "react";
import { List, ListItemButton, ListItemText, Collapse } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import Link from "next/link";
import { userSchemaT } from "@/app/utils/models";
import { USER_TYPE_CLIENT, USER_TYPE_DEALER } from "@/app/utils/constants";

interface DrawerItemsProps {
  onClose: () => void;
  userData: userSchemaT | null;
}

const DrawerItems: React.FC<DrawerItemsProps> = ({ onClose, userData }) => {
  const [openProducts, setOpenProducts] = useState(false);
  const [openReport1, setOpenReport1] = useState(false);
  const [openReport2, setOpenReport2] = useState(false);

  const handleReportsClick = () => {
    setOpenProducts(!openProducts);
  };

  return (
    <List>
      <Link href="/cap/dashboard" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </Link>

      {userData?.user_type === USER_TYPE_DEALER && (
        <Link href="/cap/licenses" passHref>
          <ListItemButton onClick={onClose}>
            <ListItemText primary="Licenses" />
          </ListItemButton>
        </Link>
      )}

      {userData?.user_type === USER_TYPE_CLIENT && (
        <Link href="/cap/products" passHref>
          <ListItemButton onClick={onClose}>
            <ListItemText primary="Products" />
          </ListItemButton>
        </Link>
      )}

      {(userData?.user_type === USER_TYPE_CLIENT ||
        userData?.user_type === USER_TYPE_DEALER) && (
        <Link href="/cap/users" passHref>
          <ListItemButton onClick={onClose}>
            <ListItemText primary="Users" />
          </ListItemButton>
        </Link>
      )}

      {userData?.user_type === USER_TYPE_CLIENT && (
        <Link href="/cap/dealers" passHref>
          <ListItemButton onClick={onClose}>
            <ListItemText primary="Dealers" />
          </ListItemButton>
        </Link>
      )}

      <ListItemButton onClick={handleReportsClick}>
        <ListItemText primary="Reports" />
        {openProducts ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={openProducts} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemButton
            sx={{ pl: 4 }}
            onClick={() => setOpenReport1(!openReport1)}
          >
            <ListItemText primary="Report 1" />
            {openReport1 ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openReport1} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <Link href="#" passHref>
                <ListItemButton sx={{ pl: 8 }} onClick={onClose}>
                  <ListItemText primary="Subreport 1" />
                </ListItemButton>
              </Link>
              <Link href="#" passHref>
                <ListItemButton sx={{ pl: 8 }} onClick={onClose}>
                  <ListItemText primary="Subreport 2" />
                </ListItemButton>
              </Link>
            </List>
          </Collapse>

          <ListItemButton
            sx={{ pl: 4 }}
            onClick={() => setOpenReport2(!openReport2)}
          >
            <ListItemText primary="Report 2" />
            {openReport2 ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openReport2} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <Link href="#" passHref>
                <ListItemButton sx={{ pl: 8 }} onClick={onClose}>
                  <ListItemText primary="Subreport 1" />
                </ListItemButton>
              </Link>
              <Link href="#" passHref>
                <ListItemButton sx={{ pl: 8 }} onClick={onClose}>
                  <ListItemText primary="Subreport 2" />
                </ListItemButton>
              </Link>
            </List>
          </Collapse>
        </List>
      </Collapse>
    </List>
  );
};

export default DrawerItems;
