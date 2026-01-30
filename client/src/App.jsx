import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PhoneOtpLogin from "./pages/PhoneOtpLogin";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import Users from "./pages/admin/Users";
import Orders from "./pages/admin/Orders";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import ProcessedOrdersReview from "./pages/admin/ProcessedOrdersReview";
import ManagerPanel from "./pages/ManagerPanel";
import ManagerOrders from "./pages/manager/Orders";
import ProcessedOrders from "./pages/manager/ProcessedOrders";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import UpdateKmz from "./pages/admin/UpdateKmz";
import UpdatePrices from "./pages/admin/UpdatePrices";
import TermsAndConditions from "./pages/legal/TermsAndConditions";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import RefundPolicy from "./pages/legal/RefundPolicy";
import ShippingPolicy from "./pages/legal/ShippingPolicy";
import CookiesPolicy from "./pages/legal/CookiesPolicy";
import Disclaimer from "./pages/legal/Disclaimer";
import AboutUs from "./pages/legal/AboutUs";
import Contact from "./pages/legal/Contact";

function App() {
  // 🧩 Track current user from localStorage (read once)
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("loggedInUser");
    return stored ? JSON.parse(stored) : null;
  });

  // 🧭 Store initial redirect route based on role
  const [initialRoute, setInitialRoute] = useState("/");

  // 🔁 Listen for login/logout changes across the app or tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("loggedInUser");
      setUser(stored ? JSON.parse(stored) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 🎯 Update initial route based on role whenever user changes
  useEffect(() => {
    if (!user) {
      setInitialRoute("/");
      return;
    }

    switch (user.role) {
      case "admin":
        setInitialRoute("/admin");
        break;
      case "manager":
        setInitialRoute("/manager");
        break;
      default:
        setInitialRoute("/dashboard/home");
        break;
    }
  }, [user]);

  // 🕓 Wait until route is set
  if (initialRoute === null) return null;

  return (
    <Router>
      <Routes>
        {/* 🔑 Root: redirect based on user or show login */}
        <Route
          path="/"
          element={user ? <Navigate to={initialRoute} replace /> : <PhoneOtpLogin />}
        />

        {/* 🧭 User Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["user", "manager", "admin"]}>
              <Dashboard role={user?.role} />
            </ProtectedRoute>
          }
        />

        {/* 🧑‍💼 Manager Routes */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/orders"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/processed-orders"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ProcessedOrders />
            </ProtectedRoute>
          }
        />

        {/* 🛠️ Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/processed-orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ProcessedOrdersReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/update-kmz"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UpdateKmz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/update-prices"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UpdatePrices />
            </ProtectedRoute>
          }
        />
        {/* 📄 Legal & Static Pages */}
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/cookies-policy" element={<CookiesPolicy />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/about-us" element={<AboutUs />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
