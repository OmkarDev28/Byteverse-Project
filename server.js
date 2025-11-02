
import express from "express";
import session from "express-session";
import passport from "passport";
import authRoutes from "./backend/routes/authRoutes.js";
import userRoutes from "./backend/routes/userRoutes.js";
import postRoutes from "./backend/routes/postRoutes.js";
import commentRoutes from "./backend/routes/commentRoutes.js";

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
app.use(postRoutes)
app.use(commentRoutes);

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
