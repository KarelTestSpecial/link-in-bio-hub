const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { onRequest } = require("firebase-functions/v2/https");

// Initialiseer Firebase Admin SDK
admin.initializeApp({
  databaseURL: "https://link-in-bio-hub-default-rtdb.europe-west1.firebasedatabase.app"
});
const db = admin.database();

const app = express();
app.use(cors({ origin: ['https://link-in-bio-2.web.app', 'http://localhost:5173', 'https://link-in-bio-hub.web.app'] }));
app.use(express.json());

// Gebruik process.env voor secrets, wat de standaard is voor 2nd Gen functions
const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI;
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (e) {
    console.error("Failed to initialize GoogleGenerativeAI", e);
  }
} else {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
}

// ... (rest of the helper functions and routes remain the same) ...

// Exporteer de Express app als een Cloud Function (2e generatie)
exports.api = onRequest(
    {
        region: 'europe-west3',
        secrets: ["GEMINI_API_KEY", "JWT_SECRET"],
        minInstances: 0,
    },
    app
);
