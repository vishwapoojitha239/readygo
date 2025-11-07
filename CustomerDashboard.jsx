import React, { useState, useEffect, useRef, useCallback } from 'react';
// Import 'useNavigate' for programmatic navigation on logout
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, MapPin, Search, User, LayoutDashboard, History, FileText,
    CreditCard, UserCog, LogOut, ArrowLeft, CheckCircle, PlusCircle, Wrench,
    Loader2, Mail, Phone, Bell, X, CreditCard as CreditCardIcon,
    MessageSquareWarning, // For complaints
    Lock, // For password
    Menu, // For hamburger icon
    Calendar, // For date
    Trash2, // For deleting cards & notifications
    Star, // For ratings
    Video, // For video modal
    MessageSquare, // For contact owner
    Send // For feedback submit
} from 'lucide-react';

// --- API & Auth Helpers ---
// --- MODIFIED: Use Environment Variable for API URL ---
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
        console.error("Error parsing user data from localStorage", e);
        localStorage.removeItem('user'); // Clear invalid data
        return null;
     }
};

// --- Embedded CSS ---
const CustomerDashboardStyles = () => (
    <style>{`
        /* Import Google Font */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* Base styles */
        :root {
         --orange-500: #f97316; --orange-600: #ea580c;
         --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-300: #d1d5db;
         --gray-400: #9ca3af; --gray-600: #4b5563; --gray-700: #374151; --gray-800: #1f2937;
         --gray-900: #111827;
         --admin-primary: #1f2937; --admin-secondary: #374151;
         --white: #ffffff; --red-500: #ef4444; --green-500: #22c55e; --blue-500: #3b82f6; --yellow-500: #eab308;
         --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
         --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
         --sidebar-width: 256px;
         --sidebar-width-collapsed: 80px;
        }

        .dashboard.theme-customer {
         display: flex;
         height: 100vh;
         width: 100%;
         background-color: var(--gray-50);
         font-family: 'Inter', sans-serif;
         transition: padding-left 0.3s ease; /* Transition for main content */
        }

        /* --- MODIFIED: Sidebar Styles --- */
        .dashboard__sidebar {
         width: var(--sidebar-width);
         background-color: var(--admin-primary);
         color: var(--gray-300);
         height: 100vh;
         position: fixed; /* Changed to fixed */
         top: 0;
         left: 0;
         padding: 1rem;
         display: flex;
         flex-direction: column;
         flex-shrink: 0;
         box-shadow: var(--shadow-md);
         overflow-y: auto;
         overflow-x: hidden; /* Hide horizontal overflow */
         transition: width 0.3s ease, transform 0.3s ease;
         z-index: 1000;
        }

        .sidebar-header {
         display: flex;
         align-items: center;
         justify-content: space-between; /* Default for expanded and mobile */
         margin-bottom: 2rem;
         margin-top: 1rem;
         min-height: 32px; /* Ensure header has a minimum height */
         transition: padding 0.3s ease;
        }

        .dashboard__sidebar .logo {
         font-size: 1.75rem; font-weight: 800; color: var(--orange-500);
         text-align: left;
         letter-spacing: 0.1em;
         white-space: nowrap;
         opacity: 1;
         transition: opacity 0.2s ease, display 0s linear 0.3s; /* Delay display change */
         display: block; /* Default display */
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

        .dashboard__nav { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; flex-grow: 1; padding: 0; }

        .nav-item {
         display: flex; align-items: center; padding: 0.75rem 1rem; border-radius: 0.5rem;
         text-decoration: none; font-weight: 500;
         transition: background-color 0.2s, color 0.2s;
         white-space: nowrap; cursor: pointer; background: none; border: none;
         width: 100%; text-align: left; font-size: 1rem;
         color: var(--gray-300);
         position: relative;
        }
        .nav-item svg {
         color: currentColor;
         opacity: 0.7;
         margin-right: 0.75rem;
         transition: opacity 0.2s, margin 0.3s ease;
         flex-shrink: 0; /* Prevent icon from shrinking */
        }
        .nav-item:hover {
         background-color: var(--admin-secondary);
         color: var(--white);
        }
         .nav-item:hover svg { opacity: 1; }
        .nav-item.active {
         background-color: var(--orange-500);
         color: var(--white);
         font-weight: 600;
        }
         .nav-item.active svg { opacity: 1; }

        .nav-item .nav-text {
         opacity: 1;
         transition: opacity 0.2s ease, width 0.3s ease; /* Faster text fade */
         white-space: nowrap;
         width: auto; /* Default width */
        }

        .nav-item.logout { margin-top: auto; color: var(--gray-300) !important; }
        .nav-item.logout:hover {
         background-color: var(--admin-secondary);
         color: var(--white) !important;
        }

        /* --- Sidebar Collapsed State --- */
        .dashboard__sidebar.collapsed {
         width: var(--sidebar-width-collapsed);
        }
        /* --- CORRECTED COLLAPSED HEADER --- */
        .dashboard__sidebar.collapsed .sidebar-header {
         justify-content: center; /* Center the remaining item (button) */
         padding-left: 0; /* Remove padding */
         padding-right: 0; /* Remove padding */
        }
         .dashboard__sidebar.collapsed .logo {
         opacity: 0;
         pointer-events: none;
         transition: opacity 0.2s ease, display 0s linear 0s; /* Hide immediately */
         display: none; /* Remove from layout flow */
        }
        .dashboard__sidebar.collapsed .sidebar-toggle-btn {
         opacity: 1; /* Ensure visible */
         pointer-events: auto; /* Ensure clickable */
        }
        /* --- END CORRECTION --- */
        .dashboard__sidebar.collapsed .nav-text {
         opacity: 0;
         width: 0;
         overflow: hidden; /* Prevent text showing during transition */
         pointer-events: none;
        }
        .dashboard__sidebar.collapsed .nav-item svg {
         margin-right: 0; /* Remove margin when collapsed */
        }
        .dashboard__sidebar.collapsed .nav-item {
         justify-content: center; /* Center icon */
        }
        .dashboard__sidebar.collapsed .nav-notification-dot {
         top: 0.75rem;
         right: 0.75rem; /* Adjusted slightly */
        }


        /* --- Main Content --- */
        .dashboard__main {
         flex: 1;
         padding: 2.5rem;
         overflow-y: auto;
         background-color: var(--gray-50);
         margin-left: var(--sidebar-width); /* Push content over */
         transition: margin-left 0.3s ease;
         position: relative;
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
         margin: -2.5rem -2.5rem 1.5rem -2.5rem; /* Adjust negative margins based on main padding */
        }
        .mobile-header .logo-mobile {
         font-size: 1.5rem; font-weight: 800; color: var(--orange-500);
         letter-spacing: 0.1em;
        }
        .mobile-menu-btn {
         background: none; border: none; cursor: pointer; padding: 0.5rem;
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
         .dashboard.theme-customer {
          padding-left: 0; /* Reset padding */
         }
         .dashboard__sidebar {
          transform: translateX(-100%);
          width: var(--sidebar-width); /* Full width when open */
         }
         .dashboard__sidebar.open {
          transform: translateX(0);
         }
         .dashboard__sidebar.collapsed {
          /* Collapsed state is not used on mobile */
          width: var(--sidebar-width);
          transform: translateX(-100%); /* Ensure it stays hidden if collapsed on resize */
         }
          .dashboard__sidebar.collapsed.open {
            transform: translateX(0); /* Allow opening even if resized while collapsed */
          }
         .dashboard__sidebar.collapsed .nav-text,
         .dashboard__sidebar.collapsed .logo {
          opacity: 1;
          width: auto;
          pointer-events: auto;
          display: block; /* Ensure logo is block on mobile if collapsed state persists */
         }
         .dashboard__sidebar.collapsed .nav-item {
          justify-content: flex-start;
         }
         .dashboard__sidebar.collapsed .nav-item svg {
            margin-right: 0.75rem;
         }
         .dashboard__sidebar.collapsed .sidebar-header {
          justify-content: space-between;
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
            margin: -1.5rem -1.5rem 1.5rem -1.5rem; /* Adjust for mobile padding */
         }
         .sidebar-overlay.open {
          display: block;
         }
         /* Hide desktop-only toggle */
         .sidebar-header .sidebar-toggle-btn {
          display: none; /* Keep hidden on mobile */
         }
         /* Show mobile toggle */
          .mobile-menu-btn {
            display: block;
          }
        }
         /* Ensure toggle btn IS visible on desktop, even if hidden by mobile rules initially */
         @media (min-width: 769px) {
           .sidebar-header .sidebar-toggle-btn {
            display: block;
          }
         }


        /* --- Notification Dot --- */
        .nav-notification-dot {
         position: absolute;
         top: 1rem;
         right: 1.25rem;
         width: 8px;
         height: 8px;
         background-color: var(--red-500);
         border-radius: 50%;
         border: 2px solid var(--admin-primary);
         transition: right 0.3s ease, top 0.3s ease;
        }
        .dashboard__sidebar.collapsed .nav-notification-dot {
         top: 0.75rem;
         right: 0.75rem; /* Adjusted slightly */
        }
        
        /* --- Notification List Styles --- */
        .notification-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
        .notification-item { display: flex; gap: 1rem; padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; background-color: var(--white); align-items: center; }
        .notification-icon { color: var(--blue-500); flex-shrink: 0; margin-top: 0px; }
        .notification-content { flex-grow: 1; }
        .notification-message { color: var(--gray-800); margin-bottom: 0.25rem; }
        .notification-time { font-size: 0.8rem; color: var(--gray-600); }
        .notification-delete-btn { background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: color 0.2s, background-color 0.2s; flex-shrink: 0; }
        .notification-delete-btn:hover { color: var(--red-500); background-color: var(--gray-100); }
        .notification-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        
        /* --- Rating Styles --- */
        .ratings-list { display: flex; flex-direction: column; gap: 1rem; }
        .rating-item { border: 1px solid var(--gray-200); border-radius: 0.5rem; background-color: var(--white); padding: 1rem; }
        .rating-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem; }
        .rating-reviewer { font-weight: 600; color: var(--gray-800); }
        .rating-stars { display: flex; gap: 0.125rem; }
        .star-filled { color: var(--yellow-500); }
        .star-empty { color: var(--gray-200); }
        .rating-vehicle { font-size: 0.875rem; color: var(--gray-600); font-style: italic; margin-top: 0.25rem; }
        .rating-comment { margin-top: 0.5rem; color: var(--gray-700); }

        /* --- Other Styles --- */
        .main-title { font-size: 1.875rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--gray-800); }
        .sub-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: var(--gray-800); }

        .card { background-color: var(--white); padding: 1.5rem; border-radius: 0.5rem; box-shadow: var(--shadow-md); margin-bottom: 1.5rem; animation: fadeIn 0.5s ease-out; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
        .stat-number { font-size: 2.25rem; font-weight: 700; margin-top: 0.5rem; }
        .stat-verification { font-size: 1.2rem; font-weight: 600; color: var(--green-500); display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        .stat-verification.pending { color: var(--yellow-500); }
        .stat-verification.rejected { color: var(--red-500); }
        .stat-verification.error { color: var(--red-500); }

        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 1rem; font-weight: 600; text-decoration: none; border: none; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s; box-shadow: var(--shadow-md); width: auto; }
        .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .btn-primary { background-color: var(--orange-500); color: var(--white); }
        .btn-secondary { background-color: var(--gray-100); color: var(--gray-800); }
        .btn-success { background-color: var(--green-500); color: var(--white); }
        .btn-danger { background-color: var(--red-500); color: var(--white); }
        .btn-link { background: none; color: var(--orange-500); font-weight: 600; cursor: pointer; padding: 0; text-decoration: none; border: none; }
        .btn-link:hover { text-decoration: underline; }
        .btn:disabled { background-color: var(--gray-200); cursor: not-allowed; opacity: 0.7; }
        .button-group { display: flex; gap: 1rem; flex-wrap: wrap; } .button-group .btn { flex: 1; min-width: 150px; }
        .button-group-sm { display:flex; gap: 0.5rem; flex-wrap: wrap; }

        .form-group { margin-bottom: 1.5rem; text-align: left; }
        .form-label { display: block; font-weight: 500; color: var(--gray-700); margin-bottom: 0.5rem; }
        .input-wrapper { position: relative; }
        .form-input, .form-select, .form-textarea {
         width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--gray-200);
         border-radius: 0.5rem; font-size: 1rem; transition: box-shadow 0.2s;
         box-sizing: border-box; font-family: 'Inter', sans-serif;
        }
        .form-textarea { min-height: 120px; }
        .form-input[readonly] { background-color: var(--gray-100); }
        .form-input::placeholder { color: #9ca3af; opacity: 1; }

        .input-icon {
         position: absolute;
         left: 1rem;
         top: 50%;
         transform: translateY(-50%);
         color: var(--gray-600);
         pointer-events: none;
         z-index: 10;
        }
        .form-input-with-icon {
         padding-left: 3.5rem;
        }

        .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
        .error-message { background-color: #fee2e2; color: #b91c1c; padding: 0.75rem; border-radius: 0.5rem; text-align: center; margin-bottom: 1.5rem; animation: fadeIn 0.3s; }
        .success-message { background-color: #dcfce7; color: #166534; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }

        .form-grid-col-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
        .form-grid-col-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }

        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--gray-200); white-space: nowrap; }
        .data-table th { background-color: var(--gray-100); font-size: 0.75rem; text-transform: uppercase; }
        .overflow-auto { overflow-x: auto; }

        .vehicle-card { background: var(--white); border-radius: 0.5rem; box-shadow: var(--shadow-md); overflow: hidden; cursor: pointer; transition: transform 0.2s; }
        .vehicle-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .vehicle-card-image { width: 100%; height: 12rem; object-fit: cover; background-color: var(--gray-200); }
        .vehicle-card-body { padding: 1rem; }
        .vehicle-card-title { font-size: 1.125rem; font-weight: 600; color: var(--gray-800); }
        .vehicle-card-location { font-size: 0.875rem; color: var(--gray-600); display: flex; align-items: center; margin-top: 0.25rem; gap: 0.25rem; }
        .vehicle-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
        .vehicle-card-price { font-size: 1.125rem; font-weight: 700; color: var(--gray-800); }
        .vehicle-card-price span { font-size: 0.875rem; color: var(--gray-600); font-weight: 400; }
        .vehicle-detail-card { display: flex; flex-direction: column; gap: 2rem; }
        @media (min-width: 768px) { .vehicle-detail-card { flex-direction: row; } }
        .vehicle-detail-image-wrapper { flex: 1; }
        .vehicle-detail-image { width: 100%; height: auto; border-radius: 0.5rem; box-shadow: var(--shadow-md); background-color: var(--gray-200); }
        .vehicle-detail-info { flex: 1; }
        .vehicle-detail-title { font-size: 2.25rem; font-weight: 800; color: var(--gray-800); }
        .vehicle-detail-meta { display: flex; align-items: center; margin-top: 1rem; color: var(--gray-700); gap: 0.5rem; }
        .vehicle-detail-price-wrapper { margin: 1.5rem 0; }
        .vehicle-detail-price { font-size: 2.25rem; font-weight: 800; color: var(--gray-800); }
        .vehicle-detail-price span { font-size: 1rem; font-weight: 500; color: var(--gray-600); }
        .vehicle-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }

        .search-container { position: relative; margin-bottom: 1.5rem; }
        .search-input { width: 100%; padding: 1rem 1rem 1rem 3rem; border-radius: 9999px; border: 1px solid var(--gray-200); font-size: 1rem; }
        .search-input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--gray-600); pointer-events: none; }

        .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; align-items: end; margin-bottom: 1.5rem; }
        .range-group { grid-column: 1 / -1; }
        .range-slider { width: 100%; }

        .document-upload { margin-bottom: 1.5rem; }
        .document-upload .form-group { margin-bottom: 1rem; }
        .file-input-group { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
        .file-name { color: var(--gray-700); font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 1; min-width: 50px;}
        .hidden { display: none; }
        .file-input-group label.btn { cursor: pointer; background-color: var(--gray-200); color: var(--gray-800); }
        .file-input-group label.btn:hover { background-color: var(--gray-300); }


        .saved-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 1rem; }
        .saved-card-info { display: flex; align-items: center; gap: 1rem; }
        .saved-card-info span { font-family: monospace; font-size: 1.1rem; }

        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem; }

        .status-chip { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
        .status-chip-green { background-color: #dcfce7; color: #166534; }
        .status-chip-blue { background-color: #dbeafe; color: #1e40af; }
        .status-chip-red { background-color: #fee2e2; color: #991b1b; }
        .status-chip-yellow { background-color: #fef9c3; color: #854d0e; }
        .status-chip-gray { background-color: #f3f4f6; color: #4b5563; }

        /* --- Complaint Styles --- */
        .complaint-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1.5rem; }
        .complaint-item { border: 1px solid var(--gray-200); border-radius: 0.5rem; }
        .complaint-header { padding: 1rem; background-color: var(--gray-50); border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .complaint-body { padding: 1rem; }
        .complaint-body p { margin-top: 0.5rem; color: var(--gray-700); }
        .complaint-replies { padding: 1rem; border-top: 1px solid var(--gray-100); display: flex; flex-direction: column; gap: 1rem; }
        .reply-item { background-color: var(--gray-100); padding: 1rem; border-radius: 0.5rem; }
        .reply-item-header { font-size: 0.875rem; font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem; }
        .reply-item-body { color: var(--gray-800); }
       
        .loading-container { display: flex; justify-content: center; align-items: center; padding: 2rem; }
        .spinner { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .slide-down { overflow: hidden; animation: slideDown 0.5s ease-out forwards; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 500px; } }

        .w-full { width: 100%; }
        .text-center { text-align: center; }
        .placeholder-icon { margin: 0 auto 1rem auto; color: var(--orange-500); }
        .back-button { display: inline-flex; align-items: center; margin-bottom: 1.5rem; background: none; border: none; cursor: pointer; font-weight: 600; color: var(--gray-600); padding: 0;}
        .back-button .icon { margin-right: 0.5rem; }

        /* --- Modal Styles --- */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: var(--white); padding: 2rem; border-radius: 0.5rem; box-shadow: var(--shadow-lg); width: 90%; max-width: 600px; animation: fadeIn 0.3s; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--gray-200); padding-bottom: 1rem; }
        .modal-title { font-size: 1.5rem; font-weight: 700; color: var(--gray-800); }
        .modal-close-btn { background: none; border: none; cursor: pointer; color: var(--gray-600); padding: 0.5rem; }
        .modal-body { display: flex; flex-direction: column; gap: 1rem; }
       
        /* Star Rating Component */
        .star-rating { display: flex; gap: 0.25rem; cursor: pointer; }
        .star-rating .star { color: var(--gray-300); transition: color 0.2s; }
        .star-rating .star.filled { color: var(--yellow-500); }
        .star-rating:hover .star { color: var(--yellow-500); }
        .star-rating .star:hover ~ .star { color: var(--gray-300); }

    `}</style>
);

// --- Sub-Components ---

// --- Sidebar Component ---
const Sidebar = React.forwardRef(({ activeTab, onTabClick, onLogout, isCollapsed, onToggle, unreadCount, className }, ref) => {

    const NavItem = ({ tabName, icon, children, hasNotification }) => (
        <li>
            <button
                onClick={() => {
                    onTabClick(tabName);
                }}
                className={`nav-item ${activeTab === tabName ? 'active' : ''}`}
                title={isCollapsed ? children : ""} // Show tooltip when collapsed
            >
                {React.cloneElement(icon, { size: 20 })}
                <span className="nav-text">{children}</span>
                {hasNotification && <span className="nav-notification-dot"></span>}
            </button>
        </li>
    );

    return (
        // Apply the 'ref' and the 'className' prop
        <aside ref={ref} className={`dashboard__sidebar ${isCollapsed ? 'collapsed' : ''} ${className || ''}`}>
            <div className="sidebar-header">
                <h1 className="logo">READY GO</h1>
                {/* Conditionally render button based on mobile view (handled by parent logic + CSS) */}
                <button onClick={onToggle} className="sidebar-toggle-btn" title={isCollapsed ? "Expand Menu" : "Collapse Menu"}>
                    <Menu size={24} />
                </button>
            </div>
            <ul className="dashboard__nav">
                <NavItem tabName="dashboard" icon={<LayoutDashboard />}>Dashboard</NavItem>
                <NavItem tabName="vehicle-search" icon={<Search />}>Vehicle Search</NavItem>
                <NavItem tabName="map-search" icon={<MapPin />}>Map Search</NavItem>
                <NavItem tabName="history" icon={<History />}>Booking History</NavItem>
                <NavItem tabName="notifications" icon={<Bell />} hasNotification={unreadCount > 0}>Notifications</NavItem>
                <NavItem tabName="verify" icon={<FileText />}>Verify Docs</NavItem>
                <NavItem tabName="ratings" icon={<Star />}>Ratings</NavItem> {/* ADDED Ratings NavItem */}
                <NavItem tabName="complaints" icon={<MessageSquareWarning />}>Complaints</NavItem>
                <NavItem tabName="payment" icon={<CreditCard />}>Payments</NavItem>
                <NavItem tabName="profile" icon={<UserCog />}>Profile</NavItem>
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

// --- Star Rating Component (used in FeedbackModal and CustomerRatings) ---
const StarRatingDisplay = ({ rating }) => (
    <div className="rating-stars">
        {[...Array(5)].map((_, i) => (
            i < rating ? <Star key={i} size={16} className="star-filled" /> : <Star key={i} size={16} className="star-empty" />
        ))}
    </div>
);

// --- Star Rating Input Component (used in FeedbackModal) ---
const StarRatingInput = ({ rating, setRating }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="star-rating">
            {[...Array(5)].map((star, index) => {
                const ratingValue = index + 1;
                return (
                    <label key={index}>
                        <input
                            type="radio"
                            name="rating"
                            value={ratingValue}
                            onClick={() => setRating(ratingValue)}
                            style={{ display: 'none' }}
                        />
                        <Star
                            className="star"
                            size={32}
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(0)}
                            fill={ratingValue <= (hover || rating) ? 'var(--yellow-500)' : 'none'}
                            style={{ color: ratingValue <= (hover || rating) ? 'var(--yellow-500)' : 'var(--gray-300)' }}
                        />
                    </label>
                );
            })}
        </div>
    );
};

// --- Vehicle Condition Modal ---
const VehicleConditionModal = ({ booking, onClose }) => {
    if (!booking || !booking.preRideVideo) {
        console.warn("Attempted to open video modal without booking or video URL");
        return null; // Don't render if data is missing
    }

    // --- MODIFIED: Handle Cloudinary URLs vs Local Paths ---
    const videoUrl = booking.preRideVideo.startsWith('http')
        ? booking.preRideVideo
        : `${API_BASE_URL}/${booking.preRideVideo.replace(/\\/g, '/')}`;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Pre-Ride Vehicle Condition</h3>
                    <button onClick={onClose} className="modal-close-btn"><X size={24} /></button>
                </div>
                <div className="modal-body">
                    <p>This is the pre-ride condition video uploaded by the owner for your booking of: <strong>{booking.vehicleId?.name || 'Vehicle'}</strong>.</p>
                    
                    <div style={{ background: '#000', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                        <video width="100%" controls autoPlay muted loop>
                           <source src={videoUrl} type="video/mp4" /> {/* Use the modified videoUrl */}
                           {/* Add more source types if needed (e.g., video/webm) */}
                           Your browser does not support the video tag.
                        </video>
                    </div>

                    <div className="form-actions" style={{justifyContent: 'center'}}>
                        <button type="button" className="btn btn-primary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Feedback Modal ---
const FeedbackModal = ({ booking, onClose, onFeedbackSubmitted }) => {
    const [vehicleRating, setVehicleRating] = useState(0);
    const [ownerRating, setOwnerRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!booking) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (vehicleRating === 0 || ownerRating === 0) {
            setError('Please provide a rating for both the vehicle and the owner.');
            return;
        }
        setError('');
        setLoading(true);

        try {
             const token = getAuthToken();
             const response = await fetch(`${API_BASE_URL}/reviews`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     bookingId: booking._id,
                     vehicleId: booking.vehicleId._id,
                     ownerId: booking.ownerId._id, // Pass the owner's ID object
                     vehicleRating,
                     ownerRating,
                     comment
                 })
             });
             if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to submit feedback.');
             }
            
            onFeedbackSubmitted(booking._id); // Tell parent component to update
            onClose(); // Close modal

        } catch (err) {
            setError(err.message || 'An error occurred.');
            setLoading(false); // Stop loading only on error
        }
        // Don't setLoading(false) on success because the modal closes
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Leave Feedback</h3>
                    <button onClick={onClose} className="modal-close-btn"><X size={24} /></button>
                </div>
                <form className="modal-body" onSubmit={handleSubmit}>
                    <p>How was your experience with <strong>{booking.vehicleId?.name || 'this vehicle'}</strong>?</p>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="form-group">
                        <label className="form-label">Vehicle Condition</label>
                        <StarRatingInput rating={vehicleRating} setRating={setVehicleRating} />
                    </div>
                    
                    <div className="form-group">
                         <label className="form-label">Owner Experience</label>
                         <StarRatingInput rating={ownerRating} setRating={setOwnerRating} />
                    </div>

                    <div className="form-group">
                         <label className="form-label" htmlFor="feedback-comment">Comments (Optional)</label>
                         <textarea
                            id="feedback-comment"
                            className="form-textarea"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What went well? What could be improved?"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 className="spinner" size={16} /> : <><Send size={16} /> Submit Feedback</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CustomerDashboardHome = ({ setActiveTab }) => {
    const [stats, setStats] = useState({ upcoming: 0, completed: 0, verificationStatus: 'Checking...' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/bookings/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to load dashboard stats.');
                const data = await response.json();
                setStats(data);
            } catch (err) {
                console.error(err);
                setStats({ upcoming: '?', completed: '?', verificationStatus: 'Error' });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const getVerificationStatus = () => {
        switch (stats.verificationStatus) {
            case 'Verified':
                return <p className="stat-verification"><ShieldCheck size={18} /> Verified</p>;
            case 'Pending':
                return <p className="stat-verification pending"><Loader2 size={18} className="spinner" /> Pending Review</p>;
            case 'Rejected':
                return <p className="stat-verification rejected"><X size={18} /> Rejected</p>;
            case 'Error':
                 return <p className="stat-verification error">Error Loading Status</p>;
            default:
                return <p className="stat-verification error">Not Verified</p>;
        }
    };

    return (
        <div className="fade-in">
            <h2 className="main-title">Welcome back!</h2>
            <div className="stats-grid">
                <div className="card">
                    <h3 className="sub-title">Upcoming</h3>
                    <p className="stat-number" style={{color: 'var(--orange-500)'}}>{loading ? <Loader2 size={30} className="spinner" /> : stats.upcoming}</p>
                </div>
                <div className="card">
                    <h3 className="sub-title">Completed</h3>
                    <p className="stat-number" style={{color: 'var(--blue-500)'}}>{loading ? <Loader2 size={30} className="spinner" /> : stats.completed}</p>
                </div>
                <div className="card">
                    <h3 className="sub-title">Verification</h3>
                    {loading ? <div className="loading-container"><Loader2 size={30} className="spinner" /></div> : getVerificationStatus()}
                </div>
            </div>
            <div className="button-group" style={{marginBottom: '1.5rem'}}>
                <button onClick={() => setActiveTab('vehicle-search')} className="btn btn-primary">Book a New Ride</button>
                <button onClick={() => setActiveTab('complaints')} className="btn btn-secondary">Report an Issue</button>
            </div>
             <div className="card">
                <h3 className="sub-title">Recent Notifications</h3>
                <p>Check the <button className="btn-link" onClick={() => setActiveTab('notifications')}>Notifications</button> tab for updates.</p>
            </div>
        </div>
    );
};

const CustomerVehicleSearch = ({ setSelectedVehicle }) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ type: 'All', price: 5000 });

     useEffect(() => {
        const fetchVehicles = async () => {
            setLoading(true);
            setError('');
            try {
                // We fetch all vehicles and filter on the client
                // A real app would use query params: /vehicles?search=...&type=...
                const response = await fetch(`${API_BASE_URL}/vehicles`);
                if (!response.ok) throw new Error('Failed to fetch vehicles');
                let data = await response.json();

                // Client-side filtering
                const searchLower = searchTerm.toLowerCase();
                data = data.filter(v =>
                    (v.name.toLowerCase().includes(searchLower) || v.location.toLowerCase().includes(searchLower)) &&
                    (filters.type === 'All' || v.type === filters.type) &&
                    (v.pricePerDay <= filters.price) &&
                    v.isAvailable
                );
                setVehicles(data);
            } catch (err) {
                setError(err.message);
            } finally { setLoading(false); }
        };
        // Debounce search
        const timerId = setTimeout(fetchVehicles, 300);
        return () => clearTimeout(timerId);
    }, [searchTerm, filters]);

    const handleFilterChange = (e) => setFilters({...filters, [e.target.name]: e.target.value});

    return (
        <div className="fade-in">
            <h2 className="main-title">Find Your Ride</h2>
            <div className="card filter-card">
                 <div className="search-container">
                    <Search className="search-input-icon" size={20}/>
                    <input
                        type="text"
                        placeholder="Search by name or location (e.g., Guntur, Swift)"
                        className="search-input form-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <div className="filter-grid">
                      <div className="form-group">
                        <label className="form-label">Type</label>
                        <select name="type" value={filters.type} onChange={handleFilterChange} className="form-select">
                            <option>All</option>
                            <option>Car</option>
                            <option>Bike</option>
                            <option>Scooter</option>
                        </select>
                      </div>
                      <div className="form-group range-group">
                        <label className="form-label">Max Price: ₹{parseInt(filters.price).toLocaleString('en-IN')}</label>
                        <input type="range" name="price" min="500" max="5000" step="100" value={filters.price} onChange={handleFilterChange} className="range-slider"/>
                      </div>
                 </div>
            </div>
            {loading && <div className="loading-container"><Loader2 className="spinner" /></div>}
            {error && <div className="error-message">{error}</div>}
            {!loading && !error && (
                <div className="vehicle-grid">
                    {vehicles.length > 0 ? vehicles.map(vehicle => (
                        <CustomerVehicleCard key={vehicle._id} vehicle={vehicle} onSelect={setSelectedVehicle} />
                    )) : (
                        <p className="text-center" style={{gridColumn: '1 / -1'}}>
                            No vehicles match your criteria. Try adjusting your filters.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

// --- IMPLEMENTED: CustomerMapSearch ---
const CustomerMapSearch = ({ setSelectedVehicle }) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

     useEffect(() => {
        const fetchVehicles = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE_URL}/vehicles`);
                if (!response.ok) throw new Error('Failed to fetch vehicles');
                let data = await response.json();

                // Client-side filtering by location
                const searchLower = searchTerm.toLowerCase();
                if (searchLower) {
                    data = data.filter(v =>
                        v.location.toLowerCase().includes(searchLower) && v.isAvailable
                    );
                } else {
                    data = data.filter(v => v.isAvailable); // Show all if no search term
                }
                setVehicles(data);
            } catch (err) {
                setError(err.message);
            } finally { setLoading(false); }
        };
        const timerId = setTimeout(fetchVehicles, 300);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    return (
        <div className="fade-in">
            <h2 className="main-title">Search by Location</h2>
            <div className="card filter-card">
                 <div className="search-container">
                    <MapPin className="search-input-icon" size={20}/>
                    <input
                        type="text"
                        placeholder="Enter a city or area (e.g., Guntur)"
                        className="search-input form-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <p>Showing results for vehicles available in your searched location. A full map view is coming soon!</p>
            </div>
            {loading && <div className="loading-container"><Loader2 className="spinner" /></div>}
            {error && <div className="error-message">{error}</div>}
            {!loading && !error && (
                <div className="vehicle-grid">
                    {vehicles.length > 0 ? vehicles.map(vehicle => (
                        <CustomerVehicleCard key={vehicle._id} vehicle={vehicle} onSelect={setSelectedVehicle} />
                    )) : (
                         <p className="text-center" style={{gridColumn: '1 / -1'}}>
                            {searchTerm ? 'No vehicles found in that location.' : 'No vehicles currently available.'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};


// --- MODIFIED: CustomerBookingHistory ---
const CustomerBookingHistory = ({ bookings, loading, error, onOpenVideoModal, onOpenFeedbackModal }) => {

    const getStatusChipClass = (status) => {
        switch (status) {
            case 'Completed': return 'status-chip-green';
            case 'Confirmed': case 'Upcoming': return 'status-chip-blue';
            case 'Cancelled': return 'status-chip-red';
            case 'Pending': return 'status-chip-yellow';
            default: return 'status-chip-gray';
        }
    };
    
    return (
        <div className="fade-in">
            <h2 className="main-title">Booking History</h2>
            <div className="card overflow-auto">
                 {loading && <div className="loading-container"><Loader2 className="spinner" /></div>}
                 {error && <div className="error-message">{error}</div>}
                 {!loading && !error && bookings.length === 0 && <p style={{textAlign: 'center'}}>You haven't made any bookings yet.</p>}
                 {!loading && !error && bookings.length > 0 && (
                      <table className="data-table">
                           <thead><tr><th>Booking ID</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                           <tbody>
                                {bookings.map(booking => (
                                     <tr key={booking._id}>
                                         <td>{booking._id.slice(-8)}</td>
                                         <td>{booking.vehicleId?.name || 'Vehicle Removed'}</td>
                                         <td>{new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}</td>
                                         <td>₹{booking.totalPrice.toLocaleString('en-IN')}</td>
                                         <td><span className={`status-chip ${getStatusChipClass(booking.status)}`}>{booking.status}</span></td>
                                         <td>
                                             {/* --- Workflow Actions --- */}
                                             {(booking.status === 'Upcoming' || booking.status === 'Confirmed') && booking.preRideVideo && ( // Only show if video exists
                                                 <button className="btn-link" onClick={() => onOpenVideoModal(booking)}>
                                                     <Video size={16} style={{marginRight: '0.25rem'}}/> View Condition
                                                 </button>
                                             )}
                                             {booking.status === 'Completed' && !booking.feedbackGiven && (
                                                  <button className="btn-link" onClick={() => onOpenFeedbackModal(booking)}>
                                                      <Star size={16} style={{marginRight: '0.25rem'}}/> Leave Feedback
                                                  </button>
                                             )}
                                             {booking.status === 'Completed' && booking.feedbackGiven && (
                                                  <span style={{color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                                                      <CheckCircle size={16} /> Feedback Submitted
                                                  </span>
                                             )}
                                              {booking.status === 'Pending' && (
                                                  <span style={{color: 'var(--gray-600)'}}>Waiting for Owner</span>
                                             )}
                                              {booking.status === 'Cancelled' && (
                                                  <span style={{color: 'var(--gray-600)'}}>No Action</span>
                                             )}
                                         </td>
                                     </tr>
                                ))}
                           </tbody>
                      </table>
                 )}
            </div>
        </div>
    );
};


const CustomerVerifyDocuments = () => {
    const [docs, setDocs] = useState({
        license: { file: null, status: 'Not Uploaded', number: '' },
        address: { file: null, status: 'Not Uploaded', number: '' }
    });
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    useEffect(() => {
        const fetchDocStatus = async () => {
             setFetchLoading(true);
             try {
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/documents/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if(response.ok) {
                    const data = await response.json();
                    setDocs({
                        license: { file: null, status: data.licenseStatus || 'Not Uploaded', number: data.licenseNumber || '' },
                        address: { file: null, status: data.addressStatus || 'Not Uploaded', number: data.aadhaarNumber || '' }
                    });
                } else {
                     throw new Error("Failed to fetch status");
                }
             } catch (err) {
                 console.error("Failed to fetch document status:", err);
                 setMessage("Error fetching current document status.");
             } finally {
                 setFetchLoading(false);
             }
        };
        fetchDocStatus();
    }, []);

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setMessage('');
        if (files[0]) {
            if (!files[0].type.startsWith('image/') && !files[0].type.includes('pdf')) {
                 setMessage(`Invalid file type. Please upload images or PDFs.`);
                 e.target.value = null; return;
            }
             if (files[0].size > 10 * 1024 * 1024) { // 10MB limit (matching Cloudinary)
                 setMessage(`File size exceeds 10MB limit.`);
                 e.target.value = null; return;
            }
            setDocs(prev => ({ ...prev, [name]: { ...prev[name], file: files[0], status: 'Ready to Upload' }}));
        } else {
             setDocs(prev => ({ ...prev, [name]: { ...prev[name], file: null }}));
        }
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        const docType = name === 'licenseNumber' ? 'license' : 'address';
        setMessage('');
        setDocs(prev => ({ ...prev, [docType]: { ...prev[docType], number: value }}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!docs.license.number) { setMessage("Please enter your Driving License Number."); return; }
        if (!docs.address.number) { setMessage("Please enter your Aadhaar Number."); return; }
        
        if (!docs.license.file && (docs.license.status === 'Not Uploaded' || docs.license.status === 'Rejected')) { setMessage("Please choose a Driving License file."); return; }
        if (!docs.address.file && (docs.address.status === 'Not Uploaded' || docs.address.status === 'Rejected')) { setMessage("Please choose an Address Proof file."); return; }

        setMessage(''); setIsLoading(true);

        try {
            const token = getAuthToken();
            const formData = new FormData();

            if (docs.license.file) formData.append('license', docs.license.file);
            if (docs.address.file) formData.append('address', docs.address.file);
            
            formData.append('licenseNumber', docs.license.number);
            formData.append('aadhaarNumber', docs.address.number);

            const response = await fetch(`${API_BASE_URL}/documents/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.message || 'Upload failed.');
            }

            const result = await response.json();
            setMessage(result.message || 'Documents submitted successfully. Pending review.');

            setDocs({
                license: { file: null, status: result.licenseStatus || docs.license.status, number: docs.license.number },
                address: { file: null, status: result.addressStatus || docs.address.status, number: docs.address.number }
            });

        } catch (err) {
            setMessage(`Submission failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

     const getStatusChipClass = (status) => {
          switch (status) {
              case 'Verified': return 'status-chip-green';
              case 'Pending Review': return 'status-chip-yellow';
              case 'Ready to Upload': return 'status-chip-blue';
              case 'Rejected': return 'status-chip-red';
              default: return 'status-chip-gray';
          }
       };


    if (fetchLoading) {
        return <div className="loading-container"><Loader2 className="spinner" /> Loading Document Status...</div>;
    }

    return (
        <div className="fade-in">
            <h2 className="main-title">Verify Documents</h2>
              {message && <div className={message.includes('success') ? "success-message card" : "error-message card"}>{message}</div>}
            <form onSubmit={handleSubmit} className="card">
                {/* --- License Section --- */}
                <div className="document-upload">
                    <label className="form-label">Driving License</label>
                    <div className="form-group">
                         <label className="form-label" htmlFor="licenseNumber" style={{fontSize: '0.9rem', color: 'var(--gray-600)'}}>License Number</label>
                        <input
                            id="licenseNumber" type="text" name="licenseNumber"
                            value={docs.license.number} onChange={handleNumberChange}
                            className="form-input" placeholder="Enter Driving License Number" required
                            readOnly={docs.license.status === 'Verified' || docs.license.status === 'Pending Review'}
                        />
                    </div>
                    <div className="file-input-group">
                        <input type="file" name="license" onChange={handleFileChange} className="hidden" id="license-upload" accept="image/*,.pdf"/>
                        <label htmlFor="license-upload" className="btn btn-secondary btn-sm">Choose File</label>
                        <span className="file-name">{docs.license.file?.name || 'No file chosen'}</span>
                        <span className={`status-chip ${getStatusChipClass(docs.license.status)}`}>{docs.license.status}</span>
                    </div>
                      {docs.license.status === 'Rejected' && <small style={{color: 'var(--red-500)', marginTop: '0.5rem'}}>Your license was rejected. Please upload a new, clear image.</small>}
                </div>

                {/* --- Address Proof Section --- */}
                <div className="document-upload">
                    <label className="form-label">Address Proof (Aadhaar)</label>
                     <div className="form-group">
                         <label className="form-label" htmlFor="aadhaarNumber" style={{fontSize: '0.9rem', color: 'var(--gray-600)'}}>Aadhaar Number</label>
                        <input
                            id="aadhaarNumber" type="text" name="aadhaarNumber"
                            value={docs.address.number} onChange={handleNumberChange}
                            className="form-input" placeholder="Enter Aadhaar Number" required
                             readOnly={docs.address.status === 'Verified' || docs.address.status === 'Pending Review'}
                        />
                    </div>
                    <div className="file-input-group">
                        <input type="file" name="address" onChange={handleFileChange} className="hidden" id="address-upload" accept="image/*,.pdf"/>
                        <label htmlFor="address-upload" className="btn btn-secondary btn-sm">Choose File</label>
                        <span className="file-name">{docs.address.file?.name || 'No file chosen'}</span>
                         <span className={`status-chip ${getStatusChipClass(docs.address.status)}`}>{docs.address.status}</span>
                    </div>
                    {docs.address.status === 'Rejected' && <small style={{color: 'var(--red-500)', marginTop: '0.5rem'}}>Your address proof was rejected. Please upload a new, clear image.</small>}
                </div>

                <div className="form-actions" style={{justifyContent: 'flex-start'}}>
                    {/* Disable button if documents are already verified */}
                    <button type="submit" className="btn btn-primary" disabled={isLoading || fetchLoading || (docs.license.status === 'Verified' && docs.address.status === 'Verified')}>
                        {isLoading ? <Loader2 className="spinner" size={16}/> : 'Submit for Verification'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// --- FIXED: CustomerEditProfile Component ---
const CustomerEditProfile = () => {
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    
    const [profileMessage, setProfileMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    // Fetch profile data on load
    useEffect(() => {
        const fetchProfile = async () => {
            setFetchLoading(true);
            setProfileMessage('');
            try {
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/profile/customer`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch profile.');
                const data = await response.json();
                setFormData({ fullName: data.fullName, email: data.email, phone: data.phone || '' });
            } catch (err) {
                setProfileMessage(err.message);
            } finally {
                setFetchLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleFormChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePasswordChange = (e) => {
        setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Handle Profile Update
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage('');
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/profile/customer`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName: formData.fullName, phone: formData.phone })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Update failed.');
            setProfileMessage('Profile updated successfully!');
            // Update local storage user data
            const user = getUserData();
            if (user) {
                user.fullName = data.fullName;
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch (err) {
            setProfileMessage(err.message);
        } finally {
            setProfileLoading(false);
        }
    };

    // Handle Password Change
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage("New passwords do not match.");
            return;
        }
        if (passwordData.newPassword.length < 6) {
             setPasswordMessage("New password must be at least 6 characters long.");
             return;
        }

        setPasswordLoading(true);
        setPasswordMessage('');
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/profile/customer/password`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    currentPassword: passwordData.currentPassword, 
                    newPassword: passwordData.newPassword 
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Password change failed.');
            setPasswordMessage('Password updated successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordMessage(err.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    if (fetchLoading) {
        return <div className="loading-container"><Loader2 className="spinner" /> Loading Profile...</div>;
    }

    return (
        <div className="fade-in">
            <h2 className="main-title">Manage Profile</h2>
            
            {/* Profile Details Card */}
            <form className="card" onSubmit={handleProfileSubmit}>
                <h3 className="sub-title">Your Details</h3>
                {profileMessage && <div className={profileMessage.includes('success') ? "success-message" : "error-message"}>{profileMessage}</div>}
                
                <div className="form-grid-col-2">
                    <div className="form-group">
                        <label className="form-label" htmlFor="fullName">Full Name</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input id="fullName" type="text" name="fullName" value={formData.fullName} onChange={handleFormChange} className="form-input form-input-with-icon" required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input id="email" type="email" name="email" value={formData.email} className="form-input form-input-with-icon" readOnly />
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number</label>
                    <div className="input-wrapper">
                        <Phone size={18} className="input-icon" />
                        <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleFormChange} className="form-input form-input-with-icon" placeholder="e.g., +919876543210" />
                    </div>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                        {profileLoading ? <Loader2 className="spinner" size={16} /> : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Change Password Card */}
            <form className="card" onSubmit={handlePasswordSubmit}>
                <h3 className="sub-title">Change Password</h3>
                {passwordMessage && <div className={passwordMessage.includes('success') ? "success-message" : "error-message"}>{passwordMessage}</div>}
                
                <div className="form-group">
                    <label className="form-label" htmlFor="currentPassword">Current Password</label>
                    <div className="input-wrapper">
                        <Lock size={18} className="input-icon" />
                        <input id="currentPassword" type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="form-input form-input-with-icon" required />
                    </div>
                </div>
                <div className="form-grid-col-2">
                    <div className="form-group">
                        <label className="form-label" htmlFor="newPassword">New Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input id="newPassword" type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="form-input form-input-with-icon" required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input id="confirmPassword" type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="form-input form-input-with-icon" required />
                        </div>
                    </div>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                        {passwordLoading ? <Loader2 className="spinner" size={16} /> : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const CustomerVehicleCard = ({ vehicle, onSelect }) => (
    <div className="vehicle-card" onClick={() => onSelect(vehicle)}>
        {/* --- MODIFIED: Handle Cloudinary URLs --- */}
        <img
            src={vehicle.imageUrl ? (vehicle.imageUrl.startsWith('http') ? vehicle.imageUrl : `${API_BASE_URL}/${vehicle.imageUrl.replace(/\\/g, '/')}`) : 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}
            alt={vehicle.name}
            className="vehicle-card-image"
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'; }}
        />
        <div className="vehicle-card-body">
            <h3 className="vehicle-card-title">{vehicle.name}</h3>
            <p className="vehicle-card-location"><MapPin size={14} /> {vehicle.location}</p>
            <div className="vehicle-card-footer">
                <p className="vehicle-card-price">₹{vehicle.pricePerDay.toLocaleString('en-IN')}<span> / day</span></p>
                <button className="btn btn-primary" style={{padding: '0.5rem 0.75rem'}}>Book</button>
            </div>
        </div>
    </div>
);

// --- IMPLEMENTED: CustomerVehicleDetail ---
const CustomerVehicleDetail = ({ vehicle, onBack, setActiveTab }) => {
    const [booking, setBooking] = useState({
        startDate: '',
        endDate: '',
        totalPrice: 0,
        days: 0
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Helper to get today's date string
    const getMinDate = () => new Date().toISOString().split('T')[0];
    
    // Calculate price
    useEffect(() => {
        if (booking.startDate && booking.endDate) {
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            if (end >= start) { // Allow same-day booking
                const diffTime = Math.abs(end - start);
                // Calculate days inclusively
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setBooking(prev => ({
                    ...prev,
                    days: diffDays,
                    totalPrice: diffDays * vehicle.pricePerDay
                }));
             } else {
                 setBooking(prev => ({ ...prev, days: 0, totalPrice: 0 }));
            }
        } else {
             setBooking(prev => ({ ...prev, days: 0, totalPrice: 0 }));
        }
    }, [booking.startDate, booking.endDate, vehicle.pricePerDay]);


    const handleDateChange = (e) => {
        setMessage('');
        const { name, value } = e.target;
         // Ensure end date is not before start date
         if (name === 'startDate' && booking.endDate && new Date(value) > new Date(booking.endDate)) {
             setBooking(prev => ({ ...prev, startDate: value, endDate: value })); // Reset end date if start > end
         } else {
             setBooking(prev => ({ ...prev, [name]: value }));
         }
    };
    
    const handleContactOwner = () => {
        // Mock function: In a real app, this would open a chat modal or trigger a call
        setMessage(`Contacting ${vehicle.ownerId?.fullName || 'Owner'}... (Feature not implemented)`);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleBookingSubmit = async () => {
        if (booking.days <= 0) {
            setMessage('Please select a valid date range.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const token = getAuthToken();
            const ownerId = vehicle.ownerId?._id || vehicle.ownerId; // Handle populated vs non-populated
            if (!ownerId) {
                throw new Error('Vehicle owner information is missing.');
            }
            
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                      vehicleId: vehicle._id,
                      ownerId: ownerId,
                      startDate: booking.startDate,
                      endDate: booking.endDate,
                      totalPrice: booking.totalPrice
                 })
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.message || 'Booking failed. Vehicle might be unavailable.');
            
            setMessage('Booking request sent! The owner will confirm and upload a video shortly. Check your history for status.');

            // Wait 2 seconds and go to history tab
            setTimeout(() => {
                onBack(); // Go back to search list
                if (typeof setActiveTab === 'function') {
                    setActiveTab('history');
                }
            }, 2500);

        } catch (err) {
            console.error("Booking Error:", err);
            setMessage(`Booking failed: ${err.message}`);
            setLoading(false); // Only stop loading on error
        }
        // Don't set loading to false on success, as we are redirecting
    };

    return (
         <div className="fade-in">
             <button onClick={onBack} className="back-button"><ArrowLeft size={18} className="icon" /> Back to Search</button>
             <div className="card vehicle-detail-card">
                 <div className="vehicle-detail-image-wrapper">
                      {/* --- MODIFIED: Handle Cloudinary URLs --- */}
                      <img
                         src={vehicle.imageUrl ? (vehicle.imageUrl.startsWith('http') ? vehicle.imageUrl : `${API_BASE_URL}/${vehicle.imageUrl.replace(/\\/g, '/')}`) : 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'}
                         alt={vehicle.name}
                         className="vehicle-detail-image"
                         onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'; }}
                    />
                 </div>
                 <div className="vehicle-detail-info">
                      <h2 className="vehicle-detail-title">{vehicle.name}</h2>
                      <p className="vehicle-detail-meta"><MapPin size={16}/> {vehicle.location}</p>
                      <div className="vehicle-detail-price-wrapper">
                         <p className="vehicle-detail-price">₹{vehicle.pricePerDay.toLocaleString('en-IN')} <span>/ day</span></p>
                      </div>
                      <p>Owner: {vehicle.ownerId?.fullName || 'N/A'}</p>
                      <p>Type: {vehicle.type}</p>
                      
                      <button className="btn btn-secondary" style={{marginTop: '1.5rem', justifyContent: 'center'}} onClick={handleContactOwner}>
                         <MessageSquare size={16} /> Contact Owner
                      </button>

                      <hr style={{margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--gray-200)'}} />

                      <h3 className="sub-title" style={{marginBottom: '1rem'}}>Book Your Ride</h3>
                      {message && <div className={message.includes('sent') || message.includes('Contacting') ? "success-message" : "error-message"}>{message}</div>}
                      
                      <div className="form-grid-col-2">
                          <div className="form-group">
                             <label className="form-label" htmlFor="startDate">Start Date</label>
                             <input 
                                 type="date" 
                                 id="startDate" 
                                 name="startDate"
                                 value={booking.startDate}
                                 onChange={handleDateChange}
                                 min={getMinDate()} // Prevent booking past dates
                                 className="form-input"
                                 required
                             />
                          </div>
                          <div className="form-group">
                             <label className="form-label" htmlFor="endDate">End Date</label>
                              <input 
                                 type="date" 
                                 id="endDate" 
                                 name="endDate"
                                 value={booking.endDate}
                                 onChange={handleDateChange}
                                 min={booking.startDate || getMinDate()} // End date cannot be before start date
                                 className="form-input"
                                 required
                             />
                          </div>
                      </div>
                      
                      {booking.totalPrice > 0 && booking.days > 0 && (
                          <div className="card" style={{backgroundColor: 'var(--gray-50)', marginTop: '1rem'}}>
                             <h4 className="sub-title" style={{marginTop: 0, marginBottom: '0.5rem'}}>Booking Summary</h4>
                             <p style={{fontSize: '1.2rem', fontWeight: 600}}>
                                 Total Price: ₹{booking.totalPrice.toLocaleString('en-IN')}
                             </p>
                              <p style={{fontSize: '0.9rem', color: 'var(--gray-600)'}}>
                                 Duration: {booking.days} day(s)
                             </p>
                          </div>
                      )}

                      <button 
                         className="btn btn-primary w-full" 
                         style={{marginTop: '1.5rem'}} 
                         onClick={handleBookingSubmit}
                         disabled={loading || booking.days <= 0 || message.includes('sent')}
                     >
                         {loading ? <Loader2 className="spinner" size={16} /> : (message.includes('sent') ? 'Request Sent!' : 'Request to Book')}
                     </button>
                 </div>
             </div>
        </div>
    );
};


// --- IMPLEMENTED: Customer Payment Methods ---
const CustomerPaymentMethods = () => {
    const [cards, setCards] = useState([
        { id: 1, last4: '1234', expiry: '12/25' } // Mock data
    ]);
    const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFormChange = (e) => {
        let { name, value } = e.target;
        // Basic input formatting/validation
        if (name === 'number') {
            value = value.replace(/\D/g, '').slice(0, 16); // Remove non-digits, limit length
        } else if (name === 'expiry') {
            value = value.replace(/\D/g, '').slice(0, 4); // Remove non-digits, limit length MMYY
             if (value.length >= 2 && !value.includes('/')) { // Add slash automatically only if not present
                 value = value.slice(0, 2) + '/' + value.slice(2);
             }
        } else if (name === 'cvv') {
            value = value.replace(/\D/g, '').slice(0, 3); // Remove non-digits, limit length
        }
        setNewCard(prev => ({ ...prev, [name]: value }));
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // More robust validation
        if (newCard.number.length !== 16) {
            setMessage('Please enter a valid 16-digit card number.');
            setLoading(false); return;
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(newCard.expiry)) {
             setMessage('Please enter a valid expiry date (MM/YY).');
             setLoading(false); return;
        }
         // Validate expiry date is not in the past
        const [month, year] = newCard.expiry.split('/');
        const expiryDate = new Date(`20${year}`, month - 1, 1); // Month is 0-indexed
        const lastDayOfMonth = new Date(expiryDate.getFullYear(), expiryDate.getMonth() + 1, 0); // Get last day of expiry month
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare dates only

        if (lastDayOfMonth < today) {
            setMessage('Card has expired.');
            setLoading(false); return;
        }

        if (newCard.cvv.length !== 3) {
             setMessage('Please enter a valid 3-digit CVV.');
             setLoading(false); return;
        }

        // Mock API call
        setTimeout(() => {
            const newCardData = {
                id: Date.now(),
                last4: newCard.number.slice(-4),
                expiry: newCard.expiry
            };
            setCards(prev => [...prev, newCardData]);
            setNewCard({ number: '', expiry: '', cvv: '' });
            setMessage('Card added successfully!');
            setLoading(false);
        }, 1000);
    };

    const deleteCard = (id) => {
        setCards(prev => prev.filter(card => card.id !== id));
    };

    return (
        <div className="fade-in">
            <h2 className="main-title">Payment Methods</h2>

            {/* Add New Card Form */}
            <form className="card" onSubmit={handleSubmit}>
                <h3 className="sub-title">Add a New Card</h3>
                {message && <div className={message.includes('success') ? "success-message" : "error-message"}>{message}</div>}

                <div className="form-group">
                    <label className="form-label" htmlFor="number">Card Number</label>
                    <div className="input-wrapper">
                        <CreditCardIcon size={18} className="input-icon" />
                        <input
                            id="number" type="tel" name="number"
                            value={newCard.number} onChange={handleFormChange}
                            className="form-input form-input-with-icon"
                            placeholder="0000 0000 0000 0000"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            maxLength="16"
                            required
                        />
                    </div>
                </div>
                <div className="form-grid-col-2">
                    <div className="form-group">
                        <label className="form-label" htmlFor="expiry">Expiry Date</label>
                        <input
                            id="expiry" type="text" name="expiry"
                            value={newCard.expiry} onChange={handleFormChange}
                            className="form-input"
                            placeholder="MM/YY"
                            maxLength="5"
                            autoComplete="cc-exp"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="cvv">CVV</label>
                        <input
                            id="cvv" type="text" name="cvv"
                            value={newCard.cvv} onChange={handleFormChange}
                            className="form-input"
                            placeholder="123"
                            maxLength="3"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            required
                        />
                    </div>
                </div>
                <div className="form-actions" style={{justifyContent: 'flex-start'}}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={16} /> : 'Add Card'}
                    </button>
                </div>
            </form>

            {/* Saved Cards List */}
            <div className="card">
                <h3 className="sub-title">Your Saved Cards</h3>
                {cards.length === 0 ? (
                    <p>You have no saved cards.</p>
                ) : (
                    <div>
                        {cards.map(card => (
                            <div key={card.id} className="saved-card">
                                <div className="saved-card-info">
                                    <CreditCardIcon size={24} />
                                    <span>•••• {card.last4}</span>
                                    <span>{card.expiry}</span>
                                </div>
                                <button onClick={() => deleteCard(card.id)} className="btn btn-danger" style={{padding: '0.5rem', background: 'none', color: 'var(--red-500)', boxShadow: 'none'}} title="Delete Card">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- MODIFIED: Customer Notifications Component ---
const CustomerNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchNotifications = useCallback(async () => { // useCallback for potential re-use
        setLoading(true); setError('');
        try {
            const token = getAuthToken(); if (!token) throw new Error("Please log in.");
            const response = await fetch(`${API_BASE_URL}/notifications/customer`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch notifications.');
            const data = await response.json();
            setNotifications(data);
        } catch (err) {
            setError(err.message);
            console.error("Notification Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleDeleteNotification = async (notificationId) => {
        // Optimistic UI update
        const originalNotifications = notifications;
        setNotifications(prev => prev.filter(n => n._id !== notificationId));

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/notifications/customer/${notificationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to delete notification.');
            }
            // No need to refetch if successful, already removed optimistically
        } catch (err) {
            console.error("Delete Notification Error:", err);
            setError(`Failed to delete: ${err.message}`);
            // Revert optimistic update on error
            setNotifications(originalNotifications);
        }
    };

    const handleClearAllNotifications = async () => {
        if (!window.confirm("Are you sure you want to delete all notifications?")) return;

        const originalNotifications = notifications;
        setNotifications([]); // Optimistic UI update

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/notifications/customer/all`, {
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
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };


    return (
        <div className="fade-in">
            <div className="notification-header">
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
                      <div className="card text-center">
                          <Bell size={48} className="placeholder-icon" style={{color: 'var(--gray-400)'}} />
                          <p>No new notifications.</p>
                      </div>
                 ) : (
                      <ul className="notification-list">
                          {notifications.map(notif => (
                              <li key={notif._id} className="notification-item">
                                  <div className="notification-icon">
                                      <Bell size={20} />
                                  </div>
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

// --- Customer Complaints Component ---
const CustomerComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [newComplaint, setNewComplaint] = useState({ subject: '', description: '' });
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchComplaints = async () => {
        setLoading(true); setMessage('');
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/complaints/customer`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch complaints.');
            setComplaints(await response.json());
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleFormChange = (e) => {
        setNewComplaint(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true); setMessage('');
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/complaints/customer`, {
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
            <h2 className="main-title">Complaints & Support</h2>

            {/* New Complaint Form */}
            <form className="card" onSubmit={handleSubmit}>
                <h3 className="sub-title">Submit a New Complaint</h3>
                {message && <div className={message.includes('success') ? "success-message" : "error-message"}>{message}</div>}

                <div className="form-group">
                    <label className="form-label" htmlFor="subject">Subject</label>
                    <input
                        id="subject" type="text" name="subject"
                        value={newComplaint.subject} onChange={handleFormChange}
                        className="form-input" placeholder="e.g., Issue with Booking #12345" required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="description">Description</label>
                    <textarea
                        id="description" name="description"
                        value={newComplaint.description} onChange={handleFormChange}
                        className="form-textarea" placeholder="Please provide all details about the issue..." required
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
                {!loading && complaints.length === 0 && <p>You have no submitted complaints.</p>}
                {!loading && complaints.length > 0 && (
                    <ul className="complaint-list">
                        {complaints.map(complaint => (
                            <li key={complaint._id} className="complaint-item">
                                <div className="complaint-header">
                                    <h4 style={{margin: 0}}>{complaint.subject}</h4>
                                    <span className={`status-chip ${getStatusChipClass(complaint.status)}`}>{complaint.status}</span>
                                </div>
                                <div className="complaint-body">
                                    <p>{complaint.description}</p>
                                    <p style={{fontSize: '0.8rem', color: 'var(--gray-600)'}}>Submitted: {new Date(complaint.createdAt).toLocaleString()}</p>
                                </div>
                                {complaint.replies && complaint.replies.length > 0 && (
                                    <div className="complaint-replies">
                                        <h5 style={{margin: 0, fontSize: '0.9rem', color: 'var(--gray-800)'}}>Admin Replies:</h5>
                                        {complaint.replies.map(reply => (
                                            <div key={reply._id || reply.createdAt} className="reply-item"> {/* Use createdAt as fallback key */}
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

// --- NEW: CustomerRatings Component ---
const CustomerRatings = () => {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRatings = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const token = getAuthToken();
            if (!token) throw new Error("Authentication required.");

            // *** Replace with your actual backend endpoint ***
            const response = await fetch(`${API_BASE_URL}/reviews/customer`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to fetch ratings.');
            }
            const data = await response.json();
            setRatings(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error("Fetch Ratings Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRatings();
    }, [fetchRatings]);

    return (
        <div className="fade-in">
            <h2 className="main-title">Your Ratings</h2>
            <div className="card">
                <h3 className="sub-title">Ratings You've Received</h3>
                 {loading && <div className="loading-container"><Loader2 className="spinner" /></div>}
                 {error && <div className="error-message">{error}</div>}
                 {!loading && !error && (
                      ratings.length === 0 ? (
                           <p className="text-center">You have not received any ratings yet.</p>
                      ) : (
                           <div className="ratings-list">
                                {ratings.map(r => (
                                     <div key={r._id} className="rating-item">
                                          <div className="rating-header">
                                               <span className="rating-reviewer">{r.reviewerId?.fullName || 'Anonymous User'}</span>
                                               <StarRatingDisplay rating={r.rating} />
                                          </div>
                                           {/* Display vehicle if it's a vehicle/owner review */}
                                           {(r.reviewType === 'Vehicle' || r.reviewType === 'Owner') && r.bookingId?.vehicleId?.name && (
                                                <p className="rating-vehicle">For: {r.bookingId.vehicleId.name}</p>
                                            )}
                                           {/* Display comment if exists */}
                                           {r.comment && <p className="rating-comment">"{r.comment}"</p>}
                                           <p style={{fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.5rem'}}>
                                               Received: {new Date(r.createdAt).toLocaleDateString()}
                                            </p>
                                     </div>
                                ))}
                           </div>
                      )
                 )}
            </div>
        </div>
    );
};


// --- Main CustomerDashboard Component ---
function CustomerDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    // --- State for Modals ---
    const [videoModalBooking, setVideoModalBooking] = useState(null);
    const [feedbackModalBooking, setFeedbackModalBooking] = useState(null);
    const [feedbackSubmittedIds, setFeedbackSubmittedIds] = useState(new Set()); // Tracks feedback in this session

    // --- State for Bookings (Lifted) ---
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [bookingsError, setBookingsError] = useState('');
    const [historyKey, setHistoryKey] = useState(0); // Key to force refresh


    // --- Sidebar State ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    // --- Ref for clicking outside sidebar ---
    const sidebarRef = useRef(null);
    const mainContentRef = useRef(null); // Ref for main content area

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    // --- Notification Fetching ---
    const fetchUnreadCount = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const response = await fetch(`${API_BASE_URL}/notifications/customer/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            }
        } catch (err) {
            console.error("Failed to fetch unread count", err);
        }
    };

    const handleMarkNotificationsRead = async () => {
        if (unreadCount === 0) return;
        setUnreadCount(0); // Optimistic update
        try {
            const token = getAuthToken();
            await fetch(`${API_BASE_URL}/notifications/customer/mark-read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Failed to mark notifications as read", err);
            // Consider reverting optimistic update or re-fetching count on error
        }
    };

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


    // --- Auth & Initial Load Effect ---
    useEffect(() => {
        const token = getAuthToken();
        const user = getUserData();
        if (!token || !user || user.role !== 'Customer') {
            console.warn("Redirecting: No token or invalid user role for Customer Dashboard.");
            handleLogout();
        } else {
            setUserData(user);
            fetchUnreadCount(); // Fetch count on load
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]); // navigate dependency is correct here


    // --- NEW: Lifted Booking Fetch Logic ---
    const fetchBookings = useCallback(async () => {
        setBookingsLoading(true); setBookingsError('');
        try {
            const token = getAuthToken(); if (!token) throw new Error("Please log in.");
            const response = await fetch(`${API_BASE_URL}/bookings/customer`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch booking history.');
            const data = await response.json();
            
            // Check against local list of submitted feedback
            const bookingsWithFeedback = data.map(b => ({
                ...b,
                // Check if backend says feedback is given OR if we submitted it this session
                feedbackGiven: b.feedbackGiven || feedbackSubmittedIds.has(b._id)
            }));
            setBookings(bookingsWithFeedback);
        } catch (err) { setBookingsError(err.message); }
        finally { setBookingsLoading(false); }
    }, [feedbackSubmittedIds]); // Re-fetch if the submitted IDs set changes

    // Fetch bookings when history tab is active or when historyKey changes
      useEffect(() => {
        if (activeTab === 'history') {
            fetchBookings();
        }
    }, [activeTab, fetchBookings, historyKey]); // Re-fetch when tab is opened or key changes


    // --- Sidebar Toggle Logic ---
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        setSelectedVehicle(null);
        if (tabName === 'notifications') {
            handleMarkNotificationsRead();
        }
        if (isMobileView) {
            setIsSidebarOpen(false); // Close sidebar on mobile after click
        }
    };
    
    // --- Modal Handlers ---
    const handleOpenVideoModal = (booking) => {
        setVideoModalBooking(booking);
    };
    const handleOpenFeedbackModal = (booking) => {
         setFeedbackModalBooking(booking);
    };
    
    // NEW: Updated feedback submission handler
    const handleFeedbackSubmitted = (bookingId) => {
        setFeedbackSubmittedIds(prev => new Set(prev).add(bookingId)); // Track it locally
        setFeedbackModalBooking(null); // Close modal
        setHistoryKey(k => k + 1); // Force a refresh of the history component
    };


    const renderContent = () => {
        if (selectedVehicle) return <CustomerVehicleDetail vehicle={selectedVehicle} onBack={() => setSelectedVehicle(null)} setActiveTab={setActiveTab} />;
        switch (activeTab) {
            case 'dashboard': return <CustomerDashboardHome setActiveTab={setActiveTab} />;
            case 'vehicle-search': return <CustomerVehicleSearch setSelectedVehicle={setSelectedVehicle} />;
            case 'map-search': return <CustomerMapSearch setSelectedVehicle={setSelectedVehicle} />;
            case 'history': return (
                <CustomerBookingHistory 
                    bookings={bookings}
                    loading={bookingsLoading}
                    error={bookingsError}
                    onOpenVideoModal={handleOpenVideoModal}
                    onOpenFeedbackModal={handleOpenFeedbackModal}
                />
            );
            case 'notifications': return <CustomerNotifications />;
            case 'verify': return <CustomerVerifyDocuments />;
            case 'ratings': return <CustomerRatings />; {/* ADDED Ratings case */}
            case 'payment': return <CustomerPaymentMethods />;
            case 'complaints': return <CustomerComplaints />;
            case 'profile': return <CustomerEditProfile />;
            default: return <CustomerDashboardHome setActiveTab={setActiveTab} />;
        }
    };

    if (isLoading) {
        return (
             <>
                 <CustomerDashboardStyles />
                 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
                     <Loader2 className="spinner" size={48}/> Loading Dashboard...
                 </div>
             </>
        );
    }

    return (
         <>
             <CustomerDashboardStyles />
             <div className="dashboard theme-customer">
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
                     unreadCount={unreadCount}
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
                             <h1 className="logo-mobile">READY GO</h1>
                             <span style={{width: '40px'}}></span> {/* Spacer */}
                         </div>
                     )}
                     {renderContent()}
                 </main>
                 
                 {/* --- Render Modals --- */}
                 {videoModalBooking && (
                     <VehicleConditionModal 
                         booking={videoModalBooking}
                         onClose={() => setVideoModalBooking(null)}
                     />
                 )}
                 {feedbackModalBooking && (
                     <FeedbackModal 
                         booking={feedbackModalBooking}
                         onClose={() => setFeedbackModalBooking(null)}
                         onFeedbackSubmitted={handleFeedbackSubmitted} // Pass the new handler
                     />
                 )}
             </div>
         </>
    );
};

export default CustomerDashboard;