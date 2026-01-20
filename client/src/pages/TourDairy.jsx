import React, { useState } from "react";
import TourDiaryTab from "./TourDiaryTab";
import AbstractTab from "./AbstractTab";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon, MapIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";

export default function TourDairy() {
  const [active, setActive] = useState("tour");

  const navigate = useNavigate();
const handleBack = () => {

      navigate("/dashboard/request-services", { replace: true });

}
  return (
    <div className="p-6">
       <motion.button
        onClick={handleBack}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-5 left-5 p-2 bg-green-400 text-white rounded-full shadow-lg z-50"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </motion.button>
      {/* Tab Buttons */}
      <div className="flex gap-4 mb-6 justify-center">
        <button
          onClick={() => setActive("tour")}
          className={`px-6 py-2 rounded-xl font-semibold shadow 
            ${active === "tour" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}
          `}
        >
          Tour Diary
        </button>

        <button
          onClick={() => setActive("abstract")}
          className={`px-6 py-2 rounded-xl font-semibold shadow 
            ${active === "abstract" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}
          `}
        >
          Abstract
        </button>
      </div>

      {/* Render Tabs */}
      {active === "tour" ? <TourDiaryTab /> : <AbstractTab />}
    </div>
  );
}
