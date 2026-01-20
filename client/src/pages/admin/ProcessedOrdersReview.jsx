import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export default function ProcessedOrdersReview() {
  const navigate = useNavigate();
  const backend = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    const fetchProcessedOrders = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + "api/processed/orders");
        const data = await res.json();
        if (data.success) setOrders(data.orders || []);
        else console.error("Error fetching:", data.message);
      } catch (err) {
        console.error("❌ Fetch Processed Orders Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProcessedOrders();
  }, []);

  const handleDecision = async (orderId, decision) => {
    try {
      const feedback =
        decision === "Approved" ? "Approved by admin." : "Rejected by admin.";
      const res = await fetch(import.meta.env.VITE_BACKEND_URL + `api/processed/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision, feedback }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Order ${decision}!`);
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: decision, feedback } : o
          )
        );
      }
    } catch (err) {
      console.error("❌ Approval Error:", err);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return alert("Please enter feedback.");
    try {
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URL + `api/processed/${feedbackModal._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: feedbackText }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === feedbackModal._id ? { ...o, feedback: feedbackText } : o
          )
        );
        alert("💬 Feedback added successfully!");
        setFeedbackModal(null);
        setFeedbackText("");
      }
    } catch (err) {
      console.error("❌ Feedback Error:", err);
    }
  };

  const getStatusBadge = (status) => {
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

  // Fields to skip displaying
  const hiddenKeys = [
    "_id",
    "__v",
    "user",
    "managerId",
    "processedFiles",
    "feedback",
    "status",
    "createdAt",
    "updatedAt",
    "orderRef",
    "type",
    "razorpayOrderId",
    "razorpaySignature",
    "razorpayPaymentId",
  ];

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
        Processed Orders Review
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow animate-pulse h-40"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-600">No processed orders found.</p>
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
              {/* Header */}
              <div className="flex justify-between items-center">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
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

              {/* Basic Info */}
              <p className="font-semibold text-gray-800 capitalize">
                {order.type?.replace("Order", "").trim()}
              </p>

              <p className="text-gray-600 text-sm">
                <strong>Order ID:</strong> {order.orderId || "N/A"}
              </p>

              {/* User and Manager Details */}
              <div className="text-sm text-gray-700 mt-1 space-y-1">
                <p>
                  👤 <strong>User:</strong>{" "}
                  {order.user
                    ? `${order.user.fullName} (${order.user.mobile})`
                    : "N/A"}
                </p>
                <p>
                  🧑‍💼 <strong>Manager:</strong>{" "}
                  {order.manager
                    ? `${order.manager.fullName} (${order.manager.mobile})`
                    : "N/A"}
                </p>
              </div>

              <p className="text-xs text-gray-500">
                Processed on:{" "}
                {new Date(order.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>

              {/* 🧾 Original Order Details */}
              {order.orderDetails && (
                <div className="mt-2 border-t pt-2 space-y-1 text-sm">
                  <p className="font-semibold text-purple-700 mb-1">
                    Order Details:
                  </p>
                  {Object.entries(order.orderDetails)
                    .filter(([key, val]) => !hiddenKeys.includes(key))
                    .filter(([_, val]) => val !== null && val !== "")
                    .map(([key, val]) => (
                      <p key={key}>
                        <strong className="capitalize">
                          {key.replace(/([A-Z])/g, " $1")}:
                        </strong>{" "}
                        {typeof val === "object"
                          ? JSON.stringify(val)
                          : val.toString()}
                      </p>
                    ))}
                </div>
              )}

              {/* Processed Files */}
              {order.processedFiles?.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <p className="font-semibold text-purple-700 mb-1">
                    Uploaded Files:
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
                <p className="text-sm font-semibold text-gray-700">Feedback:</p>
                <p className="text-sm mt-1 text-gray-600">
                  {order.feedback || "No feedback yet."}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between mt-3 gap-2">
                <button
                  onClick={() => handleDecision(order._id, "Approved")}
                  disabled={order.status === "Approved"}
                  className="flex-1 px-3 py-1 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-green-200 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(order._id, "Rejected")}
                  disabled={order.status === "Rejected"}
                  className="flex-1 px-3 py-1 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:bg-red-200 transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setFeedbackModal(order);
                    setFeedbackText(order.feedback || "");
                  }}
                  className="flex items-center justify-center px-3 py-1 bg-gray-300 rounded-xl hover:bg-gray-400 transition"
                >
                  <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-purple-700 mb-3">
              Add Feedback
            </h2>
            <textarea
              rows={4}
              className="w-full border rounded-lg p-3"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Write admin feedback..."
            />
            <div className="flex justify-end mt-3 gap-2">
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
