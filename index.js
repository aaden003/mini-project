// Import the modules we need
var express = require("express"); // Express
var ejs = require("ejs");
var bodyParser = require("body-parser"); // for parsing the body of the request
const mysql = require("mysql"); // Import the mysql module
const cookieParser = require("cookie-parser"); // cookie parser
const session = require("express-session"); //session
var path = require("path"); // Path module
//Express sanitization
const expressSanitizer = require("express-sanitizer");

require("dotenv").config(); // Import the dotenv module

// Create a connection to the database
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_DATABASE;

// Create the express application object
const app = express();
const port = 8000;

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

// To parse cookies from the HTTP Request
app.use(cookieParser());

// Set up css
app.use(express.static(__dirname + "/public"));

// Create a session
app.use(
  session({
    secret: "somerandomstuff",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000,
    },
  })
);

app.use(express.json());
//Use sanitizer
app.use(expressSanitizer());

// Define the database connection
var db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});
// Connect to the database
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to database");
});


global.db = db;

// Define our data
var shopData = { shopName: "Books Shop" };

// Requires the main.js file inside the routes folder passing in the Express app and data as arguments.  All the routes will go in this file
require("./routes/main")(app, shopData);

// Start the web app listening
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
