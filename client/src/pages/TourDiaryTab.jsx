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
  officeTitle: "",
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
        if (doc.header)
  setHeader({
    officeTitle: "",
    name: "",
    designation: "",
    mandal: "",
    month: "",
    ...doc.header
  });

        if (doc.rows) setRows(doc.rows);
        setSyncMessage("Loaded from server");
      } else {
        // No document found — start fresh
        setHeader({
  officeTitle: "",
  name: "",
  designation: "",
  mandal: "",
  month: ""
});

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
    setHeader({
  officeTitle: "",
  name: "",
  designation: "",
  mandal: "",
  month: ""
});

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
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a3"
  });

  // ===== GLOBAL STYLE =====
  doc.setFont("times", "bold");          // slight bold everywhere
  doc.setTextColor(0, 0, 0);             // pure black

  /* =========================
     TITLE
  ========================= */
  doc.setFontSize(14);
  doc.text(
    header.officeTitle || "OFFICE OF THE COLLECTOR SURVEY AND LAND RECORDS",
    148,
    14,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.text(`Monthly Tour Diary of Sri: ${header.name}`, 14, 28);
  doc.text(`Designation: ${header.designation}`, 14, 36);
  doc.text(`Mandal: ${header.mandal}`, 200, 28);
  doc.text(`For the Month of: ${header.month}`, 200, 36);

  /* =========================
     HEADER GEOMETRY
  ========================= */
  const startY = 44;
const headerHeight = 50;
  const subHeaderHeight = 15;

  const centerY = startY + headerHeight / 2 + 4;
  const kindCenterY = centerY + 6; // KIND OF JOURNEY slightly down
  const workCenterY =
    startY + subHeaderHeight + (headerHeight - subHeaderHeight) / 2 + 8;

  const w = {
    date: 19,
    from: 32,
    to: 32,
    kind: 14,
    dist: 14,
    file: 20,
    work: 8,    // narrow (2-char style)
    desc: 90
  };

  // ===== LEFT MARGIN (REGISTER STYLE) =====
  let x = 10;

  /* =========================
     DATE
  ========================= */
  doc.rect(x, startY, w.date, headerHeight);
  doc.text("DATE", x + w.date / 2, startY + 12, { align: "center" });
  x += w.date;

  /* =========================
     PLACE TO JOURNEY
  ========================= */
  doc.rect(x, startY, w.from + w.to, subHeaderHeight);
  doc.text("PLACE TO JOURNEY", x + (w.from + w.to) / 2, startY + 12, {
    align: "center"
  });

  doc.rect(x, startY + subHeaderHeight, w.from, headerHeight - subHeaderHeight);
  doc.text("FROM", x + w.from / 2, startY + subHeaderHeight + 12, {
    align: "center"
  });

  doc.rect(x + w.from, startY + subHeaderHeight, w.to, headerHeight - subHeaderHeight);
  doc.text("TO", x + w.from + w.to / 2, startY + subHeaderHeight + 12, {
    align: "center"
  });

  x += w.from + w.to;

  /* =========================
     KIND / DIST / FILE
  ========================= */
  doc.rect(x, startY, w.kind, headerHeight);
  doc.text("KIND OF JOURNEY", x + w.kind / 2, kindCenterY, { angle: 90 });
  x += w.kind;

  doc.rect(x, startY, w.dist, headerHeight);
  doc.text("DISTANCE", x + w.dist / 2, centerY, { angle: 90 });
  x += w.dist;

  doc.rect(x, startY, w.file, headerHeight);
  doc.text("FILE NO", x + w.file / 2, centerY, { angle: 90 });
  x += w.file;

  /* =========================
     NATURE OF WORK
  ========================= */
  const workTitles = [
    "GOVT. LAND DEM",
    "PATTA LAND DEM",
    "SPOT INSPECTION",
    "L.A / HOUSE SITES",
    "SD WORK",
    "COURT CASES",
    "COPY OF TIPPONS"
  ];

  doc.rect(x, startY, w.work * workTitles.length, subHeaderHeight);
  doc.text(
    "NATURE OF WORK",
    x + (w.work * workTitles.length) / 2,
    startY + 12,
    { align: "center" }
  );

  doc.setFontSize(7);
  workTitles.forEach((t, i) => {
    doc.rect(
      x + i * w.work,
      startY + subHeaderHeight,
      w.work,
      headerHeight - subHeaderHeight
    );
    doc.text(
      t,
      x + i * w.work + w.work / 2,
      workCenterY,
      { angle: 90 }
    );
  });
  doc.setFontSize(9);

  x += w.work * workTitles.length;

  /* =========================
     DESCRIPTION
  ========================= */
  doc.rect(x, startY, w.desc, headerHeight);
  doc.text(
    "BRIEF DESCRIPTION OF THE WORK ATTENDED",
    x + w.desc / 2,
    startY + 12,
    { align: "center" }
  );

  /* =========================
     TABLE BODY (ATTACHED)
  ========================= */
  autoTable(doc, {
    startY: startY + headerHeight, // 🔥 no gap
    margin: { left: 10 },          // 🔥 aligned with header
    theme: "grid",
    styles: {
      font: "times",
      fontStyle: "bold",
      fontSize: 9,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: w.date },
      1: { cellWidth: w.from },
      2: { cellWidth: w.to },
      3: { cellWidth: w.kind },
      4: { cellWidth: w.dist },
      5: { cellWidth: w.file },
      6: { cellWidth: w.work },
      7: { cellWidth: w.work },
      8: { cellWidth: w.work },
      9: { cellWidth: w.work },
      10: { cellWidth: w.work },
      11: { cellWidth: w.work },
      12: { cellWidth: w.work },
      13: { cellWidth: w.desc }
    },
    body: rows.map(r => [
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
    ])
  });

  doc.save("Monthly_Tour_Diary_A3.pdf");
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
  placeholder="Title"
  value={header.officeTitle}
  onChange={(e) => setHeader({ ...header, officeTitle: e.target.value })}
/>
<br />

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






// LAST UPDATED: 2026.02.07