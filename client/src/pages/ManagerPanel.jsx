import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
const managerOptions = [
  {
    id: 1,
    title: "Orders",
    route: "/manager/orders",
    icon: ClipboardDocumentListIcon,
    color: "from-green-400 to-green-500",
  },
  {
    id: 2,
    title: "Processed Orders",
    route: "/manager/processed-orders",
    icon: CheckCircleIcon,
    color: "from-blue-400 to-blue-500",
  },
  {
    id: 3,
    title: "Settings",
    route: "settings",
    icon: Cog6ToothIcon,
    color: "from-gray-400 to-gray-500",
  },
];

export default function ManagerPanel() {
  const navigate = useNavigate();
  const [openSettings, setOpenSettings] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.dispatchEvent(new Event("storage"));
    navigate("/", { replace: true });
  };

  const handleClick = (route) => {
    if (route === "settings") {
      setOpenSettings(true);
    } else {
      navigate(route);
    }
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Manager Panel
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {managerOptions.map((option, index) => (
          <motion.div
            key={option.id}
            onClick={() => handleClick(option.route)}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`bg-gradient-to-r ${option.color} text-white rounded-3xl shadow-2xl cursor-pointer`}
          >
            <div className="flex items-center gap-4 p-6">
              <div className="bg-white/30 p-4 rounded-full">
                <option.icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg font-bold">{option.title}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ================= SETTINGS MODAL ================= */}
      <AnimatePresence>
        {openSettings && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl w-96 p-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Settings
              </h2>

              {!confirmLogout ? (
                <>
                  <button
                    onClick={() => setConfirmLogout(true)}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    Logout
                  </button>

                  <button
                    onClick={() => setOpenSettings(false)}
                    className="w-full mt-3 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-700 mb-6 text-center">
                    Are you sure you want to logout?
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={handleLogout}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmLogout(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-xl"
                    >
                      No
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
