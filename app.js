const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const PORT = process.env.PORT || 3000;
const CLIENT_ID = '7a938a49-c698-4901-89c6-25fdfbf6bb7a';
const CLIENT_SECRET = 'dcd8d991-c22c-4998-903b-29372422663a';
const CALLBACK_URL = 'http://localhost:3000/auth/openid/return';
const TENANT_ID = '6cb2ffb0-bd22-47b5-b675-47289ac16b70';

const app = express();

passport.use(new OIDCStrategy({
    identityMetadata: `https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    responseType: 'id_token',
    responseMode: 'form_post',
    redirectUrl: CALLBACK_URL,
    allowHttpForRedirectUrl: true,
    validateIssuer: false,
    passReqToCallback: false,
    scope: ['openid', 'profile'],
    loggingLevel: 'info'
}, (iss, sub, profile, accessToken, refreshToken, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

app.use(express.urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', (req, res) => {
    res.send(`
        <h1>Login Page</h1>
        <form action="/login" method="post">
            <label for="loginType">Choose login type:</label>
            <select name="loginType" id="loginType">
                <option value="azuread">Microsoft SSO</option>
                <option value="local">Local Account</option>
            </select>
            <button type="submit">Login</button>
        </form>
    `);
});

app.post('/login', (req, res, next) => {
    const loginType = req.body.loginType;
    if (loginType === 'azuread') {
        passport.authenticate('azuread-openidconnect')(req, res, next);
    } else if (loginType === 'local') {
        res.send('Local account login functionality not implemented yet.');
    } else {
        res.status(400).send('Invalid login type');
    }
});

app.post('/auth/openid/return',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
    (req, res) => {
        if (req.user) {
            const { displayName } = req.user;

            console.log(req.user);

            res.send(`Hello, ${displayName} ! You are now logged in.`);
        } else {
            res.status(401).send('Authentication failed');
        }
    }
);


app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/', (req, res) => {
    res.send('Hello World from Wenhanfu Yang');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
