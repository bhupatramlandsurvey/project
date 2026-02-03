// routes/kmzUpdateRoute.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");



const AdmZip = require("adm-zip");
const { DOMParser } = require("xmldom");
const toGeoJSON = require("@tmcw/togeojson");
const turf = require("@turf/turf");

const router = express.Router();

/* ---------- helpers ---------- */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/* ---------- paths ---------- */
const tempDir = path.join(__dirname, "../uploads/temp");
const importantDir = path.join(__dirname, "../uploads/important");

ensureDir(tempDir);
ensureDir(importantDir);
const pmtilesPath = path.join(importantDir, "parcels.pmtiles");

/* ---------- multer ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".kmz";
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".kmz", ".zip"].includes(ext)) {
      return cb(new Error("Only KMZ files allowed"));
    }
    cb(null, true);
  },
});

/* ---------- KMZ → OPTIMIZED GEOJSON ---------- */

async function generateOptimizedGeoJSON(kmzPath, pmtilesOut) {
  console.log("Starting streaming KMZ → PMTiles");

  return new Promise((resolve, reject) => {
    const cmd = `
      ogr2ogr -f GeoJSONSeq /vsistdout/ ${kmzPath} |
      tippecanoe \
        --force \
        --read-parallel \
        --drop-densest-as-needed \
        --extend-zooms-if-still-dropping \
        --minimum-zoom=10 \
        --maximum-zoom=16 \
        -o ${pmtilesOut}
    `;

    exec(cmd, { maxBuffer: 1024 * 1024 }, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log("PMTiles created");
        resolve();
      }
    });
  });
}




/* ---------- upload route ---------- */
router.post("/upload-kmz", upload.single("kmz"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const tempPath = req.file.path;
    const kmzPath = path.join(importantDir, "file.kmz");
    const geojsonPath = path.join(importantDir, "optimized.geojson");

    if (fs.existsSync(kmzPath)) fs.unlinkSync(kmzPath);
if (fs.existsSync(pmtilesPath)) fs.unlinkSync(pmtilesPath);

    fs.renameSync(tempPath, kmzPath);

    // 🔥 generate optimized geojson
   await generateOptimizedGeoJSON(kmzPath, pmtilesPath);


    res.json({
  success: true,
  message: "KMZ uploaded & optimized successfully",
  kmzUrl: "/important/file.kmz",
  geojsonUrl: "/important/optimized.geojson",
  pmtilesUrl: "/important/parcels.pmtiles",
});

  } catch (err) {
    console.error("KMZ upload error:", err);
    res.status(500).json({ success: false, message: "KMZ processing failed" });
  }
});

/* ---------- info route ---------- */
router.get("/kmz-info", (req, res) => {
  try {
    const kmzPath = path.join(importantDir, "file.kmz");

    res.setHeader("Cache-Control", "no-store");

    if (!fs.existsSync(kmzPath)) {
      return res.json({ exists: false });
    }

    const stat = fs.statSync(kmzPath);
    res.json({
      exists: true,
      lastModified: stat.mtime.toISOString(),
      downloadUrl: "/important/file.kmz",
    });
  } catch (err) {
    res.status(500).json({ exists: false });
  }
});

router.get("/tile-status", (req, res) => {
  const fs = require("fs");

const tilePath = path.join(__dirname,"../uploads/important/parcels.pmtiles");


  if (fs.existsSync(tilePath)) {
    return res.json({ ready: true });
  }

  res.json({ ready: false });
});


module.exports = router;
