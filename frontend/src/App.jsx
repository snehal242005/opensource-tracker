import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import FullScreenLoader from "./components/FullScreenLoader";

function Home() {
  const { firebaseUser, role, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return <Navigate to={role === "student" ? "/dashboard" : "/staff"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["mentor", "admin"]}>
            <MentorDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
