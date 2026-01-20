import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  // Not logged in → redirect to login
  if (!loggedInUser) return <Navigate to="/" replace />;

  // Role not allowed → redirect to dashboard (or unauthorized page)
  if (allowedRoles && !allowedRoles.includes(loggedInUser.role)) {
    return <Navigate to="/dashboard/home" replace />;
  }

  // Allowed → render page
  return children;
}
