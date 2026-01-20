// src/components/PasswordGate.jsx
import React, { useState, useEffect } from "react";

const APP_PASSWORD = "Balakrishna10292025"; // ✅ change this

export default function PasswordGate({ children }) {
  const [enteredPassword, setEnteredPassword] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    const storedAccess = localStorage.getItem("accessGranted");
    if (storedAccess === "true") setAccessGranted(true);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (enteredPassword === APP_PASSWORD) {
      localStorage.setItem("accessGranted", "true");
      setAccessGranted(true);
    } else {
      alert("Incorrect password!");
    }
  };

  if (!accessGranted) {
    return (
      <div style={styles.container}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.heading}>Enter Access Password</h2>
          <input
            type="password"
            placeholder="Enter password"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return children;
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  form: {
    background: "#1e293b",
    padding: "2rem",
    borderRadius: "1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
  },
  heading: {
    color: "#fff",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
    marginBottom: "1rem",
    borderRadius: "5px",
    border: "1px solid #ccc",
    width: "200px",
  },
  button: {
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
