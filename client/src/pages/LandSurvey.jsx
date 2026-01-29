import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon, MapIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";



import villagesEnglish from "../assets/villages_final.json";
import villagesTelugu from "../assets/villages_telugu.json";

// ✅ Dummy mandals for Town Plan Survey
const townPlanMandals = {
  Hyderabad: ["Shaikpet", "Serilingampally", "Amberpet"],
  Rangareddy: ["Rajendranagar", "Hayathnagar", "Ibrahimpatnam"],
};

export default function LandSurvey() {
  
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
  const navigate = useNavigate();
  const { type } = useParams();

  const [selectedType, setSelectedType] = useState("");
  const [tipponSubType, setTipponSubType] = useState("");
  const [district, setDistrict] = useState("");
  const [division, setDivision] = useState("");
  const [mandal, setMandal] = useState("");
  const [village, setVillage] = useState("");
  const [surveyNo, setSurveyNo] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
const [completedOrderId, setCompletedOrderId] = useState(null);
  // ✅ Town Plan Fields
  const [townDistrict, setTownDistrict] = useState("");
  const [townMandal, setTownMandal] = useState("");
  const [wardNumber, setWardNumber] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [tslrNumber, setTslrNumber] = useState("");

  // Error modal state for missing required inputs
const [showErrorModal, setShowErrorModal] = useState(false);
const [errorList, setErrorList] = useState([]);
const validateRequiredFields = (formType) => {
  const missing = [];

  const addIfMissing = (value, label) => {
    if (value === "" || value === null || typeof value === "undefined") missing.push(label);
  };

  if (formType === "Town Plan Survey") {
    addIfMissing(townDistrict, "Town District");
    addIfMissing(townMandal, "Town Mandal");
    addIfMissing(wardNumber, "Ward Number");
    addIfMissing(blockNumber, "Block Number");
    addIfMissing(tslrNumber, "TSLR Number");
  } else {
    // common location fields for most surveys
    addIfMissing(district, "District");
    addIfMissing(division, "Division");
    addIfMissing(mandal, "Mandal");
    addIfMissing(village, "Village");

    // Tippon requires survey number
    if (formType === "Tippon Survey") {
      addIfMissing(surveyNo, "Survey Number");
    }
  }

  return missing;
};



  const surveyTypes = [
    "Tippon Survey",
    "Possession Survey",
    "Partition Survey",
    "Irrigation Hydra FTL",
    "Town Plan Survey",
    "Static Survey",
    "Contour Survey",
    "Earth Quantity Survey",
    "Drone Survey",
    "LiDAR Survey",
  ];

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


  const inputClass =
    "w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-sm";

  // ✅ Sync selectedType with route param
  useEffect(() => {
    if (type) {
      const decoded = decodeURIComponent(type.replace(/-/g, " "))
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (selectedType !== decoded) {
        setSelectedType(decoded);
      }
    } else if (!type && selectedType) {
      setSelectedType("");
    }
  }, [type]);

  // ✅ Default "Demarcation" for Tippon Survey
  useEffect(() => {
    if (selectedType === "Tippon Survey" && !tipponSubType) {
      setTipponSubType("Demarcation");
    }
  }, [selectedType, tipponSubType]);

const handleSubmit = async (e) => {
  e.preventDefault();

  // decide which form is being submitted
  const formType = selectedType || (type ? decodeURIComponent(type.replace(/-/g, " ")) : "");
  const missing = validateRequiredFields(formType);

  if (missing.length > 0) {
    setErrorList(missing);
    setShowErrorModal(true);
    return;
  }

  // proceed with existing submission logic
  const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const fullType =
    selectedType === "Tippon Survey" && tipponSubType
      ? `Tippon Survey - ${tipponSubType}`
      : selectedType;

  const orderData = {
    userId: loggedUser._id,
    surveyType: selectedType,
    subType: tipponSubType,
    district,
    division,
    mandal,
    village,
    surveyNo,
    wardNumber,
    blockNumber,
    tslrNumber,
    townDistrict,
    townMandal,
  };

  try {
    const res = await fetch(import.meta.env.VITE_BACKEND_URL + "api/landsurvey/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();
    if (data.success) {
      setCompletedOrderId(data.friendlyId);
      setShowSuccess(true);

      // reset
      setDistrict("");
      setDivision("");
      setMandal("");
      setVillage("");
      setSurveyNo("");
      setTipponSubType("");
      setWardNumber("");
      setBlockNumber("");
      setTslrNumber("");
      setTownDistrict("");
      setTownMandal("");
    } else {
      alert("❌ Error submitting your survey request");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("❌ Server error while submitting request");
  }
};


  const handleClosePopup = () => {
    setShowSuccess(false);
    setSelectedType("");
    setTipponSubType("");
    setDistrict("");
    setDivision("");
    setMandal("");
    setVillage("");
    setSurveyNo("");
    setTownDistrict("");
    setTownMandal("");
    setWardNumber("");
    setBlockNumber("");
    setTslrNumber("");
    navigate("/dashboard/land-survey-request");
  };

  const handleBack = () => {
    if (selectedType) {
      setSelectedType("");
      navigate("/dashboard/land-survey-request", { replace: true });
    } else {
      navigate("/dashboard/home", { replace: true });
    }
  };

const handleTypeClick = (option) => {
  const formatted = option.toLowerCase().replace(/\s+/g, "-");
  navigate(`/dashboard/land-survey-request/${formatted}`);
  // ❌ remove setSelectedType
};


  if (type && !selectedType) return null;

  return (
    <div
  className="page-scroll fixed inset-0  p-4 flex flex-col items-center justify-start 
  bg-gradient-to-b from-green-50 to-white rounded-3xl overflow-y-auto text-sm"
  style={{ WebkitOverflowScrolling: "touch" }}
>

      {/* Back Button */}
      <motion.button
        onClick={handleBack}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-5 left-5 p-2 bg-green-400 text-white rounded-full shadow-lg z-50"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </motion.button>

      {/* Main Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 flex flex-col gap-5 mt-0"
      >
        {!selectedType ? (
          <>
            <h1 className="text-lg font-bold text-green-700 text-center">
              Select Survey Type
            </h1>
            <div className="grid grid-cols-1 gap-3">
              {surveyTypes.map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTypeClick(type)}
                  className="w-full py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl font-medium shadow-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MapIcon className="w-5 h-5" />
                  {type}
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-green-700 text-center">
              {selectedType}
            </h1>

            {/* ✅ Tippon Survey Section */}
            {selectedType === "Tippon Survey" && (
               <div className="flex justify-center gap-6 mt-1">
    <label className="flex items-center gap-2 text-green-700">
      <span className="font-semibold text-gray-700 text-sm">
        Tippon Type <span className="text-red-500">*</span>
      </span>
      <input
        type="radio"
        name="tipponType"
        value="Demarcation"
        checked={tipponSubType === "Demarcation"}
        onChange={(e) => setTipponSubType(e.target.value)}
      />
      Demarcation
    </label>
    <label className="flex items-center gap-2 text-green-700">
      <input
        type="radio"
        name="tipponType"
        value="With Partition"
        checked={tipponSubType === "With Partition"}
        onChange={(e) => setTipponSubType(e.target.value)}
      />
      With Partition
    </label>
  </div>
            )}

            {/* ✅ Town Plan Survey Form (Simplified with District + Mandal) */}
            {selectedType === "Town Plan Survey" ? (
               <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
    <label className="text-gray-600 text-sm">
      District <span className="text-red-500">*</span>
    </label>
    <select
      value={townDistrict}
      onChange={(e) => {
        setTownDistrict(e.target.value);
        setTownMandal("");
      }}
      className={inputClass}
      
    >
      <option value="">Select District</option>
      <option value="Hyderabad">Hyderabad</option>
      <option value="Rangareddy">Rangareddy</option>
    </select>

    <label className="text-gray-600 text-sm">
      Mandal <span className="text-red-500">*</span>
    </label>
    <select
      value={townMandal}
      onChange={(e) => setTownMandal(e.target.value)}
      disabled={!townDistrict}
      className={inputClass}
      
    >
      <option value="">Select Mandal</option>
      {townDistrict &&
        townPlanMandals[townDistrict].map((mandal) => (
          <option key={mandal} value={mandal}>
            {mandal}
          </option>
        ))}
    </select>

    <label className="text-gray-600 text-sm">
      Ward Number <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      value={wardNumber}
      onChange={(e) => setWardNumber(e.target.value)}
      className={inputClass}
      placeholder="Enter Ward Number"
      
    />

    <label className="text-gray-600 text-sm">
      Block Number <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      value={blockNumber}
      onChange={(e) => setBlockNumber(e.target.value)}
      className={inputClass}
      placeholder="Enter Block Number"
      
    />

    <label className="text-gray-600 text-sm">
      TSLR Number <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      value={tslrNumber}
      onChange={(e) => setTslrNumber(e.target.value)}
      className={inputClass}
      placeholder="Enter TSLR Number"
      
    />

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl font-medium shadow-lg hover:from-green-500 hover:to-green-600 transition-all duration-300"
                >
                  Submit
                </motion.button>
              </form>
            ) : (
              /* ✅ Other Survey Types */
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
                <label className="text-gray-600 text-sm">District</label>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setDivision("");
                    setMandal("");
                    setVillage("");
                  }}
                  className={inputClass}
                  
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
  <option key={d} value={d}>{d}</option>
))}

                </select>

                <label className="text-gray-600 text-sm">Division</label>
                <select
                  value={division}
                  onChange={(e) => {
                    setDivision(e.target.value);
                    setMandal("");
                    setVillage("");
                  }}
                  disabled={!district}
                  className={inputClass}
                  
                >
                  <option value="">Select Division</option>
                  {divisions.map((d) => (
                    <option value={d} key={d}>{d}</option>
                  ))}
                </select>

                <label className="text-gray-600 text-sm">Mandal</label>
                <select
                  value={mandal}
                  onChange={(e) => {
                    setMandal(e.target.value);
                    setVillage("");
                  }}
                  disabled={!division}
                  className={inputClass}
                  
                >
                  <option value="">Select Mandal</option>
                  {mandals.map((m) => (
                    <option value={m} key={m}>{m}</option>
                  ))}
                </select>

                <label className="text-gray-600 text-sm">Village</label>
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  disabled={!mandal}
                  className={inputClass}
                  
                >
                  <option value="">Select Village</option>
                {(Array.isArray(villages) ? villages : []).map((v) => (
  <option key={v} value={v}>{v}</option>
))}
                </select>

                {/* ✅ Always show Survey Number for Tippon */}
                {selectedType === "Tippon Survey" && (
                  <>
                    <label className="text-gray-600 text-sm">Survey Number</label>
                    <input
                      type="text"
                      value={surveyNo}
                      onChange={(e) => setSurveyNo(e.target.value)}
                      className={inputClass}
                      placeholder="Enter Survey Number"
                      
                    />
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl font-medium shadow-lg hover:from-green-500 hover:to-green-600 transition-all duration-300"
                >
                  Submit
                </motion.button>
              </form>
            )}
          </>
        )}
      </motion.div>

      {/* ✅ Success Modal for Request */}
<AnimatePresence>
  {showSuccess && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 text-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-white p-6 rounded-2xl shadow-2xl text-center w-72"
      >
        <div className="text-3xl mb-2">🎉</div>
        <h2 className="text-lg font-bold text-green-600 mb-1">
          Request Submitted!
        </h2>
        <p className="text-gray-600 mb-3">
         Your request has been received. We will call you back soon.

        </p>
        <p className="font-semibold text-gray-700 mb-4">
          Request ID: {completedOrderId}
        </p>
        <button
          onClick={() => {
            setShowSuccess(false);
            navigate("/dashboard/land-survey-request");
          }}
          className="mt-4 px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-md hover:scale-105 transition"
        >
          OK
        </button>
      </motion.div>
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

    </div>
  );
}
