import React, { useState, useEffect, useRef, useCallback } from 'react';
// Import 'useNavigate' to handle redirects for auth and logout
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Car, ShoppingCart, Star, AlertCircle, Settings, LogOut,
    Phone, Check, X, PlusCircle, Loader2, Edit, Bell, Menu, CheckCircle, // Added CheckCircle
    MessageSquareWarning, // For complaints
    Upload, // For file upload
    Video, // For video
    Wrench, // For Damage Reports
    Send, // For submit
    Trash2 // For deleting notifications
} from 'lucide-react';

// --- API & Auth Helpers ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030';
const getAuthToken = () => localStorage.getItem('token');

const getUserData = () => {
    const userStr = localStorage.getItem('user');
    try {
        if (userStr && userStr.startsWith('{') && userStr.endsWith('}')) {
           return JSON.parse(userStr);
        }
        console.warn("User data in localStorage is not valid JSON:", userStr);
        return null;
     } catch (e) {
        console.error("Error parsing user data", e);
        localStorage.removeItem('user'); // Clear invalid data
        return null;
     }
};

// --- Embedded CSS ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        :root {
         --owner-primary: #064e3b; --owner-secondary: #065f46; /* Dark Greens */
         --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-300: #d1d5db; --gray-400: #9ca3af; --gray-600: #4b5563; --gray-700: #374151; --gray-800: #1f2937;
         --white: #ffffff; --orange-500: #f97316; --green-500: #22c55e; --red-500: #ef4444; --blue-500: #3b82f6; --yellow-500: #eab308;
         --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
         --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
         --sidebar-width: 256px;
         --sidebar-width-collapsed: 80px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background-color: var(--gray-50); }
        .dashboard {
         display: flex;
         height: 100vh;
         width: 100%;
        }

        /* --- Sidebar Styles --- */
        .dashboard__sidebar {
         width: var(--sidebar-width);
         background-color: var(--owner-primary);
         color: var(--gray-300);
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
         text-align: left;
         margin-bottom: 0;
         margin-top: 0;
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
         background-color: var(--owner-secondary);
        }

        .dashboard__nav { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; flex-grow: 1; padding: 0; }
        .nav-item {
         display: flex; align-items: center; padding: 0.75rem 1rem; border-radius: 0.5rem;
         transition: background-color 0.2s, color 0.2s; color: var(--gray-300);
         text-decoration: none; font-weight: 500; background: none; border: none; width: 100%; cursor: pointer; font-size: 1rem; text-align: left;
         white-space: nowrap; /* Prevent text wrap */
        }
        .nav-item svg {
         color: currentColor;
         opacity: 0.7;
         margin-right: 0.75rem;
         transition: opacity 0.2s, margin 0.3s ease;
         flex-shrink: 0; /* Prevent icon shrinking */
        }
        .nav-item:hover { background-color: var(--owner-secondary); color: var(--white); }
        .nav-item:hover svg { opacity: 1; }
        .nav-item.active { background-color: var(--orange-500); color: var(--white); font-weight: 600; }
        .nav-item.active svg { opacity: 1; }
        .nav-item .nav-text {
         opacity: 1;
         transition: opacity 0.2s ease, width 0.3s ease;
         white-space: nowrap;
         width: auto;
        }
        .nav-item.logout { margin-top: auto; color: var(--gray-300) !important; }
        .nav-item.logout:hover { background-color: var(--owner-secondary); color: var(--white) !important; }

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
         font-size: 1.5rem; font-weight: 800; color: var(--orange-500); /* Use orange to match customer */
         letter-spacing: 0.1em;
        }
        .mobile-menu-btn {
         background: none; border: none; cursor: pointer; padding: 0.5rem;
         display: none; /* Hidden by default, shown in media query */
         color: var(--gray-800); /* Color for mobile menu button */
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
          padding: 0.75rem 1rem; /* Revert padding */
         }
         .dashboard__sidebar.collapsed .nav-item svg {
            margin-right: 0.75rem;
         }
          .dashboard__sidebar.collapsed .nav-text {
            margin-left: 0.75rem;
         }
         .dashboard__sidebar.collapsed .sidebar-header {
          justify-content: space-between;
          padding: 0; /* Revert padding */
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
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .main-title { font-size: 1.875rem; font-weight: 700; color: var(--gray-800); }
        .sub-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: var(--gray-800); }
        .card { background-color: var(--white); padding: 1.5rem; border-radius: 0.5rem; box-shadow: var(--shadow); margin-bottom: 1.5rem; animation: fadeIn 0.5s ease-out; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
        .stat-number { font-size: 2.25rem; font-weight: 700; margin-top: 0.5rem; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--gray-200); white-space: nowrap; }
        .data-table th { background-color: var(--gray-100); font-size: 0.75rem; text-transform: uppercase; }
        .overflow-auto { overflow-x: auto; }
        .button-group-sm { display:flex; gap: 0.5rem; flex-wrap: wrap; }
        .btn { padding: 0.75rem 1rem; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background-color 0.2s, transform 0.2s; text-decoration: none; line-height: 1; box-shadow: var(--shadow-md); }
        .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .btn-sm { padding: 0.5rem 0.75rem; font-size: 0.875rem; }
        .btn:disabled { background-color: var(--gray-200); cursor: not-allowed; opacity: 0.7; }
        .btn-primary { background-color: var(--orange-500); color: var(--white); }
        .btn-primary:hover:not(:disabled) { background-color: var(--orange-600); }
        .btn-success { background-color: var(--green-500); color: var(--white); }
        .btn-danger { background-color: var(--red-500); color: var(--white); }
        .btn-secondary { background-color: var(--gray-200); color: var(--gray-800); }
        .btn-link { background: none; color: var(--orange-500); font-weight: 600; cursor: pointer; padding: 0; border: none; box-shadow: none; }
        .status-chip { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
        .status-chip-green { background-color: #dcfce7; color: #166534; }
        .status-chip-blue { background-color: #dbeafe; color: #1e40af; }
        .status-chip-yellow { background-color: #fef9c3; color: #854d0e; }
        .status-chip-red { background-color: #fee2e2; color: #991b1b; }
        .status-chip-gray { background-color: #f3f4f6; color: #4b5563; }

        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; }
        .form-label { font-weight: 500; color: var(--gray-700); }
        .form-input, .form-select, .form-textarea { padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: 0.375rem; font-size: 1rem; width: 100%; box-sizing: border-box; }
        .form-textarea { min-height: 120px; }
        .form-actions { padding-top: 1rem; display: flex; justify-content: flex-end; gap: 1rem; }
        .form-divider { border: none; border-top: 1px solid var(--gray-200); margin: 1.5rem 0; }

        /* Rating Styles */
        .ratings-list { display: flex; flex-direction: column; gap: 1rem; }
        .rating-item { border: 1px solid var(--gray-200); border-radius: 0.5rem; background-color: var(--white); padding: 1rem; }
        .rating-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem; }
        .rating-reviewer { font-weight: 600; color: var(--gray-800); } /* Changed from .rating-customer */
        .rating-stars { display: flex; gap: 0.125rem; }
        .star-filled { color: var(--yellow-500); } /* Use yellow for filled */
        .star-empty { color: var(--gray-200); }
        .rating-vehicle { font-size: 0.875rem; color: var(--gray-600); font-style: italic; margin-top: 0.25rem; }
        .rating-comment { margin-top: 0.5rem; color: var(--gray-700); }

        .loading-container { display: flex; justify-content: center; align-items: center; padding: 2rem; }
        .spinner { animation: spin 1s linear infinite; }
        .error-message { background-color: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
        .success-message { background-color: #dcfce7; color: #166534; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

         /* --- Modal Styles --- */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: var(--white); padding: 2rem; border-radius: 0.5rem; box-shadow: var(--shadow-lg); width: 90%; max-width: 600px; animation: fadeIn 0.3s; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--gray-200); padding-bottom: 1rem; }
        .modal-title { font-size: 1.5rem; font-weight: 700; color: var(--gray-800); }
        .modal-close-btn { background: none; border: none; cursor: pointer; color: var(--gray-600); padding: 0.5rem; }
        .modal-body { display: flex; flex-direction: column; gap: 1rem; }

        /* Notification Styles */
        .notification-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
        .notification-item { display: flex; gap: 1rem; padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; background-color: var(--white); align-items: center; } /* Added align-items */
        .notification-icon { color: var(--blue-500); flex-shrink: 0; margin-top: 0px; } /* Adjusted */
        .notification-content { flex-grow: 1; }
        .notification-message { color: var(--gray-800); margin-bottom: 0.25rem; }
        .notification-time { font-size: 0.8rem; color: var(--gray-600); }
        .notification-delete-btn { background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: color 0.2s, background-color 0.2s; flex-shrink: 0; }
        .notification-delete-btn:hover { color: var(--red-500); background-color: var(--gray-100); }
        .notification-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; } /* For Clear All button */

        /* Complaint & Damage Report Styles */
        .report-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1.5rem; }
        .report-item { border: 1px solid var(--gray-200); border-radius: 0.5rem; }
        .report-header { padding: 1rem; background-color: var(--gray-50); border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .report-body { padding: 1rem; }
        .report-body p { margin-top: 0.5rem; color: var(--gray-700); }
        .report-links { display: flex; gap: 1rem; margin-top: 1rem; }
        .report-replies { padding: 1rem; border-top: 1px solid var(--gray-100); display: flex; flex-direction: column; gap: 1rem; }
        .reply-item { background-color: var(--gray-100); padding: 1rem; border-radius: 0.5rem; }
        .reply-item-header { font-size: 0.875rem; font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem; }
        .reply-item-body { color: var(--gray-800); }

        /* File Input Style */
        .file-input-group {
         display: flex;
         flex-direction: column;
         gap: 0.5rem;
         padding: 1rem;
         border: 2px dashed var(--gray-300);
         border-radius: 0.5rem;
         align-items: center;
         justify-content: center;
         cursor: pointer;
         background-color: var(--gray-50);
         transition: background-color 0.2s;
        }
        .file-input-group:hover {
         background-color: var(--gray-100);
        }
        .file-input-group span {
         font-size: 0.875rem;
         color: var(--gray-600);
        }
        .file-input-group .file-name {
         font-weight: 600;
         color: var(--owner-primary);
        }
        .hidden { display: none; }

    `}</style>
);


// --- Sub-Components ---

// --- Star Rating Display Component (for Ratings tab) ---
const StarRatingDisplay = ({ rating }) => (
    <div className="rating-stars">
        {[...Array(5)].map((_, i) => (
            i < rating ? <Star key={i} size={16} className="star-filled" /> : <Star key={i} size={16} className="star-empty" />
        ))}
    </div>
);


// --- Sidebar Component ---
// (Keep your existing Sidebar component here - no changes needed for this request)
const Sidebar = React.forwardRef(({ activeTab, onTabClick, onLogout, isCollapsed, onToggle, className }, ref) => {

    const NavItem = ({ tabName, icon, children }) => (
        <li>
            <button
                onClick={() => onTabClick(tabName)}
                className={`nav-item ${activeTab === tabName ? 'active' : ''}`}
                title={isCollapsed ? children : ""} // Show tooltip when collapsed
            >
                {React.cloneElement(icon, { size: 20 })}
                <span className="nav-text">{children}</span>
            </button>
        </li>
    );

    return (
        // Apply the 'ref' and the 'className' prop
        <aside ref={ref} className={`dashboard__sidebar ${isCollapsed ? 'collapsed' : ''} ${className || ''}`}>
            <div className="sidebar-header">
                <h1 className="logo">READY GO</h1>
                <button onClick={onToggle} className="sidebar-toggle-btn" title={isCollapsed ? "Expand Menu" : "Collapse Menu"}>
                    <Menu size={24} />
                </button>
            </div>
            <ul className="dashboard__nav">
                <NavItem tabName="overview" icon={<LayoutDashboard />}>Overview</NavItem>
                <NavItem tabName="vehicles" icon={<Car />}>Vehicles</NavItem>
                <NavItem tabName="orders" icon={<ShoppingCart />}>Orders</NavItem>
                <NavItem tabName="notifications" icon={<Bell />}>Notifications</NavItem>
                <NavItem tabName="ratings" icon={<Star />}>Ratings</NavItem>
                <NavItem tabName="damage-reports" icon={<Wrench />}>Damage Reports</NavItem>
                <NavItem tabName="complaints" icon={<MessageSquareWarning />}>Complaints</NavItem>
                <NavItem tabName="settings" icon={<Settings />}>Settings</NavItem>
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


// --- Overview Component ---
// (Keep your existing Overview component here - no changes needed for this request)
const Overview = ({ setActiveTab }) => {
    const [stats, setStats] = useState({ totalVehicles: 0, activeBookings: 0, monthlyEarnings: 0, overallRating: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const token = getAuthToken();
                let res = await fetch(`${API_BASE_URL}/owner/stats`, { headers: { Authorization: `Bearer ${token}` }});
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                     console.error("Failed to fetch /owner/stats. Ensure backend is running and route exists.");
                     throw new Error('Failed to load owner stats. Backend route missing or failed.');
                }
            } catch (err) {
                console.error(err);
                setStats({ totalVehicles: 0, activeBookings: 0, monthlyEarnings: 0, overallRating: 0 });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="fade-in">
            <h2 className="main-title">Owner Overview</h2>
            <div className="stats-grid">
                 <div className="card"><h3 className="card-title">Total Vehicles</h3><p className="stat-number">{loading ? <Loader2 size={24} className="spinner"/> : stats.totalVehicles}</p></div>
                 <div className="card"><h3 className="card-title">Active Bookings</h3><p className="stat-number">{loading ? <Loader2 size={24} className="spinner"/> : stats.activeBookings}</p></div>
                 <div className="card"><h3 className="card-title">Overall Rating</h3><p className="stat-number" style={{color: '#f97316'}}>{loading ? <Loader2 size={24} className="spinner"/> : `${(stats.overallRating || 0).toFixed(1)}`} <Star size={24} style={{display: 'inline', marginBottom: '8px'}}/></p></div>
                 <div className="card"><h3 className="card-title">Est. Month's Earnings</h3><p className="stat-number" style={{color: '#22c55e'}}>{loading ? <Loader2 size={24} className="spinner"/> : `₹${(stats.monthlyEarnings || 0).toLocaleString('en-IN')}`}</p></div>
            </div>
            <div className="card">
                <div className="button-group" style={{justifyContent: 'center'}}>
                     <button className="btn btn-primary" onClick={() => setActiveTab('orders')}>
                         <ShoppingCart size={18} /> View Orders
                     </button>
                      <button className="btn btn-secondary" style={{backgroundColor: 'var(--owner-secondary)', color: 'white'}} onClick={() => setActiveTab('vehicles')}>
                         <Car size={18} /> Manage Vehicles
                     </button>
                </div>
            </div>
        </div>
    );
};


// --- Manage Vehicles Component ---
// (Keep your existing ManageVehicles, AddVehicle, EditVehicle components here - no changes needed for this request)
const ManageVehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);

    const fetchOwnerVehicles = useCallback(async () => {
         setLoading(true); setError('');
         try {
             const token = getAuthToken();
             let response = await fetch(`${API_BASE_URL}/owner/vehicles`, { headers: { Authorization: `Bearer ${token}` }});
             if (!response.ok) {
                 throw new Error('Failed to fetch your vehicles. Ensure backend route exists.');
             }
             const data = await response.json();
             setVehicles(Array.isArray(data) ? data : []);
         } catch (err) { setError(err.message || 'Failed to load vehicles'); }
         finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchOwnerVehicles(); }, [fetchOwnerVehicles]);

    const handleVehicleAdded = (newVehicleFromServer) => {
        setVehicles(current => [newVehicleFromServer, ...current]); // Add to top
        setShowAddForm(false);
    };

    const handleOpenEditModal = (vehicle) => {
        setEditingVehicle(vehicle);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setEditingVehicle(null);
        setShowEditModal(false);
        fetchOwnerVehicles(); // Refetch all data on close
    };

    const handleVehicleUpdated = (updatedVehicle) => {
         setVehicles(current => current.map(v => v._id === updatedVehicle._id ? updatedVehicle : v));
         setShowEditModal(false);
         setEditingVehicle(null);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2 className="main-title">Manage Vehicles</h2>
                <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                    <PlusCircle size={16}/> {showAddForm ? 'Cancel Add' : 'Add New Vehicle'}
                </button>
            </div>

            {showAddForm && <AddVehicle onVehicleAdded={handleVehicleAdded} />}

            <div className="card overflow-auto">
                {loading && <div className="loading-container"><Loader2 className="spinner" /></div>}
                {error && <div className="error-message">{error}</div>}
                {!loading && !error && vehicles.length === 0 && <p style={{textAlign: 'center'}}>You haven't added any vehicles yet.</p>}
                {!loading && !error && vehicles.length > 0 && (
                    <table className="data-table">
                        <thead><tr><th>Vehicle Name</th><th>Plate</th><th>Price/Day</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {vehicles.map(v => (
                                <tr key={v._id}>
                                    <td>{v.name}</td>
                                    <td>{v.plate}</td>
                                    <td>₹{v.pricePerDay?.toLocaleString('en-IN')}</td>
                                    <td><span className={`status-chip ${v.isAvailable ? 'status-chip-green' : 'status-chip-blue'}`}>{v.isAvailable ? 'Available' : 'Booked'}</span></td>
                                    <td>
                                        <button className="btn-link" onClick={() => handleOpenEditModal(v)}>
                                            <Edit size={16} /> Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showEditModal && editingVehicle &&
                <EditVehicle
                    vehicle={editingVehicle}
                    onClose={handleCloseEditModal}
                    onVehicleUpdated={handleVehicleUpdated}
                />
            }
        </div>
    );
};
const AddVehicle = ({ onVehicleAdded }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Bike');
    const [plate, setPlate] = useState('');
    const [pricePerDay, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
         if (e.target.files && e.target.files[0]) {
             const file = e.target.files[0];
             if (file.size > 5 * 1024 * 1024) { // 5MB limit
                 setError('File is too large. Max 5MB.');
                 return;
             }
             if (!file.type.startsWith('image/')) {
                 setError('Invalid file type. Please upload an image.');
                 return;
             }
             setImageFile(file);
             setError('');
         }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) {
            setError('Please select an image for the vehicle.');
            return;
        }
        setError(''); setLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('type', type);
        formData.append('plate', plate);
        formData.append('pricePerDay', Number(pricePerDay));
        formData.append('location', location);
        formData.append('image', imageFile); // Append the file

        try {
            const token = getAuthToken(); if (!token) throw new Error('Authentication error.');
            const response = await fetch(`${API_BASE_URL}/owner/vehicles/addwithimage`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add vehicle.');
            onVehicleAdded(data);
            // Reset form
            setName(''); setType('Bike'); setPlate(''); setPrice(''); setLocation(''); setImageFile(null);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="card fade-in" style={{ borderColor: 'var(--green-500)', borderWidth: '1px'}}>
            <h3 className="sub-title">New Vehicle Details</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group"><label className="form-label">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" required/></div>
                    <div className="form-group"><label className="form-label">Type</label><select value={type} onChange={(e) => setType(e.target.value)} className="form-select"><option>Bike</option><option>Scooter</option><option>Car</option></select></div>
                    <div className="form-group"><label className="form-label">Plate Number</label><input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} className="form-input" required/></div>
                    <div className="form-group"><label className="form-label">Price/Day (₹)</label><input type="number" value={pricePerDay} onChange={(e) => setPrice(e.target.value)} className="form-input" min="0" required/></div>
                    <div className="form-group" style={{gridColumn: '1 / -1'}}><label className="form-label">Location</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="form-input" placeholder="e.g., Guntur, AP" required/></div>

                     <div className="form-group" style={{gridColumn: '1 / -1'}}>
                         <label className="form-label">Vehicle Image</label>
                         <label htmlFor="vehicle-image-upload" className="file-input-group">
                             <input id="vehicle-image-upload" type="file" onChange={handleFileChange} className="form-input hidden" accept="image/*" required={!imageFile} />
                             <Upload size={24} />
                             {imageFile ? (
                                 <span className="file-name">{imageFile.name}</span>
                             ) : (
                                 <span>Click or drag to upload image</span>
                             )}
                         </label>
                    </div>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-success" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={16}/> : 'Save Vehicle'}
                    </button>
                </div>
            </form>
        </div>
    );
};
const EditVehicle = ({ vehicle, onClose, onVehicleUpdated }) => {
    const [formData, setFormData] = useState({
        name: vehicle.name || '',
        type: vehicle.type || 'Bike',
        plate: vehicle.plate || '',
        pricePerDay: vehicle.pricePerDay || '',
        location: vehicle.location || '',
        isAvailable: vehicle.isAvailable !== undefined ? vehicle.isAvailable : true
    });
    const [newImageFile, setNewImageFile] = useState(null); // For new image
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

     const handleFileChange = (e) => {
         if (e.target.files && e.target.files[0]) {
             const file = e.target.files[0];
             if (file.size > 5 * 1024 * 1024) {
                 setError('File is too large. Max 5MB.');
                 return;
             }
             if (!file.type.startsWith('image/')) {
                 setError('Invalid file type. Please upload an image.');
                 return;
             }
             setNewImageFile(file);
             setError('');
         }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);

        const formDataWithImage = new FormData();
        formDataWithImage.append('name', formData.name);
        formDataWithImage.append('type', formData.type);
        formDataWithImage.append('plate', formData.plate);
        formDataWithImage.append('pricePerDay', Number(formData.pricePerDay));
        formDataWithImage.append('location', formData.location);
        formDataWithImage.append('isAvailable', formData.isAvailable);

        if (newImageFile) {
            formDataWithImage.append('image', newImageFile); // Append new image if selected
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/owner/vehicles/${vehicle._id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }, // No 'Content-Type' for FormData
                body: formDataWithImage, // Send FormData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update vehicle.');
            onVehicleUpdated(data);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Edit Vehicle: {vehicle.name}</h3>
                    <button onClick={onClose} className="modal-close-btn"><X size={24} /></button>
                </div>
                <div className="modal-body">
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group"><label className="form-label">Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required/></div>
                            <div className="form-group"><label className="form-label">Type</label><select name="type" value={formData.type} onChange={handleChange} className="form-select"><option>Bike</option><option>Scooter</option><option>Car</option></select></div>
                            <div className="form-group"><label className="form-label">Plate Number</label><input type="text" name="plate" value={formData.plate} onChange={handleChange} className="form-input" required/></div>
                            <div className="form-group"><label className="form-label">Price/Day (₹)</label><input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} className="form-input" min="0" required/></div>
                            <div className="form-group" style={{gridColumn: '1 / -1'}}><label className="form-label">Location</label><input type="text" name="location" value={formData.location} onChange={handleChange} className="form-input" required/></div>

                             <div className="form-group" style={{gridColumn: '1 / -1'}}>
                                 <label className="form-label">Change Image (Optional)</label>
                                 <label htmlFor="vehicle-image-edit" className="file-input-group">
                                     <input id="vehicle-image-edit" type="file" onChange={handleFileChange} className="form-input hidden" accept="image/*" />
                                     <Upload size={24} />
                                     {newImageFile ? (
                                         <span className="file-name">{newImageFile.name}</span>
                                     ) : (
                                         <span>Click or drag to change image</span>
                                     )}
                                 </label>
                                 {vehicle.imageUrl && !newImageFile && (
                                     <small>Current image: {vehicle.imageUrl.split('-').pop()}</small>
                                 )}
                            </div>

                            <div className="form-group" style={{gridColumn: '1 / -1', alignItems: 'center', flexDirection: 'row', gap: '1rem'}}>
                                <label className="form-label" htmlFor={`available-${vehicle._id}`}>Available for Renting</label>
                                <input
                                    id={`available-${vehicle._id}`}
                                    type="checkbox"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleChange}
                                    style={{width: 'auto', height: '1rem'}}
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-success" disabled={loading}>
                                {loading ? <Loader2 className="spinner" size={16}/> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- Orders Component (Handles workflow) ---
// (Keep your existing Orders component here - CheckCircle should now be defined)
const Orders = ({ bookings, loading, error, onOpenConfirmModal, onOpenCompleteModal, onRejectBooking }) => {

    const pendingRequests = bookings.filter(b => b.status === 'Pending');
    const confirmedBookings = bookings.filter(b => ['Upcoming', 'Confirmed'].includes(b.status));
    const pastBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');

    return(
        <div className="fade-in">
            <h2 className="main-title">Orders & Bookings</h2>
            {error && <div className="error-message card">{error}</div>}

            {/* --- Pending Requests --- */}
            <div className="card">
                <h3 className="sub-title">New Booking Requests</h3>
                <div className="overflow-auto">
                    {loading ? <div className="loading-container"><Loader2 className="spinner" /></div> :
                     pendingRequests.length > 0 ? (
                         <table className="data-table">
                             <thead><tr><th>Vehicle</th><th>Customer</th><th>Dates</th><th>Total</th><th>Actions</th></tr></thead>
                             <tbody>
                                 {pendingRequests.map(req => (
                                     <tr key={req._id}>
                                         <td>{req.vehicleId?.name || 'N/A'}</td>
                                         <td>{req.customerId?.fullName || 'N/A'}</td>
                                         <td>{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</td>
                                          <td>₹{req.totalPrice?.toLocaleString('en-IN') || 0}</td>
                                         <td>
                                             <div className="button-group-sm">
                                                 <button className="btn btn-success btn-sm" onClick={() => onOpenConfirmModal(req)}><Check size={16}/> Accept</button>
                                                 <button className="btn btn-danger btn-sm" onClick={() => onRejectBooking(req._id)}><X size={16}/> Reject</button>
                                             </div>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : (<p style={{textAlign: 'center'}}>No new booking requests.</p>)}
                </div>
            </div>

            {/* --- Confirmed Bookings --- */}
            <div className="card">
                <h3 className="sub-title">Confirmed & Upcoming Bookings</h3>
                 <div className="overflow-auto">
                    {loading ? <div className="loading-container"><Loader2 className="spinner" /></div> :
                     confirmedBookings.length > 0 ? (
                         <table className="data-table">
                             <thead><tr><th>Booking ID</th><th>Vehicle</th><th>Customer</th><th>Dates</th><th>Actions</th></tr></thead>
                             <tbody>
                                 {confirmedBookings.map(book => (
                                     <tr key={book._id}>
                                         <td>{String(book._id).slice(-6)}</td>
                                         <td>{book.vehicleId?.name || 'N/A'}</td>
                                         <td>{book.customerId?.fullName || 'N/A'}</td>
                                         <td>{new Date(book.startDate).toLocaleDateString()} to {new Date(book.endDate).toLocaleDateString()}</td>
                                         <td>
                                             {/* FIX: Ensure CheckCircle is imported */}
                                             <button className="btn btn-primary btn-sm" onClick={() => onOpenCompleteModal(book)}>
                                                 <CheckCircle size={16} /> Mark as Completed
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : (<p style={{textAlign: 'center'}}>No confirmed bookings.</p>)}
                </div>
            </div>

             {/* --- Past Bookings --- */}
             <div className="card">
                <h3 className="sub-title">Booking History (Completed / Cancelled)</h3>
                 <div className="overflow-auto">
                    {loading ? <div className="loading-container"><Loader2 className="spinner" /></div> :
                     pastBookings.length > 0 ? (
                         <table className="data-table">
                             <thead><tr><th>Booking ID</th><th>Vehicle</th><th>Customer</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
                             <tbody>
                                 {pastBookings.map(book => (
                                     <tr key={book._id}>
                                         <td>{String(book._id).slice(-6)}</td>
                                         <td>{book.vehicleId?.name || 'N/A'}</td>
                                         <td>{book.customerId?.fullName || 'N/A'}</td>
                                         <td>{new Date(book.startDate).toLocaleDateString()} to {new Date(book.endDate).toLocaleDateString()}</td>
                                         <td>₹{book.totalPrice?.toLocaleString('en-IN') || 0}</td>
                                          <td><span className={`status-chip ${book.status === 'Completed' ? 'status-chip-green' : 'status-chip-red'}`}>{book.status}</span></td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : (<p style={{textAlign: 'center'}}>No past bookings.</p>)}
                </div>
            </div>
        </div>
    );
};


// --- MODIFIED: Notifications Component ---
const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Use useCallback for fetchNotifications
    const fetchNotifications = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const token = getAuthToken(); if (!token) throw new Error("Please log in.");
            let response = await fetch(`${API_BASE_URL}/notifications/owner`, { headers: { Authorization: `Bearer ${token}` }});
            if (!response.ok) {
                throw new Error('Failed to fetch notifications. Ensure backend route /notifications/owner exists.');
            }
            const data = await response.json();
            setNotifications(Array.isArray(data) ? data : []); // Ensure it's an array
        } catch (err) {
            setError(err.message);
            console.error("Owner Notification Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Placeholder: Delete single notification
    const handleDeleteNotification = async (notificationId) => {
        // Optimistic UI update
        const originalNotifications = notifications;
        setNotifications(prev => prev.filter(n => n._id !== notificationId));

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/notifications/owner/${notificationId}`, { // Needs backend route
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to delete notification.');
            }
            // If successful, UI is already updated
        } catch (err) {
            console.error("Delete Notification Error:", err);
            setError(`Failed to delete: ${err.message}`);
            // Revert optimistic update on error
            setNotifications(originalNotifications);
        }
    };

    // Placeholder: Clear all notifications
    const handleClearAllNotifications = async () => {
        if (!window.confirm("Are you sure you want to delete all notifications?")) return;

        const originalNotifications = notifications;
        setNotifications([]); // Optimistic UI update

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/notifications/owner/all`, { // Needs backend route
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to clear notifications.');
            }
            // Successfully cleared on backend
        } catch (err) {
            console.error("Clear All Notifications Error:", err);
            setError(`Failed to clear all: ${err.message}`);
            // Revert optimistic update
            setNotifications(originalNotifications);
        }
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const diff = Date.now() - new Date(dateString).getTime();
        const mins = Math.floor(diff / (1000 * 60));
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="fade-in">
             <div className="notification-header"> {/* Header for title and button */}
                 <h2 className="main-title" style={{ marginBottom: 0 }}>Notifications</h2>
                 {notifications.length > 0 && !loading && (
                    <button
                        onClick={handleClearAllNotifications}
                        className="btn btn-danger btn-sm"
                        style={{ background: 'none', color: 'var(--red-500)', boxShadow: 'none' }}
                        title="Clear All Notifications"
                    >
                         <Trash2 size={16} /> Clear All
                     </button>
                 )}
            </div>

            {loading && <div className="loading-container card"><Loader2 className="spinner" /></div>}
            {error && <div className="error-message card">{error}</div>}
            {!loading && !error && (
                 notifications.length === 0 ? (
                      <div className="card" style={{textAlign: 'center'}}><Bell size={48} style={{color: 'var(--gray-400)', margin: '0 auto 1rem'}} /><p>No new notifications.</p></div>
                 ) : (
                      <ul className="notification-list">
                          {notifications.map(notif => (
                              <li key={notif._id} className="notification-item">
                                  <div className="notification-icon"><Bell size={20} /></div>
                                  <div className="notification-content">
                                      <p className="notification-message">{notif.message}</p>
                                      <p className="notification-time">{formatTimeAgo(notif.createdAt)}</p>
                                  </div>
                                  {/* Delete Button */}
                                  <button
                                     onClick={() => handleDeleteNotification(notif._id)}
                                     className="notification-delete-btn"
                                     title="Delete Notification"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </li>
                          ))}
                      </ul>
                 )
            )}
        </div>
    );
};


// --- MODIFIED: Ratings Component ---
const Ratings = () => {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRatings = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const token = getAuthToken();
            if (!token) throw new Error("Authentication required.");

            // *** Replace with your actual backend endpoint for owner ratings ***
            const response = await fetch(`${API_BASE_URL}/owner/ratings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to fetch ratings.');
            }
            const data = await response.json();
            setRatings(Array.isArray(data) ? data : []); // Ensure it's an array

        } catch (err) {
            console.error("Fetch Owner Ratings Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRatings();
    }, [fetchRatings]);

    return (
        <div className="fade-in card">
            <h2 className="main-title">Your Ratings</h2>
            {loading && <div className="loading-container"><Loader2 className="spinner" /></div>}
            {error && <div className="error-message">{error}</div>}
            {!loading && !error && (
                <div className="ratings-list">
                    {ratings.length === 0 ? (
                        <p className="text-center">You have not received any ratings yet.</p>
                    ) : (
                        ratings.map(r => (
                            <div key={r._id} className="rating-item">
                                <div className="rating-header">
                                    <span className="rating-reviewer">{r.reviewerId?.fullName || 'Anonymous Customer'}</span>
                                    <StarRatingDisplay rating={r.rating} />
                                </div>
                                {/* Display vehicle if it's a vehicle/owner review */}
                                {(r.reviewType === 'Vehicle' || r.reviewType === 'Owner') && r.vehicleId?.name && (
                                    <p className="rating-vehicle">For: {r.vehicleId.name}</p>
                                )}
                                {/* Display comment if exists */}
                                {r.comment && <p className="rating-comment">"{r.comment}"</p>}
                                <p style={{fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.5rem'}}>
                                    Received: {new Date(r.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};


// --- Owner-to-Admin Complaints Component ---
// (Keep your existing Complaints component here - no changes needed for this request)
const Complaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [newComplaint, setNewComplaint] = useState({ subject: '', description: '' });
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchComplaints = useCallback(async () => {
        setLoading(true); setMessage('');
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/complaints/owner`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch your complaints. Ensure backend route /complaints/owner exists.');
            const data = await response.json();
            setComplaints(Array.isArray(data) ? data : []);
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const handleFormChange = (e) => {
        setNewComplaint(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true); setMessage('');
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/complaints/owner`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newComplaint)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to submit complaint.');

            setMessage('Complaint submitted successfully!');
            setNewComplaint({ subject: '', description: '' });
            fetchComplaints(); // Refresh the list
        } catch (err) {
            setMessage(err.message);
        } finally {
            setSubmitLoading(false);
        }
    };

     const getStatusChipClass = (status) => {
         return status === 'Resolved' ? 'status-chip-green' : 'status-chip-yellow';
    };

    return (
        <div className="fade-in">
            <h2 className="main-title">Complaints to Admin</h2>

            {/* New Complaint Form */}
            <form className="card" onSubmit={handleSubmit}>
                <h3 className="sub-title">Submit a New Complaint</h3>
                {message && <div className={message.includes('success') ? "success-message" : "error-message"}>{message}</div>}

                <div className="form-group">
                    <label className="form-label" htmlFor="subject">Subject</label>
                    <input
                        id="subject" type="text" name="subject"
                        value={newComplaint.subject} onChange={handleFormChange}
                        className="form-input" placeholder="e.g., Issue with platform fee" required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="description">Description</label>
                    <textarea
                        id="description" name="description"
                        value={newComplaint.description} onChange={handleFormChange}
                        className="form-textarea" placeholder="Please provide details about your issue with the platform..." required
                    ></textarea>
                </div>
                <div className="form-actions" style={{justifyContent: 'flex-start'}}>
                    <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                        {submitLoading ? <Loader2 className="spinner" size={16} /> : 'Submit Complaint'}
                    </button>
                </div>
            </form>

            {/* Existing Complaints List */}
            <div className="card">
                <h3 className="sub-title">Your Complaint History</h3>
                {loading && <div className="loading-container"><Loader2 className="spinner" /></div>}
                {!loading && complaints.length === 0 && <p style={{textAlign: 'center'}}>You have no submitted complaints.</p>}
                {!loading && complaints.length > 0 && (
                    <ul className="report-list"> {/* Using report-list style */}
                        {complaints.map(complaint => (
                            <li key={complaint._id} className="report-item"> {/* Using report-item style */}
                                <div className="report-header">
                                    <h4 style={{margin: 0, fontSize: '1.1rem'}}>{complaint.subject}</h4>
                                    <span className={`status-chip ${getStatusChipClass(complaint.status)}`}>{complaint.status}</span>
                                </div>
                                <div className="report-body">
                                    <p>{complaint.description}</p>
                                    <p style={{fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '1rem'}}>Submitted: {new Date(complaint.createdAt).toLocaleString()}</p>
                                </div>
                                {complaint.replies && complaint.replies.length > 0 && (
                                    <div className="report-replies">
                                        <h5 style={{margin: 0, fontSize: '0.9rem', color: 'var(--gray-800)'}}>Admin Replies:</h5>
                                        {complaint.replies.map(reply => (
                                            <div key={reply._id || reply.createdAt} className="reply-item">
                                                <p className="reply-item-header">Reply from Admin ({new Date(reply.createdAt).toLocaleString()}):</p>
                                                <p className="reply-item-body">{reply.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};


// --- NEW: Damage Reports Tab ---
// (Keep your existing DamageReports component here - no changes needed for this request)
const DamageReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReports = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/owner/damage-reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch damage reports. Ensure backend route /owner/damage-reports exists.');
            const data = await response.json();
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const getStatusChipClass = (status) => {
        return status === 'Resolved' ? 'status-chip-green' : 'status-chip-yellow';
    };

    return (
        <div className="fade-in">
            <h2 className="main-title">Damage Reports</h2>
            <div className="card">
                <h3 className="sub-title">Your Submitted Reports</h3>
                 {loading && <div className="loading-container"><Loader2 className="spinner" /></div>}
                 {error && <div className="error-message">{error}</div>}
                {!loading && reports.length === 0 && <p style={{textAlign: 'center'}}>You have not submitted any damage reports.</p>}
                {!loading && reports.length > 0 && (
                    <ul className="report-list">
                        {reports.map(report => (
                            <li key={report._id} className="report-item">
                                <div className="report-header">
                                    <h4 style={{margin: 0, fontSize: '1.1rem'}}>Report for Booking #{report.bookingId?._id.slice(-6) || 'N/A'}</h4>
                                    <span className={`status-chip ${getStatusChipClass(report.status)}`}>{report.status}</span>
                                </div>
                                <div className="report-body">
                                    <p><strong>Vehicle:</strong> {report.vehicleId?.name || 'Unknown'}</p>
                                    <p><strong>Customer:</strong> {report.customerId?.fullName || 'Unknown'}</p>
                                    <p><strong>Your Report:</strong> {report.description}</p>
                                    <div className="report-links">
                                        {report.preRideVideo && (
                                            <a href={`${API_BASE_URL}/${report.preRideVideo.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                                <Video size={16}/> Pre-Ride Video
                                            </a>
                                        )}
                                        {report.damageVideo && (
                                             <a href={`${API_BASE_URL}/${report.damageVideo.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="btn btn-danger btn-sm">
                                                 <Video size={16}/> Damage Video
                                             </a>
                                        )}
                                    </div>
                                    <p style={{fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '1rem'}}>Submitted: {new Date(report.createdAt).toLocaleString()}</p>
                                </div>
                                {report.replies && report.replies.length > 0 && (
                                    <div className="report-replies">
                                        <h5 style={{margin: 0, fontSize: '0.9rem', color: 'var(--gray-800)'}}>Admin Replies:</h5>
                                        {report.replies.map(reply => (
                                            <div key={reply._id || reply.createdAt} className="reply-item">
                                                <p className="reply-item-header">Reply from Admin ({new Date(reply.createdAt).toLocaleString()}):</p>
                                                <p className="reply-item-body">{reply.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};


// --- Owner Settings Component ---
// (Keep your existing OwnerSettings component here - no changes needed for this request)
const OwnerSettings = () => {
    const [profile, setProfile] = useState({ fullName: '', email: '', phone: '' });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingPassword, setLoadingPassword] = useState(false);

     useEffect(() => {
         const fetchProfile = async () => {
             setLoadingProfile(true); setError('');
             try {
                 const token = getAuthToken();
                 let response = await fetch(`${API_BASE_URL}/profile/owner`, { headers: { Authorization: `Bearer ${token}` }});
                 if (response.ok) {
                     const data = await response.json();
                     setProfile({ fullName: data.fullName || '', email: data.email || '', phone: data.phone || '' });
                 } else {
                     const localUser = getUserData();
                     if (localUser) setProfile({ fullName: localUser.fullName || '', email: localUser.email || '', phone: localUser.phone || '' });
                     else throw new Error('Profile not available on backend or locally.');
                 }
             } catch (err) { setError(err.message); }
             finally { setLoadingProfile(false); }
         };
         fetchProfile();
     }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage(''); setError(''); setLoadingProfile(true);
        try {
            const token = getAuthToken();
            let response = await fetch(`${API_BASE_URL}/profile/owner`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ fullName: profile.fullName, phone: profile.phone })
             });
             const data = await response.json();
             if (!response.ok) throw new Error(data.message || 'Update failed.');
             setMessage('Profile updated successfully!');
             const localUser = getUserData();
             if(localUser) {
                 localUser.fullName = data.fullName;
                 localUser.phone = data.phone; // Update phone as well
                 localStorage.setItem('user', JSON.stringify(localUser));
             }
             setTimeout(() => setMessage(''), 3000);
        } catch (err) { setError(err.message); }
        finally { setLoadingProfile(false); }
    };

    const handlePasswordUpdate = async (e) => {
         e.preventDefault();
         setMessage(''); setError(''); setLoadingPassword(true);
         try {
            const token = getAuthToken();
            let response = await fetch(`${API_BASE_URL}/owner/password`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ currentPassword, newPassword })
             });
             const data = await response.json();
             if (!response.ok) throw new Error(data.message || 'Password update failed.');

             setMessage('Password updated successfully!');
             setCurrentPassword(''); setNewPassword('');
             setTimeout(() => setMessage(''), 3000);
         } catch(err) { setError(err.message); }
         finally { setLoadingPassword(false); }
     };

    if (loadingProfile && !profile.email) {
        return <div className="loading-container"><Loader2 className="spinner"/> Loading Settings...</div>;
    }

    return (
        <div className="fade-in">
            <h2 className="main-title">Settings</h2>
              {message && <div className="success-message card">{message}</div>}
              {error && <div className="error-message card">{error}</div>}
            <div className="card">
                <h3 className="sub-title">Profile Details</h3>
                <form onSubmit={handleProfileUpdate}>
                     <div className="form-grid">
                         <div className="form-group">
                             <label className="form-label" htmlFor="ownerName">Full Name</label>
                             <input id="ownerName" type="text" value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})} className="form-input"/>
                         </div>
                         <div className="form-group">
                             <label className="form-label" htmlFor="ownerEmail">Email Address</label>
                             <input id="ownerEmail" type="email" value={profile.email} className="form-input" readOnly/>
                         </div>
                          <div className="form-group">
                             <label className="form-label" htmlFor="ownerPhone">Phone Number</label>
                             <input id="ownerPhone" type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="form-input"/>
                         </div>
                    </div>
                     <div className="form-actions">
                         <button type="submit" className="btn btn-primary" disabled={loadingProfile}>
                             {loadingProfile ? <Loader2 className="spinner" size={16}/> : 'Update Profile'}
                         </button>
                     </div>
                </form>

                <hr className="form-divider" />

                 <h3 className="sub-title">Change Password</h3>
                 <form onSubmit={handlePasswordUpdate}>
                     <div className="form-grid">
                         <div className="form-group">
                             <label className="form-label" htmlFor="currentPassword">Current Password</label>
                             <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="form-input" required/>
                         </div>
                         <div className="form-group">
                             <label className="form-label" htmlFor="newPassword">New Password</label>
                             <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" className="form-input" required/>
                         </div>
                    </div>
                     <div className="form-actions" style={{marginTop: '1rem'}}>
                         <button type="submit" className="btn btn-primary" disabled={loadingPassword}>
                            {loadingPassword ? <Loader2 className="spinner" size={16}/> : 'Update Password'}
                         </button>
                     </div>
                </form>
            </div>
        </div>
    );
};


// --- Main OwnerDashboard Component ---
function OwnerDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // --- Sidebar State ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    // --- Refs ---
    const sidebarRef = useRef(null);
    const mainContentRef = useRef(null);

    // --- Modal States ---
    const [confirmModalBooking, setConfirmModalBooking] = useState(null);
    const [completeModalBooking, setCompleteModalBooking] = useState(null);
    const [damageModalBooking, setDamageModalBooking] = useState(null);

    // --- Lifted State ---
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [bookingsError, setBookingsError] = useState('');

    // Key to force refresh of bookings list
    const [refreshKey, setRefreshKey] = useState(0);

    // Use useCallback for handleLogout
    const handleLogout = useCallback(() => {
        console.log("handleLogout called");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/'); // Redirect to home/main login
    }, [navigate]); // Dependency on navigate

    // --- Window Resize Effect ---
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobileView(mobile);
             if (mobile) {
                 setIsSidebarOpen(false);
             } else {
                 setIsSidebarOpen(true);
             }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        return () => window.removeEventListener('resize', handleResize);
    }, []);

     // --- Click Outside Sidebar Effect (Mobile Only) ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobileView && isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
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
    }, [isMobileView, isSidebarOpen]);

    // --- Auth & Initial Load Effect ---
    useEffect(() => {
        const token = getAuthToken();
        const user = getUserData();
        if (!token || !user || user.role !== 'Owner') {
            console.warn("Redirecting: No token or invalid user role for Owner Dashboard.");
            handleLogout();
        } else {
             setIsLoading(false); // Auth passed
        }
    }, [navigate, handleLogout]);

    // --- Lifted Booking Fetch Logic ---
    const fetchBookings = useCallback(async () => {
         setBookingsLoading(true); setBookingsError('');
         try {
             const token = getAuthToken(); if (!token) throw new Error("Please log in.");
             let response = await fetch(`${API_BASE_URL}/owner/bookings`, { headers: { Authorization: `Bearer ${token}` }});
             if (!response.ok) {
                 throw new Error('Failed to fetch bookings. Ensure backend route /owner/bookings exists.');
             }
             const data = await response.json();
             setBookings(Array.isArray(data) ? data : []);
         } catch (err) { setBookingsError(err.message); }
         finally { setBookingsLoading(false); }
    }, []);

    // Fetch bookings when 'orders' tab is active or refreshKey changes
    useEffect(() => {
        if (activeTab === 'orders') {
            fetchBookings();
        }
    }, [activeTab, fetchBookings, refreshKey]); // re-fetch when tab is opened or key changes

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

    // --- Modal Handlers ---
    const handleOpenConfirmModal = (booking) => setConfirmModalBooking(booking);
    const handleOpenCompleteModal = (booking) => setCompleteModalBooking(booking);
    const handleOpenDamageModal = (booking) => {
        setCompleteModalBooking(null); // Close the complete modal
        setDamageModalBooking(booking); // Open the damage modal
    };

    const refreshData = () => {
        setRefreshKey(k => k + 1); // Increment key to trigger re-fetch in Orders
        // If the damage reports tab needs refreshing too, call its fetch function here
        // if (activeTab === 'damage-reports') { /* call fetchDamageReports */ }
    };

    // --- Booking Action Handlers (Reject, Complete) ---
    const handleRejectBooking = async (bookingId) => {
        if (!window.confirm("Are you sure you want to reject this booking?")) return;
        setBookingsLoading(true); // Indicate loading on the orders tab
        try {
            const token = getAuthToken();
            let response = await fetch(`${API_BASE_URL}/owner/bookings/${bookingId}/reject`, {
                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to reject booking.');
            refreshData(); // Refresh list
        } catch (err) {
            console.error(err);
            setBookingsError(err.message); // Show error on the orders tab
            setBookingsLoading(false); // Stop loading on error
        }
    };

    const handleCompleteBooking = async (bookingId) => {
        if (!window.confirm("Are you sure you want to mark this ride as complete (no issues)?")) return;
        setBookingsLoading(true); // Indicate loading on the orders tab
        setCompleteModalBooking(null); // Close modal first
        try {
            const token = getAuthToken();
            let response = await fetch(`${API_BASE_URL}/owner/bookings/${bookingId}/complete`, {
                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to complete booking.');
            refreshData(); // Refresh list
        } catch (err) {
            console.error(err);
            setBookingsError(err.message); // Show error on the orders tab
            setBookingsLoading(false); // Stop loading on error
        }
    };


    const renderContent = () => {
         if (isLoading) return null; // Don't render content if auth check is pending

        switch (activeTab) {
            case 'overview': return <Overview setActiveTab={setActiveTab}/>;
            case 'vehicles': return <ManageVehicles />;
            case 'orders': return (
                <Orders
                    bookings={bookings}
                    loading={bookingsLoading}
                    error={bookingsError}
                    onOpenConfirmModal={handleOpenConfirmModal}
                    onOpenCompleteModal={handleOpenCompleteModal}
                    onRejectBooking={handleRejectBooking}
                />
            );
            case 'notifications': return <Notifications />;
            case 'ratings': return <Ratings />;
            case 'damage-reports': return <DamageReports />;
            case 'complaints': return <Complaints />;
            case 'settings': return <OwnerSettings />;
            default: return <Overview setActiveTab={setActiveTab}/>;
        }
    };

    if (isLoading) {
        return (
            <>
                <GlobalStyles />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
                    <Loader2 className="spinner" size={48} /> Verifying Access...
                </div>
            </>
        );
    }

    return (
        <>
            <GlobalStyles />
            <div className="dashboard theme-owner">
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
                    isCollapsed={!isMobileView && !isSidebarOpen}
                    onToggle={toggleSidebar}
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
                            <h1 className="logo-mobile">READY GO</h1>
                            <span style={{width: '40px'}}></span> {/* Spacer */}
                        </div>
                    )}
                    {renderContent()}
                </main>

                {/* --- RENDER MODALS --- */}
                {confirmModalBooking && (
                    <ConfirmBookingModal
                        booking={confirmModalBooking}
                        onClose={() => setConfirmModalBooking(null)}
                        onBookingConfirmed={() => {
                            setConfirmModalBooking(null);
                            refreshData(); // Refresh orders list
                        }}
                    />
                )}

                {completeModalBooking && (
                    <CompleteRideModal
                        booking={completeModalBooking}
                        onClose={() => setCompleteModalBooking(null)}
                        onOpenDamageModal={() => handleOpenDamageModal(completeModalBooking)}
                        onCompleteBooking={() => handleCompleteBooking(completeModalBooking._id)}
                    />
                )}

                {damageModalBooking && (
                     <DamageReportModal
                         booking={damageModalBooking}
                         onClose={() => setDamageModalBooking(null)}
                         onReportSubmitted={() => {
                             setDamageModalBooking(null);
                             refreshData(); // Refresh orders list
                             // Optionally, switch to damage reports tab
                             // setActiveTab('damage-reports');
                         }}
                     />
                )}
            </div>
        </>
    );
}

// --- NEW MODAL: ConfirmBookingModal ---
// (Keep your existing ConfirmBookingModal component here)
const ConfirmBookingModal = ({ booking, onClose, onBookingConfirmed }) => {
    const [videoFile, setVideoFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
         if (e.target.files && e.target.files[0]) {
             const file = e.target.files[0];
             if (file.size > 50 * 1024 * 1024) { // 50MB limit for video
                 setError('File is too large. Max 50MB.');
                 return;
             }
             if (!file.type.startsWith('video/')) {
                 setError('Invalid file type. Please upload a video.');
                 return;
             }
             setVideoFile(file);
             setError('');
         }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!videoFile) {
            setError('A pre-ride video is required to confirm the booking.');
            return;
        }
        setError(''); setLoading(true);

        const formData = new FormData();
        formData.append('video', videoFile);

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/owner/bookings/${booking._id}/confirm-with-video`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to confirm booking.');

            onBookingConfirmed(); // Tell parent to refresh and close

        } catch (err) {
            setError(err.message);
            setLoading(false); // Keep modal open on error
        }
        // Don't setLoading(false) on success
    };

    return (
         <div className="modal-overlay" onClick={onClose}>
             <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                 <div className="modal-header">
                     <h3 className="modal-title">Confirm Booking & Upload Video</h3>
                     <button onClick={onClose} className="modal-close-btn"><X size={24} /></button>
                 </div>
                 <form className="modal-body" onSubmit={handleSubmit}>
                     <p>To accept this booking, please record and upload a short video showing the current condition of your vehicle (<b>{booking.vehicleId?.name}</b>). This protects you in case of any disputes.</p>

                     {error && <div className="error-message">{error}</div>}

                     <div className="form-group">
                         <label className="form-label">Pre-Ride Video</label>
                         <label htmlFor="pre-ride-video-upload" className="file-input-group">
                             <input id="pre-ride-video-upload" type="file" onChange={handleFileChange} className="form-input hidden" accept="video/*" capture="environment" required />
                             <Video size={24} />
                             {videoFile ? (
                                 <span className="file-name">{videoFile.name}</span>
                             ) : (
                                 <span>Click to Upload/Record Video</span>
                             )}
                         </label>
                         <small>Use your phone to record a live video (`capture="environment"`).</small>
                    </div>

                    <div className="form-actions">
                         <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                             Cancel
                         </button>
                         <button type="submit" className="btn btn-success" disabled={loading || !videoFile}>
                             {loading ? <Loader2 className="spinner" size={16} /> : <><Check size={16} /> Confirm Booking</>}
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- NEW MODAL: CompleteRideModal ---
// (Keep your existing CompleteRideModal component here)
const CompleteRideModal = ({ booking, onClose, onOpenDamageModal, onCompleteBooking }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Complete Ride</h3>
                    <button onClick={onClose} className="modal-close-btn"><X size={24} /></button>
                </div>
                <div className="modal-body">
                    <p>Have you received and inspected the vehicle (<b>{booking.vehicleId?.name}</b>) from <b>{booking.customerId?.fullName}</b>?</p>

                    <div className="form-actions" style={{justifyContent: 'space-between', marginTop: '1.5rem'}}>
                        <button type="button" className="btn btn-danger" onClick={onOpenDamageModal}>
                            <AlertCircle size={16} /> Report Damage
                        </button>
                        <button type="button" className="btn btn-success" onClick={onCompleteBooking}>
                            <CheckCircle size={16} /> Complete (No Issues)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW MODAL: DamageReportModal ---
// (Keep your existing DamageReportModal component here)
const DamageReportModal = ({ booking, onClose, onReportSubmitted }) => {
    const [damageVideoFile, setDamageVideoFile] = useState(null);
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
         if (e.target.files && e.target.files[0]) {
             const file = e.target.files[0];
             if (file.size > 50 * 1024 * 1024) { // 50MB limit for video
                 setError('File is too large. Max 50MB.');
                 return;
             }
             if (!file.type.startsWith('video/')) {
                 setError('Invalid file type. Please upload a video.');
                 return;
             }
             setDamageVideoFile(file);
             setError('');
         }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!damageVideoFile || !description) {
            setError('A new video and description of the damage are required.');
            return;
        }
        setError(''); setLoading(true);

        const formData = new FormData();
        formData.append('description', description);
        formData.append('damageVideo', damageVideoFile);
        // We also send bookingId in the URL

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/owner/bookings/${booking._id}/report-damage`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to submit report.');

            onReportSubmitted(); // Tell parent to refresh and close

        } catch (err) {
            setError(err.message);
            setLoading(false); // Keep modal open on error
        }
       // Don't setLoading(false) on success
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Report Damage</h3>
                    <button onClick={onClose} className="modal-close-btn"><X size={24} /></button>
                </div>
                <form className="modal-body" onSubmit={handleSubmit}>
                    <p>Submit a damage report for booking <b>#{booking._id.slice(-6)}</b>. This will be sent to an admin for review, along with your original pre-ride video.</p>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">Damage Video</label>
                        <label htmlFor="damage-video-upload" className="file-input-group">
                            <input id="damage-video-upload" type="file" onChange={handleFileChange} className="form-input hidden" accept="video/*" capture="environment" required />
                            <Video size={24} />
                            {damageVideoFile ? (
                                <span className="file-name">{damageVideoFile.name}</span>
                            ) : (
                            <span>Click to Record/Upload Damage Video</span>
                            )}
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="damage-description">Damage Description</label>
                        <textarea
                            id="damage-description"
                            className="form-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the damage, location on vehicle, etc."
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-danger" disabled={loading || !damageVideoFile || !description}>
                            {loading ? <Loader2 className="spinner" size={16} /> : <><Send size={16} /> Submit Report</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default OwnerDashboard;