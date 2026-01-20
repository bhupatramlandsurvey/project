import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export default function ProcessedOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const backend = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
  // ✅ Fetch processed orders
  useEffect(() => {
    const fetchProcessedOrders = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + "api/processed/orders");
        const data = await res.json();

        if (data.success) {
          setOrders(data.orders || []);
        } else {
          setError(data.message || "Failed to fetch processed orders");
        }
      } catch (err) {
        console.error("❌ Fetch Processed Orders Error:", err);
        setError("Unable to load processed orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchProcessedOrders();
  }, []);

  const getStatusClasses = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending Approval":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 rounded-3xl">
      {/* 🔙 Back Button */}
      <motion.button
        onClick={() => navigate(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg z-50 transition"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </motion.button>

      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Processed Orders
      </h1>

      <p className="text-center text-gray-600 mb-6">
        Below are all the processed orders along with admin feedback.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow animate-pulse h-40"
            ></div>
          ))}
        </div>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500">No processed orders yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-3"
            >
              <div className="flex justify-between items-center">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusClasses(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
                {order.status === "Approved" ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                ) : order.status === "Rejected" ? (
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                ) : null}
              </div>

              <p className="font-semibold text-gray-800">{order.type}</p>
              <p className="text-gray-600 text-sm">
                Order ID: <strong>{order.orderId}</strong>
              </p>
              <p className="text-gray-600 text-sm">
                👤 {order.user?.fullName} ({order.user?.mobile})
              </p>
              <p className="text-xs text-gray-500">
                Uploaded:{" "}
                {new Date(order.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>

              {/* Files Section */}
              {order.processedFiles?.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <p className="font-semibold text-purple-700 mb-1">
                    Processed Files:
                  </p>
                  {order.processedFiles.map((file, i) => (
                    <a
                      key={i}
                      href={`${backend}${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-lg text-sm text-purple-700 mb-1"
                    >
                      ⬇️ {file.name} ({Math.round(file.size / 1024)} KB)
                    </a>
                  ))}
                </div>
              )}

              {/* Feedback */}
              <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700">
                  Admin Feedback:
                </p>
                <p
                  className={`text-sm mt-1 ${
                    order.status === "Approved"
                      ? "text-green-700"
                      : order.status === "Rejected"
                      ? "text-red-700"
                      : "text-gray-600"
                  }`}
                >
                  {order.feedback || "Awaiting admin review."}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
