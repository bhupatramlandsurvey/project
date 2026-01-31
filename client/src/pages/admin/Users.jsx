// src/pages/admin/Users.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
const [search, setSearch] = useState("");
const [roleFilter, setRoleFilter] = useState("all");

  // ✅ Mock user data (no backend)
 // ✅ Fetch all users
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_BACKEND_URL + "api/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error("❌ Fetch Users Error:", err);
    }
  };
  fetchUsers();
}, []);
// ✅ Counts
const totalUsers = users.length;
const userCount = users.filter((u) => u.role === "user").length;
const managerCount = users.filter((u) => u.role === "manager").length;
const adminCount = users.filter((u) => u.role === "admin").length;

// ✅ Filter + Search
const filteredUsers = users.filter((u) => {
  const matchRole = roleFilter === "all" || u.role === roleFilter;

  const matchSearch =
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile?.includes(search);

  return matchRole && matchSearch;
});

// ✅ Save edited user role
const handleSave = async () => {
  try {
    const res = await fetch(import.meta.env.VITE_BACKEND_URL + `api/users/${editingUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingUser),
    });
    const data = await res.json();
    if (data.success) {
      setUsers(users.map((u) => (u._id === data.user._id ? data.user : u)));
      setEditingUser(null);
      alert("✅ User updated successfully!");
    } else {
      alert("❌ Failed to update user");
    }
  } catch (err) {
    console.error("Update Error:", err);
  }
};

// ✅ Delete user
const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this user?")) return;
  try {
    const res = await fetch(import.meta.env.VITE_BACKEND_URL + `api/users/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      setUsers(users.filter((u) => u._id !== id));
      alert("🗑️ User deleted successfully!");
    }
  } catch (err) {
    console.error("Delete Error:", err);
  }
};

  return (
    <div className="p-6 bg-[#ffffff] min-h-screen relative text-gray-800">
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

      <h1 className="text-2xl font-bold mb-6 text-center">Manage Users</h1>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
  <div className="bg-blue-100 rounded-xl p-3 text-center">
    <p className="text-sm">Total</p>
    <p className="text-xl font-bold">{totalUsers}</p>
  </div>
  <div className="bg-green-100 rounded-xl p-3 text-center">
    <p className="text-sm">Users</p>
    <p className="text-xl font-bold">{userCount}</p>
  </div>
  <div className="bg-yellow-100 rounded-xl p-3 text-center">
    <p className="text-sm">Managers</p>
    <p className="text-xl font-bold">{managerCount}</p>
  </div>
  <div className="bg-red-100 rounded-xl p-3 text-center">
    <p className="text-sm">Admins</p>
    <p className="text-xl font-bold">{adminCount}</p>
  </div>
</div>
<div className="flex flex-col sm:flex-row gap-4 mb-6">
  <input
    type="text"
    placeholder="Search by name or mobile..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border rounded-xl px-4 py-2 flex-1"
  />

  <select
    value={roleFilter}
    onChange={(e) => setRoleFilter(e.target.value)}
    className="border rounded-xl px-4 py-2"
  >
    <option value="all">All</option>
    <option value="user">Users</option>
    <option value="manager">Managers</option>
    <option value="admin">Admins</option>
  </select>
</div>

      {/* User Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full">Loading users...</p>
        ) : (
          filteredUsers.map((user) => (

            <motion.div
              key={user._id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-3xl shadow-2xl p-6 flex flex-col justify-between cursor-pointer transform transition-transform hover:scale-105"
            >
              <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-white/20 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <h2 className="text-lg font-bold">{user.fullName}</h2>
                <p className="text-white/80">Mobile: {user.mobile}</p>
                <p className="text-white/80">Role: {user.role}</p>
              </div>

              <div className="relative z-10 mt-4 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingUser(user)}
                  className="flex items-center gap-1 px-4 py-2 bg-white/30 hover:bg-white/50 rounded-xl text-white text-sm transition"
                >
                  <PencilIcon className="h-5 w-5" /> Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(user._id)}
                  className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm transition"
                >
                  <TrashIcon className="h-5 w-5" /> Delete
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-96 relative"
          >
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="flex flex-col gap-3 text-gray-800">
              <label className="flex flex-col">
                Name
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  className="border rounded p-2"
                />
              </label>
              <label className="flex flex-col">
                Mobile
                <input
                  type="text"
                  value={editingUser.mobile}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, mobile: e.target.value })
                  }
                  className="border rounded p-2"
                />
              </label>
              <label className="flex flex-col">
                Role
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                  className="border rounded p-2"
                >
                  <option>user</option>
                  <option>manager</option>
                  <option>admin</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
