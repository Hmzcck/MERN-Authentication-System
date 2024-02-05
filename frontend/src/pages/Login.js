import React, { useState } from 'react';
import '../design/Login.css'; // Assume you have a CSS file for styling

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    // Here you would handle the login logic, possibly sending a request to your server
    onLogin(email, password);
  };

  return (
    <div className="login-container">
      <h2>TEST</h2>
      <form className="login-form" onSubmit={handleSubmit}>
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
        <button type="submit">Log in</button>
      </form>
      <div className="oauth-buttons">
        <button className="google-btn">Sign in with Google</button>
        <button className="microsoft-btn">Sign in with GitHub</button>
      </div>
      <button className="sso-btn">Log in with SSO</button>
    </div>
  );
};

export default LoginForm;
