const express = require('express');
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const DummyData = require('./DummyData.js');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();


//functions

// The higher the salt rounds, the more hashing rounds are performed
const saltRounds = 10;

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash; // Store this hash in the database
  } catch (error) {
    console.error('Error hashing password', error);
  }
};


const checkPassword = async (password, hash) => {
  try {
    const match = await bcrypt.compare(password, hash);
    return match; // true if the password matches, false otherwise
  } catch (error) {
    console.error('Error checking password', error);
  }
};



//functions

app.use(cors({
  origin: 'http://localhost:3000' // Only allow this origin to access the resources
}));

app.use(express.json());


app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt with:', email, password);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = DummyData.find((user) => user.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    const match = await bcrypt.compare(password, user.hashedPassword);
    if (match) {
      return res.json({ message: 'Login successful' });
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error checking password:', error);
    return res.status(500).json({ message: 'An error occurred while trying to log in' });
  }
});


// Route to start the Google OAuth flow
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback route that Google will redirect to after authentication
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
