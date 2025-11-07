import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, Phone, Home, KeyRound, ArrowLeft } from 'lucide-react';

// --- Embedded CSS with Responsive Design ---
const CustomerRegisterStyles = () => (
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

        :root { /* Define CSS Variables */
          --orange-500: #f97316; --orange-600: #ea580c;
          --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb;
          --gray-600: #4b5563; --gray-700: #374151; --white: #ffffff;
          --red-500: #ef4444; --green-500: #22c55e;
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        .customer-register-page-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100%;
            padding: 1rem;
            box-sizing: border-box;
            background: linear-gradient(135deg, var(--gray-50) 0%, #e2e8f0 100%);
        }

        .customer-register-card {
            background-color: var(--white);
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: var(--shadow-lg);
            max-width: 500px;
            width: 100%;
            animation: fadeIn 0.5s ease-out;
            text-align: center;
        }

        .customer-register-card .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            font-size: 2rem;
            font-weight: 800;
            color: var(--orange-500);
            margin-bottom: 0.5rem;
        }

        .customer-register-card .tagline {
            font-size: 1.1rem;
            color: var(--gray-600);
            margin-bottom: 2rem;
        }

        .customer-register-card .form-group {
            margin-bottom: 1.25rem;
            text-align: left;
        }

        .customer-register-card .form-label {
            display: block;
            font-weight: 500;
            color: var(--gray-700);
            margin-bottom: 0.4rem;
        }

        .customer-register-card .input-wrapper {
            position: relative;
        }

        .customer-register-card .form-input {
            width: 100%;
            padding: 0.7rem 1rem 0.7rem 2.75rem;
            border: 1px solid var(--gray-200);
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: box-shadow 0.2s;
            box-sizing: border-box;
        }

        .customer-register-card .form-input:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.3); /* Orange focus */
        }
        
        .customer-register-card .form-input::placeholder {
            color: #9ca3af;
        }

        .customer-register-card .input-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gray-600);
        }

        .customer-register-card .form-actions {
            margin-top: 1.5rem;
        }

        .customer-register-card .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 0.9rem;
            border-radius: 0.5rem;
            font-size: 1.1rem;
            font-weight: 700;
            text-decoration: none;
            border: none;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s ease, transform 0.2s ease;
        }
        
        .customer-register-card .btn-customer {
            background-color: var(--orange-500);
            color: var(--white);
        }

        .customer-register-card .btn-customer:hover {
            background-color: var(--orange-600);
            transform: translateY(-2px);
        }

        .customer-register-card .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--gray-600);
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 500;
            margin-top: 1.5rem;
            text-decoration: none;
        }
        
        .customer-register-card .error-message {
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
            .customer-register-page-container {
                padding: 1rem;
                align-items: flex-start;
                padding-top: 3vh;
            }
            .customer-register-card {
                padding: 1.5rem;
            }
            .customer-register-card .logo {
                font-size: 1.8rem;
            }
        }
    `}</style>
);

function CustomerRegister() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState(''); // Added phone state
    const [address, setAddress] = useState(''); // Added address state
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const role = 'Customer'; // Role is fixed for this component

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Include fullName in the request body
            const response = await fetch('http://localhost:3030/register', { // Using Port 3001
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, role }), // Sending required fields
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed.');
            }
            alert('Registration successful! Please log in.');
            // Redirect to the customer login page
            window.location.href = '/customer-login';
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            <CustomerRegisterStyles />
            <div className="customer-register-page-container">
                <div className="customer-register-card">
                    <h1 className="logo"><UserPlus size={36} /> Create Customer Account</h1>
                    <p className="tagline">Join to start renting vehicles.</p>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Full Name</label>
                            <div className="input-wrapper">
                                <UserPlus size={18} className="input-icon" />
                                <input id="name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="form-input" placeholder="Your full name" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                             <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" required />
                            </div>
                        </div>
                        {/* Note: Phone and Address are not required by the current backend /register endpoint, but kept in UI */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">Phone Number</label>
                             <div className="input-wrapper">
                                <Phone size={18} className="input-icon" />
                                <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="form-input" placeholder="Your phone number" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="address">Address</label>
                             <div className="input-wrapper">
                                <Home size={18} className="input-icon" />
                                <input id="address" type="text" value={address} onChange={e => setAddress(e.target.value)} className="form-input" placeholder="Your address" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Create Password</label>
                             <div className="input-wrapper">
                                <KeyRound size={18} className="input-icon" />
                                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-customer">Register</button>
                        </div>
                    </form>
                    <Link to="/customer-login" className="back-link">
                        <ArrowLeft size={16} /> Already have an account? Login
                    </Link>
                </div>
            </div>
        </>
    );
}

export default CustomerRegister;