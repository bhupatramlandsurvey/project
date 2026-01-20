// src/pages/admin/Settings.jsx
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

const handleLogout = () => {
  localStorage.removeItem("loggedInUser");
  window.dispatchEvent(new Event("storage")); // notify all listeners
  navigate("/", { replace: true });
};


  return (
    <div className="p-6 bg-[#ffffff] min-h-screen text-gray-800 relative flex flex-col items-center justify-center">
      {/* Floating Back Button */}
      <motion.button
        onClick={() => navigate(-1)}
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.95, rotate: 0 }}
        className="absolute top-6 left-6 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg z-50 transition"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </motion.button>

      <h1 className="text-2xl font-bold mb-6 text-center">Settings</h1>
      <p className="text-gray-600 mb-6 text-center">Manage your account or log out.</p>

      {/* Logout Button */}
      <motion.button
        onClick={handleLogout}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-3xl shadow-lg transition"
      >
        Logout
      </motion.button>
    </div>
  );
}
