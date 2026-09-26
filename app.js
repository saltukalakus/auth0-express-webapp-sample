require('dotenv').config();
const express = require('express');
const { auth } = require('express-openid-connect');
const escape = require('escape-html');

const app = express();
app.use(express.urlencoded({ extended: false }));

/* highlight-start auth-config */
app.use(
  auth({
    authRequired: false, // set to true to require authentication for all routes
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    clientAuthMethod: 'client_secret_post',
    issuerBaseURL: process.env.ISSUER_BASE_URL,
  })
);
/* highlight-end auth-config */

app.get('/signup', (req, res) =>
  res.oidc.login({
    returnTo: '/',
    authorizationParams: {
      screen_hint: 'signup',
      audience: process.env.AUDIENCE,
      response_type: 'code',
      scope: 'openid profile email offline_access',
    },
  })
);

app.get('/app_login', (req, res) =>
  res.oidc.login({
    returnTo: '/',
    authorizationParams: {
      screen_hint: 'login',
      audience: process.env.AUDIENCE,
      response_type: 'code',
      scope: 'openid profile email offline_access',
    },
  })
);

app.post('/refresh-tokens', async (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    return res.redirect('/');
  }
  await req.oidc.getAccessToken({ refresh: true });
  res.redirect('/');
});

app.get('/', (req, res) => {
  /* highlight-start is-authenticated */
  if (!req.oidc.isAuthenticated()) {
    return res.type('html').send(`
      <a href="/signup">Signup</a><br>
      <a href="/login">Log in</a>
    `);
  }

  const acccessToken = req.oidc.accessToken?.access_token;
  const idToken = req.oidc.idToken;
  const refreshToken = req.oidc.refreshToken;

  console.log('Access Token:', acccessToken);
  console.log('ID Token:', idToken);
  console.log('Refresh Token:', refreshToken);

  res.type('html').send(`
    <p>Logged in as ${escape(req.oidc.user.name)}</p>
    <h1>User Profile</h1>
    <pre>${escape(JSON.stringify(req.oidc.user, null, 2))}</pre>
    <p>Access TOKEN: ${acccessToken}</p>
    <p>IDTOKEN: ${idToken}</p>
    <p>Refresh TOKEN: ${refreshToken}</p>
    <form method="POST" action="/refresh-tokens">
      <button type="submit">Refresh tokens</button>
    </form>
    <a href="/logout">Log out</a>
  `);
  /* highlight-end is-authenticated */
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
