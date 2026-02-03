const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/* paths */
const importantDir = path.join(__dirname, "../uploads/important");
const tempDir = path.join(__dirname, "../uploads/temp");

if (!fs.existsSync(importantDir)) fs.mkdirSync(importantDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const CURRENT = path.join(importantDir, "parcels.pmtiles");

/* multer */
const storage = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    cb(null, "incoming.pmtiles");
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB future-proof
});

/* ---------- upload pmtiles ---------- */
router.post("/upload-pmtiles", upload.single("pmtiles"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false });
    }

    const incoming = req.file.path;

    // move existing tiles to temp with timestamp
    if (fs.existsSync(CURRENT)) {
      const backup = path.join(
        tempDir,
        `parcels-${Date.now()}.pmtiles`
      );
      fs.renameSync(CURRENT, backup);
    }

    // promote new tiles
    fs.renameSync(incoming, CURRENT);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

/* ---------- info ---------- */
router.get("/pmtiles-info", (req, res) => {
  try {
    if (!fs.existsSync(CURRENT)) return res.json({ exists: false });

    const stat = fs.statSync(CURRENT);

    res.json({
      exists: true,
      lastModified: stat.mtime.toISOString(),
      sizeMB: Math.round(stat.size / 1024 / 1024),
    });
  } catch {
    res.json({ exists: false });
  }
});

module.exports = router;
