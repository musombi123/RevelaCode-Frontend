import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./components/AdminLogin.jsx";
import MainDashboardV2 from "./MainDashboardV2.jsx";
// import other components

function App() {
  return (
    <Router>
      <Routes>
        {/* Main user dashboard */}
        <Route path="/" element={<MainDashboardV2 />} />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Optional: redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
