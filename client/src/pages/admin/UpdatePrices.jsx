import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function UpdatePrices() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [prices, setPrices] = useState({});
  const [loadedPrices, setLoadedPrices] = useState({});
  const [success, setSuccess] = useState(false);

  const loadStaticItems = async () => {
    const res = await fetch(import.meta.env.VITE_BACKEND_URL + "api/prices/static");
    const data = await res.json();
    if (data.success) setCategories(data.items);
  };

  const loadPrices = async () => {
    const res = await fetch(import.meta.env.VITE_BACKEND_URL + "api/prices");
    const data = await res.json();
    if (data.success) {
      const map = {};
      data.prices.forEach((p) => (map[`${p.category}-${p.name}`] = p.price));
      setLoadedPrices(map);
    }
  };

  useEffect(() => {
    loadStaticItems();
    loadPrices();
  }, []);

  const updatePrice = (item, value) => {
    setPrices((prev) => ({ ...prev, [item]: value }));
  };

  const savePrices = async () => {
    const entries = Object.entries(prices);

    for (const [key, val] of entries) {
      const [category, name] = key.split("::");

      await fetch(import.meta.env.VITE_BACKEND_URL + "api/prices/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name,
          price: Number(val),
        }),
      });
    }

    setSuccess(true);
    loadPrices();
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-100 via-white to-gray-100 relative">

      {/* BACK BUTTON */}
      <motion.button
        onClick={() => navigate(-1)}
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 flex items-center gap-2 bg-white/80 backdrop-blur-md 
        border border-gray-200 shadow-lg px-4 py-2 rounded-full text-gray-700 font-medium"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </motion.button>

      {/* PAGE HEADER */}
      <h1 className="text-3xl font-bold text-center mt-16 text-gray-800 drop-shadow-sm">
        Update Service Prices
      </h1>

      {/* CATEGORY SELECT */}
      <div className="max-w-sm mx-auto mt-10">
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200 shadow-lg 
            p-4 rounded-2xl">
          <label className="text-gray-700 font-semibold mb-2 block text-sm">
            Select Price Category
          </label>
          <select
            className="w-full p-3 border rounded-xl bg-white shadow-sm focus:ring-2 
            focus:ring-purple-400 outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">-- Select --</option>
            {Object.keys(categories).map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* PRICE LIST CARD */}
      {selectedCategory && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto mt-10 p-6 bg-white/80 backdrop-blur-xl 
        shadow-2xl rounded-3xl border border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-700 text-center mb-5">
            {selectedCategory} Prices
          </h2>

          <div className="space-y-4">
            {categories[selectedCategory].map((item) => {
  const key = `${selectedCategory}::${item}`;
  const defaultValue =
    loadedPrices[`${selectedCategory}-${item}`] || "";

  return (
    <div
      key={key}
      className="flex justify-between items-center bg-gray-50 p-4 rounded-xl shadow-sm"
    >
      <span className="font-medium text-gray-800">{item}</span>

      <input
        type="number"
        className="w-28 p-2 border rounded-xl bg-white shadow"
        placeholder="₹ Price"
        defaultValue={defaultValue}
        onChange={(e) => updatePrice(key, e.target.value)}
      />
    </div>
  );
})}
  
          </div>

          {/* SAVE BUTTON */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={savePrices}
            className="w-full mt-6 bg-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg"
          >
            Save Changes
          </motion.button>
        </motion.div>
      )}

      {/* SUCCESS POPUP */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-xs"
            >
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-green-600">
                Prices Updated!
              </h2>
              <p className="text-gray-600 mt-2">
                Your pricing changes have been saved successfully.
              </p>

              <button
                onClick={() => setSuccess(false)}
                className="mt-5 bg-green-600 text-white px-6 py-2 rounded-xl shadow hover:bg-green-700"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
