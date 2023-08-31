// Lirbary Requires
require('dotenv').config();
const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

// Our Script Requires
const router = require('./router.js');

// Establishes the port
const port = process.env.PORT || process.env.NODE_PORT || 3000;

// Connects to our database
const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1/AudioStorm';
mongoose.connect(dbURI).catch((err) => {
  if (err) {
    console.log('Could not connect to database');
    throw err;
  }
});

// Set up the Redis Client
const redisClient = redis.createClient({
  url: process.env.REDISCLOUD_URL,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect to the Redis Client
redisClient.connect().then(() => {
  // Sets up the Express Part of Our App
  const app = express();

  app.use(helmet());
  app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`)));
  app.use(favicon(`${__dirname}/../hosted/img/logo.png`));
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Creates the session settings
  app.use(session({
    key: 'sessionID',
    store: new RedisStore({
      client: redisClient,
    }),
    secret: 'Piano Man',
    resave: false,
    saveUninitialized: false,
  }));

  app.engine('handlebars', expressHandlebars.engine({ defaultLayout: '' }));
  app.set('view engine', 'handlebars');
  app.set('views', `${__dirname}/../views`);

  // Connects the app to the router
  router(app);

  // Starts the app
  app.listen(port, (err) => {
    if (err) { throw err; }
    console.log(`Listening on port ${port}`);
  });
});
