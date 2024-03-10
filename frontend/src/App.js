import React from 'react';
import LoginForm from './pages/Login';
import RegisterForm from './pages/Register';
import HomePage from './pages/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginForm onLogin />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/home" element={<HomePage />} />
            </Routes>
        </Router>
    );
};

export default App;
