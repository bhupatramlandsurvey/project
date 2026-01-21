const express = require("express");
const router = express.Router();
const pkg = require("../../package.json");

router.get("/", (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    environment: process.env.NODE_ENV || "production",
    deployedAt: new Date().toISOString(),
  });
});

module.exports = router;
