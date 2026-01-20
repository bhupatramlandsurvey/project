import { useEffect, useState } from "react";
import {
  HomeIcon,
  ShoppingCartIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Home from "./Home";
import Orders from "./Orders";
import Account from "./Account";
import DownloadMaps from "./DownloadMaps";
import RequestMap from "./RequestMap";
import LandSurvey from "./LandSurvey";
import FTLMapHydra from "./FTLMapHydra";
import TippanViewer from "./TippanViewer";
import TourDairy from "./TourDairy";
import CustomPage from "./CustomPage";

export default function Dashboard({ role }) {
  const [activeTab, setActiveTab] = useState("home");
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Local Storage Role Check
  const storedUser = JSON.parse(localStorage.getItem("loggedInUser"));

  useEffect(() => {
    if (!storedUser) {
      navigate("/", { replace: true }); // no user → go to login
      return;
    }

    // 🔐 Redirect based on role (prevent wrong access)
    switch (storedUser.role) {
      case "admin":
        navigate("/admin", { replace: true });
        break;
      case "manager":
        navigate("/manager", { replace: true });
        break;
      default:
        break; // user stays here
    }
  }, [navigate]);

  // Guard — if user not found
  if (!storedUser) return <Navigate to="/" replace />;

  const tabs = [
    { id: "home", title: "Home", icon: HomeIcon, route: "/dashboard/home" },
    {
      id: "orders",
      title: "Orders",
      icon: ShoppingCartIcon,
      route: "/dashboard/orders",
    },
    {
      id: "account",
      title: "Account",
      icon: UserIcon,
      route: "/dashboard/account",
    },
  ];

  // ✅ Navigate properly
  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.route);
  };

  // ✅ Sync active tab with route
  useEffect(() => {
    const currentTab = tabs.find((t) => location.pathname.includes(t.id));
    setActiveTab(currentTab ? currentTab.id : "home");
  }, [location.pathname]);

  // ✅ Scroll reset on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };
// 🚫 Hide bottom nav for Tippan / map viewer pages
const hideBottomNav = location.pathname.includes("/dashboard/map-viewer");

  return (
    <div className="flex flex-col bg-[#fefefe] min-h-screen relative">
      {/* ---------------- Main Content ---------------- */}
      <div id="page-container" className="flex-1 relative pb-24 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full overflow-y-auto page-scroll"
            style={{
              WebkitOverflowScrolling: "touch",
              minHeight: "100dvh",
            }}
          >
            <Routes location={location}>
              <Route path="home" element={<Home role={role} />} />
              <Route path="download-maps-and-files" element={<DownloadMaps />} />
              <Route path="download-maps-and-files/:type" element={<DownloadMaps />} />
              <Route path="request-services" element={<RequestMap />} />
              <Route path="request-services/:type" element={<RequestMap />} />
              <Route path="land-survey-request" element={<LandSurvey />} />
              <Route path="land-survey-request/:type" element={<LandSurvey />} />
              <Route path="ftl-hydra-hmda" element={<FTLMapHydra />} />
              <Route path="ftl-hydra-hmda/:type" element={<FTLMapHydra />} />
              <Route path="map-viewer" element={<TippanViewer />} />
              <Route path="tour-dairy" element={<TourDairy />} />
              <Route path="custom-page" element={<CustomPage />} />
              <Route path="orders" element={<Orders role={role} />} />
              <Route path="account" element={<Account role={role} />} />
              <Route path="*" element={<Navigate to="home" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---------------- Bottom Navigation ---------------- */}
      {!hideBottomNav && (
  <motion.div
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1, transition: { duration: 0.3 } }}
    className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-sm bg-white rounded-2xl shadow-2xl flex justify-around py-2 z-50"
  >
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => handleTabClick(tab)}
        className="flex flex-col items-center relative group focus:outline-none"
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
            ${
              activeTab === tab.id
                ? "bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg -translate-y-1.5"
                : "bg-white shadow-md group-hover:shadow-lg"
            }`}
        >
          <tab.icon
            className={`h-6 w-6 transition-colors duration-300 ${
              activeTab === tab.id
                ? "text-white"
                : "text-gray-400 group-hover:text-orange-500"
            }`}
          />
        </div>
        <span
          className={`mt-0.5 text-[10px] font-semibold transition-all duration-300 ${
            activeTab === tab.id
              ? "text-orange-500"
              : "text-gray-400 group-hover:text-orange-500"
          }`}
        >
          {tab.title}
        </span>
        {activeTab === tab.id && (
          <span className="absolute -top-1 w-2 h-2 bg-orange-500 rounded-full shadow-md"></span>
        )}
      </button>
    ))}
  </motion.div>
)}

    </div>
  );
}
