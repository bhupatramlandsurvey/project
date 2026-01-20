import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("loggedInUser"));
        if (!user || !user._id) return;

        // 1️⃣ Fetch user's orders
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + `api/orders/user/${user._id}`);
        const data = await res.json();

        // 2️⃣ Fetch processed orders (for admin-approved results)
        const processedRes = await fetch(import.meta.env.VITE_BACKEND_URL + `api/processed/orders`);
        const processedData = await processedRes.json();

        if (data.success && processedData.success) {
          const processedOrders = processedData.orders.filter(
            (p) => p.status === "Approved"
          );

          // 3️⃣ Merge processed data into user orders
          const mergedOrders = data.orders.map((order) => {
            const match = processedOrders.find(
              (p) => p.orderId === order._id || p.orderId === order.orderId
            );

            if (match) {
              return {
                ...order,
                processedFiles: match.processedFiles || [],
                feedback: match.feedback || "",
                status: "Completed",
              };
            }
            return order;
          });

          // 4️⃣ Sort orders (newest first)
          const sorted = [...mergedOrders].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.dateTime || a.updatedAt || 0);
            const dateB = new Date(b.createdAt || b.dateTime || b.updatedAt || 0);
            return dateB - dateA;
          });

          setOrders(sorted);
        } else {
          console.error("Failed to load orders or processed data");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDateTime = (dateInput) => {
    if (!dateInput) return "-";
    const date = new Date(dateInput);
    if (isNaN(date)) return "-";
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <div className="p-6 min-h-[100dvh] overflow-y-auto bg-gradient-to-b rounded-3xl from-purple-50 to-purple-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        My Orders
      </h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading orders...</p>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <motion.div
              key={order._id || order.orderId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-3"
            >
              <p className="font-semibold text-lg text-purple-600">{order.type}</p>
              <p className="text-gray-700">
                Status: <span className="font-medium">{order.status}</span>
              </p>
              <p className="text-gray-500 text-sm">
                {formatDateTime(order.createdAt || order.dateTime || order.updatedAt)}
              </p>

              <button
                onClick={() => setSelectedOrder(order)}
                className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
              >
                View
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No orders found.</p>
      )}

      {/* 🧾 Scrollable Modal for order details */}
      {selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-purple-600 mb-4 sticky top-0 bg-white pb-2">
              {selectedOrder.type} Details
            </h2>

            <div className="space-y-2 text-sm">
              {/* ✅ Show only meaningful fields */}
              {Object.entries(selectedOrder)
                .filter(
                  ([key, value]) =>
                    value &&
                    value !== "" &&
                    !["_id", "__v", "user", "userId", "razorpayOrderId", "razorpayPaymentId", "razorpaySignature", "files", "uploadedFiles","processedFiles"].includes(
                      key
                    )
                )
                .map(([key, value]) => (
                  <p key={key}>
                    <strong>
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (s) => s.toUpperCase())}
                      :
                    </strong>{" "}
                    {typeof value === "string" || typeof value === "number"
                      ? value
                      : JSON.stringify(value)}
                  </p>
                ))}

              {/* ✅ Uploaded Files (User’s Files) */}
              {Array.isArray(selectedOrder.uploadedFiles) &&
                selectedOrder.uploadedFiles.length > 0 && (
                  <div className="mt-3 border-t pt-3 flex flex-col gap-2">
                    <p className="font-semibold text-purple-700">
                      Uploaded Files (Your Submission):
                    </p>
                    {selectedOrder.uploadedFiles.map((file, index) => {
                      const name = file.originalName || `File ${index + 1}`;
                      const url = file.url?.startsWith("http")
                        ? file.url
                        : `${import.meta.env.VITE_BACKEND_URL}${file.url}`;
                      return (
                        <a
                          key={index}
                          href={url}
                          download={name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-purple-100 border border-purple-300 rounded-lg text-purple-700 hover:bg-purple-200 transition text-sm flex items-center gap-2"
                        >
                          📎 {name}
                          {file.size && (
                            <span className="text-xs text-gray-500 ml-auto">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}

              {/* ✅ Processed Files (Approved by Admin for All Completed Orders) */}
              {selectedOrder.status === "Completed" &&
                Array.isArray(selectedOrder.processedFiles) &&
                selectedOrder.processedFiles.length > 0 && (
                  <div className="mt-3 border-t pt-3 flex flex-col gap-2">
                    <p className="font-semibold text-green-700">
                      ✅ Processed Files (Approved by Admin)
                    </p>
                    {selectedOrder.processedFiles.map((file, index) => {
                      const name = file.name || `Processed File ${index + 1}`;
                      const url = file.url?.startsWith("http")
                        ? file.url
                        : `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}${file.url}`;
                      return (
                        <a
                          key={index}
                          href={url}
                          download={name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-green-100 border border-green-300 rounded-lg text-green-700 hover:bg-green-200 transition text-sm flex items-center gap-2"
                        >
                          📂 {name}
                          {file.size && (
                            <span className="text-xs text-gray-500 ml-auto">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          )}
                        </a>
                      );
                    })}
                    {selectedOrder.feedback && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        💬 Admin Feedback: {selectedOrder.feedback}
                      </p>
                    )}
                  </div>
                )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-5 sticky bottom-0 bg-white pt-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
