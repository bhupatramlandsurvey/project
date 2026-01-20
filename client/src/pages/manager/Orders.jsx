import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function ManagerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // ✅ Safe parse of manager data from localStorage
  const managerData = (() => {
    try {
      return JSON.parse(localStorage.getItem("loggedInUser")) || {};
    } catch {
      return {};
    }
  })();
  const managerId = managerData?._id;

  const orderTypes = [
    "All",
    "Download Maps",
    "Request Services",
    "Land Survey",
    "FTL Hydra",
    "HMDA Masterplan",
    "TOPO Sheet",
  ];
  const statusOptions = ["Pending", "Processing", "Completed", "Cancelled"];

  // ✅ Fetch only unprocessed / admin rejected orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!managerId) return;
      try {
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + `api/manager/orders/${managerId}`);
        const data = await res.json();
        if (data.success) {
          // ✅ Hide any accidentally approved orders
          const filtered = data.orders.filter(
            (o) => !/^approved$/i.test(o.status)
          );
          setOrders(filtered);
          setFilteredOrders(filtered);
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [managerId]);

  const handleFilter = (type) => {
    setActiveFilter(type);
    if (type === "All") setFilteredOrders(orders);
    else setFilteredOrders(orders.filter((o) => o.type === type));
  };

  const handleFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Multiple file upload handler
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setEditForm((prev) => ({
      ...prev,
      processedFiles: [...(prev.processedFiles || []), ...files],
    }));
  };

  // ✅ Remove a file from upload list
  const handleRemoveFile = (index) => {
    setEditForm((prev) => ({
      ...prev,
      processedFiles: prev.processedFiles.filter((_, i) => i !== index),
    }));
  };

  // ✅ Submit processed files + status
  const handleSave = async () => {
    const formData = new FormData();
    formData.append("type", editForm.type);
    formData.append("status", editForm.status);
    formData.append("managerId", managerId);

    if (editForm.processedFiles?.length) {
      editForm.processedFiles.forEach((file) =>
        formData.append("processedFiles", file)
      );
    }

    try {
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URL + `api/manager/orders/${editForm._id}`,
        { method: "PUT", body: formData }
      );
      const data = await res.json();
      if (data.success) {
        const updatedOrders = orders.map((o) =>
          o._id === editForm._id ? data.order : o
        );
        setOrders(updatedOrders);
        handleFilter(activeFilter);
        setSelectedOrder(null);
        alert("✅ Order processed successfully!");
      } else {
        alert("❌ Update failed");
      }
    } catch (err) {
      console.error("❌ Update error:", err);
    }
  };

  const getBadgeClasses = (type) => {
    switch (type) {
      case "Download Maps": return "bg-purple-100 text-purple-800";
      case "Request Services": return "bg-green-100 text-green-800";
      case "Land Survey": return "bg-blue-100 text-blue-800";
      case "FTL Hydra": return "bg-yellow-100 text-yellow-800";
      case "HMDA Masterplan": return "bg-pink-100 text-pink-800";
      case "TOPO Sheet": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const getStatusBadgeClasses = (status, adminRejected) => {
    if (adminRejected) return "bg-red-100 text-red-700 border border-red-400";
    switch (status) {
      case "Pending": return "bg-gray-100 text-gray-800";
      case "Processing": return "bg-blue-100 text-blue-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d)) return "-";
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setEditForm({ ...order, processedFiles: [] });
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 rounded-3xl">
      {/* Back */}
      <motion.button
        onClick={() => navigate(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg z-50"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </motion.button>

      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Manager Orders
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {orderTypes.map((type) => (
          <span
            key={type}
            onClick={() => handleFilter(type)}
            className={`cursor-pointer px-4 py-2 rounded-full text-sm font-semibold ${
              activeFilter === type
                ? "bg-purple-500 text-white"
                : getBadgeClasses(type)
            }`}
          >
            {type}
          </span>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-3 ${
                order.adminRejected ? "border border-red-400" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getBadgeClasses(order.type)}`}
                >
                  {order.type}
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClasses(order.status, order.adminRejected)}`}
                >
                  {order.adminRejected ? "Admin Rejected" : order.status}
                </span>
              </div>

              {/* User Info */}
              {order.user && (
                <p className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg w-fit">
                  👤 {order.user.fullName} ({order.user.mobile})
                </p>
              )}

              <p className="text-gray-700 font-medium">
                {order.orderId || order.friendlyId || "No ID"}
              </p>

              <p className="text-gray-500 text-xs">{formatDate(order.createdAt)}</p>

              <button
                onClick={() => openEditModal(order)}
                className="mt-2 px-3 py-1 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
              >
                {order.adminRejected ? "Re-upload Files" : "View / Process"}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-2xl shadow-2xl max-w-lg w-full overflow-y-auto max-h-[90vh]"
          >
            <h2 className="text-2xl font-bold text-purple-600 mb-4">
              {selectedOrder.type} Order Details
            </h2>

            {selectedOrder.user && (
              <div className="mb-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
                <p><strong>User:</strong> {selectedOrder.user.fullName}</p>
                <p><strong>Mobile:</strong> {selectedOrder.user.mobile}</p>
              </div>
            )}

            <div className="space-y-2 text-gray-700">
              {Object.entries(selectedOrder)
                .filter(([key, value]) =>
                  value &&
                  value !== "" &&
                  !["_id", "__v", "user", "assignedTo", "razorpayOrderId", "razorpayPaymentId", "razorpaySignature"].includes(key)
                )
                .map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <strong className="capitalize">
                      {key.replace(/([A-Z])/g, " $1")}:
                    </strong>{" "}
                    {typeof value === "object" ? JSON.stringify(value) : value.toString()}
                  </div>
                ))}
            </div>

{/* Uploaded Files from User */}
{selectedOrder.uploadedFiles && selectedOrder.uploadedFiles.length > 0 && (
  <div className="mt-3">
    <label className="font-semibold text-gray-700">Uploaded Files (from User)</label>
    <ul className="mt-2 space-y-1">
      {selectedOrder.uploadedFiles.map((file, i) => (
        <li
          key={i}
          className="flex items-center justify-between bg-purple-50 border border-purple-200 px-2 py-1 rounded"
        >
          <a
            href={`${backend}${file.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-700 underline truncate w-44"
          >
            📎 {file.originalName || file.name}
          </a>
          <span className="text-xs text-gray-500">
            ({Math.round(file.size / 1024)} KB)
          </span>
        </li>
      ))}
    </ul>
  </div>
)}

{/* Divider */}
<hr className="my-3 border-gray-200" />

{/* Upload Processed Files */}
<div className="mt-3">
  <label className="font-semibold text-gray-700">Upload Processed Files</label>
  <input
    type="file"
    multiple
    onChange={handleFilesChange}
    className="border px-3 py-1 rounded-lg w-full mt-1"
  />

  {editForm.processedFiles?.length > 0 && (
    <ul className="mt-2 space-y-1">
      {editForm.processedFiles.map((file, i) => (
        <li
          key={i}
          className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded"
        >
          <span className="text-sm text-gray-800 truncate w-44">
            📄 {file.name}
          </span>
          <XMarkIcon
            onClick={() => handleRemoveFile(i)}
            className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700"
          />
        </li>
      ))}
    </ul>
  )}
</div>



            {/* Status Dropdown */}
            <div className="mt-3">
              <label className="font-semibold text-gray-700">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => handleFormChange("status", e.target.value)}
                className="border px-3 py-1 rounded-lg w-full mt-1"
              >
                {statusOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
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
