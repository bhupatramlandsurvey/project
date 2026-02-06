import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftEllipsisIcon,
  LifebuoyIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

/* ============================
   Tawk.to Lazy Loader (ONLY on click)
============================ */
const loadTawk = (user, setChatLoading) => {
  // If already loaded
  if (window.Tawk_API) {
    setChatLoading(false);

    window.Tawk_API.setAttributes(
      {
        name: user?.fullName || "Guest User",
        phone: user?.mobile || "",
      },
      function () {}
    );

    window.Tawk_API.hideWidget();
    window.Tawk_API.maximize();
    return;
  }

  setChatLoading(true); // 🔄 START LOADING

  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();

  window.Tawk_API.onLoad = function () {
    window.Tawk_API.hideWidget();

    window.Tawk_API.setAttributes(
      {
        name: user?.fullName || "Guest User",
        phone: user?.mobile || "",
      },
      function () {}
    );

    window.Tawk_API.maximize();
    setChatLoading(false); // ✅ STOP LOADING
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://embed.tawk.to/69687770fde850197a46c82f/1jf0154uh";
  script.charset = "UTF-8";
  script.setAttribute("crossorigin", "*");

  document.body.appendChild(script);
};



export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [openPanel, setOpenPanel] = useState(null);
  const [loading, setLoading] = useState(true);
const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("loggedInUser"));
        if (!storedUser || !storedUser._id) {
          navigate("/");
          return;
        }

        const res = await fetch(
          import.meta.env.VITE_BACKEND_URL + `api/users/${storedUser._id}`
        );
        const data = await res.json();

        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.dispatchEvent(new Event("storage"));
    navigate("/", { replace: true });
  };

  const sendSupportMail = (user) => {
  const name = user?.fullName || "Guest User";
  const phone = user?.mobile || "Not provided";

  const subject = encodeURIComponent("Need Assistance - Bhupatram App");

  const body = encodeURIComponent(
`Hello Support Team,

I need assistance with your service.

Name: ${name}
Phone: ${phone}

Issue:
Please describe your problem here...

Thank you.`
  );

  window.location.href = `mailto:contact@bhupatram.cloud?subject=${subject}&body=${body}`;
};

  const togglePanel = (panel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFF2EA]">
        Loading account info...
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#FFF2EA] text-gray-800 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-16">

        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/dashboard/home")}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className="absolute top-5 left-5 p-2 bg-white rounded-full shadow border z-10"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </motion.button>

        {/* Header */}
        <div className="pt-16 text-center">
          <h1 className="text-xl font-semibold">Account</h1>
        </div>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mt-6 bg-white rounded-2xl p-6 flex flex-col items-center shadow border"
        >
          <UserCircleIcon className="w-16 h-16 text-gray-400" />
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold">
              {user?.fullName || "Guest User"}
            </p>
            <p className="text-sm text-gray-600">
              {user?.mobile || "+91XXXXXXXXXX"}
            </p>
          </div>
        </motion.div>

        {/* Menu */}
        <div className="mt-10 space-y-4 mx-5 pb-5">

          {/* Feedback */}
          <MenuItem
            icon={<ChatBubbleLeftEllipsisIcon className="w-6 h-6" />}
            label="Feedback"
            isOpen={openPanel === "feedback"}
            onClick={() => togglePanel("feedback")}
          >
            <textarea
              placeholder="Write your feedback..."
              className="w-full p-2 text-sm rounded border"
            />
            <button className="mt-2 w-full bg-orange-400 text-white py-2 rounded">
              Submit
            </button>
          </MenuItem>

          {/* ✅ Get Support – LOAD CHAT HERE */}
         <MenuItem
  icon={<LifebuoyIcon className="w-6 h-6" />}
  label="Get Support"
  isOpen={openPanel === "support"}
  onClick={() => togglePanel("support")}
>
  <p className="text-sm">Email: support@bhupatram.cloud</p>

  {/* 🔥 ONLY WAY TO OPEN CHAT */}
<button
  onClick={() => sendSupportMail(user)}
  className="w-full mt-3 py-2 rounded bg-orange-400 hover:bg-orange-500 text-white transition"
>
  Send Support Message
</button>


</MenuItem>

          {/* Privacy */}
          <MenuItem
            icon={<InformationCircleIcon className="w-6 h-6" />}
            label="Disclaimer & Privacy"
            isOpen={openPanel === "privacy"}
            onClick={() => togglePanel("privacy")}
          >
            <p className="text-sm leading-relaxed">
  Bhupatram Land Surveys (OPC) Private Limited is an independent, privately owned service provider.
  We do <strong>not represent any government authority</strong> and are not associated with any official government website.
  Fees charged are for professional assistance, processing, and consultancy services only.
</p>

          </MenuItem>

          {/* About */}
          <MenuItem
            icon={<DocumentDuplicateIcon className="w-6 h-6" />}
            label="About"
            isOpen={openPanel === "about"}
            onClick={() => togglePanel("about")}
          >
            <p className="text-sm">Version 1.0.0</p>
            <p className="text-sm">© 2023 Bhupatram Land Surveys (OPC) Private Limited</p>
          </MenuItem>

          {/* Logout */}
          <MenuItem
            icon={<ArrowRightOnRectangleIcon className="w-6 h-6" />}
            label="Log Out"
            onClick={handleLogout}
            noToggle
          />
        </div>
      </div>
    </div>
  );
}

/* ============================
   MenuItem Component
============================ */
function MenuItem({ icon, label, children, isOpen, onClick, noToggle }) {
  const variants = {
    collapsed: { opacity: 0, height: 0 },
    open: { opacity: 1, height: "auto" },
  };

  return (
    <motion.div layout initial={false} className="bg-white rounded-xl shadow border">
      <div
        onClick={onClick}
        className="flex justify-between items-center p-4 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>

        {!noToggle && (
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 90 : 0 }}
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </motion.div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && !noToggle && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={variants}
            className="px-4 pb-4 space-y-2 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
