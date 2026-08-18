if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const path = require("path");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");

// ================= SETTINGS =================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600,
  }),

  secret: process.env.SECRET,

  resave: false,
  saveUninitialized: false,

  cookie: {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// ================= DB CONNECT =================
mongoose.set("strictQuery", true);


mongoose.set("bufferCommands", false);

mongoose.connection.on("connected", () => {
  console.log("DB Connected");
});
mongoose.connection.on("error", (err) => {
  console.log("DB Connection Error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.log("DB Disconnected");
});

let connectionPromise = null;

function connectDB() {

  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 60000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        bufferCommands: false,
      })
      .catch((err) => {
     
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
}

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currUser = req.user;
  next();
});

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    connectionPromise = null;
    next(err);
  }
});

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Listings Routes // Reviews Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// ================= 404 =================
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.log(err);

  if (err.name === "CastError") {
    err = new ExpressError(400, "Invalid ID");
  }

  let { statusCode = 500, message = "Something went wrong!" } = err;

  res.status(statusCode).send(message);
});

// ================= SERVER =================
if (process.env.NODE_ENV !== "production") {
  app.listen(8080, () => {
    console.log("Server listening on port 8080");
  });
}

module.exports = app;