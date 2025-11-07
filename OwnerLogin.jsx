import React, { useState } from 'react';
// Import Link and useNavigate for SPA navigation
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, KeyRound, ArrowLeft, Loader2 } from 'lucide-react'; // Added Loader2

// --- MODIFIED: API URL ---
// This will use your Render URL in production and localhost in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030';
// --- Embedded CSS with Responsive Design ---
const OwnerLoginStyles = () => (
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
        .owner-login-page-container {
            display: flex;
            justify-content: center; /* Horizontally center */
            align-items: center;    /* Vertically center */
            width: 100%;
            min-height: 100%; /* Use min-height to ensure it fills viewport */
            padding: 1rem;
            box-sizing: border-box;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); /* Light green gradient */
        }

        /* The main login card */
        .owner-login-card {
            background-color: #ffffff;
            padding: 2.5rem;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            max-width: 450px;
            width: 100%;
            animation: fadeIn 0.5s ease-out;
            text-align: center;
        }

        .owner-login-card .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            font-size: 2.25rem;
            font-weight: 800;
            color: #047857; /* Owner primary color (Green) */
            margin-bottom: 0.5rem;
        }

        .owner-login-card .tagline {
            font-size: 1.125rem;
            color: #4b5563; /* gray-600 */
            margin-bottom: 2.5rem;
        }

        .owner-login-card .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }

        .owner-login-card .form-label {
            display: block;
            font-weight: 500;
            color: #374151; /* gray-700 */
            margin-bottom: 0.5rem;
        }

        .owner-login-card .input-wrapper {
            position: relative;
        }

        .owner-login-card .form-input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.75rem; /* Padding for icon */
            border: 1px solid #e5e7eb; /* gray-200 */
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: box-shadow 0.2s;
            box-sizing: border-box;
        }

        .owner-login-card .form-input:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.3); /* Green focus color */
        }

        .owner-login-card .form-input::placeholder {
            color: #9ca3af;
        }

        .owner-login-card .input-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: #4b5563; /* gray-600 */
            pointer-events: none; /* Icon is not interactive */
        }

        .owner-login-card .form-actions {
            margin-top: 2rem;
        }

        .owner-login-card .btn {
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

         /* Added spinner animation */
        .spinner {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .owner-login-card .btn-owner {
            background-color: #047857; /* owner-primary */
            color: #ffffff;
        }

        .owner-login-card .btn-owner:hover:not(:disabled) { /* Don't apply hover effect when disabled */
            background-color: #065f46; /* owner-secondary */
            transform: translateY(-2px);
        }

        .owner-login-card .btn:disabled { /* Style for disabled button */
             background-color: #d1d5db; /* gray-300 */
             cursor: not-allowed;
             opacity: 0.7;
        }

        .owner-login-card .form-links {
            margin-top: 1.5rem;
            display: flex;
            flex-direction: column; /* Stack links vertically */
            gap: 0.75rem;
            align-items: center;
            font-size: 0.875rem;
        }

        .owner-login-card .form-links a { /* Style Links */
            color: #4b5563;
            text-decoration: none;
            font-weight: 500;
        }

        .owner-login-card .form-links a:hover {
            text-decoration: underline;
            color: #1f2937;
        }

        .owner-login-card .error-message {
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

        /* Responsive adjustments */
        @media (max-width: 480px) {
            .owner-login-page-container {
                padding: 1rem;
                align-items: flex-start; /* Align card to top on small screens */
                padding-top: 5vh;
            }
            .owner-login-card {
                padding: 2rem 1.5rem;
            }
            .owner-login-card .logo {
                font-size: 2rem;
            }
        }
    `}</style>
);

function OwnerLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Added loading state
    const navigate = useNavigate(); // Added useNavigate hook

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true); // Set loading true
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
            if (data.user.role !== 'Owner') {
                 throw new Error('Access denied. Please use the correct login page for Owners.');
            }

            // --- Store token and user data ---
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // --- Use navigate for redirection ---
            navigate('/owner-dashboard');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false); // Set loading false regardless of outcome
        }
    };

    return (
        <>
            <OwnerLoginStyles />
            <div className="owner-login-page-container">
                <div className="owner-login-card">
                    <h1 className="logo"><Car size={36} />Owner Login</h1>
                    <p className="tagline">Manage your vehicles and earnings.</p>
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
                                    placeholder="you@example.com"
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
                            {/* Updated button with loading state */}
                            <button type="submit" className="btn btn-owner" disabled={isLoading}>
                                {isLoading ? <Loader2 className="spinner" /> : 'Login'}
                            </button>
                        </div>
                    </form>

                    <div className="form-links">
                        <Link to="/owner-register">Don't have an account? Register</Link>
                        <Link to="/customer-login">Login as a Customer</Link>
                        <Link to="/"> <ArrowLeft size={16} /> Back to Home</Link> {/* Added Back link */}
                    </div>
                </div>
            </div>
        </>
    );
}

export default OwnerLogin;