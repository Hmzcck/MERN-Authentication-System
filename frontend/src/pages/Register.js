import React, { useState } from 'react';
import '../design/Register.css'; 

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        console.log('Form data:', formData);
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return; 
        }
        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const result = await response.json();
                const errorMessage = result?.errors?.[0].msg;
                if (errorMessage)
                    setError(errorMessage);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Success:', data);
            setSuccessMessage('Registration successful!');
        } catch (error) {
            console.error("Could not fetch the data", error);
        }
    };


    return (
        <div className="register-container">
            <h2>Register</h2>
            <form className="register-form" onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                <button type="submit">Register</button>
            </form>
            <div className="oauth-buttons">
                <button className="google-btn" onClick={() => window.location.href = 'http://localhost:5000/auth/google'}>Register with Google</button>
                <button className="github-btn" onClick={() => window.location.href = 'http://localhost:5000/auth/github'}>Register with GitHub</button>
            </div>
            <div className="back-to-login" onClick={() => window.location.href = 'http://localhost:3000/'}>
                Back to Login Page
            </div>
        </div>
    );
};

export default RegisterPage;
