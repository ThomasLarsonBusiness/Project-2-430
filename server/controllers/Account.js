// Sets up the Models
const { ObjectId } = require('bson');
const models = require('../models');

const { Account } = models;

// Main Page Functions
const loginPage = (req, res) => res.render('login');

// Logout Function
const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

// Account Functions
const login = (req, res) => {
  // Sets up the Variables
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  // If Variable is Missing
  if (!username || !pass) {
    return res.status(400).json({ error: 'All Fields Are Required!' });
  }

  // Attempts to Authenticate the User
  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong Username Or Password!' });
    }

    req.session.account = Account.toAPI(account);

    return res.json({ redirect: '/home' });
  });
};

// Creates an account for a new user
const signup = async (req, res) => {
  // Sets the Variables
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  // If Variable is Missing
  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: 'All Fields Are Required!' });
  }

  // If Passwords Don't Match
  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords Do Not Match!' });
  }

  // Tries to Create a New User
  try {
    const hash = await Account.generateHash(pass);
    const newAccount = new Account({
      username, password: hash, premiumSubscription: false, numOwnedSongs: 0,
    });
    await newAccount.save();
    req.session.account = Account.toAPI(newAccount);
    return res.json({ redirect: '/home' });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username Already In Use!' });
    }
    return res.status(500).json({ error: 'An Error Occurred' });
  }
};

// Changes the user's password
const changePassword = (req, res) => {
  // Define the variables
  const { oldPass } = req.body;
  const { newPass } = req.body;
  const { username } = req.body;

  // If there is a variable missing, return a 400 error
  if (!oldPass || !newPass) {
    return res.status(400).json({ error: 'Missing Old or New Password' });
  }

  // Attempts to Authenticate the User
  return Account.authenticate(username, oldPass, async (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong password!' });
    }

    // Tries to Update the user's password
    try {
      const hash = await Account.generateHash(newPass);
      const tempAccount = account;
      tempAccount.password = hash;
      await tempAccount.save();
      req.session.account = Account.toAPI(account);
      return res.json({ redirect: '/home' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'An Error Occurred' });
    }
  });
};

// Checks if the user is loggedin
const checkLogin = (req, res) => {
  let responseJson;
  if (req.session.account) {
    responseJson = {
      loggedIn: true,
      username: req.session.account.username,
    };
  } else {
    responseJson = {
      loggedIn: false,
    };
  }

  return res.json(responseJson);
};

// Performs a search for accounts that have the search param in their name
const searchAccount = async (req, res) => {
  // Check if params are present
  if (!req.query.search) {
    return res.status(400).json({ error: 'Missing Search Parameter' });
  }

  let docs;

  // Creates the regex param
  // https://stackoverflow.com/questions/4029109/javascript-regex-how-to-put-a-variable-inside-a-regular-expression
  // https://javascript.info/regexp-introduction#:~:text=A%20regular%20expression%20consists%20of,otherwise%2C%20only%20the%20first%20one.
  const regexExpression = new RegExp(req.query.search, 'gi');

  // Tries to find all examples of user's whose username match the search param
  try {
    // https://stackoverflow.com/questions/32898139/partial-string-matching-in-mongodb
    // https://www.mongodb.com/docs/manual/reference/operator/query/regex/
    const query = { username: { $regex: regexExpression } };
    docs = await Account.find(query);
    return res.json({ searchResult: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Error Searching Database');
  }
};

// Checks if a user has liked a song
const checkLiked = async (req, res) => {
  // If the id is missing, return a 400 error
  if (!req.query.id) {
    return res.status(400).json({ error: 'Missing Song Id' });
  }

  let doc;

  // Tries to find if a user has liked a song or not
  try {
    // Looks for the liked song
    const query = { username: req.session.account.username };
    doc = await Account.findOne(query);
    // https://stackoverflow.com/questions/25768213/mongodb-in-with-an-objectid-array
    const id = new ObjectId(req.query.id);
    const song = doc.likedSongs.indexOf(id);

    // Prepares the response
    const responseJson = {
      result: true,
    };
    if (song === -1) {
      responseJson.result = false;
    }

    // Returns the result
    return res.json({ responseJson });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error Communicating With Database' });
  }
};

// Updates what songs a user has liked
const updateLiked = async (req, res) => {
  // If the id or checked status is missing, return a 400 error
  if (!req.body.id || req.body.checked === null) {
    return res.status(400).json({ error: 'Missing Song ID or Checked Status' });
  }

  // Tries to find the song the user liked and either add it or remove it from their likedSongs list
  const query = { username: req.session.account.username };

  try {
    const userAccount = await Account.findOne(query);
    // If checked, add it to the array
    if (req.body.checked) {
      userAccount.likedSongs.push(req.body.id);
      await userAccount.save();
      return res.json({ message: 'Successfully Added Liked Song' });
    }
    // if unchecked, remove it from the array
    // https://stackoverflow.com/questions/25768213/mongodb-in-with-an-objectid-array
    const id = new ObjectId(req.body.id);
    const index = userAccount.likedSongs.indexOf(id);
    userAccount.likedSongs.splice(index, 1);
    await userAccount.save();
    return res.json({ message: 'Successfully Removed Liked Song' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Issue Communicating With Server' });
  }
};

// Returns all of the songs liked by a user
const getLikedSongs = async (req, res) => {
  // Tries to get all the liked songs of the user
  const query = { username: req.session.account.username };
  let doc;

  try {
    doc = await Account.findOne(query).select('likedSongs').exec();
    return res.json({ ids: doc });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Problem Communicating With Server' });
  }
};

// Updates whether an account has a premium subscription
const updatePremium = async (req, res) => {
  // If the subscribed param is missing, return a 400 error
  if (req.body.subscribed === null) {
    return res.status(400).json({ error: 'Missing Subscribed Parameter' });
  }

  // Tries to update a user's premium status in the database
  const query = { username: req.session.account.username };
  let doc;

  try {
    doc = await Account.findOne(query);
    doc.premiumSubscription = req.body.subscribed;
    await doc.save();
    return res.json({ subscribed: doc.premiumSubscription });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Problem Communicating With Database' });
  }
};

// Checks if the user has a premium subscription
const checkPremium = async (req, res) => {
  // Tries to check if the user is a premium subscriber
  const query = { username: req.session.account.username };
  let doc;

  try {
    doc = await Account.findOne(query).select('premiumSubscription').exec();
    return res.json({ subscribed: doc.premiumSubscription });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Problem Communicating With Database' });
  }
};

// Exports
module.exports = {
  loginPage,
  logout,
  login,
  signup,
  changePassword,
  checkLogin,
  searchAccount,
  checkLiked,
  updateLiked,
  getLikedSongs,
  updatePremium,
  checkPremium,
};
