const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { onRequest } = require("firebase-functions/v2/https");

admin.initializeApp({
  databaseURL: "https://linkhub-db-default-rtdb.europe-west1.firebasedatabase.app"
});
const db = admin.database();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-please-change-this";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI;
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (e) {
    console.error("Failed to initialize GoogleGenerativeAI", e);
  }
}

const getDefaultAppData = (username) => {
  const linkId = uuidv4();
  const groupId = uuidv4();
  return {
    profile: { name: username, handle: `@${username}`, avatarUrl: "https://i.pravatar.cc/150?u=" + username, bio: "Welcome to my page!", },
    linkGroups: {
      [groupId]: {
        id: groupId,
        title: "My Links",
        links: {
          [linkId]: { id: linkId, title: "My Website", url: "https://example.com", clicks: 0, style: "fill", order: 0, active: true },
        },
      },
    },
    socials: [ { id: uuidv4(), platform: "twitter", url: "https://twitter.com/example" }, ],
    palettes: [ { id: "default", name: "Default", light: { "--background-color": "#f3f4f6", "--surface-color": "#ffffff", "--text-primary": "#1f2937", }, dark: { "--background-color": "#111827", "--surface-color": "#1f2937", "--text-primary": "#f9fafb", }, }, ],
    customization: { theme: "light", paletteId: "default", fontId: "font-sans", linkAnimation: "none", backgroundImageUrl: "", },
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post("/users/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) return res.status(400).send({ message: "All fields are required." });
    
    const usersRef = db.ref('users');
    const emailSnapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    if (emailSnapshot.exists()) return res.status(409).send({ message: "Email already in use." });

    const userSnapshot = await usersRef.child(username).once('value');
    if (userSnapshot.exists()) return res.status(409).send({ message: "Username already taken." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserData = { username, email, password: hashedPassword, appData: getDefaultAppData(username) };
    await usersRef.child(username).set(newUserData);
    
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
    res.status(201).send({ token, user: { username, email } });
  } catch (error) {
    console.error("Error in /users/register:", error);
    res.status(500).send({ message: "Internal Server Error. Could not register user." });
  }
});

app.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send({ message: "Email and password are required." });

    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) return res.status(401).send({ message: "Invalid credentials." });
    
    const users = snapshot.val();
    const username = Object.keys(users)[0];
    const user = users[username];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send({ message: "Invalid credentials." });

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "24h" });
    res.status(200).send({ token, user: { username: user.username, email: user.email } });
  } catch (error) {
    console.error("Error in /users/login:", error);
    res.status(500).send({ message: "Internal Server Error. Could not log in." });
  }
});

// Other routes remain the same...
app.get("/users/:username/appData", authenticateToken, (req, res) => { /* ... */ });
app.put("/users/:username/appData", authenticateToken, (req, res) => { /* ... */ });
app.post("/links/:linkId/click", (req, res) => { /* ... */ });
app.get("/users/:username/analytics", authenticateToken, (req, res) => { /* ... */ });

exports.api = onRequest(
    { 
        region: 'europe-west3', 
        secrets: ["GEMINI_API_KEY", "JWT_SECRET"],
        minInstances: 1,
    }, 
    app
);
