const express = require("express");
const router = express.Router();

const DownloadMapsAndFilesOrder = require("../models/DownloadMapsAndFilesOrder");
const FTLOrder = require("../models/FTLOrder");
const HMDAOrder = require("../models/HMDAOrder");
const TopoOrder = require("../models/TopoOrder");
const RequestMapOrder = require("../models/RequestMapOrder");
const LandSurveyOrder = require("../models/LandSurveyOrder");
// ✅ Fetch all orders for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
const [downloadMaps, ftl, hmda, topo, requestMap, landSurvey] =
  await Promise.all([
    DownloadMapsAndFilesOrder.find({ $or: [{ user: userId }, { userId: userId }] }),
    FTLOrder.find({ $or: [{ user: userId }, { userId: userId }] }),
    HMDAOrder.find({ $or: [{ user: userId }, { userId: userId }] }),
    TopoOrder.find({ $or: [{ user: userId }, { userId: userId }] }),
    RequestMapOrder.find({ $or: [{ user: userId }, { userId: userId }] }), // ✅ fixed
    LandSurveyOrder.find({ $or: [{ user: userId }, { userId: userId }] }),
  ]);


    const combined = [
      ...downloadMaps.map((o) => ({ ...o.toObject(), type: "Download Maps" })),
      ...ftl.map((o) => ({ ...o.toObject(), type: "FTL Hydra" })),
      ...hmda.map((o) => ({ ...o.toObject(), type: "HMDA Masterplan" })),
      ...topo.map((o) => ({ ...o.toObject(), type: "TOPO Sheet" })),
      ...requestMap.map((o) => ({ ...o.toObject(), type: "Request Services" })),
      ...landSurvey.map((o) => ({ ...o.toObject(), type: "Land Survey" })),
    ];

    res.json({ success: true, orders: combined.reverse() });
  } catch (err) {
    console.error("❌ Fetch Orders Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;