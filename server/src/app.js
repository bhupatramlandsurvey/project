const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");


const authRoutes = require("./routes/authRoutes");
const downloadMapsAndFilesRoutes = require("./routes/downloadMapsAndFilesRoutes");
const ftlHydraRoutes = require("./routes/ftlHydraRoutes");
const requestMapRoutes = require("./routes/requestMapRoutes");
const landSurveyRoutes = require("./routes/landSurveyRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminReportsRoutes = require("./routes/adminReportsRoutes");
const managerRoutes = require("./routes/managerRoutes");
const processedRoutes = require("./routes/processedRoutes");
const searchRoutes = require("./routes/searchRoutes");
const tourDiaryRoutes = require("./routes/tourdairyRoutes");
const abstractRoutes = require("./routes/abstractRoutes");
const kmzUpdateRoute = require("./routes/kmzUpdateRoute");
const priceRoute = require("./routes/priceRoute");
const versionRoute = require("./routes/versionRoute");



const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));
app.use("/important", express.static(path.join(__dirname, "./uploads/important")));


app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/downloadmapsandfiles", downloadMapsAndFilesRoutes);
app.use("/api/ftl-hydra", ftlHydraRoutes);
app.use("/api/requestmap", requestMapRoutes);
app.use("/api/landsurvey", landSurveyRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/reports", adminReportsRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/processed", processedRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/tour-diary", tourDiaryRoutes);
app.use("/api/abstract", abstractRoutes);
app.use("/api/kmz", kmzUpdateRoute);
app.use("/api/prices", priceRoute);
app.use("/api/version", versionRoute);
app.get("/socket-test", (req, res) => {
  const io = req.app.get("io");
  io.emit("new-order", { test: true });
  res.send("ok");
});

app.get("/", (req, res) => {
  res.send("API is running......!..!");
});


module.exports = app;
