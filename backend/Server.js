// server.js

// Import the Express library
const express = require('express');

// Create an instance of an Express application
const app = express();

// Define the port the server will run on.
// process.env.PORT is for hosting platforms; 5000 is for local development.
const PORT = process.env.PORT || 5000;

// Define a "route" for the homepage
// This tells the server what to do when someone visits the main URL
app.get('/', (req, res) => {
  res.send('Welcome to the SUPER Fantasy Football API! The mothership is online.');
});

// Start the server and listen for incoming requests on the specified port
app.listen(PORT, () => {
  console.log(`🚀 SUPER server is fired up and running on port ${PORT}`);
});