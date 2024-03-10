const express = require('express');
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const { body, validationResult } = require('express-validator');
const { MongoClient } = require('mongodb');


require('dotenv').config();


//functions
const uri = process.env.MONGO_URI;
let client;


async function connectToDatabase() {
    if (!client) {
        client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        await client.connect();
        return;
    }
    await client.connect();
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {


        secure: false,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use(passport.initialize());
app.use(passport.session()); 


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, 
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
    callbackURL: "/google/callback",
    //  passReqToCallback: true
},
    async function (accessToken, refreshToken, profile, cb) {


        try {
            await connectToDatabase();
            const database = client.db('users');
            const users = database.collection('people');
            const existingUser = await users.findOne({ 'profiles.google.id': profile.id });
            if (existingUser) {
                console.log('User already exists:', existingUser);
                return cb(null, profile);
            }
            const name = profile.displayName;
            const username = null;//unique username needed
            const email = profile.emails[0].value;
            const googleId = profile.id;
            const newUser = { name, email, password: null, profiles: { google: { id: googleId } }, registeredAt: new Date() };

            const result = await users.insertOne(newUser);
            console.log('User registered successfully:', result.insertedId);
            return cb(null, profile);
        } catch (error) {
            console.error('Registration error:', error);
            cb(error, null); 
        } 
    }
));


passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/auth/github/callback"
},
    async function (accessToken, refreshToken, profile, done) {
        try {
            await connectToDatabase()
            const database = client.db('users');
            const users = database.collection('people');
            const existingUser = await users.findOne({ 'profiles.github.id': profile.id });
            if (existingUser) {
                console.log('User already exists:', existingUser);
                return done(null, profile);
            }
            const name = profile.username;
            const username = profile.username;
            const email = profile.email;
            const githubId = profile.id;
            const newUser = { name, email, password: null, profiles: { github: { id: githubId } }, registeredAt: new Date() };

            const result = await users.insertOne(newUser);
            console.log('User registered successfully:', result.insertedId);
            return done(null, profile);
        } catch (error) {
            console.error('Registration error:', error);
            cb(error, null);
        } 
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id); 
});

passport.deserializeUser((id, done) => {

    done(null, id); 
});


async function findUserByEmail(email) {
    try {
        await connectToDatabase();
        const database = client.db("users"); 
        const users = database.collection("people"); 


        const query = { email: email };
        const user = await users.findOne(query);
        return user;
    } 
    catch (error) {
        console.error('Error finding user by email:', error);
        return null;
    }
}

process.on('SIGINT', async () => {
    if (client && client.isConnected()) {
        console.log('Closing MongoDB connection');
        await client.close();
    }
    process.exit();
});


//functions

app.use(cors({
    origin: 'http://localhost:3000' 
}));

app.use(express.json());


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/login',
    [
        // Validate and sanitize fields.
        body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
        body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),

    ], async (req, res) => {
        const { email, password, 'g-recaptcha-response': recaptchaToken } = req.body;

        const errors = validationResult(req);
        console.log('Validation errors:', errors.array());
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }


        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const recaptchaURL = `https://www.google.com/recaptcha/api/siteverify`;
        try {
            const response = await fetch(recaptchaURL, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `secret=${secretKey}&response=${recaptchaToken}`
            });
            const data = await response.json();

            if (!data.success) {
                return res.status(400).json({ message: 'reCAPTCHA verification failed' });
            }
        } catch (error) {
            console.error('Error verifying reCAPTCHA:', error);
            return res.status(500).json({ message: 'Error during reCAPTCHA verification' });
        }


        console.log('Login attempt with:', email, password);
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                console.log('Login successful');
                return res.json({ message: 'Login successful' });

            } else {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        } catch (error) {
            console.error('Error checking password:', error);
            return res.status(500).json({ message: 'An error occurred while trying to log in' });
        }

    });


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));


app.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
    });

app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
    });

app.post('/register',
    [
        // Validate and sanitize fields.
        body('name').trim().escape().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
        body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Password confirmation does not match password');
                }
                return true;
            }),
    ]
    , async (req, res) => {
        const { name, email, password } = req.body;

        const errors = validationResult(req);
        console.log('Validation errors:', errors.array());
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await connectToDatabase();
            const database = client.db('users');
            const users = database.collection('people');

            const existingUser = await users.findOne({ email });
            if (existingUser) {
                return res.status(409).send({ message: 'User already exists.' });
            }


            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = { name, email, password: hashedPassword, profiles: null, registeredAt: new Date() };
            const result = await users.insertOne(newUser);

            res.status(201).send({ message: 'User registered successfully', userId: result.insertedId });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).send({ message: 'Error registering new user' });
        } 
    });
