// components/ProductDetailCard.tsx
"use client";
import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
} from "@mui/material";

interface Product {
  id: number;
  image: string;
  name: string;
  description: string;
  price: number;
}

interface ProductDetailCardProps {
  products: Product[];
}

const ProductDetailCard: React.FC<ProductDetailCardProps> = ({ products }) => {
  return (
    <Grid container spacing={2}>
      {products.map((product) => (
        <Grid item xs={12} sm={6} md={4} key={product.id}>
          <Card
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <CardMedia
              component="img"
              sx={{ height: 200, objectFit: "cover" }}
              image={product.image}
              alt={product.name}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="div">
                {product.name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ marginY: 1 }}
              >
                {product.description}
              </Typography>
              <Typography
                variant="h6"
                color="primary"
                sx={{ marginTop: "auto" }}
              >
                ${product.price.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductDetailCard;
