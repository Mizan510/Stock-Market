const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const buyRoutes = require("./routes/buyRoutes");
const saleRoutes = require("./routes/saleRoutes");
const authRoutes = require("./routes/auth");
const investmentRoutes = require("./routes/investmentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/buy", buyRoutes);
app.use("/api/sale", saleRoutes);
app.use("/api/investment", investmentRoutes);

// Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});