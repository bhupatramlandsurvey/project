import { useState, useEffect } from "react";
import {
  ChartBarIcon,
  ArrowLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
} from "recharts";

const reportOptions = [
  {
    id: 1,
    title: "Sales Report",
    description: "View overall sales analytics.",
    icon: ChartBarIcon,
    color: "from-purple-400 to-purple-500",
    endpoint: "sales",
  },
  {
    id: 2,
    title: "Orders Report",
    description: "Check order trends and statuses.",
    icon: ChartBarIcon,
    color: "from-green-400 to-green-500",
    endpoint: "orders",
  },
  {
    id: 3,
    title: "User Report",
    description: "Analyze user activity and growth.",
    icon: ChartBarIcon,
    color: "from-blue-400 to-blue-500",
    endpoint: "users",
  },
];

export default function Reports() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch summary on page load
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + "api/admin/reports/summary");
        const data = await res.json();
        if (data.success) setSummary(data.summary);
      } catch (err) {
        console.error("❌ Summary Fetch Error:", err);
      }
    };
    fetchSummary();
  }, []);

  const fetchReportData = async (endpoint) => {
    try {
      setLoading(true);
      const res = await fetch(import.meta.env.VITE_BACKEND_URL + `api/admin/reports/${endpoint}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error("❌ Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  const openReport = (report) => {
    setSelectedReport(report);
    fetchReportData(report.endpoint);
  };

  const closeModal = () => {
    setSelectedReport(null);
    setReportData(null);
  };

  return (
    <div className="p-6 bg-[#ffffff] min-h-screen text-gray-800 relative">
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

      <h1 className="text-2xl font-bold mb-6 text-center">Reports Dashboard</h1>
      <p className="text-gray-600 mb-6 text-center">
        Analytics and insights across the platform.
      </p>

      {/* ✅ Summary Cards */}
      {summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <SummaryCard
            title="Total Revenue"
            value={`₹${(
              summary?.totals?.totalRevenueINR || 0
            ).toLocaleString()}`}
            color="from-purple-500 to-purple-600"
            icon="💰"
          />
          <SummaryCard
            title="Total Orders"
            value={summary?.totals?.totalOrders || 0}
            color="from-green-500 to-green-600"
            icon="📦"
          />
          <SummaryCard
            title="Total Users"
            value={summary?.usersCount || "Loading..."}
            color="from-blue-500 to-blue-600"
            icon="👥"
          />
        </div>
      ) : (
        <p className="text-center text-gray-400 mb-8">Loading summary...</p>
      )}

      {/* ✅ Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportOptions.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openReport(report)}
            className={`relative overflow-hidden bg-gradient-to-r ${report.color} text-white rounded-3xl shadow-2xl p-6 cursor-pointer`}
          >
            <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-white/20 rounded-full blur-3xl"></div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white/30 p-4 rounded-full shadow-lg flex items-center justify-center">
                <report.icon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{report.title}</h2>
                <p className="text-white/80 text-sm">{report.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ✅ Modal for Report Data */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto relative"
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <h2 className="text-2xl font-bold mb-2 text-purple-700">
              {selectedReport.title}
            </h2>
            <p className="text-gray-600 mb-4">{selectedReport.description}</p>

            {loading ? (
              <p className="text-center text-gray-500 py-10">Loading...</p>
            ) : !reportData ? (
              <p className="text-center text-gray-500 py-10">No data available.</p>
            ) : (
              <>
                {selectedReport.endpoint === "sales" && reportData.sales && (
                  <ChartSection
                    title="Sales Revenue Trend"
                    data={reportData.sales}
                    xKey="date"
                    yKey="revenueINR"
                    type="line"
                  />
                )}

                {selectedReport.endpoint === "orders" && reportData.trend && (
                  <>
                    <ChartSection
                      title="Orders Trend"
                      data={reportData.trend}
                      xKey="date"
                      yKey="count"
                      type="line"
                    />
                    <ChartSection
                      title="Orders by Type"
                      data={reportData.byType}
                      xKey="type"
                      yKey="count"
                      type="bar"
                    />
                    <ChartSection
                      title="Orders by Status"
                      data={reportData.byStatus}
                      xKey="status"
                      yKey="count"
                      type="bar"
                    />
                  </>
                )}

                {selectedReport.endpoint === "users" && reportData.users && (
                  <>
                    <ChartSection
                      title="User Growth"
                      data={reportData.users.growth}
                      xKey="date"
                      yKey="count"
                      type="line"
                    />
                    <ChartSection
                      title="Users by Role"
                      data={reportData.users.byRole}
                      xKey="role"
                      yKey="count"
                      type="bar"
                    />
                  </>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ✅ Summary Card Component */
const SummaryCard = ({ title, value, color, icon }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`bg-gradient-to-r ${color} text-white rounded-3xl p-6 shadow-lg flex items-center justify-between`}
  >
    <div>
      <h3 className="text-sm uppercase text-white/80">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
    <span className="text-4xl">{icon}</span>
  </motion.div>
);

/* ✅ Chart Section Component */
const ChartSection = ({ title, data, xKey, yKey, type }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-2 text-gray-700">{title}</h3>
    <div className="bg-gray-50 border rounded-xl p-3 shadow-inner h-72">
      <ResponsiveContainer width="100%" height="100%">
        {type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="#8b5cf6" strokeWidth={2} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#34d399" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  </div>
);
