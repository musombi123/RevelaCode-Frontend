import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SupportLogin from "./components/SupportLogin.jsx";
import MainDashboardV2 from "./MainDashboardV2.jsx";
// import other components

function App() {
  return (
    <Router>
      <Routes>
        {/* Main user dashboard */}
        <Route path="/" element={<MainDashboardV2 />} />

        {/* Support login */}
        <Route path="/support/login" element={<SupportLogin />} />

        {/* Optional admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
