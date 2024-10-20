"use client";
import React, { useState } from "react";
import { TextField, Box } from "@mui/material";

export default function KeystrokeCapture() {
  const [inputValue, setInputValue] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value); // Capture the keystroke
    // alert("Current Input: " + event.target.value); // Optionally log the current input
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Check for Alt + M
    if (event.altKey && event.key === "m") {
      alert("Alt + M was pressed!");
      event.preventDefault(); // Prevent default action if necessary
    }

    // Check for F2
    if (event.key === "F3") {
      alert("F2 was pressed!");
      event.preventDefault(); // Prevent default action if necessary
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <TextField
        label="Type something..."
        variant="outlined"
        value={inputValue}
        onChange={handleChange} // Capture keystrokes here
        onKeyDown={handleKeyDown} // Capture specific key presses here
        fullWidth
      />
    </Box>
  );
}
