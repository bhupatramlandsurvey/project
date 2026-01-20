import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// API base (local)
const API_BASE = import.meta.env.VITE_BACKEND_URL + "api/tour-diary";

const initialRow = {
  date: "",
  from: "",
  to: "",
  kind: "",
  distance: "",
  fileNo: "",
  govtLand: "",
  pattaLand: "",
  spotInspection: "",
  laHouse: "",
  sdWork: "",
  courtCases: "",
  copyTippons: "",
  description: ""
};

export default function TourDiaryTab({ loggedInUser: propLoggedInUser }) {
  // If loggedInUser not passed as prop, try reading from localStorage (you said localStorage only for that)
  const storedUser = typeof window !== "undefined" && localStorage.getItem("loggedInUser");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const loggedInUser = propLoggedInUser || parsedUser;

  const [rows, setRows] = useState([]);
  const [header, setHeader] = useState({
    name: "",
    designation: "",
    mandal: "",
    month: ""
  });

  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  // STYLES (unchanged)
  const inputHeader =
    "w-full max-w-md border border-gray-400 rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-blue-500";
  const inputCell =
    "w-50 border border-gray-400 rounded-md px-3 py-2 text-base focus:ring-2 focus:ring-blue-400";
  const smallCell =
    "w-12 border border-gray-400 rounded-md px-2 py-1 text-center focus:ring-2 focus:ring-blue-400";

  // ---------------------------
  // Load user's single diary from server on mount
  // ---------------------------
  useEffect(() => {
    loadFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFromServer = async () => {
    if (!loggedInUser || !loggedInUser._id) {
      setSyncMessage("No logged-in user found.");
      return;
    }
    setLoading(true);
    setSyncMessage("");
    try {
      const res = await fetch(`${API_BASE}/${loggedInUser._id}`);
      const json = await res.json();

      // Expecting { success: true, data: { header, rows } } or { success:true, data:null }
      if (json && json.success && json.data) {
        const doc = json.data;
        // Some backends might store header under doc.header; adjust gracefully
        if (doc.header) setHeader(doc.header);
        if (doc.rows) setRows(doc.rows);
        setSyncMessage("Loaded from server");
      } else {
        // No document found — start fresh
        setHeader({ name: "", designation: "", mandal: "", month: "" });
        setRows([]);
        setSyncMessage("No server data. Starting fresh.");
      }
    } catch (err) {
      console.error("Load error:", err);
      setSyncMessage("Failed to load from server");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Save (upsert) to server
  // ---------------------------
  const saveToServer = async () => {
    if (!loggedInUser || !loggedInUser._id) {
      alert("No logged-in user found!");
      return;
    }

    setLoading(true);
    setSyncMessage("");
    try {
      const res = await fetch(`${API_BASE}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": loggedInUser._id
        },
        body: JSON.stringify({
          userId: loggedInUser._id,
          header,
          rows
        })
      });

      const json = await res.json();
      if (json && json.success) {
        setSyncMessage("Saved to server ✔");
      } else {
        setSyncMessage(json && json.message ? json.message : "Save failed");
      }
    } catch (err) {
      console.error("Save error:", err);
      setSyncMessage("Server save failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Clear All Rows (Option B): reset header completely and rows (with confirmation)
  // ---------------------------
  const clearAllRows = () => {
    const ok = window.confirm("Are you sure you want to delete ALL rows and reset header? This action cannot be undone.");
    if (!ok) return;

    setRows([]);
    setHeader({ name: "", designation: "", mandal: "", month: "" });
    setSyncMessage("Cleared locally. Click Save to persist to server.");
  };

  // ---------------------------
  // Row operations
  // ---------------------------
  const addRow = () => setRows([...rows, { ...initialRow }]);
  const deleteRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = value;
    setRows(copy);
  };

  // ---------------------------
  // Exports (unchanged)
  // ---------------------------
  const exportExcel = () => {
    const data = rows.map((r) => ({
      Date: r.date,
      From: r.from,
      To: r.to,
      "Kind Journey": r.kind,
      Distance: r.distance,
      "File No": r.fileNo,
      Govt: r.govtLand,
      Patta: r.pattaLand,
      Spot: r.spotInspection,
      LA: r.laHouse,
      SD: r.sdWork,
      Court: r.courtCases,
      Tippons: r.copyTippons,
      Description: r.description
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TourDiary");
    XLSX.writeFile(wb, "TourDiary.xlsx");
  };

const exportPDF = () => {
  const doc = new jsPDF("landscape");

  // 🔵 Add Heading
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICE OF THE COLLECTOR SURVEY AND LAND RECORDS RANGAREDDY DISTRICT", 14, 12);
  doc.text("", 14, 20);

  // 🔵 Add sub-header (existing)
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Monthly Tour Diary of Sri: ${header.name}`, 14, 38);
  doc.text(`Designation: ${header.designation}`, 14, 46);
  doc.text(`Mandal: ${header.mandal}`, 200, 38);
  doc.text(`Month: ${header.month}`, 200, 46);

  // 🔵 Table
  autoTable(doc, {
    startY: 55,
    head: [
      [
        "DATE",
        "FROM",
        "TO",
        "KIND OF JOURNEY",
        "DISTANCE",
        "FILE NO",
        "GOVT. LAND DEM",
        "PATTA LAND DEM",
        "SPOT INSPECTION",
        "L.A/ HOUSE SITES",
        "SD WORK",
        "COURT CASES",
        "COPY OF TIPPONS",
        "BRIEF DESCRIPTION"
      ]
    ],
    body: rows.map((r) => [
      r.date,
      r.from,
      r.to,
      r.kind,
      r.distance,
      r.fileNo,
      r.govtLand,
      r.pattaLand,
      r.spotInspection,
      r.laHouse,
      r.sdWork,
      r.courtCases,
      r.copyTippons,
      r.description
    ]),
    theme: "grid"
  });

  doc.save("TourDiary.pdf");
};


  return (
    <div >
      {/* Loading indicator */}
      {loading && (
        <div className="text-blue-600 font-semibold mb-3 animate-pulse">Loading...</div>
      )}

      {/* Sync / status message */}
      {syncMessage && <div className="text-green-600 font-medium mb-3">{syncMessage}</div>}

      {/* Save + Clear Buttons */}
      <div className="flex gap-4 mb-6">
        <button onClick={saveToServer} className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow">
          Save to Server
        </button>

        <button onClick={clearAllRows} className="bg-yellow-600 text-white px-5 py-2 rounded-lg shadow">
          Clear All Rows
        </button>
      </div>

      {/* Header Inputs */}
      <div className="mb-6">
        <input
          className={inputHeader}
          placeholder="Name"
          value={header.name}
          onChange={(e) => setHeader({ ...header, name: e.target.value })}
        />
        <br />

        <input
          className={inputHeader}
          placeholder="Designation"
          value={header.designation}
          onChange={(e) => setHeader({ ...header, designation: e.target.value })}
        />
        <br />

        <input
          className={inputHeader}
          placeholder="Mandal"
          value={header.mandal}
          onChange={(e) => setHeader({ ...header, mandal: e.target.value })}
        />
        <br />

        <input
          className={inputHeader}
          placeholder="Month (label only)"
          value={header.month}
          onChange={(e) => setHeader({ ...header, month: e.target.value })}
        />
      </div>

      {/* ICON BUTTONS */}
      <div className="flex gap-10 mb-6">
        <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition" onClick={addRow}>
          <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" className="w-12" alt="add" />
          <span className="text-sm font-medium mt-1">Add Row</span>
        </div>

        <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition" onClick={exportExcel}>
          <img src="https://cdn-icons-png.flaticon.com/512/732/732220.png" className="w-12" alt="excel" />
          <span className="text-sm font-medium mt-1">Excel</span>
        </div>

        <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition" onClick={exportPDF}>
          <img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" className="w-12" alt="pdf" />
          <span className="text-sm font-medium mt-1">PDF</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-300">
        <table className="min-w-[1400px] w-full border-collapse">

          <thead>
            <tr>
              <th className="bg-blue-600 text-white py-3 border">Date</th>
              <th className="bg-blue-600 text-white py-3 border">From</th>
              <th className="bg-blue-600 text-white py-3 border">To</th>
              <th className="bg-blue-600 text-white py-3 border">Kind</th>
              <th className="bg-blue-600 text-white py-3 border">Dist</th>
              <th className="bg-blue-600 text-white py-3 border">File No</th>

              <th className="bg-blue-600 text-white py-3 border">Govt</th>
              <th className="bg-blue-600 text-white py-3 border">Patta</th>
              <th className="bg-blue-600 text-white py-3 border">Spot</th>
              <th className="bg-blue-600 text-white py-3 border">LA</th>
              <th className="bg-blue-600 text-white py-3 border">SD</th>
              <th className="bg-blue-600 text-white py-3 border">Court</th>
              <th className="bg-blue-600 text-white py-3 border">Tippons</th>

              <th className="bg-blue-600 text-white py-3 border w-[600px]">Description</th>

              <th className="bg-blue-600 text-white py-3 border">Del</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="border p-3">
                  <input className={inputCell} type="date" value={r.date} onChange={(e) => updateRow(i, "date", e.target.value)} />
                </td>

                <td className="border p-3">
                  <input className={inputCell} value={r.from} onChange={(e) => updateRow(i, "from", e.target.value)} />
                </td>

                <td className="border p-3">
                  <input className={inputCell} value={r.to} onChange={(e) => updateRow(i, "to", e.target.value)} />
                </td>

                <td className="border p-3">
                  <input className={inputCell} value={r.kind} onChange={(e) => updateRow(i, "kind", e.target.value)} />
                </td>

                <td className="border p-3">
                  <input className={inputCell} type="number" value={r.distance} onChange={(e) => updateRow(i, "distance", e.target.value)} />
                </td>

                <td className="border p-3">
                  <input className={inputCell} value={r.fileNo} onChange={(e) => updateRow(i, "fileNo", e.target.value)} />
                </td>

                {/* small 2-char fields */}
                {[
                  "govtLand",
                  "pattaLand",
                  "spotInspection",
                  "laHouse",
                  "sdWork",
                  "courtCases",
                  "copyTippons"
                ].map((key) => (
                  <td key={key} className="border p-3 text-center">
                    <input type="text" maxLength={2} className={smallCell} value={r[key]} onChange={(e) => updateRow(i, key, e.target.value.toUpperCase())} />
                  </td>
                ))}

                <td className="border p-3">
                  <textarea className="w-50 border h-[50px] border-gray-400 rounded-md px-2 py-2 text-base  resize-none focus:ring-2 focus:ring-blue-400" value={r.description} onChange={(e) => updateRow(i, "description", e.target.value)} />
                </td>

                <td className="border p-3 text-center">
                  <button onClick={() => deleteRow(i)} className="bg-red-500 text-white px-3 py-1 rounded-lg shadow hover:bg-red-600">X</button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
