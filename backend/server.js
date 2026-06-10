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

// ✅ Dividend routes (FIXED NAME)
const dividendRoutes = require("./routes/dividendRoutes");
const zoneRoutes = require("./routes/zoneRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/buy", buyRoutes);
app.use("/api/sale", saleRoutes);
app.use("/api/investment", investmentRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/lbsl", lbslReportRoutes);

// ✅ Dividend API
app.use("/api/dividend", dividendRoutes);
app.use("/api/zone", zoneRoutes);

// Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
