const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback",
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly']
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Create user data object
    const userData = {
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      profilePicture: profile.photos[0].value,
      accessToken: accessToken,
      refreshToken: refreshToken
    };

    return done(null, userData);
  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport;
