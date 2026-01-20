const express = require("express");
const { Price, STATIC_PRICE_ITEMS } = require("../models/Price");

const router = express.Router();

/** GET STATIC PRICE ITEMS (frontend use) */
router.get("/static", (req, res) => {
  res.json({ success: true, items: STATIC_PRICE_ITEMS });
});

/** GET all stored prices */
router.get("/", async (req, res) => {
  try {
    const prices = await Price.find();
    res.json({ success: true, prices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** SET/UPDATE PRICE */
router.post("/set", async (req, res) => {
  try {
    const { category, name, price } = req.body;

    if (!category || !name || typeof price !== "number") {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Validate against STATIC names
    if (!STATIC_PRICE_ITEMS[category]?.includes(name)) {
      return res.status(400).json({
        success: false,
        message: `Invalid item: ${name} under category ${category}`,
      });
    }

    let item = await Price.findOne({ category, name });

    if (item) {
      item.price = price;
      item.updatedAt = new Date();
      await item.save();
    } else {
      item = await Price.create({ category, name, price });
    }

    res.json({ success: true, message: "Price saved", item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
/** GET PRICE BY CATEGORY + NAME */
router.get("/get", async (req, res) => {
  try {
    const { category, name } = req.query;

    if (!category || !name) {
      return res.status(400).json({
        success: false,
        message: "Category and name are required",
      });
    }

    // Validate category & name from static list
    if (!STATIC_PRICE_ITEMS[category]?.includes(name)) {
      return res.status(400).json({
        success: false,
        message: `Invalid item name '${name}' in category '${category}'`,
      });
    }

    // Fetch stored price
    const item = await Price.findOne({ category, name });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Price not set for this item",
      });
    }

    res.json({
      success: true,
      price: item.price,
      category,
      name,
      updatedAt: item.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
