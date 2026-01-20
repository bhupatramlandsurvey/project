import { 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  BellIcon,
  SpeakerXMarkIcon,
  SpeakerWaveIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const adminOptions = [
  { id: 1, title: 'Users', route: '/admin/users', icon: UserGroupIcon, color: 'from-blue-400 to-blue-500' },
  { id: 2, title: 'Orders', route: '/admin/orders', icon: ClipboardDocumentListIcon, color: 'from-green-400 to-green-500' },
  { id: 8, title: 'Order Alerts', route: null, icon: BellIcon, color: 'from-pink-400 to-pink-500' },
  { id: 3, title: 'Reports', route: '/admin/reports', icon: ChartBarIcon, color: 'from-purple-400 to-purple-500' },
  { id: 5, title: 'Processed Orders', route: '/admin/processed-orders', icon: Cog6ToothIcon, color: 'from-gray-400 to-gray-500' },
  { id: 6, title: 'Update KMZ File', route: '/admin/update-kmz', icon: Cog6ToothIcon, color: 'from-red-400 to-red-500' },
  { id: 7, title: 'Update Prices', route: '/admin/update-prices', icon: Cog6ToothIcon, color: 'from-yellow-400 to-yellow-500' },
  { id: 4, title: 'Settings', route: '/admin/settings', icon: Cog6ToothIcon, color: 'from-orange-400 to-orange-500' },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const soundRef = useRef(new Audio("/alert.mp3"));

  const [newOrders, setNewOrders] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [muted, setMuted] = useState(false);

  const [alertCounts, setAlertCounts] = useState({
    download: 0,
    ftl: 0,
    request: 0,
    survey: 0,
  });

  /* 🔌 SOCKET CONNECTION */
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("new-order", (data) => {
      // MAIN orders badge (unchanged)
      setNewOrders(prev => prev + 1);

      // TYPE-WISE COUNTS
      setAlertCounts(prev => {
        const updated = { ...prev };
        if (data.type === "DownloadMaps") updated.download++;
        else if (["FTL", "HMDA", "TOPO"].includes(data.type)) updated.ftl++;
        else if (data.type === "RequestMap") updated.request++;
        else if (data.type === "LandSurvey") updated.survey++;
        return updated;
      });

      // 🔔 SOUND ONLY IF MODAL OPEN & NOT MUTED
      if (showAlerts && !muted) {
        soundRef.current.currentTime = 0;
        soundRef.current.play().catch(() => {});
      }
    });

    return () => socketRef.current.disconnect();
  }, [showAlerts, muted]);

  const totalAlerts = Object.values(alertCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 bg-[#ffffff] min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Admin Panel
      </h1>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {adminOptions.map((option, index) => (
          <motion.div
            key={option.id}
            onClick={() => {
              if (option.title === "Orders") {
                setNewOrders(0);
                navigate(option.route);
              } else if (option.title === "Order Alerts") {
                setShowAlerts(true);
              } else {
                navigate(option.route);
              }
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative overflow-hidden bg-gradient-to-r ${option.color} text-white rounded-3xl shadow-2xl cursor-pointer`}
          >
            {/* BADGES */}
            {option.title === "Orders" && newOrders > 0 && (
              <span className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {newOrders}
              </span>
            )}

            {option.title === "Order Alerts" && totalAlerts > 0 && (
              <span className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {totalAlerts}
              </span>
            )}

            <div className="flex items-center gap-4 p-6">
              <div className="bg-white/30 p-4 rounded-full">
                <option.icon className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold">{option.title}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🔔 ORDER ALERTS MODAL */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-6 w-[90%] max-w-md shadow-2xl relative"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">🚨 Order Alerts</h2>
                <div className="flex gap-3 items-center">
                  <button onClick={() => setMuted(!muted)}>
                    {muted ? (
                      <SpeakerXMarkIcon className="h-6 w-6 text-red-500" />
                    ) : (
                      <SpeakerWaveIcon className="h-6 w-6 text-green-600" />
                    )}
                  </button>
                  <button onClick={() => setShowAlerts(false)}>
                    <XMarkIcon className="h-6 w-6 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* ALERT LIST */}
              {[
                { label: "Download Maps", key: "download" },
                { label: "FTL / HMDA / TOPO", key: "ftl" },
                { label: "Request Maps", key: "request" },
                { label: "Land Survey", key: "survey" },
              ].map(item => (
                <div key={item.key} className="flex justify-between py-2 border-b">
                  <span>{item.label}</span>
                  {alertCounts[item.key] > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {alertCounts[item.key]}
                    </span>
                  )}
                </div>
              ))}

              {/* ACTIONS */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setAlertCounts({ download: 0, ftl: 0, request: 0, survey: 0 });
                    setShowAlerts(false);
                    navigate("/admin/orders");
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded-xl font-semibold"
                >
                  View Orders
                </button>

                <button
                  onClick={() => setShowAlerts(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-xl font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
