import React, { useState } from 'react';
// NEW: Import Link and useNavigate for SPA navigation
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, KeyRound, ArrowLeft, Loader2, User, Lock } from 'lucide-react'; // Added User and Lock

// --- MODIFIED: API URL ---
// This will use your Render URL in production and localhost in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030';

// --- Embedded CSS with Responsive Design ---
const AdminLoginStyles = () => (
    <style>{`
        /* Import Google Font */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');

        /* Base styles for the entire page */
        html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }

        /* This container correctly centers the card in the viewport */
        .admin-login-page-container {
            display: flex;
            justify-content: center; /* Horizontally center */
            align-items: center;    /* Vertically center */
            width: 100%;
            min-height: 100vh;
            padding: 1rem;
            box-sizing: border-box;
            background: linear-gradient(135deg, #f9fafb 0%, #e2e8f0 100%);
        }

        /* The main login card with specific class names */
        .admin-login-card {
            background-color: #ffffff;
            padding: 2.5rem;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            max-width: 450px;
            width: 100%;
            animation: fadeIn 0.5s ease-out;
            text-align: center;
        }

        .admin-login-card .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            font-size: 2.25rem;
            font-weight: 800;
            color: #1f2937; /* Admin primary color */
            margin-bottom: 0.5rem;
        }

        .admin-login-card .tagline {
            font-size: 1.125rem;
            color: #4b5563; /* gray-600 */
            margin-bottom: 2.5rem;
        }

        .admin-login-card .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }

        .admin-login-card .form-label {
            display: block;
            font-weight: 500;
            color: #374151; /* gray-700 */
            margin-bottom: 0.5rem;
        }

        .admin-login-card .input-wrapper {
            position: relative;
        }

        .admin-login-card .form-input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 3rem; /* MODIFIED: Increased left padding */
            border: 1px solid #e5e7eb; /* gray-200 */
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: box-shadow 0.2s;
            box-sizing: border-box;
        }

        .admin-login-card .form-input:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.3);
        }
        
        .admin-login-card .form-input::placeholder {
            color: #9ca3af;
        }

        .admin-login-card .input-icon {
            position: absolute;
            left: 1rem; /* MODIFIED: Adjusted icon position slightly */
            top: 50%;
            transform: translateY(-50%);
            color: #4b5563; /* gray-600 */
            pointer-events: none; /* Make icon non-interactive */
        }

        .admin-login-card .form-actions {
            margin-top: 2rem;
        }

        .admin-login-card .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 1rem;
            border-radius: 0.5rem;
            font-size: 1.125rem;
            font-weight: 700;
            text-decoration: none;
            border: none;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s ease, transform 0.2s ease;
        }
        
        .admin-login-card .btn-admin {
            background-color: #1f2937; /* admin-primary */
            color: #ffffff;
        }

        .admin-login-card .btn-admin:hover:not(:disabled) {
            background-color: #374151; /* admin-secondary */
            transform: translateY(-2px);
        }

        .admin-login-card .btn:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
        }

        /* Added spinner animation */
        .spinner {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .admin-login-card .toggle-link {
            color: #4b5563;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 500;
            margin-top: 1.5rem;
            text-decoration: underline;
            font-size: 0.875rem;
        }

        .admin-login-card .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #4b5563; /* gray-600 */
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 500;
            margin-top: 1rem;
            text-decoration: none;
            font-size: 0.875rem;
        }
        
        .admin-login-card .message {
            padding: 0.75rem;
            border-radius: 0.5rem;
            text-align: center;
            margin-bottom: 1.5rem;
            animation: fadeIn 0.3s;
        }
        .admin-login-card .error-message {
            background-color: #fee2e2;
            color: #b91c1c;
        }
        .admin-login-card .success-message {
            background-color: #dcfce7;
            color: #166534;
        }


        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive adjustments for mobile */
        @media (max-width: 480px) {
            .admin-login-page-container {
                padding: 1rem;
                align-items: flex-start;
                padding-top: 5vh;
            }
            .admin-login-card {
                padding: 2rem 1.5rem;
            }
            .admin-login-card .logo {
                font-size: 2rem;
            }
        }
    `}</style>
);

function AdminLogin() {
    const [isRegister, setIsRegister] = useState(false);
    
    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register State
    const [registerData, setRegisterData] = useState({
        fullName: '',
        email: '',
        password: '',
        secretKey: ''
    });
    
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }
            if (data.user.role !== 'Admin') {
                 throw new Error('Access denied. Only admins can log in here.');
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            navigate('/admin-dashboard');

        } catch (err) {
            setIsError(true);
            setMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterChange = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        // Basic frontend validation
        if (!registerData.fullName || !registerData.email || !registerData.password || !registerData.secretKey) {
            setIsError(true);
            setMessage("All fields are required for registration.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/register`, { // NEW ENDPOINT
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed.');
            }
            
            // Success!
            setIsError(false);
            setMessage("Admin registered successfully! Please switch to login.");
            setIsRegister(false); // Switch back to login form
            setRegisterData({ fullName: '', email: '', password: '', secretKey: '' }); // Clear form

        } catch (err) {
            setIsError(true);
            setMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AdminLoginStyles />
            <div className="admin-login-page-container">
                <div className="admin-login-card">
                    <h1 className="logo"><Shield size={36} />Admin Panel</h1>
                    <p className="tagline">{isRegister ? 'Create a new Admin account' : 'Please sign in to continue.'}</p>
                    
                    {message && <div className={`message ${isError ? "error-message" : "success-message"}`}>{message}</div>}
                    
                    {isRegister ? (
                        /* --- REGISTRATION FORM --- */
                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="fullName">Full Name</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input 
                                        id="fullName" 
                                        name="fullName"
                                        type="text" 
                                        value={registerData.fullName} 
                                        onChange={handleRegisterChange} 
                                        className="form-input" 
                                        placeholder="Enter your full name" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input 
                                        id="email" 
                                        name="email"
                                        type="email" 
                                        value={registerData.email} 
                                        onChange={handleRegisterChange} 
                                        className="form-input" 
                                        placeholder="admin@example.com" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <KeyRound size={18} className="input-icon" />
                                    <input 
                                        id="password" 
                                        name="password"
                                        type="password" 
                                        value={registerData.password} 
                                        onChange={handleRegisterChange} 
                                        className="form-input" 
                                        placeholder="••••••••" 
                                        required 
                                    />
                                </div>
                            </div>
                             <div className="form-group">
                                <label className="form-label" htmlFor="secretKey">Secret Key</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input 
                                        id="secretKey" 
                                        name="secretKey"
                                        type="password" 
                                        value={registerData.secretKey} 
                                        onChange={handleRegisterChange} 
                                        className="form-input" 
                                        placeholder="Enter the admin secret key" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-admin" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="spinner" /> : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* --- LOGIN FORM --- */
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input 
                                        id="email" 
                                        type="email" 
                                        value={loginEmail} 
                                        onChange={e => setLoginEmail(e.target.value)} 
                                        className="form-input" 
                                        placeholder="admin@example.com" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <KeyRound size={18} className="input-icon" />
                                    <input 
                                        id="password" 
                                        type="password" 
                                        value={loginPassword} 
                                        onChange={e => setLoginPassword(e.target.value)} 
                                        className="form-input" 
                                        placeholder="••••••••" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-admin" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="spinner" /> : 'Login'}
                                </button>
                            </div>
                        </form>
                    )}
                    
                    <button onClick={() => setIsRegister(!isRegister)} className="toggle-link">
                        {isRegister ? 'Already have an account? Login' : 'Create new Admin Account'}
                    </button>
                    
                    <Link to="/" className="back-link">
                        <ArrowLeft size={16} /> Go Back to Home
                    </Link>
                </div>
            </div>
        </>
    );
}

export default AdminLogin;

