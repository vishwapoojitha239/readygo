import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import all your page components (Ensure these files exist in 'src/pages/')
import Welcome from './pages/Welcome.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CustomerLogin from './pages/CustomerLogin.jsx';
import CustomerRegister from './pages/CustomerRegister.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import OwnerLogin from './pages/OwnerLogin.jsx';
import OwnerRegister from './pages/OwnerRegister.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
// Optional: If you create a NotFound page
// import NotFound from './pages/NotFound.jsx';

function App() {
  // This component sets up the routing for the application.
  // It expects the imported components to handle their own logic and styling.
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/owner-login" element={<OwnerLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/customer-register" element={<CustomerRegister />} />
        <Route path="/owner-register" element={<OwnerRegister />} />

        {/* Protected Routes (You'll add protection logic inside these components or using wrapper components later) */}
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Optional: Add a 404 Not Found route */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
}

export default App;

