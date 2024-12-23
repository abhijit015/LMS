"use client";

import React, { useState } from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Divider,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import Link from "next/link";
import { userSchemaT } from "@/app/utils/models";

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

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/licenses" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Licenses" />
        </ListItemButton>
      </Link>

      <Link href="/cap/pricing" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Plans & Pricing" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/products" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Products" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/executives" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary=" Executives" />
        </ListItemButton>
      </Link>

      <Link href="/cap/dealers" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Dealers" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/invites" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Invites" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/departments" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Departments" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/credits" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Credit Ledger" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/roles" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Roles" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/rights" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Rights" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/variants" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Variants" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="/cap/addons" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Add-ons" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <Link href="#" passHref>
        <ListItemButton onClick={onClose}>
          <ListItemText primary="Schemes" />
        </ListItemButton>
      </Link>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

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
