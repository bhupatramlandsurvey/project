import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import { useNavigate } from "react-router-dom";

function PhoneOtpLogin() {
  const [step, setStep] = useState("login"); // login, otp, dashboard
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState("user");
  const [timer, setTimer] = useState(180);
  const [resendDisabled, setResendDisabled] = useState(true);
  const navigate = useNavigate();
const [loading, setLoading] = useState(false);

  // Check if user already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("loggedInUser");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setMobile(userData.mobile);
      setRole(userData.role);
      setStep("dashboard");
    } else {
      navigate("/");
    }
  }, []);

  // Timer for OTP resend
  useEffect(() => {
    if (step !== "otp") return;
    if (timer <= 0) {
      setResendDisabled(false);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, step]);

  // 🔹 Handle Send OTP (API call)
const handleSendOtp = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!fullName.trim()) return setError("Please enter your full name.");
  if (!/^\d{10}$/.test(mobile))
    return setError("Enter valid 10-digit mobile number.");

  try {
    setLoading(true); // 🔹 start loading

    // 🔹 2 seconds artificial delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const res = await fetch(
      import.meta.env.VITE_BACKEND_URL + "api/auth/send-otp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, mobile }),
      }
    );

    const data = await res.json();

    if (data.success) {
      setStep("otp");
      setTimer(180);
      setResendDisabled(true);
      setSuccess(data.message);
    } else {
      setError(data.message);
    }
  } catch (err) {
    setError("Server error. Please try again.");
  } finally {
    setLoading(false); // 🔹 stop loading
  }
};

  // 🔹 Handle Verify OTP (API call)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch(import.meta.env.VITE_BACKEND_URL + "api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("loggedInUser", JSON.stringify(data.user));
        window.location.href = `${window.location.origin}/dashboard/home`;
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  // 🔹 Handle resend OTP
  const handleResend = () => {
    setOtp("");
    setTimer(180);
    setResendDisabled(true);
    setSuccess(`Dummy OTP "123456" resent to ${mobile}`);
  };

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setStep("login");
    setFullName("");
    setMobile("");
    setOtp("");
    setError("");
    setSuccess("");
  };

  const minutes = `${Math.floor(timer / 60)}`.padStart(2, "0");
  const seconds = `${timer % 60}`.padStart(2, "0");

  if (step === "dashboard") {
    return <Dashboard role={role} logout={handleLogout} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFF2EA] px-4">
      {step === "login" && (
        <form
          onSubmit={handleSendOtp}
          className="bg-white w-full max-w-sm p-8 rounded-2xl shadow-2xl flex flex-col gap-4 border border-gray-200"
        >
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">
            Verify your phone number
          </h2>
          <p className="text-sm text-gray-500 text-center mb-4">
            Enter your details to get a{" "}
            <span className="font-semibold text-orange-500">
              One Time Password
            </span>
          </p>

          <label className="block text-gray-700 mb-1 text-base font-semibold">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
            required
          />

          <label className="block text-gray-700 mb-1 text-base font-semibold">
            Mobile Number
          </label>
          <div className="flex mb-2">
            <span className="bg-gray-100 p-3 rounded-l-md border border-r-0 border-gray-300 text-gray-600 flex items-center">
              +91
            </span>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full p-3 rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
              maxLength={10}
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          {success && <p className="text-green-500 text-xs mb-2">{success}</p>}

        <button
  type="submit"
  disabled={loading}
  className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-orange-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-70"
>
{loading ? (
  <span className="flex items-center justify-center gap-2">
    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
    Sending OTP...
  </span>
) : (
  "Get OTP"
)}

</button>

        </form>
      )}

      {step === "otp" && (
        <form
          onSubmit={handleVerifyOtp}
          className="bg-white w-full max-w-sm p-8 rounded-2xl shadow-2xl flex flex-col gap-4 text-center border border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            OTP Verification
          </h2>
          <p className="text-gray-500 mb-2 text-sm">
            Enter the code sent to{" "}
            <span className="font-semibold text-orange-500">{`+91${mobile}`}</span>
          </p>

          <div className="flex justify-center items-center gap-2 mb-2">
            {[...Array(6).keys()].map((i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] || ""}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/, "");
                  let newOtp = otp.substring(0, i) + val;
                  if (otp.length > i) newOtp += otp.substring(i + 1);
                  setOtp(newOtp.padEnd(6, ""));
                  if (val && e.target.nextSibling) e.target.nextSibling.focus();
                }}
                className="w-12 h-14 text-center text-2xl font-extrabold text-gray-800 bg-gray-100 border border-gray-300 rounded p-2 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            ))}
          </div>

          <div className="flex justify-center gap-4 items-center text-xs text-gray-400 mb-2">
            <span>
              {minutes}:{seconds}
            </span>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-500 text-xs">{success}</p>}

          <button
            type="submit"
            disabled={otp.length < 6}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-orange-500 hover:to-orange-600 transition-all duration-300 mb-1 disabled:opacity-70"
          >
            Submit
          </button>

          <p className="text-gray-400 text-xs mt-2">
            Didn’t receive the OTP?{" "}
            <button
              type="button"
              disabled={resendDisabled}
              onClick={handleResend}
              className={`text-orange-500 font-medium underline ml-1 ${
                resendDisabled ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              Resend
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

export default PhoneOtpLogin;
