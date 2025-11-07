import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { User, Mail, KeyRound, ArrowLeft, Loader2 } from 'lucide-react'; // Import Loader2

// --- MODIFIED: API URL ---
// This will use your Render URL in production and localhost in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030';
// --- Embedded CSS with Responsive Design ---
const CustomerLoginStyles = () => (
    <style>{`
        /* Import Google Font */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');

        /* Base styles */
        html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }

        :root { /* CSS Variables */
         --orange-500: #f97316; --orange-600: #ea580c;
         --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb;
         --gray-600: #4b5563; --gray-700: #374151; --white: #ffffff;
         --red-500: #ef4444;
         --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        .customer-login-page-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100%;
            padding: 1rem;
            box-sizing: border-box;
            background: linear-gradient(135deg, var(--gray-50) 0%, #e2e8f0 100%);
        }

        .customer-login-card {
            background-color: var(--white);
            padding: 2.5rem;
            border-radius: 1rem;
            box-shadow: var(--shadow-lg);
            max-width: 450px;
            width: 100%;
            animation: fadeIn 0.5s ease-out;
            text-align: center;
        }

        .customer-login-card .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            font-size: 2.25rem;
            font-weight: 800;
            color: var(--orange-500);
            margin-bottom: 0.5rem;
        }

        .customer-login-card .tagline {
            font-size: 1.125rem;
            color: var(--gray-600);
            margin-bottom: 2.5rem;
        }

        .customer-login-card .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }

        .customer-login-card .form-label {
            display: block;
            font-weight: 500;
            color: var(--gray-700);
            margin-bottom: 0.5rem;
        }

        .customer-login-card .input-wrapper {
            position: relative;
        }

        .customer-login-card .form-input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.75rem;
            border: 1px solid var(--gray-200);
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: box-shadow 0.2s;
            box-sizing: border-box;
        }

        .customer-login-card .form-input:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.3); /* Orange focus */
        }
        
        .customer-login-card .form-input::placeholder {
            color: #9ca3af;
        }

        .customer-login-card .input-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gray-600);
        }

        .customer-login-card .form-actions {
            margin-top: 2rem;
            display: flex; /* Added for button spacing */
            flex-direction: column;
            gap: 1rem;
        }

        .customer-login-card .btn {
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
        
        .customer-login-card .btn-customer {
            background-color: var(--orange-500);
            color: var(--white);
        }

        .customer-login-card .btn-customer:hover:not(:disabled) {
            background-color: var(--orange-600);
            transform: translateY(-2px);
        }

         .customer-login-card .btn-secondary { /* Style for Register button */
            background-color: var(--gray-100);
            color: var(--gray-800);
        }
        .customer-login-card .btn-secondary:hover {
            background-color: var(--gray-200);
            transform: translateY(-2px);
        }
        
        /* Added spinner animation */
        .spinner {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .customer-login-card .btn:disabled {
             background-color: var(--gray-200);
             cursor: not-allowed;
             opacity: 0.7;
        }


        .customer-login-card .form-links {
            margin-top: 1.5rem;
            display: flex;
            justify-content: center; /* Center the links */
            gap: 1.5rem; /* Add space between links */
            font-size: 0.875rem;
        }

        .customer-login-card .form-links a {
            color: var(--gray-600);
            text-decoration: none;
            font-weight: 500;
        }
        
        .customer-login-card .form-links a:hover {
            text-decoration: underline;
            color: var(--gray-800);
        }
        
        .customer-login-card .error-message {
            background-color: #fee2e2;
            color: #b91c1c;
            padding: 0.75rem;
            border-radius: 0.5rem;
            text-align: center;
            margin-bottom: 1.5rem;
            animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
            .customer-login-page-container {
                padding: 1rem;
                align-items: flex-start;
                padding-top: 5vh;
            }
            .customer-login-card {
                padding: 2rem 1.5rem;
            }
            .customer-login-card .logo {
                font-size: 2rem;
            }
        }
    `}</style>
);

function CustomerLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // --- ADDED ---
    const navigate = useNavigate(); // --- ADDED ---

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true); // --- ADDED ---
        try {
            // --- MODIFIED: Use API_BASE_URL variable ---
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }
            if (data.user.role !== 'Customer') {
                 throw new Error('Access denied. Please use the correct login page.');
            }
            // On successful login, store token and user info, then redirect
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // --- MODIFIED: Use navigate for SPA redirect ---
            navigate('/customer-dashboard'); 

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false); // --- ADDED ---
        }
    };

    return (
        <>
            <CustomerLoginStyles />
            <div className="customer-login-page-container">
                <div className="customer-login-card">
                    <h1 className="logo"><User size={36} />Customer Login</h1>
                    <p className="tagline">Sign in to find your next ride.</p>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="form-input"
                                    placeholder="Enter your email"
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
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            {/* --- MODIFIED: Added loading state to button --- */}
                            <button type="submit" className="btn btn-customer" disabled={isLoading}>
                                {isLoading ? <Loader2 className="spinner" /> : 'Login'}
                            </button>
                            {/* Link to Register Page */}
                            <Link to="/customer-register" className="btn btn-secondary">Register</Link>
                        </div>
                    </form>

                    <div className="form-links">
                        <Link to="/owner-login">Login as Owner</Link>
                        <Link to="/"> <ArrowLeft size={16} /> Back to Home</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CustomerLogin;