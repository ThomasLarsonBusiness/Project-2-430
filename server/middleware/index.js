// Checks if a user is logged in, returns to mainpage if not
const requiresLogin = (req, res, next) => {
  if (!req.session.account) {
    return res.redirect('/');
  }

  return next();
};

// Checks if user is logged out, returns to /maker if not
const requiresLogout = (req, res, next) => {
  if (req.session.account) {
    return res.redirect('/home');
  }

  return next();
};

// Checks if the user is logging in on a secure query
const requiresSecure = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }

  return next();
};

// Bypass the Secure Check For Running Locally
const bypassSecure = (req, res, next) => next();

// Exports
module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;

if (process.env.NODE_ENV === 'production') {
  module.exports.requiresSecure = requiresSecure;
} else {
  module.exports.requiresSecure = bypassSecure;
}
