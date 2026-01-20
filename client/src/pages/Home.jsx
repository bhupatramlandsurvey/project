import {
  ArrowDownTrayIcon,
  MapIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  EyeIcon,
  LanguageIcon
  
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import LanguageSelector from "../components/LanguageSelector";

const options = [
  {
    id: 5,
    title: "Map Viewer",
    route: "/dashboard/map-viewer",
    icon: EyeIcon,
    color: "from-pink-400 to-pink-500",
  },
  {
    id: 1,
    title: "Download Maps & Files",
    route: "/dashboard/download-maps-and-files",
    icon: ArrowDownTrayIcon,
    color: "from-orange-400 to-orange-500",
  },
  {
    id: 4,
    title: "FTL Map Hydra, HMDA Masterplans, TOPO Sheet",
    route: "/dashboard/ftl-hydra-hmda",
    icon: GlobeAltIcon,
    color: "from-purple-400 to-purple-500",
  },
  {
    id: 2,
    title: "Request Services",
    route: "/dashboard/request-services",
    icon: MapIcon,
    color: "from-indigo-400 to-indigo-500",
  },
  {
    id: 3,
    title: "Land Survey Request",
    route: "/dashboard/land-survey-request",
    icon: DocumentTextIcon,
    color: "from-green-400 to-green-500",
  },
];

export default function Home({ role }) {
  const navigate = useNavigate();
  const [location, setLocation] = useState("Telangana");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!storedUser) navigate("/");
  }, [navigate]);

  return (
    <div
      className="bg-white flex flex-col relative"
      style={{
        height: "100dvh", // full viewport height
        overflow: "hidden", // ✅ locks scroll for parent
      }}
    >
      {/* ✅ Fixed Top Bar */}
<div className="fixed top-0 left-0 w-full h-16 bg-white shadow flex items-center justify-between px-4 z-50">

  {/* Left: Logo */}
  <div className="flex items-center">
    <img src={logo} alt="Logo" className="h-12 w-auto" />
  </div>

  {/* Right: Language Selector */}
   <div className="flex items-center gap-2 border border-gray-200 rounded-md px-2 py-1">
    <LanguageIcon className="h-6 w-6 text-gray-600" />
    <LanguageSelector />
  </div>

</div>


      {/* ✅ Scrollable Main Content Area */}
      <div
        className="flex-1 overflow-y-auto pt-20 px-3 pb-24"
        style={{
          height: "calc(100dvh - 4rem)", // header height subtracted
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => navigate(option.route)}
              className={`relative overflow-hidden bg-gradient-to-r ${option.color} text-white rounded-3xl shadow-2xl cursor-pointer transform transition-transform duration-300 hover:scale-105 active:scale-95`}
            >
              <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-white/20 rounded-full blur-3xl"></div>

              <div className="flex items-center gap-3 sm:gap-4 p-5 sm:p-6 relative z-10">
                <div className="bg-white/30 p-3 sm:p-4 rounded-full shadow-lg flex items-center justify-center">
                  <option.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-md md:text-base font-semibold leading-tight">
                  {option.title}
                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Hide Google Translate junk */}
      <style>{`
        .goog-te-banner-frame.skiptranslate { display: none !important; }
        body { top: 0 !important; }
        .goog-logo-link, .goog-te-gadget { display: none !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
