
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
  databaseURL: process.env.DATABASE_URL
});
const db = admin.database();

const app = express();

// --- CORS CONFIGURATIE ---
// Definieer de toegestane origins
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(',');

const corsOptions = {
  origin: (origin, callback) => {
    // Sta requests toe als de origin in de lijst staat, of als er geen origin is (bv. server-naar-server)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'], // Sta expliciet de gebruikte methodes toe
  allowedHeaders: ['Content-Type', 'Authorization'], // Sta expliciet de gebruikte headers toe
};

// Schakel pre-flight 'OPTIONS' requests in voor alle routes.
// Dit is de cruciale stap die de "preflight request doesn't pass access control check" fout oplost.
app.options('*', cors(corsOptions));

// Gebruik daarna dezelfde CORS-opties voor alle andere requests.
app.use(cors(corsOptions));
// --- EINDE CORS CONFIGURATIE ---


app.use(express.json());

// Gebruik Firebase Environment Configuration voor secrets
// Zorg ervoor dat je deze secrets hebt ingesteld met `firebase functions:config:set` of Secret Manager
const JWT_SECRET = process.env.JWT_SECRET; // Haal op via Secret Manager
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Haal op via Secret Manager


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


// Helper om JSON uit een string te extraheren, zelfs als het omgeven is door tekst of markdown
const extractJsonFromString = (str) => {
  const match = str.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
  if (match) {
    const jsonStr = match[1] || match[2];
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse extracted JSON:", e);
      return null;
    }
  }
  return null;
};


// Helper functie om standaard App Data te genereren
const getDefaultAppData = (username) => {
  const linkId = uuidv4();
  const groupId = uuidv4();
  return {
    profile: {
      name: username,
      handle: `@${username}`,
      avatarUrl: `https://i.pravatar.cc/150?u=${username}`,
      bio: "Welcome to my page!",
    },
    linkGroups: { // Opgeslagen als object in RTDB
      [groupId]: {
        id: groupId,
        title: "My Links",
        links: { // Opgeslagen als object in RTDB
          [linkId]: { id: linkId, title: "My Website", url: "https://example.com", clicks: 0, style: "fill", order: 0, active: true },
        },
        order: 0, // Volgorde van groepen
      },
    },
    socials: { // Opgeslagen als object in RTDB
      [uuidv4()]: { id: uuidv4(), platform: "twitter", url: "https://twitter.com/example", order: 0 }, // Volgorde van social links
    },
     palettes: { // Opgeslagen als object in RTDB
        "default": { id: "default", name: "Default", light: { "--background-color": "#f3f4f6", "--surface-color": "#ffffff", "--text-primary": "#1f2937", "--surface-color-hover": "#f9fafb", "--text-secondary": "#6b7280", "--accent-color": "#3b82f6", "--accent-color-hover": "#2563eb", "--border-color": "#e5e7eb", "--avatar-border-color": "#ffffff", "--input-background-color": "#f3f4f6", "--response-background-color": "#e5e7eb", "--disabled-background-color": "#d1d5db", }, dark: { "--background-color": "#111827", "--surface-color": "#1f2937", "--surface-color-hover": "#374151", "--text-primary": "#f9fafb", "--text-secondary": "#9ca3af", "--accent-color": "#60a5fa", "--accent-color-hover": "#3b82f6", "--border-color": "#374151", "--avatar-border-color": "#1f2937", "--input-background-color": "#374151", "--response-background-color": "#111827", "--disabled-background-color": "#4b5563", }, },
     },
    customization: {
      theme: "light",
      paletteId: "default",
      fontId: "font-sans",
      linkAnimation: "none",
      backgroundImageUrl: "",
      customColors: { light: {}, dark: {} }, // customColors als objecten
      customPaletteName: "Custom" // Voeg customPaletteName toe voor consistentie met frontend
    },
     adminKey: null, // Voeg adminKey toe als onderdeel van de data structuur
  };
};

// Helper functie om Realtime Database objecten om te zetten naar arrays voor de frontend
const transformRtdbObjectsToArrays = (data) => {
    // Maak een kopie om de originele data niet te wijzigen
    const transformed = JSON.parse(JSON.stringify(data));

    // Transformeer linkGroups van object naar array
    if (transformed.linkGroups && typeof transformed.linkGroups === 'object' && !Array.isArray(transformed.linkGroups)) {
        transformed.linkGroups = Object.values(transformed.linkGroups).sort((a, b) => (a.order || 0) - (b.order || 0)); // Sorteer op order
         // Transformeer links binnen elke groep van object naar array
        transformed.linkGroups.forEach(group => {
            if (group.links && typeof group.links === 'object' && !Array.isArray(group.links)) {
                group.links = Object.values(group.links).sort((a, b) => (a.order || 0) - (b.order || 0)); // Sorteer op order
            } else if (!group.links) {
                group.links = [];
            }
        });
    } else if (!transformed.linkGroups) {
        transformed.linkGroups = [];
    }

    // Transformeer socials van object naar array
    if (transformed.socials && typeof transformed.socials === 'object' && !Array.isArray(transformed.socials)) {
        transformed.socials = Object.values(transformed.socials).sort((a, b) => (a.order || 0) - (b.order || 0)); // Sorteer op order
    } else if (!transformed.socials) {
        transformed.socials = [];
    }

    // Transformeer palettes van object naar array
    // Hierbij is het belangrijk dat de 'default' palette altijd aanwezig is
    if (transformed.palettes && typeof transformed.palettes === 'object' && !Array.isArray(transformed.palettes)) {
         // Voeg de default palette toe als deze mist
        if (!transformed.palettes["default"]) {
             // Haal de default palette op uit een aparte const of logic
             const defaultPalette = getDefaultAppData("").palettes["default"]; // Gebruik getDefaultAppData als bron
             transformed.palettes["default"] = defaultPalette;
        }
        transformed.palettes = Object.values(transformed.palettes);
    } else if (!transformed.palettes) {
        // Als er geen palettes zijn, voeg dan minimaal de default toe
        const defaultPalette = getDefaultAppData("").palettes["default"];
        transformed.palettes = [defaultPalette];
    }

     // Zorg ervoor dat customization en customColors objecten blijven
     if (!transformed.customization) transformed.customization = getDefaultAppData("").customization;
     if (!transformed.customization.customColors) transformed.customization.customColors = {light: {}, dark: {}};
     if (!transformed.customization.customColors.light) transformed.customization.customColors.light = {};
     if (!transformed.customization.customColors.dark) transformed.customization.customColors.dark = {};


    return transformed;
};


// Helper functie om frontend arrays om te zetten naar Realtime Database objecten
const transformArraysToRtdbObjects = (data) => {
    // Maak een diepe kopie om de originele data niet aan te passen
    const transformed = JSON.parse(JSON.stringify(data));

    // Transformeer linkGroups van array naar object
    if (transformed.linkGroups && Array.isArray(transformed.linkGroups)) {
        const linkGroupsObject = {};
        transformed.linkGroups.forEach((group, index) => {
            if (group.id) {
                // Kopieer groep properties en voeg de order property toe
                const { links, ...groupProps } = group;
                linkGroupsObject[group.id] = { ...groupProps, order: index };

                // Transformeer links binnen de groep van array naar object
                if (links && Array.isArray(links)) {
                    const linksObject = {};
                    links.forEach((link, linkIndex) => {
                        if (link.id) {
                             // Kopieer link properties en voeg de order property toe
                            linksObject[link.id] = { ...link, order: linkIndex };
                        }
                    });
                    // Wijs het getransformeerde links object toe aan de groep in het object
                    linkGroupsObject[group.id].links = linksObject;
                } else {
                     // Zorg voor een leeg links object als er geen links waren
                     linkGroupsObject[group.id].links = {};
                }
            }
        });
        transformed.linkGroups = linkGroupsObject;
    } else if (!transformed.linkGroups) {
        transformed.linkGroups = {};
    }

    // Transformeer socials van array naar object
    if (transformed.socials && Array.isArray(transformed.socials)) {
        const socialsObject = {};
        transformed.socials.forEach((social, index) => {
            if (social.id) {
                 socialsObject[social.id] = { ...social, order: index };
            }
        });
        transformed.socials = socialsObject;
    } else if (!transformed.socials) {
        transformed.socials = {};
    }

    // Transformeer palettes van array naar object
    if (transformed.palettes && Array.isArray(transformed.palettes)) {
         const palettesObject = {};
        transformed.palettes.forEach(palette => {
            if (palette.id) {
                 palettesObject[palette.id] = { ...palette };
                 // Zorg ervoor dat light en dark colors objecten zijn
                 if (Array.isArray(palettesObject[palette.id].light)) palettesObject[palette.id].light = {}; // Corrigeer als het per ongeluk een array is
                 if (Array.isArray(palettesObject[palette.id].dark)) palettesObject[palette.id].dark = {}; // Corrigeer als het per ongeluk een array is
            }
        });
        transformed.palettes = palettesObject;
    } else if (!transformed.palettes) {
        transformed.palettes = {};
    }

     // Zorg ervoor dat customization en customColors objecten blijven
     if (!transformed.customization) transformed.customization = {}; // Start met een leeg object indien niet aanwezig
     if (!transformed.customization.customColors) transformed.customization.customColors = {light: {}, dark: {}};
      if (Array.isArray(transformed.customization.customColors.light)) transformed.customization.customColors.light = {}; // Corrigeer indien array
     if (Array.isArray(transformed.customization.customColors.dark)) transformed.customization.customColors.dark = {}; // Corrigeer indien array


    return transformed;
};


// Middleware om authenticatie te controleren
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user; // voeg user payload toe aan request
    next(); // Ga door naar de volgende middleware/route handler
  });
};

// Auth Routes
app.post("/users/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).send({ message: "Email, password, and username are required." });
    }

    const usersRef = db.ref('users');

    // Controleer of email al bestaat
    const emailSnapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    if (emailSnapshot.exists()) {
      return res.status(409).send({ message: "Email address already in use." });
    }

    // Controleer of username al bestaat
    const userSnapshot = await usersRef.child(username).once('value');
    if (userSnapshot.exists()) {
      return res.status(409).send({ message: "Username already taken." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserData = {
        username,
        email,
        password: hashedPassword, // Sla de gehashte wachtwoord op
        // appData wordt aangemaakt bij de eerste GET request
    };

    // Sla alleen de gebruiker credentials op, appData wordt later geladen/aangemaakt
    await usersRef.child(username).set(newUserData);

    // Genereer JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" }); // Token expireert na 24 uur

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
    // Zoek gebruiker op email
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');

    if (!snapshot.exists()) {
      return res.status(401).send({ message: "Invalid credentials." });
    }

    // Haal de gebruikersnaam en data op (er zou maar één resultaat moeten zijn)
    const users = snapshot.val();
    const username = Object.keys(users)[0];
    const user = users[username];

    // Vergelijk wachtwoord
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send({ message: "Invalid credentials." });
    }

    // Genereer JWT token
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
    const authenticatedUsername = req.user.username; // Van de authenticateToken middleware

    // Controleer of de geauthenticeerde gebruiker de eigenaar is van de gevraagde data
    if (requestedUsername !== authenticatedUsername) {
      return res.status(403).send({ message: "Access denied. You can only access your own data." });
    }

    const userAppDataRef = db.ref(`users/${requestedUsername}/appData`);
    const snapshot = await userAppDataRef.once('value');

    if (!snapshot.exists()) {
      // Als er geen data is, maak standaard data aan, sla op en stuur terug
      const defaultData = getDefaultAppData(requestedUsername);
      await userAppDataRef.set(defaultData); // Opslaan in de database
      const transformedDefaultData = transformRtdbObjectsToArrays(defaultData);
      return res.status(200).send(transformedDefaultData);
    }

    let rawData = snapshot.val();

    // Transformeer Realtime Database objecten naar arrays voor frontend
    const transformedData = transformRtdbObjectsToArrays(rawData);

    res.status(200).send(transformedData);

  } catch (error) {
    console.error("Error in /users/:username/appData GET:", error);
    res.status(500).send({ message: "Internal Server Error. Could not retrieve app data." });
  }
});

app.put("/users/:username/appData", authenticateToken, async (req, res) => {
  try {
    const requestedUsername = req.params.username;
    const authenticatedUsername = req.user.username; // Van de authenticateToken middleware
    const updatedAppData = req.body; // De bijgewerkte data van de frontend

    // Controleer of de geauthenticeerde gebruiker de eigenaar is van de data
    if (requestedUsername !== authenticatedUsername) {
      return res.status(403).send({ message: "Access denied. You can only update your own data." });
    }

    // Transformeer frontend arrays naar Realtime Database objecten
    // Controleer of updatedAppData wel data bevat en het verwachte formaat heeft
    if (!updatedAppData || typeof updatedAppData !== 'object') {
         return res.status(400).send({ message: "Invalid data format." });
    }
    // Voer een basic validatie uit op de structuur indien mogelijk

    const updatedAppDataInRtdbFormat = transformArraysToRtdbObjects(updatedAppData);

    const userAppDataRef = db.ref(`users/${requestedUsername}/appData`);
    await userAppDataRef.set(updatedAppDataInRtdbFormat); // Overschrijft de bestaande data

    res.status(200).send({ message: "App data updated successfully." }); // Of 204 No Content

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

    // Increment de klik count voor de specifieke link en eigenaar
    // Gebruik een transactie om race conditions te voorkomen bij het verhogen van de count
    const linkClicksRef = db.ref(`analytics/${username}/clicks/${linkId}/count`);

     await linkClicksRef.transaction((currentCount) => {
        // Als currentCount null is, begin bij 0, anders verhoog met 1
        return (currentCount || 0) + 1;
    });

     // Optioneel: log de timestamp van de klik
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
    const authenticatedUsername = req.user.username; // Van de authenticateToken middleware

    // Controleer of de geauthenticeerde gebruiker de eigenaar is
    if (requestedUsername !== authenticatedUsername) {
      return res.status(403).send({ message: "Access denied. You can only access your own analytics." });
    }

    const userAnalyticsRef = db.ref(`analytics/${requestedUsername}/clicks`);
    const snapshot = await userAnalyticsRef.once('value');

    if (!snapshot.exists()) {
      return res.status(200).send([]); // Stuur een lege array als er geen kliks zijn
    }

    const clicksData = snapshot.val();
    const analyticsList = [];

    // Structureer de data voor de frontend
    // Realtime Database geeft objecten terug: { linkId1: { count: X, timestamps: { timestampId1: TS1, ... } }, ... }
    // We willen waarschijnlijk een array van klik-evenementen voor de frontend,
    // of een overzicht van links met hun totale kliks.
    // Laten we een overzicht maken van links met totale kliks en de laatste timestamp.

    for (const linkId in clicksData) {
        const clickInfo = clicksData[linkId];
        const totalClicks = clickInfo.count || 0;
         let latestTimestamp = null;
        if (clickInfo.timestamps) {
            const timestamps = Object.values(clickInfo.timestamps);
            if (timestamps.length > 0) {
                 // Timestamp from Realtime Database is in milliseconds
                 latestTimestamp = Math.max(...timestamps);
            }
        }

        analyticsList.push({
            linkId: linkId,
            clicks: totalClicks,
             latestClickTimestamp: latestTimestamp ? new Date(latestTimestamp).toISOString() : null, // Formatteer als ISO string
        });
    }

    // Optioneel: Sorteer de analyticsList
    analyticsList.sort((a, b) => b.clicks - a.clicks); // Sorteer op aantal kliks (aflopend)


    res.status(200).send(analyticsList);

  } catch (error) {
    console.error("Error in /users/:username/analytics GET:", error);
    res.status(500).send({ message: "Internal Server Error. Could not retrieve analytics data." });
  }
});


// AI Routes (Proxy naar Gemini via Cloud Functions)
// Deze routes vereisen dat GEMINI_API_KEY is ingesteld als Secret
// Ze gebruiken de `genAI` instantie die aan het begin van het bestand is geïnitialiseerd

// Helper voor het genereren van AI response
const generateAIResponse = async (prompt, modelName = "gemini-1.5-flash-latest") => {
    if (!genAI) {
        // Geef een duidelijkere foutmelding als de AI-service niet geïnitialiseerd is
        throw new Error("AI service is not available. Please ensure GEMINI_API_KEY is set correctly.");
    }
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error generating AI content:", error);
        // Geef een generieke foutmelding aan de gebruiker, log details aan de serverkant
        throw new Error("An error occurred while generating AI content. Please try again.");
    }
};

// Proxy route voor het genereren van een thema
app.post("/ai/generate-theme", authenticateToken, async (req, res) => {
    try {
        const { prompt } = req.body;
         if (!prompt) return res.status(400).send({ message: "Prompt is required." });

        const aiPrompt = `Generate a color palette for a website based on the following description: "${prompt}". Provide the output as a JSON object with two keys: "name" (a short descriptive name for the palette) and "colors". The "colors" object should have two keys: "light" and "dark". Each of these should be an object mapping CSS variable names (like --background-color, --surface-color, --text-primary, --text-secondary, --accent-color, --border-color, --avatar-border-color, --input-background-color, --response-background-color, --disabled-background-color) to hex color codes. Only return the JSON object, no other text.`;

        const aiResponseText = await generateAIResponse(aiPrompt);

        try {
             // Probeer de JSON response te parsen
             const palette = JSON.parse(aiResponseText);
             // Voeg een willekeurige ID toe en controleer of de structuur klopt
             if (palette && typeof palette.name === 'string' && palette.colors && typeof palette.colors.light === 'object' && typeof palette.colors.dark === 'object') {
                 // Voeg een placeholder ID toe; de frontend useAppData hook zal dit verwerken
                 // of je kunt een uuidv4() toevoegen als je het direct in RTDB wilt opslaan hier
                 // Laten we een placeholder ID toevoegen zodat de frontend het kan verwerken
                 palette.id = uuidv4(); // Placeholder ID - Frontend should handle this
                 res.status(200).send(palette);
             } else {
                 console.error("AI generated invalid theme JSON:", aiResponseText);
                 res.status(500).send({ message: "AI generated invalid theme data. Please try a different prompt." });
             }
        } catch (parseError) {
             console.error("Failed to parse AI theme response:", parseError);
            res.status(500).send({ message: "Failed to parse AI theme response. Please try again." });
        }


    } catch (error) {
        console.error("Error in /ai/generate-theme:", error);
        res.status(500).send({ message: error.message || "Internal Server Error. Could not generate theme." });
    }
});

// Proxy route voor het genereren van een bio
app.post("/ai/generate-bio", authenticateToken, async (req, res) => {
     try {
        const { keywords, name } = req.body;
         if (!keywords) return res.status(400).send({ message: "Keywords are required." });

        const aiPrompt = `Generate a short and engaging bio for a link-in-bio page. The person's name is "${name}". Use the following keywords to guide the bio: "${keywords}". Keep it concise (under 160 characters) and use emojis where appropriate. Only return the bio text, no other text.`;

        const aiResponseText = await generateAIResponse(aiPrompt);
        res.status(200).send({ bio: aiResponseText });

     } catch (error) {
        console.error("Error in /ai/generate-bio:", error);
        res.status(500).send({ message: error.message || "Internal Server Error. Could not generate bio." });
     }
});

// Proxy route voor het genereren van link groepen
app.post("/ai/generate-link-groups", authenticateToken, async (req, res) => {
    try {
        const { links } = req.body; // Links is een array van { id: string, title: string, url: string }
         if (!links || !Array.isArray(links) || links.length === 0) {
             return res.status(400).send({ message: "An array of links with at least one link is required." });
         }

        // Formatteer de links voor de AI prompt
        const linkList = links.map(link => `- ${link.title} (ID: ${link.id})`).join('\n'); // Inclusief ID in prompt

        const aiPrompt = `Given the following list of links (each with a title and a unique ID), categorize them into logical groups. Provide the output as a JSON array of objects. Each object should have two keys: "groupTitle" (the title of the group) and "linkIds" (an array of the IDs of the links belonging to this group). Ensure all provided link IDs are included in the output, assigned to exactly one group. Do not include any link IDs that were not in the input list. Only return the JSON array, no other text.\n\nLinks:\n${linkList}\n\nExample Output:\n[\n  { "groupTitle": "My Socials", "linkIds": ["social1", "social2"] },\n  { "groupTitle": "My Projects", "linkIds": ["projectA", "projectB"] }\n]`;


        const aiResponseText = await generateAIResponse(aiPrompt);

         try {
             // Probeer de JSON response te parsen
             const groupSuggestions = JSON.parse(aiResponseText);
             // Voer een basic validatie uit op de structuur
             if (Array.isArray(groupSuggestions) && groupSuggestions.every(group => typeof group.groupTitle === 'string' && Array.isArray(group.linkIds))) {

                // Optionele validatie: Controleer of alle input link IDs aanwezig zijn in de output suggestions
                const inputLinkIds = new Set(links.map(link => link.id));
                const outputLinkIds = new Set(groupSuggestions.flatMap(group => group.linkIds));

                const allInputIdsIncluded = Array.from(inputLinkIds).every(id => outputLinkIds.has(id));
                 const noUnknownIdsIncluded = Array.from(outputLinkIds).every(id => inputLinkIds.has(id));


                 if (allInputIdsIncluded && noUnknownIdsIncluded) {
                     res.status(200).send(groupSuggestions);
                 } else {
                     console.error("AI generated incomplete or incorrect link group IDs:", aiResponseText);
                     res.status(500).send({ message: "AI generated invalid group suggestions. Please try again." });
                 }


             } else {
                 console.error("AI generated invalid link group JSON:", aiResponseText);
                 res.status(500).send({ message: "AI generated invalid group data. Please try a different prompt or regenerate." });
             }
        } catch (parseError) {
             console.error("Failed to parse AI link group response:", parseError);
            res.status(500).send({ message: "Failed to parse AI link group response. Please try again." });
        }


    } catch (error) {
        console.error("Error in /ai/generate-link-groups:", error);
        res.status(500).send({ message: error.message || "Internal Server Error. Could not generate link groups." });
    }
});

// Proxy route voor het genereren van link title
app.post("/ai/generate-link-title", authenticateToken, async (req, res) => {
     try {
        const { title } = req.body; // `title` is hier waarschijnlijk keywords
         if (!title) return res.status(400).send({ message: "Keywords are required." });

        const aiPrompt = `Generate a concise and engaging title for a link based on the following keywords: "${title}". Include a relevant emoji at the beginning. Keep it under 40 characters. Only return the title text, no other text.`;

        const aiResponseText = await generateAIResponse(aiPrompt);
        res.status(200).send({ title: aiResponseText });

     } catch (error) {
        console.error("Error in /ai/generate-link-title:", error);
        res.status(500).send({ message: error.message || "Internal Server Error. Could not generate link title." });
     }
});

// Exporteer de Express app als een Cloud Function
// Gebruik onRequest voor Firebase Functions (2e generatie)
exports.api = onRequest(
    {
        region: 'europe-west3', // Specificeer de regio waar je functie wordt gedeployed
        secrets: ["GEMINI_API_KEY", "JWT_SECRET"], // Koppel Secret Manager secrets aan de functie
        minInstances: 0, // Houd minimaal 1 instantie warm om koude starts te verminderen (kan kosten verhogen)
    },
    app // De Express app instance
);
