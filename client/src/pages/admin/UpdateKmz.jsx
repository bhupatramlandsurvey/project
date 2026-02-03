import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function UpdateKmz() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [info, setInfo] = useState(null);

  // Fetch existing PMTiles info
  const loadInfo = () => {
    fetch(import.meta.env.VITE_BACKEND_URL + "api/pmtiles/pmtiles-info")
      .then((res) => res.json())
      .then((data) => setInfo(data));
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleUpload = () => {
    if (!file) return alert("Please select a PMTiles file");

    setProcessing(true);
    setSuccess(false);

    const formData = new FormData();
    formData.append("pmtiles", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.open(
      "POST",
      `${import.meta.env.VITE_BACKEND_URL}api/pmtiles/upload-pmtiles`
    );

    xhr.onload = () => {
      const res = JSON.parse(xhr.response || "{}");

      if (res.success) {
        setProcessing(false);
        setSuccess(true);
        setUploadProgress(0);
        setFile(null);
        loadInfo();
      } else {
        alert("Upload failed");
        setProcessing(false);
      }
    };

    xhr.send(formData);
  };

  return (
    <div className="relative min-h-screen bg-white p-6">

      {/* Back */}
      <motion.button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full shadow z-50"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </motion.button>

      <h1 className="text-2xl font-bold text-center mt-20">
        Update Map Tiles (PMTiles)
      </h1>

      {/* Info */}
      {info && (
        <div className="mt-10 bg-gray-100 p-5 rounded-xl shadow text-center w-80 mx-auto">
          <h3 className="font-bold mb-2">Current Tiles</h3>

          {info.exists ? (
            <p className="text-sm">
              Last Updated:<br />
              {new Date(info.lastModified).toLocaleString()}
            </p>
          ) : (
            <p>No tiles uploaded yet</p>
          )}
        </div>
      )}

      {/* Upload */}
      <div className="mt-12 flex flex-col items-center gap-5">
        <input
          type="file"
          accept=".pmtiles"
          onChange={(e) => setFile(e.target.files[0])}
          className="border p-3 rounded-xl w-64"
        />

        <motion.button
          onClick={handleUpload}
          className="px-6 py-2 bg-green-500 text-white rounded-xl shadow"
        >
          Upload PMTiles
        </motion.button>

        {uploadProgress > 0 && (
          <div className="w-64 bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-green-500 h-3"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Processing */}
      <AnimatePresence>
        {processing && (
          <motion.div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="bg-white p-6 rounded-xl text-center">
              <div className="animate-spin text-3xl">⚙️</div>
              <p className="mt-2 font-semibold">Uploading tiles…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
      <AnimatePresence>
        {success && (
          <motion.div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="bg-white p-6 rounded-xl text-center">
              <div className="text-4xl">🎉</div>
              <h2 className="text-green-600 font-bold mt-2">
                Tiles Updated Successfully!
              </h2>

              <button
                onClick={() => setSuccess(false)}
                className="mt-4 px-5 py-2 bg-green-500 text-white rounded-xl"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
