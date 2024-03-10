import React, { useState } from 'react';
import '../design/Login.css'; 
import ReCAPTCHA from "react-google-recaptcha";

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        console.log('Login attempt with:', email, password);
        if (!recaptchaToken) {
            console.error("reCAPTCHA token is missing.");
            return;
        }
        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, 'g-recaptcha-response': recaptchaToken }),
            });
            if (!response.ok) {
                const result = await response.json();
                const errorMessage = result?.errors?.[0].msg;
                if (errorMessage)
                    setError(errorMessage);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            window.location.href = 'http://localhost:3000/home';
            console.log('response:', response)

        } catch (error) {
            console.error("Could not fetch the data", error);
        }
        if (captchaRef.current) {
            captchaRef.current.reset();
        }
    };

    const captchaRef = React.createRef();

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form className="login-form" onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}
                <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <ReCAPTCHA
                    ref={captchaRef} 
                    sitekey="6LfcHm0pAAAAANgzEj6RBkad5ER9DlWHKEKpVTh3"
                    onChange={setRecaptchaToken}
                />
                <button type="submit">Log in</button> {}
            </form>
            <div className="oauth-buttons">
                <button className="google-btn" onClick={() => window.location.href = 'http://localhost:5000/auth/google'}>
                    Sign in with Google
                </button>

                <button className="microsoft-btn" onClick={() => window.location.href = 'http://localhost:5000/auth/github'}>
                    Sign in with GitHub
                </button>
            </div>
            <button className="sso-btn" onClick={() => window.location.href = 'http://localhost:3000/register'}>Register</button>
        </div>
    );
};

export default LoginForm;
