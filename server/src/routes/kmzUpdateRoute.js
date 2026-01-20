// routes/kmz.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Ensure folders exist helper
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Storage config that ensures temp dir exists before multer writes
const tempDir = path.join(__dirname, "../../uploads/temp");

ensureDir(tempDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ensure directory exists at time of upload
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // keep extension, create unique name
    const ext = path.extname(file.originalname) || ".kmz";
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // optional: 200MB limit
  fileFilter: (req, file, cb) => {
    // basic accept check by extension / mimetype
    const allowedExts = [".kmz", ".zip"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      return cb(new Error("Only .kmz (or .zip) files are allowed"));
    }
    cb(null, true);
  },
});

// KMZ Upload Route
router.post("/upload-kmz", upload.single("kmz"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const uploadedTempPath = req.file.path; // full temp path
// Save outside src folder: server/uploads/important/file.kmz
const importantDir = path.join(__dirname, "../../uploads/important");
const targetPath = path.join(importantDir, "file.kmz");


    // Ensure important dir exists
    ensureDir(importantDir);

    // Remove old KMZ if exists
    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
      } catch (err) {
        // Non-fatal: log and continue
        console.error("Failed to unlink old file:", err);
      }
    }

    // Move/rename the uploaded temp file -> targetPath
    // Use fs.rename, but fallback to copy+unlink if across devices
    const moveFile = () =>
      new Promise((resolve, reject) => {
        fs.rename(uploadedTempPath, targetPath, (err) => {
          if (!err) return resolve();
          // if rename failed (different device), fallback to copy+unlink
          const read = fs.createReadStream(uploadedTempPath);
          const write = fs.createWriteStream(targetPath);
          read.on("error", reject);
          write.on("error", reject);
          write.on("close", () => {
            fs.unlink(uploadedTempPath, (uerr) => {
              if (uerr) console.warn("Failed to unlink temp after copy:", uerr);
              resolve();
            });
          });
          read.pipe(write);
        });
      });

    moveFile()
      .then(() => {
        return res.json({
          success: true,
          message: "KMZ updated successfully",
          url: "/important/file.kmz",
        });
      })
      .catch((err) => {
        console.error("Failed to move uploaded file:", err);
        return res.status(500).json({ success: false, message: "File saving failed" });
      });
  } catch (err) {
    console.error("Unexpected error in upload-kmz:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// KMZ info route
// KMZ info route (fixed)
router.get("/kmz-info", (req, res) => {
  try {
    // same path used by upload handler (two levels up -> uploads/important)
    const targetPath = path.join(__dirname, "../../uploads/important/file.kmz");

    // prevent caching so clients always get fresh timestamp
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (!fs.existsSync(targetPath)) {
      return res.json({
        exists: false,
        lastModified: null,
        lastModifiedMs: null,
        downloadUrl: null,
      });
    }

    const stats = fs.statSync(targetPath);

    res.json({
      exists: true,
      // ISO string is nice for readability
      lastModified: stats.mtime.toISOString(),
      // also include milliseconds epoch for easier client comparisons
      lastModifiedMs: stats.mtimeMs ?? stats.mtime.getTime(),
      downloadUrl: "/important/file.kmz",
    });
  } catch (err) {
    console.error("Error in /kmz-info:", err);
    res.status(500).json({ exists: false, lastModified: null, downloadUrl: null });
  }
});


module.exports = router;
