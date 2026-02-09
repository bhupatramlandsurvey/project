import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon, MapIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";


import villagesEnglish from "../assets/villages_final.json";
import villagesTelugu from "../assets/villages_telugu.json";


export default function RequestMap() {
  

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

  const [selectedType, setSelectedType] = useState(type ? type.replace(/-/g, " ") : "");
  const [district, setDistrict] = useState("");
  const [division, setDivision] = useState("");
  const [mandal, setMandal] = useState("");
  const [village, setVillage] = useState("");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]); // ✅ Multiple files
  const [showPopup, setShowPopup] = useState(false);
  const [villageMapOption, setVillageMapOption] = useState("total");

  const [showSuccess, setShowSuccess] = useState(false);
const [completedOrderId, setCompletedOrderId] = useState(null);
const [showPaymentPreview, setShowPaymentPreview] = useState(false);
const [previewData, setPreviewData] = useState(null);
const [isPaymentLoading, setIsPaymentLoading] = useState(false);
// Error modal state for missing required inputs
const [showErrorModal, setShowErrorModal] = useState(false);
const [errorList, setErrorList] = useState([]);
const validateRequiredFields = () => {
  const missing = [];
  const lower = (selectedType || "").toLowerCase();
  const isDigitizationOrKML = ["digitization village map", "kml"].includes(lower);

  const addIfMissing = (value, label) => {
    if (value === "" || value === null || typeof value === "undefined") missing.push(label);
  };

  // location always required
    // location always required
  addIfMissing(district, "District");
  addIfMissing(division, "Division");
  addIfMissing(mandal, "Mandal");
  addIfMissing(village, "Village");

  // 📂 Upload files required
  if (!uploadFiles || uploadFiles.length === 0) {
    missing.push("Upload Files");
  }


  // Survey rules
  if (isDigitizationOrKML) {
    addIfMissing(villageMapOption, "Village Map Option");
    if (villageMapOption === "selected") {
      addIfMissing(surveyNumber, "Survey Number");
    }
  } else {
    // for other request types we require survey number
    addIfMissing(surveyNumber, "Survey Number");
  }

  return missing;
};


  const mapTypes = [
    "Tippon Plotting",
    "Digitization Village Map",
    "KML",
    "Pacca Book Calculation",
    "Sub Division Sketch",
    "Tounch Map",
  ];

  const extraOptions = [{ name: "Tour Dairy", path: "/dashboard/tour-dairy" }];

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


  // ✅ Normalize type safely
useEffect(() => {
  if (!type) {
    setSelectedType("");
    return;
  }

  const formattedType = type.replace(/-/g, " ").toLowerCase();
  const matchedType = mapTypes.find(
    (t) => t.toLowerCase() === formattedType
  );

  setSelectedType(matchedType || "");
}, [type]);

const sanitizeSurveyNumber = (value) => {
  // remove spaces, commas, dots
  return value.replace(/[ ,\.]/g, "");
};



const handleSubmit = (e) => {
  e.preventDefault();

  const missing = validateRequiredFields();
  if (missing.length > 0) {
    setErrorList(missing);
    setShowErrorModal(true);
    return;
  }

  const data = {
    selectedType,
    district,
    division,
    mandal,
    village,
    surveyNumber,
    uploadFiles,
    villageMapOption,
  };

  setPreviewData(data);
  setShowPaymentPreview(true);
};

const startPayment = async () => {
  setShowPaymentPreview(false);
  setIsPaymentLoading(true);

  const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));

  const formData = new FormData();
  formData.append("userId", loggedUser._id);
  formData.append("requestType", previewData.selectedType);
  formData.append("district", previewData.district);
  formData.append("division", previewData.division);
  formData.append("mandal", previewData.mandal);
  formData.append("village", previewData.village);
  formData.append("surveyNumber", previewData.surveyNumber);
  formData.append("villageMapOption", previewData.villageMapOption);

  previewData.uploadFiles.forEach((file) => {
    formData.append("files", file);
  });

  const res = await fetch(
    import.meta.env.VITE_BACKEND_URL + "api/requestmap/create",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!data.success) {
    setIsPaymentLoading(false);
    return alert("❌ Failed to create order");
  }

  const { razorOrder, key, order, friendlyId } = data;

 const options = {
  key,
  amount: razorOrder.amount,
  currency: razorOrder.currency,
  name: "TempleClient Portal",
  description: `Payment for ${previewData.selectedType}`,
  order_id: razorOrder.id,

  handler: async function (response) {
    try {
      const verifyRes = await fetch(
        import.meta.env.VITE_BACKEND_URL + "api/requestmap/verify",
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
        setCompletedOrderId(friendlyId);
        setShowSuccess(true);
      } else {
        alert("❌ Payment verification failed");
      }
    } catch (err) {
      setIsPaymentLoading(false);
      alert("❌ Verification error");
    }
  },

  modal: {
    ondismiss: function () {
      // ✅ User closed payment popup
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
    setDistrict("");
    setDivision("");
    setMandal("");
    setVillage("");
    setSurveyNumber("");
    setSelectedType("");
    setUploadFiles([]); // ✅ reset
    setVillageMapOption("total");
    navigate("/dashboard/request-services", { replace: true });
  };

  const handleBack = () => {
    if (selectedType) {
      setSelectedType("");
      navigate(-1);
    } else {
      navigate("/dashboard/home", { replace: true });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles((prev) => [...prev, ...files]); // ✅ append new files
  };

  const removeFile = (index) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const renderForm = () => {
    if (!selectedType) {
      return (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {mapTypes.map((type) => {
            const routeName = type.toLowerCase().replace(/\s+/g, "-");
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigate(`/dashboard/request-services/${routeName}`);
                }}
                className="bg-white border border-indigo-400 rounded-2xl shadow-md py-5 font-medium text-gray-700 hover:bg-indigo-50 transition"
              >
                <MapIcon className="w-7 h-7 mx-auto text-indigo-500 mb-1" />
                {type}
              </motion.button>
            );
          })}

          {extraOptions.map((opt) => (
            <motion.button
              key={opt.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(opt.path)}
              className="bg-gradient-to-r from-indigo-100 to-indigo-200 border border-indigo-400 rounded-2xl shadow-md py-5 font-medium text-indigo-700 hover:from-indigo-200 hover:to-indigo-300 transition"
            >
              <MapIcon className="w-7 h-7 mx-auto text-indigo-500 mb-1" />
              {opt.name}
            </motion.button>
          ))}
        </div>
      );
    }

    const isDigitizationOrKML = ["digitization village map", "kml"].includes(
      selectedType.toLowerCase()
    );

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
        <h2 className="text-base font-bold text-center text-gray-800 mb-2">
          {selectedType}
        </h2>

        {/* Dropdowns */}
        <div className="flex flex-col gap-3">
  {/* 🏙️ District */}
  <div className="flex flex-col gap-1">
    <label className="font-semibold text-gray-700 text-sm">
      District <span className="text-red-500">*</span>
    </label>
    <select
      value={district}
      onChange={(e) => setDistrict(e.target.value)}
      
      className="p-2.5 border rounded-xl"
    >
      <option value="">Select District</option>
      {districts.map((d) => (
  <option key={d} value={d}>{d}</option>
))}

    </select>
  </div>

  {/* 🧭 Division */}
  <div className="flex flex-col gap-1">
    <label className="font-semibold text-gray-700 text-sm">
      Division <span className="text-red-500">*</span>
    </label>
    <select
      value={division}
      onChange={(e) => setDivision(e.target.value)}
      disabled={!district}
      
      className="p-2.5 border rounded-xl"
    >
      <option value="">Select Division</option>
      {divisions.map((div) => (
        <option value={div} key={div}>{div}</option>
      ))}
    </select>
  </div>

  {/* 🏡 Mandal */}
  <div className="flex flex-col gap-1">
    <label className="font-semibold text-gray-700 text-sm">
      Mandal <span className="text-red-500">*</span>
    </label>
    <select
      value={mandal}
      onChange={(e) => setMandal(e.target.value)}
      disabled={!division}
      
      className="p-2.5 border rounded-xl"
    >
      <option value="">Select Mandal</option>
      {mandals.map((m) => (
        <option value={m} key={m}>{m}</option>
      ))}
    </select>
  </div>

  {/* 🏘️ Village */}
  <div className="flex flex-col gap-1">
    <label className="font-semibold text-gray-700 text-sm">
      Village <span className="text-red-500">*</span>
    </label>
    <select
      value={village}
      onChange={(e) => setVillage(e.target.value)}
      disabled={!mandal}
      
      className="p-2.5 border rounded-xl"
    >
      <option value="">Select Village</option>
     {/* villages may be not an array in bad data; guard it */}
{(Array.isArray(villages) ? villages : []).map((v) => (
  <option key={v} value={v}>{v}</option>
))}

    </select>
  </div>

  {/* 🗺️ Conditional: Village Map / KML */}
  {isDigitizationOrKML && (
    <div className="flex flex-col gap-1">
      <label className="font-semibold text-gray-700 text-sm">
        Choose Option <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-3">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="villageMapOption"
            value="total"
            checked={villageMapOption === "total"}
            onChange={() => setVillageMapOption("total")}
            className="cursor-pointer"
            
          />
          Total Village Map
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="villageMapOption"
            value="selected"
            checked={villageMapOption === "selected"}
            onChange={() => setVillageMapOption("selected")}
            className="cursor-pointer"
            
          />
          Selected Survey
        </label>
      </div>
    </div>
  )}

  {/* 🔢 Survey Number */}
  {(isDigitizationOrKML ? villageMapOption === "selected" : true) && (
    <div className="flex flex-col gap-1">
      <label className="font-semibold text-gray-700 text-sm">
        Survey Number <span className="text-red-500">*</span>
      </label>
      <input
  type="text"
  placeholder="Enter Survey Number"
  value={surveyNumber}
  onChange={(e) =>
    setSurveyNumber(
      e.target.value.replace(/[ ,\.]/g, "")
    )
  }
  onKeyDown={(e) => {
    if ([" ", ",", "."].includes(e.key)) {
      e.preventDefault();
    }
  }}
  className="p-2.5 border rounded-xl"
/>

    </div>
  )}

  {/* 📂 Multiple File Upload */}
  <div className="flex flex-col gap-1">
   <label className="font-semibold text-gray-700 text-sm">
  Upload Files <span className="text-red-500">*</span>
</label>

    <input
      type="file"
      multiple
      onChange={handleFileChange}
      className="p-2.5 border rounded-xl cursor-pointer bg-white"
    />

    {uploadFiles.length > 0 && (
      <ul className="mt-1 space-y-1">
        {uploadFiles.map((file, index) => (
          <li
            key={index}
            className="flex justify-between items-center border rounded-xl p-2 bg-gray-50 text-xs text-gray-700"
          >
            <span className="truncate max-w-[75%]">{file.name}</span>
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
</div>


        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="py-2.5 bg-gradient-to-r from-indigo-400 to-indigo-500 text-white rounded-xl font-medium shadow-lg"
        >
          Submit
        </motion.button>
      </form>
    );
  };

  return (
    <div
  className={`p-4 flex pt-10 flex-col items-center bg-gradient-to-b from-indigo-50 to-white text-sm ${
    selectedType ? "min-h-screen overflow-y-auto" : "min-h-screen overflow-y-auto"
  }`}
  style={{ WebkitOverflowScrolling: "touch" }}
>


      <motion.button
        onClick={handleBack}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-5 left-5 p-2 bg-indigo-400 text-white rounded-full shadow-lg z-50"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </motion.button>
 <h1 className="text-lg font-bold  text-indigo-400 text-center">
              Select Request Type
            </h1>
     <motion.div
  key={selectedType || "select"}
  initial={false}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.3 }}
  className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 mt-10 mb-10"
>

        
        {renderForm()}
      </motion.div>

      {/* ✅ Payment Success Modal */}
<AnimatePresence>
  {showSuccess && (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 text-sm"
    >
      <motion.div
       initial={false}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-white p-6 rounded-2xl shadow-2xl text-center w-72"
      >
        <div className="text-3xl mb-2">🎉</div>
        <h2 className="text-lg font-bold text-green-600 mb-1">
          Payment Successful!
        </h2>
        <p className="text-gray-600 mb-3">
          Your request has been created successfully.
        </p>
        <p className="font-semibold text-gray-700 mb-4">
          Request ID: {completedOrderId}
        </p>
        <button
          onClick={() => {
            setShowSuccess(false);
            navigate("/dashboard/request-services");
          }}
          className="mt-4 px-5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:scale-105 transition"
        >
          OK
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
<AnimatePresence>
{showPaymentPreview && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <motion.div
      initial={false}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white p-5 rounded-2xl w-80 text-sm shadow-xl"
    >
      <h2 className="text-lg font-bold text-indigo-500 mb-2 text-center">
        Confirm Your Details
      </h2>

      <div className="space-y-1 text-gray-700">
        <p><b>Type:</b> {previewData.selectedType}</p>
        <p><b>District:</b> {previewData.district}</p>
        <p><b>Division:</b> {previewData.division}</p>
        <p><b>Mandal:</b> {previewData.mandal}</p>
        <p><b>Village:</b> {previewData.village}</p>
        <p><b>Survey Number:</b> {previewData.surveyNumber}</p>

        {previewData.uploadFiles?.length > 0 && (
          <p><b>Files:</b> {previewData.uploadFiles.length} attached</p>
        )}

        <p className="mt-2 font-bold text-indigo-600 text-center">
          Payment Amount shown on next step
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          className="flex-1 bg-gray-300 py-2 rounded-lg"
          onClick={() => setShowPaymentPreview(false)}
        >
          Back
        </button>

        <button
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg"
          onClick={startPayment}
        >
          Proceed to Pay
        </button>
      </div>
    </motion.div>
  </motion.div>
)}
</AnimatePresence>
{/* ❗ Missing required fields modal */}
<AnimatePresence>
  {showErrorModal && (
    <motion.div
     initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
    >
      <motion.div
        initial={false}
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
      <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
      <p className="text-gray-700 font-medium">Opening Payment...</p>
    </div>
  </div>
)}

    </div>
  );
}
