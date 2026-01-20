import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function AdminOrders() {
  const navigate = useNavigate();
  const backend = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [editForm, setEditForm] = useState({});
  const [managers, setManagers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ added
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

  // ✅ Fetch orders and managers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, managersRes] = await Promise.all([
          fetch(import.meta.env.VITE_BACKEND_URL + "api/admin/orders"),
          fetch(import.meta.env.VITE_BACKEND_URL + "api/admin/managers"),
        ]);
        const ordersData = await ordersRes.json();
        const managersData = await managersRes.json();

        if (ordersData.success) {
          const sorted = [...ordersData.orders].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sorted);
          setFilteredOrders(sorted);
        }

        if (managersData.success) setManagers(managersData.managers);
      } catch (err) {
        console.error("❌ Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
   useEffect(() => {
    let filtered = [...orders];
    if (activeFilter !== "All") {
      filtered = filtered.filter((o) => o.type === activeFilter);
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderId?.toLowerCase().includes(lower) ||
          o.friendlyId?.toLowerCase().includes(lower) ||
          o.user?.fullName?.toLowerCase().includes(lower) ||
          o.user?.mobile?.toLowerCase().includes(lower) ||
          o.userId?.fullName?.toLowerCase().includes(lower) ||
          o.userId?.mobile?.toLowerCase().includes(lower)
      );
    }

    setFilteredOrders(filtered);
  }, [searchTerm, activeFilter, orders]);


  const handleFilter = (type) => {
    setActiveFilter(type);
    if (type === "All") setFilteredOrders(orders);
    else setFilteredOrders(orders.filter((o) => o.type === type));
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "Pending":
        return "bg-gray-100 text-gray-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getBadgeClasses = (type) => {
    switch (type) {
      case "Download Maps":
        return "bg-purple-100 text-purple-800";
      case "Request Services":
        return "bg-green-100 text-green-800";
      case "Land Survey":
        return "bg-blue-100 text-blue-800";
      case "FTL Hydra":
        return "bg-yellow-100 text-yellow-800";
      case "HMDA Masterplan":
        return "bg-pink-100 text-pink-800";
      case "TOPO Sheet":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setEditForm({
      ...order,
      assignedTo: order.assignedTo?._id || "",
    });
  };

  const handleFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URL + `api/admin/orders/${editForm._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      const data = await res.json();
      if (data.success) {
        let patchedOrder = data.order;
        if (
          patchedOrder.assignedTo &&
          typeof patchedOrder.assignedTo === "string"
        ) {
          const managerObj = managers.find(
            (m) => m._id === patchedOrder.assignedTo
          );
          if (managerObj) patchedOrder.assignedTo = managerObj;
        }

        const updatedOrders = orders.map((o) =>
          o._id === patchedOrder._id ? patchedOrder : o
        );

        setOrders(updatedOrders);
        setFilteredOrders(
          activeFilter === "All"
            ? updatedOrders
            : updatedOrders.filter((o) => o.type === activeFilter)
        );
        setSelectedOrder(null);
        alert("✅ Order updated successfully!");
      } else {
        alert("❌ Failed to update order");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URL + `api/admin/orders/${order._id}?type=${order.type}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        const updated = orders.filter((o) => o._id !== order._id);
        setOrders(updated);
        handleFilter(activeFilter);
        alert("🗑️ Order deleted successfully!");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d)) return "-";
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 rounded-3xl">
      <motion.button
        onClick={() => navigate(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg z-50 transition"
      >
        <ArrowLeftIcon className="h-5 w-5" /> 
      </motion.button>

      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Orders
      </h1>
<div className="flex justify-center mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by User, Mobile, or Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" />
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {orderTypes.map((type) => (
          <span
            key={type}
            onClick={() => handleFilter(type)}
            className={`cursor-pointer px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeFilter === type
                ? "bg-purple-500 text-white"
                : getBadgeClasses(type)
            }`}
          >
            {type}
          </span>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center text-gray-600">No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getBadgeClasses(
                    order.type
                  )}`}
                >
                  {order.type}
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClasses(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              {/* ✅ Display user details */}
              {order.user || order.userId ? (
                <p className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg w-fit">
                  👤 {order.user?.fullName || order.userId?.fullName} (
                  {order.user?.mobile || order.userId?.mobile})
                </p>
              ) : null}

              {order.assignedTo && (
                <p className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg w-fit">
                  🧑‍💼 Assigned: {order.assignedTo.fullName} (
                  {order.assignedTo.mobile})
                </p>
              )}

              <p className="text-gray-700 font-medium">
                {order.orderId || order.friendlyId || "No ID"}
              </p>
              <p className="text-gray-500 text-sm">{formatDate(order.createdAt)}</p>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => openEditModal(order)}
                  className="flex-1 px-3 py-1 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
                >
                  View/Edit
                </button>
                <button
                  onClick={() => handleDelete(order)}
                  className="flex-1 px-3 py-1 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
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
              Edit {selectedOrder.type} Order
            </h2>

            {/* ✅ User Info */}
            {selectedOrder.user || selectedOrder.userId ? (
              <div className="mb-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
                <p>
                  <strong>User:</strong>{" "}
                  {selectedOrder.user?.fullName || selectedOrder.userId?.fullName}
                </p>
                <p>
                  <strong>Mobile:</strong>{" "}
                  {selectedOrder.user?.mobile || selectedOrder.userId?.mobile}
                </p>
              </div>
            ) : null}

            <div className="space-y-2 text-gray-700">
              {Object.entries(editForm)
                .filter(
                  ([key, value]) =>
                    value &&
                    value !== "" &&
                    !["_id", "__v", "razorpayOrderId", "razorpaySignature", "razorpayPaymentId", "user", "userId", "assignedTo"].includes(
                      key
                    )
                )
                .map(([key, value]) => (
                  <Field
                    key={key}
                    label={key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (s) => s.toUpperCase())}
                    value={
                      typeof value === "object" ? JSON.stringify(value) : value
                    }
                    onChange={(v) => handleFormChange(key, v)}
                  />
                ))}

              {/* ✅ Files section */}
              {(() => {
                const files =
                  editForm.uploadedFiles || editForm.files || [];
                return Array.isArray(files) && files.length > 0 ? (
                  <div className="mt-3 border-t pt-3 flex flex-col gap-2">
                    <p className="font-semibold text-purple-700">
                      Uploaded Files:
                    </p>
                    {files.map((file, i) => (
                      <a
                        key={i}
                        href={`${backend}${file.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-purple-100 border border-purple-300 rounded-lg text-purple-700 hover:bg-purple-200 transition text-sm flex items-center gap-2"
                      >
                        ⬇️ {file.originalName || `File ${i + 1}`}
                        {file.size && (
                          <span className="text-xs text-gray-500 ml-auto">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                ) : null;
              })()}

              <DropdownField
                label="Status"
                value={editForm.status?.trim() || ""}
                options={statusOptions}
                onChange={(v) => handleFormChange("status", v)}
              />

              <DropdownField
                label="Assign Manager"
                value={editForm.assignedTo}
                options={managers.map((m) => ({
                  label: `${m.fullName} (${m.mobile})`,
                  value: m._id,
                }))}
                onChange={(v) => handleFormChange("assignedTo", v)}
              />
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
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

// Reusable Components
const Field = ({ label, value, onChange }) => (
  <div className="flex flex-col">
    <label className="font-semibold text-gray-700">{label}</label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="border px-3 py-1 rounded-lg"
    />
  </div>
);

const DropdownField = ({ label, value, options, onChange }) => (
  <div className="flex flex-col">
    <label className="font-semibold text-gray-700 mb-1">{label}</label>
    <select
      value={value?.trim() || ""}
      onChange={(e) => onChange(e.target.value)}
      className="border px-3 py-1 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
    >
      <option value="">Select</option>
      {options.map((opt) =>
        typeof opt === "string" ? (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ) : (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        )
      )}
    </select>
  </div>
);
