import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function UpdateKmz() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [kmzInfo, setKmzInfo] = useState(null);

  // Fetch existing KMZ file details
  const loadKmzInfo = () => {
    fetch(import.meta.env.VITE_BACKEND_URL + "api/kmz/kmz-info")
      .then((res) => res.json())
      .then((data) => setKmzInfo(data));
  };

  useEffect(() => {
    loadKmzInfo();
  }, []);

  const handleUpload = async () => {
    if (!file) return alert("Please select a KMZ file");

    const formData = new FormData();
    formData.append("kmz", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.open("POST", `${import.meta.env.VITE_BACKEND_URL}api/kmz/upload-kmz`);

    xhr.onload = () => {
      const res = JSON.parse(xhr.response);

      if (res.success) {
        setSuccess(true);
        setUploadProgress(0);
        loadKmzInfo(); // Refresh KMZ info after upload
      } else {
        alert("Upload failed");
      }
    };

    xhr.send(formData);
  };

  return (
    <div className="relative min-h-screen bg-white p-6">

      {/* 🔙 Back Button */}
      <motion.button
        onClick={() => navigate(-1)}
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg z-50"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </motion.button>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800 mt-20 text-center">
        Update KMZ File
      </h1>

      {/* ⭐ KMZ Info Block */}
      {kmzInfo && (
        <div className="mt-10 bg-gray-100 p-5 rounded-2xl shadow text-center w-80 mx-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Existing KMZ File</h3>

          {kmzInfo.exists ? (
            <>
              <p className="text-gray-600 mb-3">
                <span className="font-semibold">Last Updated:</span><br />
                {new Date(kmzInfo.lastModified).toLocaleString()}
              </p>

              <a
                href={import.meta.env.VITE_BACKEND_URL + "important/file.kmz"}
                download="file.kmz"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-xl shadow"
                >
                  Download KMZ File
                </motion.button>
              </a>
            </>
          ) : (
            <p className="text-gray-600">No KMZ File Found</p>
          )}
        </div>
      )}

      {/* Upload Section */}
      <div className="mt-12 flex flex-col items-center gap-5">

        <input
          type="file"
          accept=".kmz"
          onChange={(e) => setFile(e.target.files[0])}
          className="border p-3 rounded-xl bg-gray-50 w-64 shadow"
        />

        <motion.button
          onClick={handleUpload}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 bg-green-500 text-white rounded-xl shadow-lg"
        >
          Upload KMZ
        </motion.button>

        {/* Progress Bar */}
        {uploadProgress > 0 && (
          <div className="w-64 bg-gray-200 h-3 rounded-full overflow-hidden shadow">
            <div
              className="bg-green-500 h-3"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* 🎉 Success Animation */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white p-6 rounded-2xl shadow-xl text-center"
            >
              <div className="text-4xl">🎉</div>
              <h2 className="text-xl font-bold text-green-600 mt-2">
                KMZ Updated Successfully!
              </h2>

              <button
                onClick={() => setSuccess(false)}
                className="mt-4 px-5 py-2 bg-green-500 text-white rounded-xl shadow"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
