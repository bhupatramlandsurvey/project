import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
    title: "Logout",
    route: "/logout",
    icon: ArrowRightOnRectangleIcon,
    color: "from-red-400 to-red-500",
  },
];

export default function ManagerPanel() {
  const navigate = useNavigate();

  const handleClick = (route) => {
  if (route === "/logout") {
    // ✅ Clear auth data
    localStorage.removeItem("loggedInUser");

    // ✅ Notify all tabs & update React state across app
    window.dispatchEvent(new Event("storage"));

    // ✅ Redirect to login safely
    navigate("/", { replace: true });

    // ✅ Optional: full reload to reset any lingering state
    // window.location.reload();
  } else {
    // ✅ Navigate to selected route
    navigate(route);
  }
};


  return (
    <div className="p-4 bg-[#ffffff] min-h-screen">
      <br />
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
            className={`relative overflow-hidden bg-gradient-to-r ${option.color} text-white rounded-3xl shadow-2xl cursor-pointer`}
          >
            <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-white/20 rounded-full blur-3xl"></div>

            <div className="flex items-center gap-4 p-6 relative z-10">
              <div className="bg-white/30 p-4 rounded-full shadow-lg flex items-center justify-center">
                <option.icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg font-bold">{option.title}</h2>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
