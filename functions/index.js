// --- START OF FILE functions/index.js (FINAL, COMPLETE, AND CORRECTED VERSION) ---

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
// Binnen een Firebase-omgeving worden de instellingen automatisch gedetecteerd.
admin.initializeApp();
const db = admin.database();

const app = express();

// --- CORS CONFIGURATIE ---
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(',');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

// Secrets
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

// --- DEFINITIEVE, CORRECTE HELPER FUNCTIE ---
const extractJsonFromString = (str) => {
  if (!str || typeof str !== 'string') {
    console.error("extractJsonFromString received a non-string input:", str);
    return null;
  }
  const markdownMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    const jsonStr = markdownMatch[1];
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse JSON from markdown block:", e);
      console.error("Original content of markdown block:", jsonStr);
      return null;
    }
  }
  const trimmedStr = str.trim();
  if ((trimmedStr.startsWith('{') && trimmedStr.endsWith('}')) || (trimmedStr.startsWith('[') && trimmedStr.endsWith(']'))) {
    try {
      return JSON.parse(trimmedStr);
    } catch (e) {
      console.error("Failed to parse the entire string as JSON:", e);
      console.error("Original string:", trimmedStr);
      return null;
    }
  }
  console.error("Could not find a valid JSON object or markdown block in the string:", str);
  return null;
};

// --- ANDERE HELPER FUNCTIES ---
const getDefaultAppData = (username) => {
  const linkId = uuidv4();
  const groupId = uuidv4();
  return {
    profile: { name: username, handle: `@${username}`, avatarUrl: `https://i.pravatar.cc/150?u=${username}`, bio: "Welcome to my page!", },
    linkGroups: { [groupId]: { id: groupId, title: "My Links", links: { [linkId]: { id: linkId, title: "My Website", url: "https://example.com", clicks: 0, style: "fill", order: 0, active: true }, }, order: 0, }, },
    socials: { [uuidv4()]: { id: uuidv4(), platform: "twitter", url: "https://twitter.com/example", order: 0 }, },
    palettes: { "default": { id: "default", name: "Default", light: { "--background-color": "#f3f4f6", "--surface-color": "#ffffff", "--text-primary": "#1f2937", "--surface-color-hover": "#f9fafb", "--text-secondary": "#6b7280", "--accent-color": "#3b82f6", "--accent-color-hover": "#2563eb", "--border-color": "#e5e7eb", "--avatar-border-color": "#ffffff", "--input-background-color": "#f3f4f6", "--response-background-color": "#e5e7eb", "--disabled-background-color": "#d1d5db", }, dark: { "--background-color": "#111827", "--surface-color": "#1f2937", "--surface-color-hover": "#374151", "--text-primary": "#f9fafb", "--text-secondary": "#9ca3af", "--accent-color": "#60a5fa", "--accent-color-hover": "#3b82f6", "--border-color": "#374151", "--avatar-border-color": "#1f2937", "--input-background-color": "#374151", "--response-background-color": "#111827", "--disabled-background-color": "#4b5563", }, }, },
    customization: { theme: "light", paletteId: "default", fontId: "font-sans", linkAnimation: "none", backgroundImageUrl: "", customColors: { light: {}, dark: {} }, customPaletteName: "Custom" },
    adminKey: null,
  };
};

const transformRtdbObjectsToArrays = (data) => {
    const transformed = JSON.parse(JSON.stringify(data));
    if (transformed.linkGroups && typeof transformed.linkGroups === 'object' && !Array.isArray(transformed.linkGroups)) {
        transformed.linkGroups = Object.values(transformed.linkGroups).sort((a, b) => (a.order || 0) - (b.order || 0));
        transformed.linkGroups.forEach(group => {
            if (group.links && typeof group.links === 'object' && !Array.isArray(group.links)) {
                group.links = Object.values(group.links).sort((a, b) => (a.order || 0) - (b.order || 0));
            } else if (!group.links) { group.links = []; }
        });
    } else if (!transformed.linkGroups) { transformed.linkGroups = []; }
    if (transformed.socials && typeof transformed.socials === 'object' && !Array.isArray(transformed.socials)) {
        transformed.socials = Object.values(transformed.socials).sort((a, b) => (a.order || 0) - (b.order || 0));
    } else if (!transformed.socials) { transformed.socials = []; }
    if (transformed.palettes && typeof transformed.palettes === 'object' && !Array.isArray(transformed.palettes)) {
        if (!transformed.palettes["default"]) { transformed.palettes["default"] = getDefaultAppData("").palettes["default"]; }
        transformed.palettes = Object.values(transformed.palettes);
    } else if (!transformed.palettes) { transformed.palettes = [getDefaultAppData("").palettes["default"]]; }
    if (!transformed.customization) transformed.customization = getDefaultAppData("").customization;
    if (!transformed.customization.customColors) transformed.customization.customColors = {light: {}, dark: {}};
    if (!transformed.customization.customColors.light) transformed.customization.customColors.light = {};
    if (!transformed.customization.customColors.dark) transformed.customization.customColors.dark = {};
    return transformed;
};

const transformArraysToRtdbObjects = (data) => {
    const transformed = JSON.parse(JSON.stringify(data));
    if (transformed.linkGroups && Array.isArray(transformed.linkGroups)) {
        const linkGroupsObject = {};
        transformed.linkGroups.forEach((group, index) => {
            if (group.id) {
                const { links, ...groupProps } = group;
                linkGroupsObject[group.id] = { ...groupProps, order: index };
                if (links && Array.isArray(links)) {
                    const linksObject = {};
                    links.forEach((link, linkIndex) => { if (link.id) { linksObject[link.id] = { ...link, order: linkIndex }; } });
                    linkGroupsObject[group.id].links = linksObject;
                } else { linkGroupsObject[group.id].links = {}; }
            }
        });
        transformed.linkGroups = linkGroupsObject;
    } else if (!transformed.linkGroups) { transformed.linkGroups = {}; }
    if (transformed.socials && Array.isArray(transformed.socials)) {
        const socialsObject = {};
        transformed.socials.forEach((social, index) => { if (social.id) { socialsObject[social.id] = { ...social, order: index }; } });
        transformed.socials = socialsObject;
    } else if (!transformed.socials) { transformed.socials = {}; }
    if (transformed.palettes && Array.isArray(transformed.palettes)) {
         const palettesObject = {};
        transformed.palettes.forEach(palette => {
            if (palette.id) {
                 palettesObject[palette.id] = { ...palette };
                 if (Array.isArray(palettesObject[palette.id].light)) palettesObject[palette.id].light = {};
                 if (Array.isArray(palettesObject[palette.id].dark)) palettesObject[palette.id].dark = {};
            }
        });
        transformed.palettes = palettesObject;
    } else if (!transformed.palettes) { transformed.palettes = {}; }
     if (!transformed.customization) transformed.customization = {};
     if (!transformed.customization.customColors) transformed.customization.customColors = {light: {}, dark: {}};
     if (Array.isArray(transformed.customization.customColors.light)) transformed.customization.customColors.light = {};
     if (Array.isArray(transformed.customization.customColors.dark)) transformed.customization.customColors.dark = {};
    return transformed;
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

// --- ROUTES ---

// Auth Routes
app.post("/users/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).send({ message: "Email, password, and username are required." });
    }
    const usersRef = db.ref('users');
    const emailSnapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    if (emailSnapshot.exists()) {
      return res.status(409).send({ message: "Email address already in use." });
    }
    const userSnapshot = await usersRef.child(username).once('value');
    if (userSnapshot.exists()) {
      return res.status(409).send({ message: "Username already taken." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserData = { username, email, password: hashedPassword };
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
    if (!email || !password) {
      return res.status(400).send({ message: "Email and password are required." });
    }
    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) {
      return res.status(401).send({ message: "Invalid credentials." });
    }
    const users = snapshot.val();
    const username = Object.keys(users)[0];
    const user = users[username];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send({ message: "Invalid credentials." });
    }
    const token = jwt.sign({ username: user.username, uid: user.username }, JWT_SECRET, { expiresIn: "24h" });
    res.status(200).send({ token, user: { username: user.username, email: user.email } });
  } catch (error) {
    console.error("Error in /users/login:", error);
    res.status(500).send({ message: "Internal Server Error. Could not log in." });
  }
});

// App Data Routes
app.get("/users/:username/appData", authenticateToken, async (req, res) => {
  try {
    const requestedUsername = req.params.username;
    const authenticatedUsername = req.user.username;
    if (requestedUsername !== authenticatedUsername) {
      return res.status(403).send({ message: "Access denied. You can only access your own data." });
    }
    const userAppDataRef = db.ref(`users/${requestedUsername}/appData`);
    const snapshot = await userAppDataRef.once('value');
    if (!snapshot.exists()) {
      const defaultData = getDefaultAppData(requestedUsername);
      await userAppDataRef.set(defaultData);
      return res.status(200).send(transformRtdbObjectsToArrays(defaultData));
    }
    res.status(200).send(transformRtdbObjectsToArrays(snapshot.val()));
  } catch (error) {
    console.error("Error in /users/:username/appData GET:", error);
    res.status(500).send({ message: "Internal Server Error. Could not retrieve app data." });
  }
});

app.put("/users/:username/appData", authenticateToken, async (req, res) => {
  try {
    const requestedUsername = req.params.username;
    const authenticatedUsername = req.user.username;
    if (requestedUsername !== authenticatedUsername) {
      return res.status(403).send({ message: "Access denied. You can only update your own data." });
    }
    if (!req.body || typeof req.body !== 'object') {
         return res.status(400).send({ message: "Invalid data format." });
    }
    const updatedAppDataInRtdbFormat = transformArraysToRtdbObjects(req.body);
    const userAppDataRef = db.ref(`users/${requestedUsername}/appData`);
    await userAppDataRef.set(updatedAppDataInRtdbFormat);
    res.status(200).send({ message: "App data updated successfully." });
  } catch (error) {
    console.error("Error in /users/:username/appData PUT:", error);
    res.status(500).send({ message: "Internal Server Error. Could not update app data." });
  }
});

// Analytics Routes
app.post("/analytics/click/:username/:linkId", async (req, res) => {
  try {
    const { username, linkId } = req.params;
    if (!username || !linkId) {
        return res.status(400).send({ message: "username and linkId are required." });
    }
    const linkClicksRef = db.ref(`analytics/${username}/clicks/${linkId}/count`);
    await linkClicksRef.transaction((currentCount) => (currentCount || 0) + 1);
    const clickTimestampRef = db.ref(`analytics/${username}/clicks/${linkId}/timestamps`);
    await clickTimestampRef.push(admin.database.ServerValue.TIMESTAMP);
    res.status(200).send({ message: "Click registered successfully." });
  } catch (error) {
    console.error("Error in /analytics/click/:username/:linkId POST:", error);
    res.status(500).send({ message: "Internal Server Error. Could not register click." });
  }
});

app.get("/users/:username/analytics", authenticateToken, async (req, res) => {
  try {
    const requestedUsername = req.params.username;
    if (requestedUsername !== req.user.username) {
      return res.status(403).send({ message: "Access denied." });
    }
    const userAnalyticsRef = db.ref(`analytics/${requestedUsername}/clicks`);
    const snapshot = await userAnalyticsRef.once('value');
    if (!snapshot.exists()) {
      return res.status(200).send([]);
    }
    const clicksData = snapshot.val();
    const analyticsList = Object.keys(clicksData).map(linkId => {
        const clickInfo = clicksData[linkId];
        const timestamps = clickInfo.timestamps ? Object.values(clickInfo.timestamps) : [];
        const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null;
        return {
            linkId: linkId,
            clicks: clickInfo.count || 0,
            latestClickTimestamp: latestTimestamp ? new Date(latestTimestamp).toISOString() : null,
        };
    }).sort((a, b) => b.clicks - a.clicks);
    res.status(200).send(analyticsList);
  } catch (error) {
    console.error("Error in /users/:username/analytics GET:", error);
    res.status(500).send({ message: "Internal Server Error. Could not retrieve analytics data." });
  }
});

// AI Routes
const generateAIResponse = async (prompt, modelName = "gemini-1.5-flash-latest") => {
    if (!genAI) {
        throw new Error("AI service is not available. Please ensure GEMINI_API_KEY is set correctly.");
    }
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating AI content:", error);
        throw new Error("An error occurred while generating AI content. Please try again.");
    }
};

app.post("/ai/generate-theme", authenticateToken, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).send({ message: "Prompt is required." });
        const aiPrompt = `Generate a color palette for a website based on the following description: "${prompt}". Provide the output as a JSON object with two keys: "name" (a short descriptive name for the palette) and "colors". The "colors" object should have two keys: "light" and "dark". Each of these should be an object mapping CSS variable names (like --background-color, --surface-color, --text-primary, --text-secondary, --accent-color, --border-color, --avatar-border-color, --input-background-color, --response-background-color, --disabled-background-color) to hex color codes. Only return the JSON object, no other text.`;
        const aiResponseText = await generateAIResponse(aiPrompt);
        const palette = extractJsonFromString(aiResponseText);
        if (palette && typeof palette.name === 'string' && palette.colors && typeof palette.colors.light === 'object' && typeof palette.colors.dark === 'object') {
            palette.id = uuidv4();
            res.status(200).send(palette);
        } else {
            console.error("AI generated invalid theme JSON or failed to extract:", aiResponseText);
            res.status(500).send({ message: "AI generated invalid theme data. Please try a different prompt." });
        }
    } catch (error) {
        console.error("Error in /ai/generate-theme:", error);
        res.status(500).send({ message: error.message || "Internal Server Error." });
    }
});

app.post("/ai/generate-bio", authenticateToken, async (req, res) => {
     try {
        const { keywords, name } = req.body;
        if (!keywords) return res.status(400).send({ message: "Keywords are required." });
        const aiPrompt = `Generate a short and engaging bio for a link-in-bio page. The person's name is "${name}". Use the following keywords to guide the bio: "${keywords}". Keep it concise (under 160 characters) and use emojis where appropriate. Only return the bio text, no other text.`;
        const aiResponseText = await generateAIResponse(aiPrompt);
        res.status(200).send({ bio: aiResponseText });
     } catch (error) {
        console.error("Error in /ai/generate-bio:", error);
        res.status(500).send({ message: error.message || "Internal Server Error." });
     }
});

app.post("/ai/generate-link-groups", authenticateToken, async (req, res) => {
    try {
        const { links } = req.body;
        if (!links || !Array.isArray(links) || links.length === 0) {
            return res.status(400).send({ message: "An array of links with at least one link is required." });
        }
        const linkList = links.map(link => `- ${link.title} (ID: ${link.id})`).join('\n');
        const aiPrompt = `Given the following list of links (each with a title and a unique ID), categorize them into logical groups. Provide the output as a JSON array of objects. Each object should have two keys: "groupTitle" (the title of the group) and "linkIds" (an array of the IDs of the links belonging to this group). Ensure all provided link IDs are included in the output, assigned to exactly one group. Do not include any link IDs that were not in the input list. Only return the JSON array, no other text.\n\nLinks:\n${linkList}\n\nExample Output:\n[\n  { "groupTitle": "My Socials", "linkIds": ["social1", "social2"] },\n  { "groupTitle": "My Projects", "linkIds": ["projectA", "projectB"] }\n]`;
        const aiResponseText = await generateAIResponse(aiPrompt);
        const groupSuggestions = extractJsonFromString(aiResponseText);
        if (groupSuggestions && Array.isArray(groupSuggestions) && groupSuggestions.every(group => typeof group.groupTitle === 'string' && Array.isArray(group.linkIds))) {
            const inputLinkIds = new Set(links.map(link => link.id));
            const outputLinkIds = new Set(groupSuggestions.flatMap(group => group.linkIds));
            if (Array.from(inputLinkIds).every(id => outputLinkIds.has(id)) && Array.from(outputLinkIds).every(id => inputLinkIds.has(id))) {
                res.status(200).send(groupSuggestions);
            } else {
                console.error("AI generated incomplete or incorrect link group IDs:", aiResponseText);
                res.status(500).send({ message: "AI generated invalid group suggestions. Please try again." });
            }
        } else {
            console.error("AI generated invalid link group JSON or failed to extract:", aiResponseText);
            res.status(500).send({ message: "AI generated invalid group data. Please try a different prompt or regenerate." });
        }
    } catch (error) {
        console.error("Error in /ai/generate-link-groups:", error);
        res.status(500).send({ message: error.message || "Internal Server Error." });
    }
});

app.post("/ai/generate-link-title", authenticateToken, async (req, res) => {
     try {
        const { title } = req.body;
        if (!title) return res.status(400).send({ message: "Keywords are required." });
        const aiPrompt = `Generate a concise and engaging title for a link based on the following keywords: "${title}". Include a relevant emoji at the beginning. Keep it under 40 characters. Only return the title text, no other text.`;
        const aiResponseText = await generateAIResponse(aiPrompt);
        res.status(200).send({ title: aiResponseText });
     } catch (error) {
        console.error("Error in /ai/generate-link-title:", error);
        res.status(500).send({ message: error.message || "Internal Server Error." });
     }
});

// Proxy route voor de streaming "Ask Me Anything" functie
app.post("/ai/ask-question-stream", authenticateToken, async (req, res) => {
  try {
    const { question, influencerName, influencerBio } = req.body;
    if (!question || !influencerName || !influencerBio) {
      return res.status(400).send({ message: "question, influencerName, and influencerBio are required." });
    }

    if (!genAI) {
      throw new Error("AI service is not initialized.");
    }

    const aiPrompt = `You are role-playing as a social media influencer. Your name is ${influencerName} and your bio is "${influencerBio}". Answer the following question from your perspective, in a friendly and engaging tone. Keep the answer concise. Do not break character. The question is: "${question}"`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContentStream(aiPrompt);

    // Stel de headers in voor een streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Stream de response
    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    
    // Sluit de stream af
    res.end();

  } catch (error) {
    console.error("Error in /ai/ask-question-stream:", error);
    // Zorg ervoor dat er een fout wordt gestuurd als er iets misgaat
    if (!res.headersSent) {
      res.status(500).send({ message: "Internal Server Error. Could not get a streaming response." });
    } else {
      res.end();
    }
  }
});

// Exporteer de Express app als een Cloud Function
exports.api = onRequest(
    {
        region: 'europe-west3',
        secrets: ["GEMINI_API_KEY", "JWT_SECRET"],
    },
    app
);