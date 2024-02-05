import React from 'react';
import LoginForm from './pages/Login';

const App = () => {
  const handleLogin = async (email, password) => {
    // Implement your login logic here, such as sending a request to your server
    console.log('Login attempt with:', email, password);

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Data:', data);
    } catch (error) {
      console.error("Could not fetch the data", error);
    }
    
  };

  return (
    <div>
      <LoginForm onLogin={handleLogin} />
    </div>
  );
};

export default App;
