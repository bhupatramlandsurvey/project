const mongoose = require("mongoose");

// STATIC CATEGORY DATA (LOCKED)
const STATIC_PRICE_ITEMS = {
  certifiedCopies: [
    "Village Map",
    "Tippon",
    "Pakka Book",
    "Sethwar",
    "Khasra",
    "Chesala",
    "Pahani/Adangal",
  ],

  digitalizedCopies: [
    "Village Map",
    "Tippon",
  ],

  ftlmaphydra: [
    "FTL Map Hydra",
    "HMDA Masterplan",
    "TOPO Sheet",
  ],

  requestMaps: [
    "Tippon Plotting",
    "Digitization Village Map",
    "KML",
    "Pacca Book Calculation",
    "Sub Division Sketch",
    "Tounch Map",
  ],
};

const priceSchema = new mongoose.Schema({
  category: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

// VALIDATION: make model static
priceSchema.pre("save", function (next) {
  const category = this.category;
  const name = this.name;

  if (!STATIC_PRICE_ITEMS[category]) {
    return next(new Error(`Invalid category: ${category}`));
  }

  if (!STATIC_PRICE_ITEMS[category].includes(name)) {
    return next(new Error(`Invalid item name: ${name}`));
  }

  next();
});

module.exports = {
  Price: mongoose.model("Price", priceSchema),
  STATIC_PRICE_ITEMS
};
