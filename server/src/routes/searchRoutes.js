const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/village", async (req, res) => {
  try {
    const q = req.query.q;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&addressdetails=1&limit=5`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "BHUPATRAM (dinesh.ram9100@gmail.com)",
      },
    });

    res.json(response.data);
  } catch (err) {
    console.log("Search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
