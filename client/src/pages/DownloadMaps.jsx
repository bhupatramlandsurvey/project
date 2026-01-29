import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  MapIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";

import villagesEnglish from "../assets/villages_final.json";
import villagesTelugu from "../assets/villages_telugu.json";


const typePreviewData = {
  // Certified
  "Village Map": {
    image: "/images/village-map-preview.jpg",
    info: "This is the map of a single revenue village . with the help of the village map we can identify the survey numbers. In the absence of tippons or if tippons are not available for a particular survey number  the map which is prepared/printed to scale is used to demarcate the boundaries of the field.The village map is like the mirror of the fields on the ground which contains survey numbers , old roads(bandla baata, kaali baata),kaaluvas , kuntas, rivers ,wells, hilly areas , habitations etc and also the geographical information at the time of preparation of the map.",
  },

  Tippon: {
    image: "/images/tippon-preview.jpg",
    info: "Tippons  are the records of the each survey number with exact measurements .Each survey number has tippon of its own with measurements. The exact measurements between  two stones are recorded with the help of which the extent of the survey number can be caliculated.",
  },

  "Pakka Book": {
    image: "/images/pakka-book-preview.jpg",
    info: "For every survey number that is demarcated at the time of initial survey , pacca book record is prepared in which replica  of tippon with F –line measurements on the left page and calculation part on the right page is recorded.This record is useful in the time if any tippon is not available or in torn condition. With the help of pacca book surveyor can prepare tippon.",
  },

  Sethwar: {
    image: "/images/sethwar-preview.jpg",
    info: "Sethwar is the book that keeps record of extents of survey nos. It is the main and primary record of total extent of survey no’s  and also to know  the classification and nature of the land .Example : Patta,Poramboku, Gairan,Kariju katha ,Shikam,Name of the pattedar etc.",
  },

  Khasra: {
    image: "/images/khasra-preview.jpg",
    info: "Khasra is the book that is prepared according to the Sethwar record, it is prepared in the year 1954-55 . It keeps record of details of each survey no. like  total extent, how many pattedars are recorded to a survey no and also other details like :classification(dry  or wet), nature of land(patta  or gairan or  poramboku etc.)",
  },

  Chesala: {
    image: "/images/chesala-preview.jpg",
    info: "Chesala is the record that is prepared according to the Khasra , it is recorded in the year 1955-1958. It keeps record of details of each survey no. like  total extent, how many pattedars are recorded to a survey no. It also contains details of the lands in that period of time.",
  },

  "Pahani/Adangal": {
    image: "/images/pahani-preview.jpg",
    info: "Pahanies are the records that are prepared after the Chesala.The records of rights prepared after 1958 are called as pahanies.In pahanies as Khasra and Chesala the total extent to survey numbers , nature of the land, classifications are recorded .Any changes in the records are recorded each year .Like change of the title holder of the buyer /seller if any are recorded year by year.These pahanies are recorded untill 2013-14 until Land record Updation program in 2014.",
  },

  // Digitalized
  "Digitalized: Village Map": {
    image: "/images/digital-village-map-preview.jpg",
    info: "This Map is prepared based according to  the  original Village map showing details in English language with numbers and letters that can be understood by anyone. ",
  },

  "Digitalized: Tippon": {
    image: "/images/digital-tippon-preview.jpg",
    info: "This is prepared by using the original tippon with the measurements recorded in the original tippon into meters and also area is shown",
  },

  // Default
  default: {
    image: "/images/default-preview.jpg",
    info: "Preview information is not available for this document type.",
  },
};

export default function DownloadMaps() {
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
  const [selectedType, setSelectedType] = useState("");
  const [previewType, setPreviewType] = useState(null); // 🆕 added
  const [district, setDistrict] = useState("");
  const [division, setDivision] = useState("");
  const [mandal, setMandal] = useState("");
  const [village, setVillage] = useState("");
  const [mapType, setMapType] = useState("");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [villageMapOption, setVillageMapOption] = useState("total");
  // Error modal state for missing required inputs
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorList, setErrorList] = useState([]);

  const [showSuccess, setShowSuccess] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState(null);

  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const validateRequiredFields = () => {
    const missing = [];
    const lower = (selectedType || "").toLowerCase();
    const isVillageMap = lower === "village map";
    const isPahani = lower === "pahani/adangal";
    const isDigitalized = source === "digitalized";

    const addIfMissing = (value, label) => {
      if (value === "" || value === null || typeof value === "undefined")
        missing.push(label);
    };

    // Common location requirements
    if (isVillageMap) {
      addIfMissing(district, "District");
      addIfMissing(division, "Division");
      addIfMissing(mandal, "Mandal");
      addIfMissing(village, "Village");
      addIfMissing(mapType, "Map Type");
      // For digitalized Village Map, if 'selected' option chosen require survey number
      if (isDigitalized && villageMapOption === "selected") {
        addIfMissing(surveyNumber, "Survey Number");
      }
    } else if (isPahani) {
      addIfMissing(district, "District");
      addIfMissing(division, "Division");
      addIfMissing(mandal, "Mandal");
      addIfMissing(village, "Village");
      addIfMissing(surveyNumber, "Survey Number");
      addIfMissing(yearFrom, "Year From");
      addIfMissing(yearTo, "Year To");
    } else {
      // default other types
      addIfMissing(district, "District");
      addIfMissing(division, "Division");
      addIfMissing(mandal, "Mandal");
      addIfMissing(village, "Village");
      addIfMissing(surveyNumber, "Survey Number");
    }

    return missing; // array of labels
  };

  const navigate = useNavigate();
  const { type } = useParams();
  const query = new URLSearchParams(window.location.search);
  const source = query.get("source");

  useEffect(() => {
    if (type) {
      const decoded = decodeURIComponent(type.replace(/-/g, " "));
      if (decoded !== selectedType) {
        setSelectedType(decoded);
      }
    } else if (selectedType !== "") {
      setSelectedType("");
    }
  }, [type]);

  const certifiedCopies = [
    "Village Map",
    "Tippon",
    "Pakka Book",
    "Sethwar",
    "Khasra",
    "Chesala",
    "Pahani/Adangal",
  ];
  const digitalizedCopies = ["Village Map", "Tippon"];
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
    : locationData?.[district]?.[division]?.[mandal] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validate required fields for the selectedType / source
    const missing = validateRequiredFields();
    if (missing.length > 0) {
      setErrorList(missing);
      setShowErrorModal(true);
      return;
    }

    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    const orderData = {
      userId: user?._id,
      downloadType: selectedType,
      source: query.get("source"),
      district,
      division,
      mandal,
      village,
      mapType,
      surveyNumber,
      villageMapOption,
      yearFrom,
      yearTo,
    };

    setPreviewData({ ...orderData });
    setShowPaymentPreview(true);
  };

  const startPayment = async () => {
    setShowPaymentPreview(false);
    setIsPaymentLoading(true);

    const res = await fetch(
      import.meta.env.VITE_BACKEND_URL + "api/downloadmapsandfiles/create",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewData),
      }
    );

    const data = await res.json();
    if (!data.success) {
      setIsPaymentLoading(false);
      return alert("❌ Error creating order");
    }

    const { razorpayOrder, key, order } = data;

    const options = {
      key,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "TempleClient Portal",
      description: `Payment for ${selectedType}`,
      order_id: razorpayOrder.id,

      handler: async function (response) {
        try {
          const verifyRes = await fetch(
            import.meta.env.VITE_BACKEND_URL +
              "api/downloadmapsandfiles/verify",
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
            setCompletedOrderId(order.friendlyId || order._id);
            setShowSuccess(true);
          } else {
            alert("❌ Payment verification failed.");
          }
        } catch (err) {
          setIsPaymentLoading(false);
          alert("❌ Verification error.");
        }
      },

      // ✅ CRITICAL FIX
      modal: {
        ondismiss: function () {
          setIsPaymentLoading(false);
          alert("⚠️ Payment cancelled. Order is pending.");
        },
      },

      prefill: {
        name: previewData.fullName,
        contact: previewData.mobile,
      },
      theme: { color: "#F97316" },
    };

    const razor = new window.Razorpay(options);

    razor.on("payment.failed", () => {
      setIsPaymentLoading(false);
      alert("❌ Payment failed. Order is pending.");
    });

    razor.open();
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setDistrict("");
    setDivision("");
    setMandal("");
    setVillage("");
    setMapType("");
    setSurveyNumber("");
    setYearFrom("");
    setYearTo("");
    setSelectedType("");
    setVillageMapOption("total");
    navigate("/dashboard/download-maps-and-files");
  };

  const handleBack = () => {
    if (selectedType) {
      setSelectedType("");
      navigate("/dashboard/download-maps-and-files", { replace: true });
    } else {
      navigate("/dashboard/home", { replace: true });
    }
  };

  const handleTypeClick = (option, source) => {
    const formatted = encodeURIComponent(
      option.toLowerCase().replace(/\s+/g, "-")
    );
    navigate(
      `/dashboard/download-maps-and-files/${formatted}?source=${source}`
    );
  };
const CURRENT_YEAR = new Date().getFullYear();

const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1954 + 1 },
  (_, i) => 1954 + i
);


  const renderForm = () => {
    if (!selectedType) {
      return (
        <div className="space-y-5 text-sm">
          {/* ✅ Certified Copies */}
          <div>
            <h2 className="text-base font-bold mb-2">Certified Copies</h2>
            <div className="grid grid-cols-2 gap-4">
              {certifiedCopies.map((option) => (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTypeClick(option, "certified")}
                  className="relative bg-white border border-orange-400 rounded-2xl shadow-md py-5 px-2 text-center font-medium text-gray-700 hover:bg-orange-50 transition flex flex-col items-center justify-center cursor-pointer"
                >
                  {/* 🟠 Info Icon (stops navigation) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewType({ name: option, source: "certified" }); // for Certified block
                    }}
                    className="absolute top-2 right-2 text-orange-500 hover:text-orange-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9.75h.008v.008H12V9.75zm0 3v3.75m0-12a9 9 0 110 18 9 9 0 010-18z"
                      />
                    </svg>
                  </button>

                  <MapIcon className="w-7 h-7 text-orange-500 mb-1" />
                  <span>{option}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ✅ Digitalized Copies */}
          <div>
            <h2 className="text-base font-bold mb-2">Digitalized Copies</h2>
            <div className="grid grid-cols-2 gap-4">
              {digitalizedCopies.map((option) => (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTypeClick(option, "digitalized")}
                  className="relative bg-white border border-orange-400 rounded-2xl shadow-md py-5 px-2 text-center font-medium text-gray-700 hover:bg-orange-50 transition flex flex-col items-center justify-center cursor-pointer"
                >
                  {/* 🟠 Info Icon (no navigation on click) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewType({ name: option, source: "digitalized" }); // for Digitalized block
                    }}
                    className="absolute top-2 right-2 text-orange-500 hover:text-orange-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9.75h.008v.008H12V9.75zm0 3v3.75m0-12a9 9 0 110 18 9 9 0 010-18z"
                      />
                    </svg>
                  </button>

                  <MapIcon className="w-7 h-7 text-orange-500 mb-1" />
                  <span>{option}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 🆕 Village Map
    // 🆕 Village Map
    if (selectedType.toLowerCase() === "village map") {
      // Determine if it's accessed from Certified or Digitalized list
      const isDigitalized = source === "digitalized";

      return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
          <h2 className="text-base font-bold text-center text-gray-800 mb-1">
            {selectedType}
          </h2>

          {/* 🌍 Location Selectors */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
              District <span className="text-red-500">*</span>
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="p-2.5 border rounded-xl"
            >
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
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
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
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
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
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
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Digitalized Options */}
          {isDigitalized && (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">
                  Choose Option <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="villageMapOption"
                      value="total"
                      checked={villageMapOption === "total"}
                      onChange={() => {
                        setVillageMapOption("total");
                        setSurveyNumber("");
                      }}
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
                    />
                    Selected Survey Number
                  </label>
                </div>
              </div>

              {villageMapOption === "selected" && (
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700">
                    Survey Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Survey Number"
                    value={surveyNumber}
                    onChange={(e) => setSurveyNumber(e.target.value)}
                    className="p-2.5 border rounded-xl"
                  />
                </div>
              )}
            </>
          )}

          {/* 🗺️ Map Type */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
              Map Type <span className="text-red-500">*</span>
            </label>
            <select
              value={mapType}
              onChange={(e) => setMapType(e.target.value)}
              className="p-2.5 border rounded-xl"
            >
              <option value="">Select Map Type</option>
              <option value="Dry">Dry</option>
              <option value="Wet">Wet</option>
            </select>
          </div>

          {/* 🚀 Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl font-medium shadow-lg"
          >
            Submit
          </motion.button>
        </form>
      );
    }
    // 🆕 Pahani / Adangal
    if (selectedType.toLowerCase() === "pahani/adangal") {
      return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
          <h2 className="text-base font-bold text-center text-gray-800 mb-1">
            {selectedType}
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700">
                District <span className="text-red-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="p-2.5 border rounded-xl"
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700">
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
                  <option key={div}>{div}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700">
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
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700">
                Village <span className="text-red-500">*</span>
              </label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                disabled={!mandal}
                className="p-2.5 border rounded-xl"
              >
                <option value="">Select Village</option>
                {villages.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700">
                Survey Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Survey Number"
                value={surveyNumber}
                onChange={(e) => setSurveyNumber(e.target.value)}
                className="p-2.5 border rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700">
                Year Range <span className="text-red-500">*</span>
              </label>
<div className="flex gap-2">
  <select
    value={yearFrom}
    onChange={(e) => setYearFrom(e.target.value)}
    className="p-2.5 border rounded-xl w-1/2"
  >
    <option value="">Year From</option>
    {YEAR_OPTIONS.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>

  <select
    value={yearTo}
    onChange={(e) => setYearTo(e.target.value)}
    className="p-2.5 border rounded-xl w-1/2"
  >
    <option value="">Year To</option>
    {YEAR_OPTIONS.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>
</div>


            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl font-medium shadow-lg"
          >
            Submit
          </motion.button>
        </form>
      );
    }

    // 🆕 Default for other types
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
        <h2 className="text-base font-bold text-center text-gray-800 mb-1">
          {selectedType}
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
              District <span className="text-red-500">*</span>
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="p-2.5 border rounded-xl"
            >
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
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
                <option key={div}>{div}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
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
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
              Village <span className="text-red-500">*</span>
            </label>
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              disabled={!mandal}
              className="p-2.5 border rounded-xl"
            >
              <option value="">Select Village</option>
              {villages.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700">
              Survey Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter Survey Number"
              value={surveyNumber}
              onChange={(e) => setSurveyNumber(e.target.value)}
              className="p-2.5 border rounded-xl"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl font-medium shadow-lg"
        >
          Submit
        </motion.button>
      </form>
    );
  };

  if (type && !selectedType) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="page-scroll fixed inset-0 p-4 flex flex-col items-center justify-start 
      bg-gradient-to-b from-orange-50 to-white rounded-3xl overflow-y-auto"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <motion.button
        onClick={handleBack}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-5 left-5 p-2 bg-orange-400 text-white rounded-full shadow-lg z-10"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </motion.button>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 mt-10 mb-10 overflow-y-auto"
        // style={{
        //   maxHeight: "100vh",          // Prevent content from overflowing screen
        //   minHeight: "75vh",          // Ensure decent size on smaller screens
        // }}
      >
        {renderForm()}
      </motion.div>

      <AnimatePresence>
        {previewType &&
          (() => {
            const previewKey =
              previewType.source === "digitalized"
                ? `Digitalized: ${previewType.name}`
                : previewType.name;

            const previewItem =
              typePreviewData[previewKey] || typePreviewData.default;

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white p-5 rounded-2xl shadow-2xl w-96 relative text-center"
                >
                  <button
                    onClick={() => setPreviewType(null)}
                    className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>

                  <h3 className="text-lg font-bold text-orange-600 mb-3">
                    {previewType.name} Preview
                  </h3>

                  <img
                    src={previewItem.image}
                    alt={previewType.name}
                    className="rounded-xl w-full h-64 object-cover border shadow-sm"
                  />

                  <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                    {previewItem.info}
                  </p>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* ✅ Keep your existing success popup untouched */}
      {/* ✅ Payment Success Modal */}
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
                  setShowSuccess(false);
                  navigate("/dashboard/download-maps-and-files");
                }}
                className="mt-4 px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium shadow-md hover:scale-105 transition"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 🔶 Payment Preview Modal */}
      <AnimatePresence>
        {showPaymentPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <div className="bg-white w-80 p-5 rounded-2xl shadow-2xl text-sm">
              <h2 className="text-lg font-bold text-orange-600 mb-3 text-center">
                Confirm Your Details
              </h2>

              <div className="space-y-1 text-gray-700">
                <p>
                  <b>Type:</b> {previewData?.downloadType}
                </p>
                <p>
                  <b>District:</b> {previewData?.district}
                </p>
                <p>
                  <b>Division:</b> {previewData?.division}
                </p>
                <p>
                  <b>Mandal:</b> {previewData?.mandal}
                </p>
                <p>
                  <b>Village:</b> {previewData?.village}
                </p>

                {previewData?.surveyNumber && (
                  <p>
                    <b>Survey No:</b> {previewData.surveyNumber}
                  </p>
                )}

                {previewData?.yearFrom && (
                  <p>
                    <b>Years:</b> {previewData.yearFrom} - {previewData.yearTo}
                  </p>
                )}

                {previewData?.villageMapOption && (
                  <p>
                    <b>Map Option:</b> {previewData.villageMapOption}
                  </p>
                )}

                <p className="mt-2 font-bold text-orange-500 text-center">
                  Payment Amount shown on next step
                </p>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  className="flex-1 bg-gray-300 py-2 rounded-lg"
                  onClick={() => setShowPaymentPreview(false)}
                >
                  Back
                </button>

                <button
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg"
                  onClick={startPayment}
                >
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
                <h3 className="text-lg font-semibold text-red-600">
                  Missing Required Fields
                </h3>
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

      {/* 🔄 Fullscreen Loading */}
      {isPaymentLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-xl text-center shadow-xl">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-700 font-medium">Opening Payment...</p>
          </div>
        </div>
      )}
    </div>
  );
}
