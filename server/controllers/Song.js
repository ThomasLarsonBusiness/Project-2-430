// Requires
const models = require('../models');

const { Song, Account } = models;

// Renders the Homepage
const homePage = async (req, res) => res.render('homepage');

// Renders an account page
const accountPage = async (req, res) => res.render('account');

// Renders the not found page
const notFoundPage = async (req, res) => res.render('notfound');

// Get random song(s)
const getRandomSong = async (req, res) => {
  try {
    // https://mongoosejs.com/docs/api/aggregate.html#Aggregate.prototype.search(),
    // https://www.statology.org/mongodb-random-sample/
    const docs = await Song.aggregate([{ $sample: { size: 5 } }]);

    return res.json({ songs: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error Finding Songs' });
  }
};

// Saves an uploaded song to the database
const saveSong = async (req, res) => {
  // Checks if a file was provided
  if (!req.file || !req.body.fileName) {
    return res.status(400).json({ error: 'Missing File or Filename' });
  }

  // Checks if the file is an MP3
  if (req.file.mimetype !== 'audio/mpeg') {
    return res.status(400).json({ error: 'Invalid File Type' });
  }

  // Checks if the user has the space to upload
  const query = { username: req.session.account.username };
  let doc;
  try {
    doc = await Account.findOne(query).select('premiumSubscription numOwnedSongs');
    if (!doc.premiumSubscription && doc.numOwnedSongs >= 5) {
      return res.status(400).json({ error: 'Max Number of Uploads Met.' });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Problem Communicating With Database' });
  }

  // Creates a data file from the Multer Upload
  const songData = {
    name: req.body.fileName,
    filename: req.file.originalname,
    data: req.file.buffer,
    size: req.file.size,
    owner: req.session.account.username,
  };

  // Tries to save the song
  try {
    const newSong = new Song(songData);
    await newSong.save();
    doc.numOwnedSongs++;
    await doc.save();
    return res.status(201).json({ filename: newSong.filename });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error Saving Song!' });
  }
};

// Function to delete a song
const deleteSong = async (req, res) => {
  // Checks if the id is present
  if (!req.body.id) {
    return res.status(400).json({ error: 'Missing ID to Delete' });
  }

  // Tries to delete the song from the database
  try {
    const query = { _id: req.body.id };
    const doc = await Song.findOneAndDelete(query).select('name').lean().exec();
    return res.json({ message: `Successfully Deleted ${doc.name}` });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error With Contacting Database' });
  }
};

// Function to get all the ids of a user's songs
const retrieveUserSongs = async (req, res) => {
  // If missing a parameter, returns a 400 status
  if (!req.query.user && req.session.account) {
    return res.json({ redirect: `/account?user=${req.session.account.username}` });
  }

  // Determines if the user is the owner of the songs
  const { user } = req.query;
  if (!user) {
    return res.status(400).json({ error: 'No User Provided' });
  }

  let owner = false;
  if (req.session.account && (req.session.account.username === user)) {
    owner = true;
  }

  // Tries to get the songs uploaded by a user from the database
  try {
    const query = { owner: user };
    const docs = await Song.find(query).select('_id name').exec();

    return res.json({ songs: docs, owner });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error When Retrieving Id\'s' });
  }
};

// Load Song Function
const retrieveSong = async (req, res) => {
  // If an id wasn't provided, don't load the song
  if (!req.query._id) {
    return res.status(400).json({ error: 'ID Not Provided' });
  }

  // Tries to get a song from the database from the id
  let doc;

  try {
    const query = { _id: req.query._id };
    doc = await Song.findOne(query);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error Retrieving File!' });
  }

  // If the file isn't found, return a 404
  if (!doc) {
    return res.status(404).json({ error: 'File Not Found!' });
  }

  // Sends the file back to the client
  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Length': doc.size,
    'Content-Disposition': `filename="${doc.filename}"`,
  });

  return res.send(doc.data);
};

// Gets the name of a song based on an id
const getSongName = async (req, res) => {
  // If missing an id, return a 400 status
  if (!req.query.id) {
    return res.status(400).json({ error: 'Missing Id!' });
  }

  // Tries to find a song and return it's name
  const query = { _id: req.query.id };
  let doc;

  try {
    doc = await Song.findOne(query).select('name').lean().exec();
    let songName;
    if (!doc) {
      songName = false;
    } else {
      songName = doc.name;
    }
    return res.json({ songName });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Problem Communicating With The Server' });
  }
};

// Searches for all the songs that match a given search param
const searchSong = async (req, res) => {
  // Check if params are present
  if (!req.query.search || req.query.search.length === 1) {
    return res.status(400).json({ error: 'Missing or Invalid Search Parameter (Must be More Than One Character)' });
  }

  let docs;

  // Creates the regex param
  // https://stackoverflow.com/questions/4029109/javascript-regex-how-to-put-a-variable-inside-a-regular-expression
  // https://javascript.info/regexp-introduction#:~:text=A%20regular%20expression%20consists%20of,otherwise%2C%20only%20the%20first%20one.
  const regexExpression = new RegExp(req.query.search, 'gi');

  // Tries to search for all songs that match the search param
  try {
    // https://stackoverflow.com/questions/32898139/partial-string-matching-in-mongodb
    // https://www.mongodb.com/docs/manual/reference/operator/query/regex/
    const query = { name: { $regex: regexExpression } };
    docs = await Song.find(query);
    return res.json({ searchResult: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Error Searching Database');
  }
};

// Exports
module.exports = {
  homePage,
  accountPage,
  notFoundPage,
  getRandomSong,
  saveSong,
  deleteSong,
  retrieveUserSongs,
  retrieveSong,
  getSongName,
  searchSong,
};
