import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import villagesEnglish from "../assets/villages_final.json";
import villagesTelugu from "../assets/villages_telugu.json";

import lakesJson from "../assets/lakes_by_district.json";


export default function FTLMapHydra() {
  
  const navigate = useNavigate();
  const { type } = useParams();
  const location = useLocation(); // <- watch full pathname

  // initialize from param if present
  const initialType = type ? decodeURIComponent(type.replace(/-/g, " ")) : "";
  const [selectedType, setSelectedType] = useState(initialType);
  const [showPopup, setShowPopup] = useState(false);
  // ✅ For showing order success info after payment
const [completedOrderId, setCompletedOrderId] = useState(null);


  // ---------------- Common Location States ----------------
  const [district, setDistrict] = useState("");
  const [division, setDivision] = useState("");
  const [mandal, setMandal] = useState("");
  const [village, setVillage] = useState("");

  // ---------------- FTL Hydra ----------------
  const [ftlOption, setFtlOption] = useState("");
  const [lakeId, setLakeId] = useState("");
  const [kuntaName, setKuntaName] = useState("");

  // ---------------- HMDA Masterplan ----------------
  const [hmdaSurvey, setHmdaSurvey] = useState("");

  // ---------------- TOPO Sheet ----------------
  const [topoMethod, setTopoMethod] = useState("");
  const [sheetNumber, setSheetNumber] = useState("");

  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
const [previewData, setPreviewData] = useState(null);
const [isPaymentLoading, setIsPaymentLoading] = useState(false);
// Error modal state for missing required inputs
const [showErrorModal, setShowErrorModal] = useState(false);
const [errorList, setErrorList] = useState([]);

const validateRequiredFields = (formType) => {
  const missing = [];

  const addIfMissing = (value, label) => {
    if (value === "" || value === null || typeof value === "undefined") missing.push(label);
  };

  if (formType === "FTL Map Hydra") {
    addIfMissing(ftlOption, "FTL / CADASTRAL");
    addIfMissing(district, "District");
    addIfMissing(mandal, "Mandal");
    addIfMissing(village, "Village");
    addIfMissing(lakeId, "Lake ID");
    addIfMissing(kuntaName, "Kunta Name");
  } else if (formType === "HMDA Masterplan") {
    addIfMissing(hmdaSurvey, "HMDA Option");
  } else if (formType === "TOPO Sheet") {
    // Either sheetNumber OR full location must be provided
    if (!sheetNumber) {
      addIfMissing(district, "District");
      addIfMissing(division, "Division");
      addIfMissing(mandal, "Mandal");
      addIfMissing(village, "Village");
    }
  }

  return missing;
};


  // ---------------- Static Data (unchanged) ----------------
   const hmdaOptions = useMemo(
    () => [
      "BIBINAGAR",
      "BOMMALARAMARAM",
      "BUVANAGIRI",
      "CHEVELLA",
      "CHOUTUPPAL",
      "FARUQNAGAR",
      "GHATKESAR",
      "HATNURA",
      "HAYATHNAGAR",
      "IBRAHIMPATNAM - MANCHAL",
      "JINNWARAM",
      "KANDUKUR",
      "KISARA",
      "KOTHURU",
      "MAHESHWARAM",
      "MEDCHAL",
      "MOINABAD - RAJENDRANAGAR",
      "MULUG",
      "NARSAPUR",
      "PATANCHERUVU",
      "POCHAMPALLI",
      "SANGAREDDY",
      "SHAHBAD",
      "SHAMIRPET",
      "SHAMSHABAD",
      "SHANKARPALLI - RAMCHANDRAPURAM",
      "SHIVAMPET",
      "TOPRAN",
      "WARGAL",
      "YACHARAM",
    ],
    []
  );



const [locationData, setLocationData] = useState(villagesEnglish);

  useEffect(() => {
    const lang = localStorage.getItem("selected_language") || "en";

    if (lang === "te") {
      setLocationData(villagesTelugu);
    } else {
      // English + Hindi use same JSON
      setLocationData(villagesEnglish);
    }
  }, []); 

  const inputClass =
    "w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white";

// defensive: ensure locationData is at least an object
const districts = Object.keys(locationData || {});

// use optional chaining + fallback empty object so Object.keys never gets undefined/null
const divisions = Object.keys(locationData?.[district] || {});

// nested safely for mandals
const mandals = Object.keys(locationData?.[district]?.[division] || {});

// villages may be an array or an object depending on your json structure.
// If your villages are stored as an array: use the array directly, otherwise fall back to []
const villages = Array.isArray(locationData?.[district]?.[division]?.[mandal])
  ? locationData[district][division][mandal]
  : (locationData?.[district]?.[division]?.[mandal] || []);


  // reset helper (unchanged)
  const resetAllStates = () => {
    setFtlOption("");
    setDistrict("");
    setDivision("");
    setMandal("");
    setVillage("");
    setLakeId("");
    setKuntaName("");
    setHmdaSurvey("");
    setTopoMethod("");
    setSheetNumber("");
  };

  // Sync UI from the current pathname — this makes back/hardware back instantaneous
  useEffect(() => {
    const path = location.pathname || "";
    // check exact endings (you may have base path prefixes)
    if (path.endsWith("/ftl-map-hydra")) {
      setSelectedType("FTL Map Hydra");
    } else if (path.endsWith("/hmda-masterplan")) {
      setSelectedType("HMDA Masterplan");
    } else if (path.endsWith("/topo-sheet")) {
      setSelectedType("TOPO Sheet");
    } else if (path.endsWith("/ftl-hydra-hmda") || path.endsWith("/ftl-hydra-hmda/")) {
      // base selection route -> clear selection and reset states
      setSelectedType("");
      resetAllStates();
    } else {
      // if route is something else (like direct /dashboard/ftl-hydra-hmda/...), attempt to fallback to param
      if (type) setSelectedType(decodeURIComponent(type.replace(/-/g, " ")));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, type]);

  // Back button logic (unchanged behavior)
  const handleBack = () => {
    if (selectedType) {
      resetAllStates();
      // navigate to base selection — do NOT use replace: true so history stays natural
      navigate("/dashboard/ftl-hydra-hmda");
    } else {
      navigate("/dashboard/home");
    }
  };

  // selecting type navigates to dedicated route — we rely on location effect to set selectedType
  const handleTypeSelect = (item) => {
    const routeName = item.toLowerCase().replace(/\s+/g, "-");
    // navigate first, effect will set selectedType immediately because location changes
    navigate(`/dashboard/ftl-hydra-hmda/${routeName}`);
  };

  // Submit handlers (unchanged)
const handleFTLSubmit = (e) => {
  e.preventDefault();

  const missing = validateRequiredFields("FTL Map Hydra");
  if (missing.length > 0) {
    setErrorList(missing);
    setShowErrorModal(true);
    return;
  }

  const data = {
    type: "FTL Map Hydra",
    ftlOption,
    district,
    division,
    mandal,
    village,
    lakeId,
    kuntaName,
  };

  setPreviewData(data);
  setShowPaymentPreview(true);
};

const handleHMDAFormSubmit = (e) => {
  e.preventDefault();

  const missing = validateRequiredFields("HMDA Masterplan");
  if (missing.length > 0) {
    setErrorList(missing);
    setShowErrorModal(true);
    return;
  }

  const data = {
    type: "HMDA Masterplan",
    hmdaSurvey,
  };

  setPreviewData(data);
  setShowPaymentPreview(true);
};

const handleTopoSubmit = (e) => {
  e.preventDefault();

  const missing = validateRequiredFields("TOPO Sheet");
  if (missing.length > 0) {
    setErrorList(missing);
    setShowErrorModal(true);
    return;
  }

  const data = {
    type: "TOPO Sheet",
    topoMethod,
    sheetNumber,
    district,
    division,
    mandal,
    village,
  };

  setPreviewData(data);
  setShowPaymentPreview(true);
};

const startPayment = async () => {
  setShowPaymentPreview(false);
  setIsPaymentLoading(true);

  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  const typeToRoute = {
    "FTL Map Hydra": "ftl",
    "HMDA Masterplan": "hmda",
    "TOPO Sheet": "topo"
  };

  const createRoute = typeToRoute[previewData.type];

  const res = await fetch(
    import.meta.env.VITE_BACKEND_URL + `api/ftl-hydra/create/${createRoute}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, ...previewData }),
    }
  );

  const data = await res.json();

  if (!data.success) {
    setIsPaymentLoading(false);
    return alert("Error creating order");
  }

  const { razorOrder, key, order } = data;

const options = {
  key,
  amount: razorOrder.amount,
  currency: "INR",
  name: "TempleClient Portal",
  description: previewData.type,
  order_id: razorOrder.id,

  handler: async function (response) {
    try {
      const verifyRes = await fetch(
        import.meta.env.VITE_BACKEND_URL +
          `api/ftl-hydra/verify/${createRoute}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: order._id,
          }),
        }
      );

      const verifyData = await verifyRes.json();
      setIsPaymentLoading(false);

      if (verifyData.success) {
        setShowPopup(true);
        setCompletedOrderId(verifyData.friendlyId);
      } else {
        alert("❌ Payment verification failed");
      }
    } catch (err) {
      setIsPaymentLoading(false);
      alert("❌ Verification error");
    }
  },

  // ✅ VERY IMPORTANT
  modal: {
    ondismiss: function () {
      setIsPaymentLoading(false);
      alert("⚠️ Payment cancelled. Order is pending.");
    },
  },
};


  const rzp = new window.Razorpay(options);

rzp.on("payment.failed", function () {
  setIsPaymentLoading(false);
  alert("❌ Payment failed. Order is pending.");
});

rzp.open();

};



  const handlePopupClose = () => {
    setShowPopup(false);
    resetAllStates();
    setSelectedType("");
    navigate("/dashboard/ftl-hydra-hmda");
  };
  // ---------------- FTL Lakes Data ----------------
const ftlDistricts = Object.keys(lakesJson || {});
const ftlMandals = Object.keys(lakesJson?.[district] || {});
const ftlVillages = Object.keys(lakesJson?.[district]?.[mandal] || {});
const ftlLakes =
  lakesJson?.[district]?.[mandal]?.[village]
    ? Object.entries(lakesJson[district][mandal][village])
    : [];


  // IMPORTANT: set key to pathname so component remounts when URL changes
  return (
    <div key={location.pathname} className="min-h-screen p-4 flex flex-col items-center justify-start bg-gradient-to-b from-purple-50 to-white rounded-3xl overflow-y-auto">

      {/* Back Button */}
      <motion.button
        onClick={handleBack}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-5 left-5 p-2 bg-purple-500 text-white rounded-full shadow-lg z-50"
      >
        <ArrowLeftIcon className="w-6 h-6" />
      </motion.button>

    {/* ---------------- Main Selection ---------------- */}
{!selectedType && (
  <div className="flex flex-col items-center justify-center gap-6 h-screen w-full overflow-hidden">
    {["FTL Map Hydra", "HMDA Masterplan", "TOPO Sheet"].map((item) => (
      <motion.button
        key={item}
        onClick={() => handleTypeSelect(item)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-64 px-10 py-6 bg-gradient-to-r from-purple-400 to-purple-500 text-white 
                   rounded-2xl text-base font-bold shadow-lg hover:from-purple-500 hover:to-purple-600 
                   transition-all duration-300"
      >
        {item}
      </motion.button>
    ))}
  </div>
)}



      {/* ---------------- FTL Form ---------------- */}
 {/* ---------------- FTL Form ---------------- */}
{selectedType === "FTL Map Hydra" && (
  <motion.div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-6 mt-0">
    <h1 className="text-sm font-bold text-gray-800 text-center">
      FTL Map Hydra
    </h1>

    <div className="flex flex-col gap-3">

      {/* FTL / CADASTRAL */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-700">
          FTL / CADASTRAL <span className="text-red-500">*</span>
        </label>
        <select
          value={ftlOption}
          onChange={(e) => setFtlOption(e.target.value)}
          className={inputClass}
          required
        >
          <option value="">Select</option>
          <option value="FTL">FTL</option>
          <option value="CADASTRAL">CADASTRAL</option>
        </select>
      </div>

      {/* District */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-700">
          District <span className="text-red-500">*</span>
        </label>
        <select
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setMandal("");
            setVillage("");
            setKuntaName("");
            setLakeId("");
          }}
          className={inputClass}
          required
        >
          <option value="">Select District</option>
          {ftlDistricts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Mandal */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-700">
          Mandal <span className="text-red-500">*</span>
        </label>
        <select
          value={mandal}
          onChange={(e) => {
            setMandal(e.target.value);
            setVillage("");
            setKuntaName("");
            setLakeId("");
          }}
          disabled={!district}
          className={inputClass}
          required
        >
          <option value="">Select Mandal</option>
          {ftlMandals.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Village */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-700">
          Village <span className="text-red-500">*</span>
        </label>
        <select
          value={village}
          onChange={(e) => {
            setVillage(e.target.value);
            setKuntaName("");
            setLakeId("");
          }}
          disabled={!mandal}
          className={inputClass}
          required
        >
          <option value="">Select Village</option>
          {ftlVillages.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Lake / Kunta */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-700">
          Lake / Kunta Name <span className="text-red-500">*</span>
        </label>
        <select
          value={kuntaName}
          onChange={(e) => {
            const selectedLake = e.target.value;
            setKuntaName(selectedLake);
            setLakeId(
              lakesJson[district][mandal][village][selectedLake] || ""
            );
          }}
          disabled={!village}
          className={inputClass}
          required
        >
          <option value="">Select Lake / Kunta</option>
          {ftlLakes.map(([name, id]) => (
            <option key={id} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Lake ID (Auto) */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-gray-700">
          Lake ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={lakeId}
          readOnly
          className={`${inputClass} bg-gray-100`}
          placeholder="Auto-filled"
        />
      </div>
    </div>

    <motion.button
      onClick={handleFTLSubmit}
      className="py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:from-purple-500 hover:to-purple-600"
    >
      Submit
    </motion.button>
  </motion.div>
)}


      {/* ---------------- HMDA Form ---------------- */}
      {selectedType === "HMDA Masterplan" && (
        <motion.div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-6 mt-12">
          <h1 className="text-sm font-bold text-gray-800 text-center">HMDA Masterplan</h1>
         <div className="flex flex-col gap-1">
  <label className="font-semibold text-gray-700">
    Select Option <span className="text-red-500">*</span>
  </label>
  <select
    value={hmdaSurvey}
    onChange={(e) => setHmdaSurvey(e.target.value)}
    required
    className={inputClass}
  >
    <option value="">Select Option</option>
    {hmdaOptions.map((o) => (
      <option key={o}>{o}</option>
    ))}
  </select>
</div>

          <motion.button onClick={handleHMDAFormSubmit} className="py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:from-purple-500 hover:to-purple-600">Submit</motion.button>
        </motion.div>
      )}

      {/* ---------------- TOPO Sheet Form ---------------- */}
      {selectedType === "TOPO Sheet" && (
        <motion.div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-6 mt-0">
          <h1 className="text-sm font-bold text-gray-800 text-center">TOPO Sheet</h1>

         <div className="flex flex-col gap-6">
  {/* 🗺️ Sheet / OSM Number */}
  <div className="flex flex-col gap-1">
    <label className="font-semibold text-gray-700">
      Sheet / OSM Number <span className="text-gray-400">(optional if location given)</span>
    </label>
    <input
      type="text"
      value={sheetNumber}
      onChange={(e) => setSheetNumber(e.target.value)}
      placeholder="Enter Sheet / OSM Number"
      className={inputClass}
    />
  </div>

  {/* Separator */}
  <div className="text-center text-gray-500 font-medium">— or —</div>

  {/* 📍 Location Details */}
  <div className="flex flex-col gap-3">
    <label className="font-semibold text-gray-700">
      Location Details <span className="text-gray-400">(optional if sheet number given)</span>
    </label>

    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">
        District <span className="text-red-500">*</span>
      </label>
      <select
        value={district}
        onChange={(e) => {
          setDistrict(e.target.value);
          setDivision("");
          setMandal("");
          setVillage("");
        }}
        className={inputClass}
        required={!sheetNumber}
      >
        <option value="">Select District</option>
        {districts.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
    </div>

    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">
        Division <span className="text-red-500">*</span>
      </label>
      <select
        value={division}
        onChange={(e) => {
          setDivision(e.target.value);
          setMandal("");
          setVillage("");
        }}
        disabled={!district}
        className={inputClass}
        required={!sheetNumber}
      >
        <option value="">Select Division</option>
        {divisions.map((d) => (
          <option value={d} key={d}>{d}</option>
        ))}
      </select>
    </div>

    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">
        Mandal <span className="text-red-500">*</span>
      </label>
      <select
        value={mandal}
        onChange={(e) => {
          setMandal(e.target.value);
          setVillage("");
        }}
        disabled={!division}
        className={inputClass}
        required={!sheetNumber}
      >
        <option value="">Select Mandal</option>
        {mandals.map((m) => (
          <option value={m} key={m}>{m}</option>
        ))}
      </select>
    </div>

    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">
        Village <span className="text-red-500">*</span>
      </label>
      <select
        value={village}
        onChange={(e) => setVillage(e.target.value)}
        disabled={!mandal}
        className={inputClass}
        required={!sheetNumber}
      >
        <option value="">Select Village</option>
       {/* villages may be not an array in bad data; guard it */}
{(Array.isArray(villages) ? villages : []).map((v) => (
  <option key={v} value={v}>{v}</option>
))}

      </select>
    </div>
  </div>
</div>


          <motion.button onClick={handleTopoSubmit} className="py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:from-orange-500 hover:to-orange-600">Submit</motion.button>
        </motion.div>
      )}

      {/* ---------------- Success Popup ---------------- */}
      <AnimatePresence>
  {showPopup && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white p-6 rounded-2xl shadow-2xl text-center w-72"
      >
        <div className="text-3xl mb-2">🎉</div>
        <h2 className="text-lg font-bold text-green-600 mb-1">
          Payment Successful!
        </h2>
        <p className="text-gray-600 mb-3">
          Your order has been created successfully.
        </p>
        <p className="font-semibold text-gray-700 mb-4">
          Order ID: {completedOrderId}
        </p>
        <button
          onClick={() => {
            setShowPopup(false);
            navigate("/dashboard/ftl-hydra-hmda");
          }}
          className="mt-4 px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium shadow-md hover:scale-105 transition"
        >
          OK
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
<AnimatePresence>
{showPaymentPreview && (
  <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-5 rounded-2xl w-80 text-sm shadow-xl">
      <h2 className="text-lg font-bold text-purple-600 mb-2 text-center">
        Confirm Your Details
      </h2>

      <div className="space-y-1 text-gray-800">
        <p><b>Type:</b> {previewData.type}</p>

        {previewData.district && <p><b>District:</b> {previewData.district}</p>}
        {previewData.division && <p><b>Division:</b> {previewData.division}</p>}
        {previewData.mandal && <p><b>Mandal:</b> {previewData.mandal}</p>}
        {previewData.village && <p><b>Village:</b> {previewData.village}</p>}
        {previewData.ftlOption && <p><b>FTL/Cadastral:</b> {previewData.ftlOption}</p>}
        {previewData.lakeId && <p><b>Lake ID:</b> {previewData.lakeId}</p>}
        {previewData.kuntaName && <p><b>Kunta:</b> {previewData.kuntaName}</p>}
        {previewData.hmdaSurvey && <p><b>Option:</b> {previewData.hmdaSurvey}</p>}
        {previewData.sheetNumber && <p><b>Sheet No:</b> {previewData.sheetNumber}</p>}

        <p className="font-bold text-purple-600 text-center mt-2">
          Payment Amount shown on next step
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <button className="flex-1 bg-gray-300 py-2 rounded-lg"
          onClick={() => setShowPaymentPreview(false)}>
          Back
        </button>

        <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg"
          onClick={startPayment}>
          Proceed to Pay
        </button>
      </div>
    </div>
  </motion.div>
)}
</AnimatePresence>
{/* ❗ Missing required fields modal */}
<AnimatePresence>
  {showErrorModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white p-5 rounded-2xl shadow-2xl w-80 text-sm"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-red-600">Missing Required Fields</h3>
        </div>

        <ul className="list-disc list-inside text-gray-700 mb-3">
          {errorList.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>

        <div className="flex gap-2">
          <button
            onClick={() => setShowErrorModal(false)}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-200"
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{isPaymentLoading && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white px-6 py-4 rounded-xl text-center shadow-xl">
      <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
      <p className="text-gray-700 font-medium">Opening Payment...</p>
    </div>
  </div>
)}

    </div>
  );
}
