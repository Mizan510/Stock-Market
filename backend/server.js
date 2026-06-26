const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const buyRoutes = require("./routes/buyRoutes");
const saleRoutes = require("./routes/saleRoutes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const lbslReportRoutes = require("./routes/lbslReportRoutes");
const dividendRoutes = require("./routes/dividendRoutes");
const zoneRoutes = require("./routes/zoneRoutes");

const app = express();

// ==================== CORS CONFIGURATION ====================
// Simple CORS - Allow all origins (for development)
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept']
}));

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ==================== MONGODB CONNECTION ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// ==================== ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/buy", buyRoutes);
app.use("/api/sale", saleRoutes);
app.use("/api/investment", investmentRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/lbsl", lbslReportRoutes);
app.use("/api/dividend", dividendRoutes);
app.use("/api/zone", zoneRoutes);

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== DEBUG ROUTE ====================
app.get('/debug/routes', (req, res) => {
  const routes = [];
  
  function printRoutes(stack, basePath = '') {
    if (!stack) return;
    
    stack.forEach((layer) => {
      if (layer.route) {
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push({
          path: basePath + path,
          methods: methods
        });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        // Get the base path from the router
        let routerPath = '';
        if (layer.regexp) {
          const pathStr = layer.regexp.source
            .replace(/\\\//g, '/')
            .replace(/\^/g, '')
            .replace(/\?/g, '')
            .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':id')
            .replace(/\\/g, '');
          routerPath = pathStr;
        }
        printRoutes(layer.handle.stack, basePath + routerPath);
      }
    });
  }
  
  if (app._router && app._router.stack) {
    printRoutes(app._router.stack);
  }
  
  res.json({
    success: true,
    totalRoutes: routes.length,
    routes: routes
  });
});

// ==================== ERROR HANDLING ====================
// 404 handler - This should be the LAST route handler
app.use((req, res) => {
  console.log("404 - Route not found:", req.method, req.url);
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.method} ${req.url}` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// ==================== SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});