import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = import.meta.env.VITE_BACKEND_URL + "api/abstract";

const blankRow = {
  nature: "",
  villages: "",
  files: "",
  synos: "",
  outturn: "",
  days: ""
};

export default function AbstractTab() {
  // Logged in user from localStorage
  const storedUser = localStorage.getItem("loggedInUser");
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;

  const [header, setHeader] = useState({
    name: "",
    designation: "",
    pay: "",
    month: ""
  });

  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const headerInput =
    "w-full max-w-md border border-gray-400 rounded-lg px-4 py-2 mb-3 focus:ring-blue-500 focus:ring-2";
  const cellInput =
    "w-full border border-gray-400 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-400";

  // ------------------------------------
  // AUTO LOAD FROM SERVER ON PAGE OPEN
  // ------------------------------------
  useEffect(() => {
    loadFromServer();
    // eslint-disable-next-line
  }, []);

  const loadFromServer = async () => {
    if (!loggedInUser || !loggedInUser._id) {
      setSyncMsg("No logged-in user.");
      return;
    }

    setLoading(true);
    setSyncMsg("");

    try {
      const res = await fetch(`${API_BASE}/${loggedInUser._id}`);
      const json = await res.json();

      if (json.success && json.data) {
        setHeader(json.data.header || {});
        setRows(json.data.rows || []);
        setSyncMsg("Loaded from server");
      } else {
        setHeader({ name: "", designation: "", pay: "", month: "" });
        setRows([]);
        setSyncMsg("No data found. Starting fresh.");
      }
    } catch (err) {
      console.error(err);
      setSyncMsg("Load failed");
    }

    setLoading(false);
  };

  // ------------------------------------
  // SAVE TO SERVER
  // ------------------------------------
  const saveToServer = async () => {
    if (!loggedInUser || !loggedInUser._id) {
      alert("No logged-in user found");
      return;
    }

    setLoading(true);
    setSyncMsg("");

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
      if (json.success) {
        setSyncMsg("Saved to server ✔");
      } else {
        setSyncMsg("Save failed");
      }
    } catch (err) {
      console.error(err);
      setSyncMsg("Server error");
    }

    setLoading(false);
  };

  // ------------------------------------
  // CLEAR ALL (Reset header + rows)
  // ------------------------------------
  const clearAll = () => {
    const ok = window.confirm(
      "Are you sure you want to delete ALL rows and reset header? This cannot be undone."
    );
    if (!ok) return;

    setHeader({ name: "", designation: "", pay: "", month: "" });
    setRows([]);
    setSyncMsg("Cleared locally. Save to update server.");
  };

  const addRow = () => setRows([...rows, { ...blankRow }]);
  const deleteRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i, f, v) => {
    const copy = [...rows];
    copy[i][f] = v;
    setRows(copy);
  };

  // ------------------------------------
  // EXCEL EXPORT
  // ------------------------------------
  const exportExcel = () => {
    const data = rows.map((r, i) => ({
      "Sl.No": i + 1,
      "Nature of Work": r.nature,
      "No. of Villages": r.villages,
      "No. of Files": r.files,
      "Total Sy Nos": r.synos,
      "Sche. Out Turn": r.outturn,
      "No. of Days": r.days
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Abstract");
    XLSX.writeFile(wb, "Abstract.xlsx");
  };

  // ------------------------------------
  // PDF EXPORT
  // ------------------------------------
const exportPDF = () => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a3"
  });

  // ===== GLOBAL STYLE =====
  doc.setFont("times", "bold");
  doc.setTextColor(0, 0, 0);

  /* =========================
     HEADER DETAILS (WITH LINES)
  ========================= */
  doc.setFontSize(11);

  doc.text("Name", 20, 30);
  doc.text(":", 55, 30);
  doc.line(60, 30, 180, 30);
  doc.text(header.name || "", 62, 29);

  doc.text("Designation", 20, 42);
  doc.text(":", 55, 42);
  doc.line(60, 42, 180, 42);
  doc.text(header.designation || "", 62, 41);

  doc.text("Pay", 20, 54);
  doc.text(":", 55, 54);
  doc.line(60, 54, 180, 54);
  doc.text(header.pay || "", 62, 53);

  doc.text("For the Month", 20, 66);
  doc.text(":", 55, 66);
  doc.line(60, 66, 180, 66);
  doc.text(header.month || "", 62, 65);

  /* =========================
     ABSTRACT TITLE
  ========================= */
  doc.setFontSize(14);
  doc.text("ABSTRACT", 148, 90, { align: "center" });
  doc.line(120, 92, 176, 92); // underline

  /* =========================
     TABLE HEADER GEOMETRY
  ========================= */
  const startY = 105;
  const headerHeight = 45;
  const centerY = startY + headerHeight / 2 + 3;

 const verticalCenterY = centerY + 10; // move vertical headers slightly down


  const w = {
    sl: 18,
    nature: 110,
    villages: 20,
    files: 20,
    synos: 22,
    outturn: 22,
    days: 18
  };

  let x = 20;

  /* =========================
     DRAW HEADER CELLS
  ========================= */
  doc.rect(x, startY, w.sl, headerHeight);
  doc.text("Sl.No.", x + w.sl / 2, centerY, { angle: 90 });
  x += w.sl;

  doc.rect(x, startY, w.nature, headerHeight);
  doc.text("Nature of Work", x + w.nature / 2, startY + 25, { align: "center" });
  x += w.nature;

  doc.rect(x, startY, w.villages, headerHeight);
  doc.text("No. of Villages", x + w.villages / 2, verticalCenterY, { angle: 90 });
  x += w.villages;

  doc.rect(x, startY, w.files, headerHeight);
  doc.text("No. of Files", x + w.files / 2, verticalCenterY, { angle: 90 });
  x += w.files;

  doc.rect(x, startY, w.synos, headerHeight);
  doc.text("Total Sy.Nos", x + w.synos / 2, verticalCenterY, { angle: 90 });
  x += w.synos;

  doc.rect(x, startY, w.outturn, headerHeight);
  doc.text("Sche. Out turn", x + w.outturn / 2, verticalCenterY, { angle: 90 });
  x += w.outturn;

  doc.rect(x, startY, w.days, headerHeight);
  doc.text("No. of Days", x + w.days / 2, verticalCenterY, { angle: 90 });

  /* =========================
     TABLE BODY (ATTACHED)
  ========================= */
  autoTable(doc, {
    startY: startY + headerHeight,
    margin: { left: 20 },
    theme: "grid",
    styles: {
      font: "times",
      fontStyle: "bold",
      fontSize: 10,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: w.sl },
      1: { cellWidth: w.nature },
      2: { cellWidth: w.villages },
      3: { cellWidth: w.files },
      4: { cellWidth: w.synos },
      5: { cellWidth: w.outturn },
      6: { cellWidth: w.days }
    },
    body: rows.map((r, i) => [
      i + 1,
      r.nature,
      r.villages,
      r.files,
      r.synos,
      r.outturn,
      r.days
    ])
  });

  doc.save("Abstract_A3.pdf");
};


  return (
    <div >

      {/* LOADING */}
      {loading && (
        <div className="text-blue-600 font-semibold mb-3 animate-pulse">
          Loading...
        </div>
      )}

      {/* SYNC MESSAGE */}
      {syncMsg && <div className="text-green-600 font-medium mb-3">{syncMsg}</div>}

      {/* SAVE + CLEAR BUTTONS */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={saveToServer}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow"
        >
          Save to Server
        </button>

        <button
          onClick={clearAll}
          className="bg-yellow-600 text-white px-5 py-2 rounded-lg shadow"
        >
          Clear All Rows
        </button>
      </div>

      {/* HEADER FIELDS */}
      <div className="mb-6">
        <input
          className={headerInput}
          placeholder="Name"
          value={header.name}
          onChange={(e) => setHeader({ ...header, name: e.target.value })}
        />
        <br />

        <input
          className={headerInput}
          placeholder="Designation"
          value={header.designation}
          onChange={(e) =>
            setHeader({ ...header, designation: e.target.value })
          }
        />
        <br />

        <input
          className={headerInput}
          placeholder="Pay"
          value={header.pay}
          onChange={(e) => setHeader({ ...header, pay: e.target.value })}
        />
        <br />

        <input
          className={headerInput}
          placeholder="Month"
          value={header.month}
          onChange={(e) => setHeader({ ...header, month: e.target.value })}
        />
      </div>

      {/* ICON BUTTONS */}
      <div className="flex gap-10 mb-6">
        <div
          className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
          onClick={addRow}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png"
            className="w-12"
          />
          <span className="text-sm font-medium mt-1">Add Row</span>
        </div>

        <div
          className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
          onClick={exportExcel}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/732/732220.png"
            className="w-12"
          />
          <span className="text-sm font-medium mt-1">Excel</span>
        </div>

        <div
          className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
          onClick={exportPDF}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
            className="w-12"
          />
          <span className="text-sm font-medium mt-1">PDF</span>
        </div>
      </div>

      <h2 className="text-center text-xl font-bold underline mb-4 text-blue-700">
        ABSTRACT
      </h2>

      {/* TABLE */}
      <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-300">
        <table className="min-w-[1200px] w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-blue-600 text-white py-3 border">Sl.No</th>
              <th className="bg-blue-600 text-white py-3 border">Nature of Work</th>
              <th className="bg-blue-600 text-white py-3 border">Villages</th>
              <th className="bg-blue-600 text-white py-3 border">Files</th>
              <th className="bg-blue-600 text-white py-3 border">Sy Nos</th>
              <th className="bg-blue-600 text-white py-3 border">Out Turn</th>
              <th className="bg-blue-600 text-white py-3 border">Days</th>
              <th className="bg-blue-600 text-white py-3 border">Del</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="border p-2 text-center">{i + 1}</td>

                <td className="border p-2">
                  <input
                    className={cellInput}
                    value={r.nature}
                    onChange={(e) => updateRow(i, "nature", e.target.value)}
                  />
                </td>

                <td className="border p-2">
                  <input
                    className={cellInput}
                    value={r.villages}
                    onChange={(e) => updateRow(i, "villages", e.target.value)}
                  />
                </td>

                <td className="border p-2">
                  <input
                    className={cellInput}
                    value={r.files}
                    onChange={(e) => updateRow(i, "files", e.target.value)}
                  />
                </td>

                <td className="border p-2">
                  <input
                    className={cellInput}
                    value={r.synos}
                    onChange={(e) => updateRow(i, "synos", e.target.value)}
                  />
                </td>

                <td className="border p-2">
                  <input
                    className={cellInput}
                    value={r.outturn}
                    onChange={(e) => updateRow(i, "outturn", e.target.value)}
                  />
                </td>

                <td className="border p-2">
                  <input
                    className={cellInput}
                    value={r.days}
                    onChange={(e) => updateRow(i, "days", e.target.value)}
                  />
                </td>

                <td className="border p-2 text-center">
                  <button
                    onClick={() => deleteRow(i)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
