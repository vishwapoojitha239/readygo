import React, { useState, useEffect, useRef, useCallback } from 'react'; // Import useCallback
// Import 'useNavigate' to handle redirects for auth and logout
import { useNavigate } from 'react-router-dom';
import {
    ChartPie, UserCheck, Users, Wallet, AlertCircle, MessageSquare,
    Settings, LogOut, Check, X, Search, Loader2, Eye, Trash2, Send, Lock, XCircle,
    Menu // Import Menu icon for toggle
} from 'lucide-react';

// --- API & Auth Helpers ---
// MODIFIED: Use environment variable for production, with a fallback for local dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030';
const getAuthToken = () => localStorage.getItem('token');

const getUserData = () => {
    const userStr = localStorage.getItem('user');
    try {
        // Basic check for JSON structure before parsing
        if (userStr && userStr.startsWith('{') && userStr.endsWith('}')) {
             return JSON.parse(userStr);
        }
        console.warn("User data in localStorage is not valid JSON:", userStr);
        return null;
    } catch (e) {
        console.error("Error parsing user data from localStorage", e);
        // Clear invalid data
        localStorage.removeItem('user');
        return null;
    }
};


// --- Helper: fetch with timeout & safe JSON parse ---
async function fetchWithTimeout(url, opts = {}, timeout = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(id);
        // Check for specific auth errors first BEFORE trying to parse JSON
        if (res.status === 401 || res.status === 403) {
             // Try to get a message, but prioritize throwing the error regardless
             let errorJson = null;
             try {
                 errorJson = await res.json();
             } catch (e) { /* Ignore JSON parse error for error response */ }
             const message = errorJson?.message || `Authorization error (${res.status})`;
             throw new Error(message); // Throw consistently
        }
        return res; // Return the response object for further processing
    } catch (err) {
        clearTimeout(id);
        if (err.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout / 1000} seconds.`);
        }
        // Re-throw other errors (like the explicitly thrown auth error)
        throw err;
    }
}


async function safeJson(res) {
    // Helper to safely parse JSON, returning null if parsing fails
    if (!res) return null;
    let text = ''; // Keep text for debugging
    try {
        text = await res.text(); // Read response body as text first
        if (!text) return null; // Handle empty response body
        return JSON.parse(text); // Try parsing the text as JSON
    } catch (e) {
        console.error("Failed to parse JSON response:", e);
        console.error("Response text was:", text); // Log the text that failed to parse
        return null; // Return null if JSON parsing fails
    }
}


// --- Embedded CSS ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        :root {
            --admin-primary: #1f2937; --admin-secondary: #374151;
            --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-600: #4b5563; --gray-700: #374151; --gray-800: #1f2937;
            --white: #ffffff; --orange-500: #f97316; --green-500: #22c55e; --red-500: #ef4444; --yellow-500: #eab308;
            --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            --sidebar-width: 256px;
            --sidebar-width-collapsed: 80px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .dashboard { 
            display: flex; 
            font-family: 'Inter', sans-serif; 
            background-color: var(--gray-50);
            width: 100%;
            height: 100vh;
        }
       
        /* --- Sidebar Styles --- */
        .dashboard__sidebar {
            width: var(--sidebar-width);
            background-color: var(--admin-primary);
            color: var(--gray-200);
            height: 100vh;
            position: fixed; /* Fixed position */
            top: 0;
            left: 0;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            box-shadow: var(--shadow-md);
            overflow-y: auto;
            overflow-x: hidden;
            transition: width 0.3s ease, transform 0.3s ease;
            z-index: 1000;
        }

        .sidebar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            margin-top: 1rem;
            min-height: 32px;
            transition: padding 0.3s ease;
        }

        .logo { 
            font-size: 1.75rem; 
            font-weight: 800; 
            text-align: left; /* Changed */
            margin-bottom: 0; /* Handled by header */
            margin-top: 0; /* Handled by header */
            letter-spacing: 0.1em; 
            color: var(--white);
            white-space: nowrap;
            opacity: 1;
            transition: opacity 0.2s ease, display 0s linear 0.3s;
            display: block;
        }
       
        .sidebar-toggle-btn {
            background: none;
            border: none;
            color: var(--gray-300);
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            transition: background-color 0.2s, color 0.2s;
        }
        .sidebar-toggle-btn:hover {
            color: var(--white);
            background-color: var(--admin-secondary);
        }

        .dashboard__nav { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; flex-grow: 1; }
        .nav-item {
            display: flex; align-items: center; padding: 0.75rem; border-radius: 0.5rem;
            transition: background-color 0.2s; color: var(--gray-200); text-decoration: none;
            font-weight: 500; background: none; border: none; width: 100%; text-align: left; cursor: pointer; font-size: 1rem;
            white-space: nowrap; /* Prevent text wrap */
        }
        .nav-item svg {
            flex-shrink: 0; /* Prevent icon shrinking */
            margin-right: 0.75rem;
            transition: opacity 0.2s, margin 0.3s ease;
        }
        .nav-item:hover { background-color: var(--admin-secondary); }
        .nav-item.active { background-color: var(--orange-500); color: var(--white); }
        .nav-item .nav-text { 
            margin-left: 0.75rem;
            opacity: 1;
            transition: opacity 0.2s ease, width 0.3s ease;
            white-space: nowrap;
            width: auto;
        }
        .nav-item.logout { margin-top: auto; }

        /* --- Collapsed Sidebar State --- */
        .dashboard__sidebar.collapsed {
            width: var(--sidebar-width-collapsed);
        }
        .dashboard__sidebar.collapsed .sidebar-header {
             justify-content: center;
             padding-left: 0;
             padding-right: 0;
        }
        .dashboard__sidebar.collapsed .logo {
             opacity: 0;
             pointer-events: none;
             transition: opacity 0.2s ease, display 0s linear 0s;
             display: none; /* Remove from layout */
        }
        .dashboard__sidebar.collapsed .sidebar-toggle-btn {
             opacity: 1;
             pointer-events: auto;
        }
        .dashboard__sidebar.collapsed .nav-text {
            opacity: 0;
            width: 0;
            overflow: hidden;
            pointer-events: none;
            margin-left: 0; /* Remove margin when text is hidden */
        }
        .dashboard__sidebar.collapsed .nav-item svg {
             margin-right: 0;
        }
        .dashboard__sidebar.collapsed .nav-item {
            justify-content: center;
            padding: 0.75rem; /* Adjust padding for centered icon */
        }

        /* --- Main Content --- */
        .dashboard__main { 
            flex: 1; 
            padding: 2.5rem; 
            overflow-y: auto; 
            height: 100vh;
            margin-left: var(--sidebar-width); /* Push content over */
            transition: margin-left 0.3s ease;
            position: relative; /* For mobile header positioning */
        }
        .dashboard__main.sidebar-collapsed {
            margin-left: var(--sidebar-width-collapsed);
        }
       
        .mobile-header {
            display: none; /* Hidden on desktop */
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.5rem;
            background-color: var(--white);
            box-shadow: var(--shadow-md);
            position: sticky;
            top: 0;
            z-index: 900;
            margin: -2.5rem -2.5rem 1.5rem -2.5rem;
        }
        .mobile-header .logo-mobile {
            font-size: 1.5rem; font-weight: 800; color: var(--orange-500);
            letter-spacing: 0.1em;
        }
        .mobile-menu-btn {
            background: none; border: none; cursor: pointer; padding: 0.5rem;
            display: none; /* Hidden by default, shown in media query */
        }
       
        .sidebar-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 999;
        }

        /* --- Mobile View --- */
        @media (max-width: 768px) {
            .dashboard__sidebar {
                transform: translateX(-100%);
                width: var(--sidebar-width); /* Full width when open */
            }
            .dashboard__sidebar.open {
                transform: translateX(0);
            }
            .dashboard__sidebar.collapsed {
                width: var(--sidebar-width);
                transform: translateX(-100%);
            }
             .dashboard__sidebar.collapsed.open {
                transform: translateX(0);
             }
            .dashboard__sidebar.collapsed .nav-text,
            .dashboard__sidebar.collapsed .logo {
                opacity: 1;
                width: auto;
                pointer-events: auto;
                display: block;
            }
            .dashboard__sidebar.collapsed .nav-item {
                justify-content: flex-start;
                padding: 0.75rem;
            }
            .dashboard__sidebar.collapsed .nav-item svg {
                 margin-right: 0.75rem;
            }
            .dashboard__sidebar.collapsed .nav-text {
                 margin-left: 0.75rem;
            }
            .dashboard__sidebar.collapsed .sidebar-header {
                justify-content: space-between;
                padding: 0;
            }

            .dashboard__main {
                margin-left: 0;
                padding: 1.5rem;
            }
            .dashboard__main.sidebar-collapsed {
                 margin-left: 0;
            }
           
            .mobile-header {
                display: flex;
                 margin: -1.5rem -1.5rem 1.5rem -1.5rem;
            }
            .sidebar-overlay.open {
                display: block;
            }
            /* Hide desktop-only toggle */
            .sidebar-header .sidebar-toggle-btn {
                display: none;
            }
            /* Show mobile toggle */
             .mobile-menu-btn {
                display: block;
             }
        }
         /* Ensure toggle btn IS visible on desktop */
         @media (min-width: 769px) {
             .sidebar-header .sidebar-toggle-btn {
                display: block;
             }
         }
       
        /* --- Other Styles --- */
        .main-title { font-size: 1.875rem; font-weight: 700; margin-bottom: 1.5rem; }
        .sub-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; }
        .card { background-color: var(--white); padding: 1.5rem; border-radius: 0.5rem; box-shadow: var(--shadow); margin-bottom: 1.5rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
        .card-title { font-weight: 600; color: #4b5563; }
        .stat-number { font-size: 2.25rem; font-weight: 700; margin-top: 0.5rem; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--gray-200); white-space: nowrap; }
        .data-table th { background-color: var(--gray-100); font-size: 0.75rem; text-transform: uppercase; }
        .overflow-auto { overflow-x: auto; }
        .button-group-sm { display:flex; gap: 0.5rem; flex-wrap: wrap; }

        .btn { padding: 0.75rem 1rem; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background-color 0.2s, transform 0.2s; }
        .btn:hover { transform: translateY(-2px); }
        .btn:disabled { background-color: var(--gray-200); cursor: not-allowed; opacity: 0.7;}
        .btn-sm { padding: 0.5rem 0.75rem; font-size: 0.875rem; }
        .btn-primary { background-color: var(--orange-500); color: var(--white); }
        .btn-secondary { background-color: var(--gray-600); color: var(--white); }
        .btn-success { background-color: var(--green-500); color: var(--white); }
        .btn-danger { background-color: var(--red-500); color: var(--white); }
        .btn-link { background: none; color: var(--orange-500); font-weight: 600; cursor: pointer; padding: 0; border: none; }

        .status-chip { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
        .status-chip-green { background-color: #dcfce7; color: #166534; }
        .status-chip-red { background-color: #fee2e2; color: #991b1b; }
        .status-chip-yellow { background-color: #fef9c3; color: #854d0e; }
        .status-chip-gray { background-color: #f3f4f6; color: #4b5563; }

        .chart-container { display: flex; height: 250px; align-items: flex-end; gap: 1rem; border-left: 1px solid var(--gray-200); border-bottom: 1px solid var(--gray-200); padding-left: 1rem; }
        .chart-bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; }
        .chart-bar { width: 80%; background-color: var(--orange-500); border-radius: 4px 4px 0 0; position: relative; transition: height 0.5s ease-out; }
        .bar-label { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; font-weight: 600; }
        .month-label { margin-top: 0.5rem; font-size: 0.875rem; }

        .search-container-sm { position: relative; }
        .search-input-sm { width: 100%; padding: 0.75rem 2.5rem 0.75rem 1rem; border: 1px solid var(--gray-200); border-radius: 0.375rem; font-size: 1rem; }
        .search-icon-sm { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--gray-600); }

        .loading-container { display: flex; justify-content: center; align-items: center; padding: 2rem; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* --- Modal Styles --- */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: var(--white); padding: 2rem; border-radius: 0.5rem; box-shadow: var(--shadow-lg); width: 90%; max-width: 500px; animation: fadeIn 0.3s; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-title { font-size: 1.5rem; font-weight: 700; color: var(--gray-800); }
        .modal-close-btn { background: none; border: none; cursor: pointer; color: var(--gray-600); }
        .modal-body { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { margin-bottom: 1rem; text-align: left; }
        .form-label { display: block; font-weight: 500; color: var(--gray-700); margin-bottom: 0.5rem; }
        .form-input { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box; }
        .form-textarea { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box; min-height: 100px; }

         /* Error Message Style */
        .error-message {
            background-color: #fee2e2; /* Light red */
            color: #b91c1c; /* Darker red */
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #fecaca; /* Red border */
            margin-bottom: 1.5rem;
            text-align: center;
        }
         /* Success Message Style */
        .success-message {
            background-color: #dcfce7; /* Light green */
            color: #166534; /* Darker green */
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #bbf7d0; /* Green border */
            margin-bottom: 1.5rem;
            text-align: center;
        }

    `}</style>
);


// --- Sub-Components ---

// --- Sidebar Component ---
const Sidebar = React.forwardRef(({ activeTab, onTabClick, onLogout, isCollapsed, onToggle, className }, ref) => {

    const NavItem = ({ tabName, icon, children }) => (
        <li>
            <button
                onClick={() => onTabClick(tabName)}
                className={`nav-item ${activeTab === tabName ? 'active' : ''}`}
                title={isCollapsed ? children : ""} // Show tooltip when collapsed
            >
                {icon}
                <span className="nav-text">{children}</span>
            </button>
        </li>
    );

    return (
        // Apply the 'ref' and the 'className' prop
        <aside ref={ref} className={`dashboard__sidebar ${isCollapsed ? 'collapsed' : ''} ${className || ''}`}>
            <div className="sidebar-header">
                <h1 className="logo">ADMIN</h1>
                <button onClick={onToggle} className="sidebar-toggle-btn" title={isCollapsed ? "Expand Menu" : "Collapse Menu"}>
                    <Menu size={24} />
                </button>
            </div>
            <ul className="dashboard__nav">
                <NavItem tabName="overview" icon={<ChartPie size={20}/>}>Overview</NavItem>
                <NavItem tabName="verification" icon={<UserCheck size={20}/>}>Document Verification</NavItem>
                <NavItem tabName="users" icon={<Users size={20}/>}>User Management</NavItem>
                <NavItem tabName="revenue" icon={<Wallet size={20}/>}>Platform Revenue</NavItem>
                <NavItem tabName="complaints" icon={<AlertCircle size={20}/>}>Complaints</NavItem>
                <NavItem tabName="feedback" icon={<MessageSquare size={20}/>}>App Feedback</NavItem>
                <NavItem tabName="settings" icon={<Settings size={20}/>}>Platform Settings</NavItem>
                <li>
                    <button onClick={onLogout} className="nav-item logout" title={isCollapsed ? "Logout" : ""}>
                        <LogOut size={20}/>
                        <span className="nav-text">Logout</span>
                    </button>
                </li>
            </ul>
        </aside>
    );
});


const Overview = () => {
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalOwners: 0,
        vehiclesOnline: 0,
        pendingVerifications: 0,
        monthlyRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); // For redirect on auth error

    const revenueData = [ // Mock data
        { month: 'Jan', revenue: 350 }, { month: 'Feb', revenue: 410 }, { month: 'Mar', revenue: 390 },
        { month: 'Apr', revenue: 450 }, { month: 'May', revenue: 480 }, { month: 'Jun', revenue: 510 },
    ];
    const maxRevenue = Math.max(1, ...revenueData.map(d => d.revenue)); // Ensure maxRevenue >= 1

    // Wrap handleLogout in useCallback
    const handleLogout = useCallback(() => {
        console.log("Auth error in Overview, logging out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin-login');
    }, [navigate]);

    useEffect(() => {
        const fetchOverviewData = async () => {
            setLoading(true);
            setError('');
            let authToken = getAuthToken(); // Get token once

            if (!authToken) {
                setError("Authentication token not found. Redirecting to login.");
                const timerId = setTimeout(handleLogout, 1500);
                setLoading(false);
                return () => clearTimeout(timerId);
            }

            try {
                const headers = { 'Authorization': `Bearer ${authToken}` };

                // Fetch all data concurrently
                const results = await Promise.allSettled([
                    fetchWithTimeout(`${API_BASE_URL}/admin/users`, { headers }, 8000),
                    fetchWithTimeout(`${API_BASE_URL}/admin/vehicles`, { headers }, 8000),
                    fetchWithTimeout(`${API_BASE_URL}/admin/bookings`, { headers }, 8000)
                ]);

                // Process results
                const [usersRes, vehiclesRes, bookingsRes] = results;

                // Handle potential rejections (timeouts, network errors, auth errors)
                const errors = results
                    .filter(r => r.status === 'rejected')
                    .map(r => r.reason?.message || 'Unknown fetch error');

                // Check specifically for auth errors that might require logout
                const authError = errors.find(e => e.includes('Authorization error') || e.includes('Invalid or expired token') || e.includes('Failed to authenticate token'));
                if (authError) {
                    console.error("Authorization error detected during data fetch:", authError);
                    setError(`Authorization error: ${authError}. Redirecting to login.`);
                    const timerId = setTimeout(handleLogout, 1500);
                    setLoading(false);
                    return () => clearTimeout(timerId); // Stop further processing
                } else if (errors.length > 0) {
                     // Report other non-critical errors
                     setError(`Failed to fetch some data: ${errors.join('; ')}. Displaying partial stats.`);
                }

                // Safely parse data even if some requests failed
                 const users = usersRes.status === 'fulfilled' && usersRes.value.ok ? await safeJson(usersRes.value) : null;
                 const vehicles = vehiclesRes.status === 'fulfilled' && vehiclesRes.value.ok ? await safeJson(vehiclesRes.value) : null;
                 const bookings = bookingsRes.status === 'fulfilled' && bookingsRes.value.ok ? await safeJson(bookingsRes.value) : null;

                // Check if parsing failed but response was ok (unexpected format)
                 if (usersRes.status === 'fulfilled' && usersRes.value.ok && users === null) {
                     setError(prev => prev ? `${prev}; Failed to parse user data.` : 'Failed to parse user data.');
                 }
                 if (vehiclesRes.status === 'fulfilled' && vehiclesRes.value.ok && vehicles === null) {
                     setError(prev => prev ? `${prev}; Failed to parse vehicle data.` : 'Failed to parse vehicle data.');
                 }
                 if (bookingsRes.status === 'fulfilled' && bookingsRes.value.ok && bookings === null) {
                      setError(prev => prev ? `${prev}; Failed to parse booking data.` : 'Failed to parse booking data.');
                 }


                // --- Calculate Stats (with safe checks) ---
                const safeUsers = Array.isArray(users) ? users : [];
                const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
                const safeBookings = Array.isArray(bookings) ? bookings : [];

                const customers = safeUsers.filter(u => u?.role === 'Customer');
                const owners = safeUsers.filter(u => u?.role === 'Owner');

                const totalCustomers = customers.length;
                const totalOwners = owners.length;
                const vehiclesOnline = safeVehicles.filter(v => v?.isAvailable).length;

                const pendingVerifications = safeUsers.filter(
                    u => u && (u.licenseStatus === 'Pending Review' || u.addressStatus === 'Pending Review')
                ).length;

                const totalRevenue = safeBookings.reduce((acc, b) => {
                    return acc + ((b && b.status === 'Completed') ? (b.totalPrice || 0) : 0);
                }, 0);

                setStats({
                    totalCustomers,
                    totalOwners,
                    vehiclesOnline,
                    pendingVerifications,
                    monthlyRevenue: totalRevenue
                });

            } catch (err) { // Catch errors thrown by fetchWithTimeout or initial token check
                console.error("Critical error during overview fetch:", err);
                // Handle auth error during initial token check or fetch
                if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                     setError(`${err.message} Redirecting to login.`);
                     const timerId = setTimeout(handleLogout, 1500);
                     setLoading(false);
                     return () => clearTimeout(timerId);
                } else {
                     setError(`Error fetching overview: ${err.message}.`);
                }
            } finally {
                // Only set loading false if we haven't initiated a redirect
                if (!error.includes("Redirecting")) {
                    setLoading(false);
                }
            }
        };

        fetchOverviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, handleLogout]); // Add navigate and handleLogout to dependency array

    return (
    <div className="fade-in">
        <h2 className="main-title">Overview</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="stats-grid">
            {/* Stats Cards remain the same */}
            <div className="card">
                <h3 className="card-title">Total Customers</h3>
                {loading ? <Loader2 className="spinner" /> : <p className="stat-number">{stats.totalCustomers.toLocaleString('en-IN')}</p>}
            </div>
            <div className="card">
                <h3 className="card-title">Total Owners</h3>
                {loading ? <Loader2 className="spinner" /> : <p className="stat-number">{stats.totalOwners.toLocaleString('en-IN')}</p>}
            </div>
            <div className="card">
                <h3 className="card-title">Vehicles Online</h3>
                {loading ? <Loader2 className="spinner" /> : <p className="stat-number">{stats.vehiclesOnline}</p>}
            </div>
            <div className="card">
                <h3 className="card-title">Pending Verifications</h3>
                {loading ? <Loader2 className="spinner" /> : <p className="stat-number" style={{color: 'var(--orange-500)'}}>{stats.pendingVerifications}</p>}
            </div>
            <div className="card" style={{gridColumn: '1 / -1'}}>
                <h3 className="card-title">Total Revenue (Completed)</h3>
                {loading ? <Loader2 className="spinner" /> : <p className="stat-number" style={{color: 'var(--green-500)'}}>₹{stats.monthlyRevenue.toLocaleString('en-IN')}</p>}
            </div>
        </div>
        <div className="card">
            <h3 className="sub-title">6-Month Revenue Trend (in thousands) - (Mock Data)</h3>
            <div className="chart-container">
                {revenueData.map(data => (
                    <div key={data.month} className="chart-bar-wrapper">
                        <div className="chart-bar" style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}>
                            <span className="bar-label">₹{data.revenue}k</span>
                        </div>
                        <span className="month-label">{data.month}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
    );
};


const DocumentVerification = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); // For redirect on auth error

    // Wrap handleLogout in useCallback
    const handleLogout = useCallback(() => {
        console.log("Auth error in DocumentVerification, logging out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin-login');
    }, [navigate]);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = getAuthToken();
            if (!token) throw new Error("Authentication token not found.");

            const res = await fetchWithTimeout(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }, 8000); // Use timeout

            if (!res.ok) {
                 const errData = await safeJson(res) || {message: `HTTP error ${res.status}`};
                 throw new Error(errData.message || 'Failed to fetch users');
            }

            const data = await safeJson(res);
            if (!Array.isArray(data)) {
                 throw new Error('Received invalid user data from server.');
            }
            const pending = data.filter(u => u && (u.role === 'Customer' || u.role === 'Owner') && (u.licenseStatus === 'Pending Review' || u.addressStatus === 'Pending Review'));
            setRequests(pending);
        } catch (err) {
            console.error("Error fetching verification requests:", err);
            // Handle auth error during initial token check or fetch
            if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                 setError(`${err.message} Redirecting to login.`);
                 const timerId = setTimeout(handleLogout, 1500);
                 setLoading(false); // Stop loading as we redirect
                 return () => clearTimeout(timerId);
            } else {
                 setError(err.message || 'Failed to fetch verification requests.');
            }
        } finally {
            // Only set loading false if we haven't initiated a redirect
            if (!error.includes("Redirecting")) {
                 setLoading(false);
             }
        }
    }, [handleLogout]); // Add handleLogout as dependency

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]); // Run fetchRequests on mount

    const handleAction = async (userId, action) => {
        // Prevent action if already processing or error occurred requiring redirect
        if (loading || error.includes("Redirecting")) return;

        const payload = action === 'approve'
            ? { licenseStatus: 'Verified', addressStatus: 'Verified' }
            : { licenseStatus: 'Rejected', addressStatus: 'Rejected' };

        try {
            const token = getAuthToken();
            if (!token) throw new Error("Authentication token not found.");

            const res = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${userId}/verify`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            }, 5000); // Shorter timeout for action

             if (!res.ok) {
                 const errData = await safeJson(res) || {message: `HTTP error ${res.status}`};
                 throw new Error(errData.message || `Failed to ${action} user`);
            }

            fetchRequests(); // Refresh list on success
        } catch (err) {
            console.error(`Error ${action}ing user:`, err);
             // Handle auth error
             if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                 setError(`${err.message} Redirecting to login.`);
                 const timerId = setTimeout(handleLogout, 1500);
                 return () => clearTimeout(timerId);
            } else {
                 setError(`Failed to ${action} user: ${err.message}`);
            }
        }
    };


    const ViewDocLink = ({ file, num }) => {
        if (!file) return <span style={{color: 'var(--gray-600)'}}>Not Uploaded</span>;
        
        // --- MODIFIED: Handle Cloudinary URLs vs Local Paths ---
        // Check if the file path is already a full URL (from Cloudinary)
        const fileUrl = file.startsWith('http') 
            ? file 
            : `${API_BASE_URL}/${file.replace(/\\/g, '/')}`; // Fallback for old local files

        return (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-link" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                <Eye size={14} /> {num || 'View File'}
            </a>
        );
    };

    // If loading, show spinner. If error includes redirect message, show that instead of table.
    if (loading) return <div className="loading-container"><Loader2 className="spinner" /></div>;
    if (error.includes("Redirecting")) return <div className="error-message">{error}</div>;

    return (
    <div className="fade-in">
        <h2 className="main-title">Document Verification</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="card overflow-auto">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>User Name</th>
                        <th>Role</th>
                        <th>License (Number & File)</th>
                        <th>Aadhaar (Number & File)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 && !loading && ( // Show only if not loading
                        <tr><td colSpan="5" style={{textAlign: 'center'}}>No pending verifications.</td></tr>
                    )}
                    {requests.map(req => (
                        <tr key={req._id}>
                            <td>{req.fullName}</td>
                            <td>{req.role}</td>
                            <td><ViewDocLink file={req.licenseFile} num={req.licenseNumber} /></td>
                            <td><ViewDocLink file={req.addressFile} num={req.aadhaarNumber} /></td>
                            <td>
                                <div className="button-group-sm">
                                    <button onClick={() => handleAction(req._id, 'approve')} className="btn btn-success btn-sm"><Check size={16}/> Approve</button>
                                    <button onClick={() => handleAction(req._id, 'reject')} className="btn btn-danger btn-sm"><X size={16}/> Reject</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
    );
};

// --- MODIFIED: User Management Component ---
const UserManagement = () => {
    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const navigate = useNavigate(); // For redirect on auth error

    // Wrap handleLogout in useCallback
    const handleLogout = useCallback(() => {
        console.log("Auth error in UserManagement, logging out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin-login');
    }, [navigate]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = getAuthToken();
             if (!token) throw new Error("Authentication token not found.");

            const res = await fetchWithTimeout(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }, 8000); // Use timeout

            if (!res.ok) {
                 const errData = await safeJson(res) || {message: `HTTP error ${res.status}`};
                 throw new Error(errData.message || 'Failed to fetch users');
            }
            const data = await safeJson(res);
            setUserList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching users:", err);
             // Handle auth error
             if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                 setError(`${err.message} Redirecting to login.`);
                 const timerId = setTimeout(handleLogout, 1500);
                 setLoading(false); // Stop loading
                 return () => clearTimeout(timerId);
            } else {
                 setError(err.message || 'Failed to fetch users.');
            }
        } finally {
             // Only set loading false if we haven't initiated a redirect
             if (!error.includes("Redirecting")) {
                 setLoading(false);
             }
        }
    }, [handleLogout]); // Add handleLogout as dependency

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]); // Run fetchUsers on mount

    const getVerificationStatus = (user) => {
        if (!user) return null; // Safety check
        if (user.licenseStatus === 'Verified' && user.addressStatus === 'Verified') {
            return <span className="status-chip status-chip-green">Verified</span>;
        }
        if (user.licenseStatus === 'Rejected' || user.addressStatus === 'Rejected') {
            return <span className="status-chip status-chip-red">Rejected</span>;
        }
        if (user.licenseStatus === 'Pending Review' || user.addressStatus === 'Pending Review') {
            return <span className="status-chip status-chip-yellow">Pending</span>;
        }
        return <span className="status-chip status-chip-gray">Not Uploaded</span>;
    };

    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh user list after modal closes (e.g., after lock/delete)
    };

    // Filter Logic
    const filteredUsers = userList.filter(user => {
        // Exclude Admins explicitly
        if (!user || user.role === 'Admin') {
            return false;
        }
        // Apply search term
        const term = searchTerm.toLowerCase();
        return (
            (user.fullName && user.fullName.toLowerCase().includes(term)) ||
            (user.email && user.email.toLowerCase().includes(term))
        );
    });

    // If loading, show spinner. If error includes redirect message, show that instead of table.
    if (loading) return <div className="loading-container"><Loader2 className="spinner" /></div>;
    if (error.includes("Redirecting")) return <div className="error-message">{error}</div>;


    return (
    <div className="fade-in">
        <h2 className="main-title">User Management</h2>
         <div className="card">
             <div className="search-container-sm">
                 <input
                     type="text"
                     placeholder="Search by name or email..."
                     className="search-input-sm"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <Search size={20} className="search-icon-sm" />
             </div>
         </div>
        <div className="card overflow-auto">
             {/* Show error only if not related to redirect */}
             {error && !error.includes("Redirecting") && <div className="error-message">{error}</div>}
            <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    {filteredUsers.length === 0 && !loading && ( // Show only if not loading
                        <tr><td colSpan="5" style={{textAlign: 'center'}}>No customers or owners found matching search.</td></tr>
                    )}
                    {filteredUsers.map(user => (
                        <tr key={user._id}>
                            <td>{user.fullName}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{getVerificationStatus(user)}</td>
                            <td>
                                <button onClick={() => handleOpenModal(user)} className="btn-link">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {isModalOpen && selectedUser && <UserDetailsModal user={selectedUser} onClose={handleCloseModal} />}
    </div>
    );
};


// --- User Details Modal Component ---
const UserDetailsModal = ({ user, onClose }) => {
    const [notice, setNotice] = useState('');
    const [lockHours, setLockHours] = useState('24');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // For redirect on auth error

     // Wrap handleLogout in useCallback
    const handleLogout = useCallback(() => {
        console.log("Auth error in Modal, logging out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin-login');
    }, [navigate]);

    const handleDelete = async () => {
        // Use a custom modal or div instead of window.confirm if possible
        if (!window.confirm(`Are you sure you want to delete ${user?.fullName || 'this user'}? This action cannot be undone.`)) {
             return;
        }
        setIsLoading(true);
        setMessage('');
        try {
            const token = getAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${user._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }, 5000);

            if (!response.ok) {
                 const data = await safeJson(response) || {message: `HTTP error ${response.status}`};
                 throw new Error(data.message || 'Failed to delete user');
            }
             // Use a more subtle notification if possible
            alert("User deleted successfully.");
            onClose(); // Close modal on success
        } catch (err) {
            console.error("Error deleting user:", err);
            // Handle auth error
             if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                 setMessage(`${err.message} Redirecting...`);
                 setTimeout(handleLogout, 1500);
            } else {
                 setMessage(`Error: ${err.message}`);
            }
        } finally {
            // Only stop loading if not redirecting
            if (!message.includes("Redirecting")) {
                 setIsLoading(false);
             }
        }
    };

    const handleSendNotice = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const token = getAuthToken();
             if (!token) throw new Error("Authentication token not found.");
            const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${user._id}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: notice })
            }, 5000);

            if (!response.ok) {
                 const data = await safeJson(response) || {message: `HTTP error ${response.status}`};
                 throw new Error(data.message || 'Failed to send notice');
            }
            setMessage("Notice sent successfully!");
            setNotice('');
        } catch (err) {
             console.error("Error sending notice:", err);
             // Handle auth error
             if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                 setMessage(`${err.message} Redirecting...`);
                 setTimeout(handleLogout, 1500);
            } else {
                 setMessage(`Error: ${err.message}`);
            }
        } finally {
            // Only stop loading if not redirecting
             if (!message.includes("Redirecting")) {
                 setIsLoading(false);
             }
        }
    };

    const handleLockProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const token = getAuthToken();
             if (!token) throw new Error("Authentication token not found.");
            const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${user._id}/lock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ lockDurationInHours: parseFloat(lockHours) || 0 }) // Ensure it's a number
            }, 5000);

            if (!response.ok) {
                 const data = await safeJson(response) || {message: `HTTP error ${response.status}`};
                 throw new Error(data.message || 'Failed to lock profile');
            }
            const data = await safeJson(response);
            setMessage(data?.message || "Profile lock status updated."); // Show success message
            // No need to manually update user state here, parent fetch on close will get latest
        } catch (err) {
             console.error("Error locking profile:", err);
             // Handle auth error
             if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                 setMessage(`${err.message} Redirecting...`);
                 setTimeout(handleLogout, 1500);
            } else {
                 setMessage(`Error: ${err.message}`);
            }
        } finally {
            // Only stop loading if not redirecting
             if (!message.includes("Redirecting")) {
                 setIsLoading(false);
             }
        }
    };


    // Added check for user object before rendering details
    if (!user) {
        return (
             <div className="modal-overlay">
                 <div className="modal-content">
                      <p>Loading user details...</p>
                      <button onClick={onClose}>Close</button>
                 </div>
             </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{user.fullName}</h3>
                    <button onClick={onClose} className="modal-close-btn"><XCircle size={24} /></button>
                </div>
                <div className="modal-body">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    <p><strong>User ID:</strong> {user._id}</p>
                    {/* Display lock status more clearly */}
                    <p><strong>Status:</strong> {user.isLocked
                        ? `Locked until ${user.lockExpiresAt ? new Date(user.lockExpiresAt).toLocaleString() : 'Indefinitely'}`
                        : 'Active'}
                    </p>

                    <hr style={{margin: '1rem 0'}}/>
                    {message && <p style={{color: message.startsWith('Error') || message.includes('failed') ? 'var(--red-500)' : 'var(--green-500)', marginBottom: '1rem', textAlign:'center'}}>{message}</p>}

                    {/* --- Send Notice Form --- */}
                    <form onSubmit={handleSendNotice}>
                        <div className="form-group">
                            <label className="form-label" htmlFor={`notice-${user._id}`}>Send Notice</label>
                            <textarea
                                id={`notice-${user._id}`}
                                className="form-textarea"
                                value={notice}
                                onChange={(e) => setNotice(e.target.value)}
                                placeholder="Type your warning or notice here..."
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={isLoading || !notice}>
                            {isLoading ? <Loader2 className="spinner" /> : <><Send size={16} /> Send Notice</>}
                        </button>
                    </form>

                    {/* --- Lock Profile Form --- */}
                    <form onSubmit={handleLockProfile} style={{marginTop: '1rem'}}>
                        <div className="form-group">
                            <label className="form-label" htmlFor={`lockHours-${user._id}`}>{user.isLocked ? 'Update Lock Duration (hours)' : 'Lock Profile Duration (hours)'}</label>
                            <input
                                id={`lockHours-${user._id}`}
                                type="number"
                                className="form-input"
                                value={lockHours}
                                onChange={(e) => setLockHours(e.target.value)}
                                min="0" // Allow 0 to potentially unlock? Check backend logic
                                step="1"
                            />
                            <small>Set to 0 or leave blank to unlock the profile immediately.</small>
                        </div>
                        <button type="submit" className="btn btn-secondary" style={{width: '100%'}} disabled={isLoading}>
                             {isLoading ? <Loader2 className="spinner" /> : (user.isLocked ? <><Lock size={16} /> Update Lock</> : <><Lock size={16} /> Lock Profile</>)}
                        </button>
                    </form>

                    <hr style={{margin: '1rem 0'}}/>

                    {/* --- Delete Button --- */}
                    <button onClick={handleDelete} className="btn btn-danger" style={{width: '100%'}} disabled={isLoading}>
                        {isLoading ? <Loader2 className="spinner" /> : <><Trash2 size={16} /> Delete User</>}
                    </button>
                </div>

            </div>
        </div>
    );
};


// --- Platform Revenue Component ---
const PlatformRevenue = () => (
    <div className="fade-in">
        <h2 className="main-title">Platform Revenue</h2>
        <div className="card">
            <p>A detailed revenue dashboard is in development.</p>
            {/* Placeholder for future implementation */}
        </div>
    </div>
);

// --- Complaints Component ---
const Complaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); // For redirect on auth error

     // Wrap handleLogout in useCallback
    const handleLogout = useCallback(() => {
        console.log("Auth error in Complaints, logging out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin-login');
    }, [navigate]);

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = getAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            const response = await fetchWithTimeout(`${API_BASE_URL}/admin/complaints`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }, 8000);

             if (!response.ok) {
                 const errData = await safeJson(response) || {message: `HTTP error ${response.status}`};
                 throw new Error(errData.message || 'Failed to fetch complaints');
            }
            const data = await safeJson(response);
            setComplaints(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching complaints:", err);
            // Handle auth error
             if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                 setError(`${err.message} Redirecting to login.`);
                 const timerId = setTimeout(handleLogout, 1500);
                 setLoading(false); // Stop loading
                 return () => clearTimeout(timerId);
            } else {
                 setError(err.message || 'Failed to fetch complaints.');
            }
        } finally {
             // Only set loading false if we haven't initiated a redirect
             if (!error.includes("Redirecting")) {
                 setLoading(false);
             }
        }
    }, [handleLogout]); // Add handleLogout

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]); // Run fetchComplaints on mount

    const handleResolve = async (id) => {
         // Prevent action if already processing or error occurred requiring redirect
         if (loading || error.includes("Redirecting")) return;
        try {
            const token = getAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            const response = await fetchWithTimeout(`${API_BASE_URL}/admin/complaints/${id}/resolve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            }, 5000);

            if (!response.ok) {
                 const errData = await safeJson(response) || {message: `HTTP error ${response.status}`};
                 throw new Error(errData.message || 'Failed to resolve complaint');
            }
            fetchComplaints(); // Refresh list
        } catch (err) {
             console.error("Error resolving complaint:", err);
            // Handle auth error
             if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                 setError(`${err.message} Redirecting to login.`);
                 setTimeout(handleLogout, 1500);
            } else {
                 setError("Failed to resolve complaint: " + err.message);
            }
        }
    };

     // Placeholder for replying functionality
     const handleReply = (complaintId) => {
         alert(`Replying to complaint ID: ${complaintId} (Not fully implemented - Add Modal or Form)`);
         // TODO: Open a modal or dedicated reply section to send a message via POST /admin/complaints/:id/reply
     };

     // If loading, show spinner. If error includes redirect message, show that instead of table.
    if (loading) return <div className="loading-container"><Loader2 className="spinner" /></div>;
    if (error.includes("Redirecting")) return <div className="error-message">{error}</div>;


    return (
    <div className="fade-in">
        <h2 className="main-title">Complaints</h2>
         {/* Show non-redirect errors above the card */}
         {error && !error.includes("Redirecting") && <div className="error-message">{error}</div>}
        <div className="card overflow-auto">
            <table className="data-table">
                <thead><tr><th>User</th><th>Subject</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    {complaints.length === 0 && (
                        <tr><td colSpan="5" style={{textAlign: 'center'}}>No open complaints.</td></tr>
                    )}
                    {complaints.map(c => (
                        <tr key={c._id}>
                            <td>{c.userId?.fullName || 'N/A'}</td>
                            <td>{c.subject}</td>
                            <td style={{whiteSpace: 'normal', minWidth: '300px'}}>{c.description}</td>
                            <td><span className={`status-chip ${c.status === 'Open' ? 'status-chip-yellow' : 'status-chip-gray'}`}>{c.status}</span></td>
                            <td>
                                <div className="button-group-sm">
                                     <button onClick={() => handleReply(c._id)} className="btn btn-primary btn-sm" title="Reply to Complaint">
                                         <MessageSquare size={16} /> Reply
                                     </button>
                                    <button onClick={() => handleResolve(c._id)} className="btn btn-success btn-sm" title="Mark as Resolved">
                                         <Check size={16} /> Resolve
                                     </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
    );
};


// --- App Feedback Component ---
const AppFeedback = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); // For redirect on auth error

     // Wrap handleLogout in useCallback
    const handleLogout = useCallback(() => {
        console.log("Auth error in AppFeedback, logging out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin-login');
    }, [navigate]);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError('');
            try {
                const token = getAuthToken();
                if (!token) throw new Error("Authentication token not found.");
                const response = await fetchWithTimeout(`${API_BASE_URL}/admin/reviews/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }, 8000);

                 if (!response.ok) {
                     const errData = await safeJson(response) || {message: `HTTP error ${response.status}`};
                     throw new Error(errData.message || 'Failed to fetch review stats');
                 }
                 const data = await safeJson(response);
                 if (!data) throw new Error('Invalid stats data received.');
                 setStats(data);
            } catch (err) {
                 console.error("Error fetching review stats:", err);
                 // Handle auth error
                 if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                     setError(`${err.message} Redirecting to login.`);
                     const timerId = setTimeout(handleLogout, 1500);
                     setLoading(false); // Stop loading
                     return () => clearTimeout(timerId);
                } else {
                     setError(err.message || 'Failed to fetch review statistics.');
                }
            } finally {
                 // Only set loading false if we haven't initiated a redirect
                 if (!error.includes("Redirecting")) {
                     setLoading(false);
                 }
            }
        };
        fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleLogout]); // Use handleLogout

    const chartData = stats ? [
        { label: '1 ★', value: stats['1_star'] || 0 },
        { label: '2 ★', value: stats['2_star'] || 0 },
        { label: '3 ★', value: stats['3_star'] || 0 },
        { label: '4 ★', value: stats['4_star'] || 0 },
        { label: '5 ★', value: stats['5_star'] || 0 },
    ] : [];
    const maxRating = stats ? Math.max(1, ...chartData.map(d => d.value)) : 1; // Ensure maxRating is at least 1

    // If loading, show spinner. If error includes redirect message, show that.
    if (loading) return <div className="loading-container"><Loader2 className="spinner" /></div>;
    if (error.includes("Redirecting")) return <div className="error-message">{error}</div>;

    return (
        <div className="fade-in">
            <h2 className="main-title">App Feedback & Ratings</h2>
             {/* Show non-redirect errors above the card */}
             {error && !error.includes("Redirecting") && <div className="error-message">{error}</div>}
            <div className="card">
                <h3 className="sub-title">Review Distribution (Mock/Fetched Data)</h3>
                {stats ? ( // Render chart only if stats were loaded successfully
                    <div className="chart-container" style={{height: '300px'}}>
                        {chartData.map(data => (
                            <div key={data.label} className="chart-bar-wrapper">
                                <div className="chart-bar" style={{ height: `${(data.value / maxRating) * 100}%` }}>
                                    <span className="bar-label">{data.value}</span>
                                </div>
                                <span className="month-label">{data.label}</span>
                            </div>
                        ))}
                    </div>
                ): (
                     !error && <p>Could not load review statistics.</p> // Show if no error but no stats
                )}
            </div>
             {/* Placeholder for future detailed reviews list */}
             <div className="card">
                 <h3 className="sub-title">Recent Reviews</h3>
                 <p>List of recent reviews will appear here. (TODO)</p>
             </div>
        </div>
    );
};


// --- Platform Settings Component ---
const PlatformSettings = () => {
    const [fee, setFee] = useState(0);
    const [loading, setLoading] = useState(true); // For initial fetch
    const [saving, setSaving] = useState(false); // For save action
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // For redirect on auth error

     // Wrap handleLogout in useCallback
    const handleLogout = useCallback(() => {
        console.log("Auth error in Settings, logging out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin-login');
    }, [navigate]);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            setMessage('');
            try {
                const token = getAuthToken();
                if (!token) throw new Error("Authentication token not found.");
                const response = await fetchWithTimeout(`${API_BASE_URL}/admin/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }, 8000);

                 if (!response.ok) {
                     const errData = await safeJson(response) || {message: `HTTP error ${response.status}`};
                     throw new Error(errData.message || 'Failed to fetch settings');
                 }
                 const data = await safeJson(response);
                 if (data && typeof data.platformFeePercent === 'number') {
                     setFee(data.platformFeePercent);
                 } else {
                     // Handle case where settings might not exist yet or are invalid
                     console.warn('Invalid or missing settings data received. Defaulting fee to 0.');
                     setFee(0); // Default to 0 if data is bad
                     setError('Could not load settings properly, defaulting fee to 0.'); // Show a non-blocking error
                 }
            } catch (err) {
                 console.error("Error fetching settings:", err);
                 // Handle auth error
                 if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                     setMessage(`${err.message} Redirecting to login.`); // Use message state for feedback
                     const timerId = setTimeout(handleLogout, 1500);
                     setLoading(false); // Stop loading
                     return () => clearTimeout(timerId);
                } else {
                     setMessage(`Error loading settings: ${err.message}`); // Use message state
                }
            } finally {
                 // Only set loading false if we haven't initiated a redirect
                 if (!message.includes("Redirecting")) {
                      setLoading(false);
                 }
            }
        };
        fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleLogout]); // Use handleLogout

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); // Use saving state
        setMessage('');
        try {
            const token = getAuthToken();
            if (!token) throw new Error("Authentication token not found.");

            const feeValue = parseFloat(fee);
            if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
                 throw new Error("Fee must be a number between 0 and 100.");
            }

            const response = await fetchWithTimeout(`${API_BASE_URL}/admin/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ platformFeePercent: feeValue })
            }, 5000);

            if (!response.ok) {
                 const data = await safeJson(response) || {message: `HTTP error ${response.status}`};
                 throw new Error(data.message || 'Failed to save settings');
            }
            setMessage("Settings saved successfully!"); // Success message
        } catch (err) {
             console.error("Error saving settings:", err);
             // Handle auth error
             if (err.message.includes('Authentication token not found') || err.message.includes('Authorization error') || err.message.includes('Invalid or expired token')) {
                 setMessage(`${err.message} Redirecting to login.`);
                 setTimeout(handleLogout, 1500);
            } else {
                 setMessage(`Error saving settings: ${err.message}`);
            }
        } finally {
             // Only stop saving if not redirecting
             if (!message.includes("Redirecting")) {
                 setSaving(false); // Set saving state back
             }
        }
    };

    // If loading, show spinner. If error includes redirect message, show that.
    if (loading) return <div className="loading-container"><Loader2 className="spinner" /> Loading Settings...</div>;
    // Show redirect message prominently if it occurs
    if (message.includes("Redirecting")) return <div className="error-message">{message}</div>;

    return (
        <div className="fade-in">
            <h2 className="main-title">Platform Settings</h2>
            <div className="card">
                <form onSubmit={handleSave}>
                     {/* Show message: success or error */ }
                     {message && !message.includes("Redirecting") && (
                         <div className={message.includes("success") ? "success-message" : "error-message"}>
                            {message}
                         </div>
                     )}
                    <div className="form-group">
                        <label className="form-label" htmlFor="platformFee">Platform Fee (%)</label>
                        <input
                            id="platformFee"
                            type="number"
                            className="form-input"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            min="0"
                            max="100"
                            step="0.1"
                            disabled={saving} // Disable input while saving
                        />
                         <small>This percentage will be deducted from owner earnings.</small>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving || loading}>
                        {saving ? <Loader2 className="spinner" size={16}/> : 'Save Settings'}
                    </button>
                </form>
            </div>
        </div>
    );
};


// --- Main AdminDashboard Component ---
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true); // Tracks the initial auth check
  const [userData, setUserData] = useState(null); // Store user data if auth passes
  const navigate = useNavigate();

   // --- Sidebar State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  // --- Refs ---
  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);


  // Use useCallback for handleLogout
  const handleLogout = useCallback(() => {
       console.log("handleLogout called");
       localStorage.removeItem('token');
       localStorage.removeItem('user');
       navigate('/admin-login'); // Ensure this route exists in your routing setup
  }, [navigate]); // Dependency on navigate

   // --- Window Resize Effect ---
   useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobileView(mobile);
            // If switching TO mobile, always close. If switching TO desktop, default to open.
             if (mobile) {
                 setIsSidebarOpen(false);
             } else {
                 setIsSidebarOpen(true);
             }
        };

        window.addEventListener('resize', handleResize);
        // Initial check
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

     // --- Click Outside Sidebar Effect (Mobile Only) ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Only run on mobile when the sidebar is open
            if (isMobileView && isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                 // Check if the click was outside the sidebar itself
                 // AND also check it wasn't the mobile toggle button
                 const mobileToggle = document.querySelector('.mobile-menu-btn');
                 if (!mobileToggle || !mobileToggle.contains(event.target)) {
                     setIsSidebarOpen(false);
                 }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileView, isSidebarOpen]); // Rerun when mobile view or sidebar state changes


  useEffect(() => {
    // This effect runs only once on mount to check auth
    console.log("Running auth check...");
    const token = getAuthToken();
    const user = getUserData();

    if (!token || !user || user.role !== 'Admin') {
        console.warn("Redirecting: No token or invalid user role for Admin Dashboard.", {tokenExists: !!token, userExists: !!user, userRole: user?.role});
        // Immediately trigger logout/redirect
        handleLogout();
        // Keep isLoading=true, the component will unmount on redirect
        // No need to set isLoading(false)
    } else {
        console.log("Auth check passed.");
        setUserData(user); // Set user data
        setIsLoading(false); // <-- Auth passed, stop loading, render dashboard
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, handleLogout]); // Dependencies

 
   // --- Sidebar Toggle Logic ---
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (isMobileView) {
            setIsSidebarOpen(false); // Close sidebar on mobile after click
        }
    };


  const renderContent = () => {
      // If we are loading (i.e., auth check hasn't passed), render nothing in the main area
      if (isLoading) {
           // The full-page loader is already handling this
           return null;
      }
      // If loading is false, we know auth passed (otherwise we'd have redirected)
      // So userData should be present
       if (!userData) {
           // This case should ideally not be hit if logic is correct
           // But as a fallback:
           console.error("renderContent called but userData is null, redirecting.");
           handleLogout();
           return null;
       }

      // Render content based on activeTab
      switch (activeTab) {
          case 'overview': return <Overview />;
          case 'verification': return <DocumentVerification />;
          case 'users': return <UserManagement />;
          case 'revenue': return <PlatformRevenue />;
          case 'complaints': return <Complaints />;
          case 'feedback': return <AppFeedback />;
          case 'settings': return <PlatformSettings />;
          default: return <Overview />;
      }
  };

  // If initial loading is true (during auth check), show the main full-page loader
  if (isLoading) {
       return (
           <>
               <GlobalStyles />
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
                   <Loader2 className="spinner" size={48} /> Verifying Admin Access...
               </div>
           </>
       );
  }

  // If loading is false, it means auth passed (or redirect already happened)
  // Render the dashboard layout
  return (
    <>
      <GlobalStyles />
      <div className="dashboard">
         {/* Overlay for mobile menu */}
        <div
            className={`sidebar-overlay ${isMobileView && isSidebarOpen ? 'open' : ''}`}
            onClick={toggleSidebar} // Close on overlay click
        ></div>

        <Sidebar
            ref={sidebarRef} // Pass the ref here
            activeTab={activeTab}
            onTabClick={handleTabClick}
            onLogout={handleLogout}
            // Collapse logic: collapsed only if NOT mobile AND sidebar is closed
            isCollapsed={!isMobileView && !isSidebarOpen}
            onToggle={toggleSidebar}
            // Open class: applied only if mobile AND sidebar is open
            className={isMobileView && isSidebarOpen ? 'open' : ''}
        />
       
        <main
            ref={mainContentRef} // Added ref to main content
            className={`dashboard__main ${!isMobileView && !isSidebarOpen ? 'sidebar-collapsed' : ''}`}
        >
             {/* Mobile Header only shown in mobile view */}
            {isMobileView && (
                <div className="mobile-header">
                    <button onClick={toggleSidebar} className="mobile-menu-btn" title="Open Menu">
                        <Menu size={24} />
                    </button>
                    <h1 className="logo-mobile">ADMIN</h1>
                    <span style={{width: '40px'}}></span> {/* Spacer */}
                </div>
            )}
            {renderContent()} {/* Renders content or null (while loading) */}
        </main>
      </div>
    </>
  );
}

export default AdminDashboard;