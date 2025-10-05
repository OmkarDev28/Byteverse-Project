// server.js
import express from "express";
import session from "express-session";
import passport from "passport";
import authRoutes from "./backend/routes/authRoutes.js";
import userRoutes from "./backend/routes/userRoutes.js";

const app = express();
const port = 3000;

app.use(express.json());

app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use( authRoutes);
app.use(userRoutes);

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
