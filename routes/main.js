const bcrypt = require("bcrypt");
const saltRounds = 10;
//Express Validator
const { check, validationResult } = require("express-validator");
const request = require("request");
require("dotenv").config(); // Import the dotenv module

//Exporting the function
module.exports = function (app, shopData) {
  // Constant variable for redirecting the page if user is not logged in
  const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
      res.redirect("./auth");
    } else {
      next();
    }
  };

  //Login
  app.get("/auth", function (req, res) {
    //If the user is already logged in, redirect to the home page
    if (req.session.loggedin) {
      console.log("User is already logged in");
      res.redirect("./");
    } else {
      //If the user is not logged in, render the login page
      let newData = Object.assign({}, shopData, { messages: "" });
      res.render("login", newData);
    }
  });

  //Login POST   //Check if the user is logged in //Username min 3 characters
  app.post(
    "/auth",
    check("username").isLength({ min: 3 }),
    function (req, res) {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.redirect("./auth");
      } else {
        //If the user is not logged in, check the credentials
        //Sanitize the username and password

        const username = req.sanitize(req.body.username);
        const password = req.body.pass;

        //Check if the username and password are correct
        let sqlQuery = "SELECT * FROM users WHERE username = ?";
        db.query(sqlQuery, [username], function (err, result) {
          if (err) throw err;
          if (result.length > 0) {
            //Compare the password
            bcrypt.compare(
              password,
              result[0].password,
              function (err, response) {
                //If the password is correct
                if (response) {
                  req.session.loggedin = true;
                  req.session.username = username;
                  req.session.userId = req.body.username;
                  res.redirect("./");
                } else {
                  //If the password is incorrect
                  // res.send('Incorrect  Password!');

                  //If the user is not logged in, render the login page
                  let newData = Object.assign({}, shopData, {
                    messages: "Incorrect Password!",
                  });
                  res.render("login", newData);
                }
                res.end();
              }
            );
          } else {
            //If the username is incorrect
            // res.send('Incorrect  Password!');
            //If the user is not logged in, render the login page
            let newData = Object.assign({}, shopData, {
              messages: "Incorrect Username!",
            });
            res.render("login", newData);
          }
        });
      }
    }
  );

  // Handle our routes
  // Home page
  app.get("/", function (req, res) {
    let newData = Object.assign({}, shopData, {
      isLoggedin: req.session.loggedin,
    });
    res.render("index", newData);
  });

  //contact page
    app.get("/contact", function (req, res) {
    let newData = Object.assign({}, shopData, {
      isLoggedin: req.session.loggedin,
    });
      res.render("contact", newData);
    });


  // Logout
  // Destroy the session and redirect to the home page
  app.get("/logout", function (req, res) {
    if (req.session) {
      req.session.destroy(function (err) {
        if (err) {
          return next(err);
        } else {
          //If the user is not logged in, render the login page
          let newData = Object.assign({}, shopData, { messages: "" });
          res.render("login", newData);
        }
      });
    }
  });

  // About page
  app.get("/about", function (req, res) {
    let newData = Object.assign({}, shopData, {
      isLoggedin: req.session.loggedin,
    });
    res.render("about", newData);
  });

  // Search page
  app.get("/search", redirectLogin, function (req, res) {
    let newData = Object.assign({}, shopData, {
      isLoggedin: req.session.loggedin,
    });
    res.render("search", newData);
  });

  // Search Results page //// Check if the keyword is at least 3 characters long
  app.get(
    "/search-result",
    redirectLogin,
    check("keyword").isLength({ min: 3 }),
    function (req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.redirect("./search");
      } else {
        const SearchKeyword = req.sanitize(req.query.keyword); // Sanitize the keyword

        //Get the search query
        let sqlquery =
          "SELECT * FROM books WHERE name LIKE '%" + SearchKeyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
          //If there is an error, throw it
          if (err) {
            res.redirect("./");
          }

          let newData = Object.assign(
            {},
            shopData,
            { message: "" },
            { availableBooks: result },
            { isLoggedin: req.session.loggedin }
          );
          console.log(newData);
          res.render("list", newData);
        });
      }
    }
  );

  // Register page
  app.get("/register", function (req, res, next) {

    let errors = req.query.error ? req.query.error.map(error => decodeURIComponent(error)) : [];

    errors = errors.length ? errors : '';

    //If the user is already logged in, redirect to the home page
    if (req.session.loggedin) {
      res.redirect("./");
    } else {
      let newData = Object.assign(
        {},
        shopData,
        { message: errors },
        { isLoggedin: req.session.loggedin }
      );
      res.render("register", newData);
    }
  });

  // Register POST
  app.post(
      "/register",
      check("email").isEmail().withMessage("Please enter a valid email address \n"),
      check("pass").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long \n"),
      check("username").isLength({ min: 3 }).withMessage("Username must be at least 3 characters long \n"),

      function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          console.log(errors);
          // Convert the errors to an array of query parameters
          const errorQueryParams = errors.array().map(error => `error=${encodeURIComponent(error.msg)}`);
          console.log(errorQueryParams);
          //errors.array().map((error) => error.msg);

          // Redirect with error messages in the query string
          return res.redirect(302, `./register?${errorQueryParams.join('&')}`);
        }

        const plainPassword = req.body.pass;
        const firstName = req.sanitize(req.body.first);
        const lastName = req.sanitize(req.body.last);
        const email = req.body.email;
        const username = req.sanitize(req.body.username);

        bcrypt.hash(plainPassword, saltRounds, function (err, hash) {
          console.log("Hashed Password: " + hash);

          let query = "SELECT * FROM users WHERE username = '" + username + "'";
          let sqlquery =
              "INSERT INTO users (first_name, last_name, username, email, password) VALUES ('" +
              firstName +
              "', '" +
              lastName +
              "', '" +
              username +
              "', '" +
              email +
              "', '" +
              hash +
              "')";

          db.query(query, (err, result) => {
            if (err) {
              console.error(err);
              return res.render("register", {
                ...shopData,
                message: "Error",
                isLoggedin: req.session.loggedin,
              });
            }

            if (result.length > 0) {
              return res.render("register", {
                ...shopData,
                message: "Username already exists",
                isLoggedin: req.session.loggedin,
              });
            }

            db.query(sqlquery, (err, result) => {
              if (err) {
                console.error(err);
                return res.render("register", {
                  ...shopData,
                  message: "Error",
                  isLoggedin: req.session.loggedin,
                });
              }

              var message =
                  "Hello " +
                  firstName +
                  " " +
                  lastName +
                  " you are now registered! We will send an email to you at " +
                  email +
                  " ";
              message +=
                  "Username is " +
                  username +
                  " " +
                  " Your password is: " +
                  plainPassword +
                  " and your hashed password is: " +
                  hash;

              let newData = {
                ...shopData,
                message: "User register successfully",
                isLoggedin: req.session.loggedin,
              };

              //If the user is not logged in, render the login page
              newData = Object.assign({}, shopData, { messages: "User register Success" });
              res.render("login", newData);
            });
          });
        });
      }
  );


  // List all users
  app.get("/listusers", redirectLogin, function (req, res) {
    // query database to get all the users
    let sqlquery = "SELECT * FROM users"; // query database to get all the users

    // execute sql query
    db.query(sqlquery, (err, result) => {
      if (err) {
        let newData = Object.assign({}, shopData, {
          isLoggedin: req.session.loggedin,
        });
        res.redirect("./");
      }
      let newData = Object.assign(
        {},
        shopData,
        { availableUsers: result },
        { isLoggedin: req.session.loggedin }
      );
      console.log(newData);
      res.render("listUsers", newData);
    });
  });

  // Delete a user form
  app.get("/delete", redirectLogin, function (req, res) {
    let newData = Object.assign(
      {},
      shopData,
      { message: "" },
      { isLoggedin: req.session.loggedin }
    );
    res.render("deleteUser", newData);
  });

  // Delete a user POST
  app.post(
    "/delete",
    redirectLogin,
    check("username").isLength({ min: 3 }), // Check if the username is at least 3 characters long
    function (req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // var newData = Object.assign({}, shopData, {message: errors[0].msg}, {isLoggedin: req.session.loggedin});
        // return res.render('register', newData);
        console.log(errors);
        res.redirect("./delete");
      } else {
        //Get the data from the form
        const username = req.sanitize(req.body.username); // Sanitize the username) ;

        //Check if the username is already taken
        sqlQuery = "select id from users where username = ?";
        db.query(sqlQuery, [username], function (err, result) {
          if (err) throw err;
          if (result.length > 0) {
            //If the username is correct
            let sqlquery =
              "DELETE FROM users WHERE username = '" + username + "'"; // query database to get all the books
            // execute sql query
            db.query(sqlquery, (err, result) => {
              if (err) {
                let newData = Object.assign(
                  {},
                  shopData,
                  { message: "" },
                  { isLoggedin: req.session.loggedin }
                );
                res.render("deleteUser", newData);
              } else {
                let newData = Object.assign(
                  {},
                  shopData,
                  { message: "User deleted" },
                  { isLoggedin: req.session.loggedin }
                );
                console.log(newData);
                res.render("deleteUser", newData);
              }
            });
          } else {
            //If the username is not correct
            let newData = Object.assign(
              {},
              shopData,
              { message: "Username not exist" },
              { isLoggedin: req.session.loggedin }
            );
            res.render("deleteUser", newData);
          }
        });
      }
    }
  );

  // Delete a user
  app.get("/delete/:id", redirectLogin, function (req, res) {
    // if user is not logged in, redirect to the home page

    let sqlquery = "DELETE FROM users WHERE id = " + req.params.id; // query database to get all the users
    // execute sql query
    db.query(sqlquery, (err, result) => {
      if (err) {
        let newData = Object.assign({}, shopData, {
          isLoggedin: req.session.loggedin,
        });
        res.redirect("./listusers");
      } else {
        res.redirect("./listusers");
      }
    });
  });

  //List all books
  app.get("/list", redirectLogin, function (req, res) {
    // query database to get all the books
    let sqlquery = "SELECT * FROM books"; // query database to get all the books
    // execute sql query
    db.query(sqlquery, (err, result) => {
      //If there is an error, throw it
      if (err) {
        res.redirect("./");
      } else {
        //If there is no error, render the list.ejs page
        let newData = Object.assign(
          {},
          shopData,
          { message: "" },
          { availableBooks: result },
          { isLoggedin: req.session.loggedin }
        );
        console.log(newData);
        res.render("list", newData);
      }
    });
  });

  // Delete a book
  app.get("/deleteBook/:id", redirectLogin, function (req, res) {
    // if user is not logged in, redirect to the home page
    let sqlquery = "DELETE FROM books WHERE id = " + req.params.id; // query database to get all the users
    // execute sql query
    db.query(sqlquery, (err, result) => {
      //If there is an error, throw it
      if (err) {
        res.redirect("../list");
      } else {
        res.redirect("../list");
      }
    });
  });

  // Add a book
  app.get("/addbook", redirectLogin, function (req, res) {
    // if user is not logged in, redirect to the home page
    if (!req.session.loggedin) {
      res.redirect("./auth");
    } else {
      let newData = Object.assign(
        {},
        shopData,
        { message: "" },
        { isLoggedin: req.session.loggedin }
      );
      res.render("addbook", newData);
    }
  });

  // Add a book Post
  app.post("/bookadded", redirectLogin, function (req, res) {
    // if user is not logged in, redirect to the home page

    console.log(req.body);

    const title = req.sanitize(req.body.title);
    const author = req.sanitize(req.body.author);
    const genre = req.sanitize(req.body.genre);
    const year = req.sanitize(req.body.year);
    const price = req.sanitize(req.body.price);

    // saving data in database
    let sqlquery = "INSERT INTO books (title, author, genre, year, price) VALUES (?,?,?,?,?)";
    // execute sql query
    let newrecord = [title, author, genre, year, price];
    db.query(sqlquery, newrecord, (err, result) => {
      //If there is an error, throw it
      if (err) {
        return console.error(err.message);
      } else {
        res.redirect("./list");
      }
      //If there is no error, redirect to the list page
    });
  });


  // Search page
  app.get("/weather", function (req, res) {
    let newData = Object.assign(
      {},
      shopData,
      { isLoggedin: req.session.loggedin },
      { message: "" }
    );
    res.render("searchCity", newData);
  });

  // Search Results page
  app.get("/weather-result", function (req, res) {
    let apiKey = process.env.API_KEY; // API key
    let city = req.sanitize(req.query.city); // Sanitize the city
    let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    //Get the search query

    request(url, function (err, response, body) {
      if (err) {
        console.log("error:", error);
        res.redirect("./weather");
      } else {
        console.log("body:", body);

        var weather = JSON.parse(body);

        var errorCode = weather.cod + "";

        if (
          errorCode === "404" ||
          errorCode === "401" ||
          errorCode === "400" ||
          errorCode === "500" ||
          errorCode === "502" ||
          errorCode === "503" ||
          errorCode === "504"
        ) {
          let newData = Object.assign(
            {},
            shopData,
            { isLoggedin: req.session.loggedin },
            { message: weather.message }
          );
          res.render("searchCity", newData);
        } else {
          var temp = weather.main.temp + "°C";
          var humadity = weather.main.humidity;
          var cityName = weather.name;
          var weatherDescription = weather.weather[0].description;
          var sealevel = weather.main.sea_level;
          var windSpeed = weather.wind.speed;
          var minTemp = weather.main.temp_min + "°C";
          var maxTemp = weather.main.temp_max + "°C";

          let newData = Object.assign(
            {},
            shopData,
            { isLoggedin: req.session.loggedin },
            { name: cityName },
            { temp: temp },
            { humadity: humadity },{desc: weatherDescription}, {sealevel: sealevel}, {windSpeed: windSpeed}, {minTemp: minTemp}, {maxTemp: maxTemp}
          );
          res.render("weather", newData);
        }
      }
    });
  });

  //API routes FOR books

  //Get all books
  app.get("/api", function (req, res) {
    var keyword = req.query.keyword;

    if (keyword) {
      let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + keyword + "%'";
      db.query(sqlquery, (err, result) => {
        if (err) {
          res.redirect("./");
        }
        // Return results as a JSON object
        res.json(result);
      });
    } else {
      // Query database to get all the books
      let sqlquery = "Select * from books "; // query database to get all the books
      // Execute the sql query
      db.query(sqlquery, (err, result) => {
        if (err) {
          res.redirect("./");
        }
        // Return results as a JSON object
        res.json(result);
      });
    }
  });

  // Search Tv Program
  app.get("/tv", function (req, res) {
    let newData = Object.assign(
      {},
      shopData,
      { isLoggedin: req.session.loggedin },
      { message: "" }
    );
    res.render("tvSearch", newData);
  });

  // Search Results page
  app.get("/tv-result", function (req, res) {
    let tvShow = req.sanitize(req.query.tvshow); // Sanitize the city
    let url = `https://api.tvmaze.com/search/shows?q=${tvShow}`;
    //Get the search query

    request(url, function (err, response, body) {
      if (err) {
        console.log("error:", err);
        res.redirect("./tv");
      } else {
        //console.log('body:', JSON.parse(body));

        var shows = JSON.parse(body);

        for (let i = 0; i < shows.length; i++) {
          console.log(shows[i].show);
        }

        let newData = Object.assign(
          {},
          shopData,
          { searchKey: tvShow },
          { isLoggedin: req.session.loggedin },
          { shows: shows }
        );
        res.render("tvSearchResult", newData);
        //res.send(shows);
      }
    });
  });




  //The 404 Route (ALWAYS Keep this as the last route)
  app.get("*", function (req, res) {
    let newData = Object.assign({}, shopData, {
      isLoggedin: req.session.loggedin,
    });
    res.render("404", newData);
  });
};
