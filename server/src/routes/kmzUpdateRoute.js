// routes/pmtilesUpdateRoute.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/* ---------- paths ---------- */
const tempDir = path.join(__dirname, "../uploads/temp");
const importantDir = path.join(__dirname, "../uploads/important");

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(importantDir)) fs.mkdirSync(importantDir, { recursive: true });

const LIVE_FILE = path.join(importantDir, "parcels.pmtiles");

/* ---------- multer ---------- */
const storage = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + ".pmtiles");
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".pmtiles")) {
      return cb(new Error("Only PMTiles allowed"));
    }
    cb(null, true);
  },
});

/* ---------- upload new pmtiles ---------- */
router.post("/upload-pmtiles", upload.single("pmtiles"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false });

    const newFile = req.file.path;

    // move old live file into temp as backup
    if (fs.existsSync(LIVE_FILE)) {
      const backup = path.join(
        tempDir,
        "parcels-" + Date.now() + ".pmtiles"
      );
      fs.renameSync(LIVE_FILE, backup);
    }

    // promote uploaded file to live
    fs.renameSync(newFile, LIVE_FILE);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

/* ---------- info ---------- */
router.get("/pmtiles-info", (req, res) => {
  if (!fs.existsSync(LIVE_FILE)) return res.json({ exists: false });

  const stat = fs.statSync(LIVE_FILE);

  res.json({
    exists: true,
    lastModified: stat.mtime.toISOString(),
  });
});

module.exports = router;
