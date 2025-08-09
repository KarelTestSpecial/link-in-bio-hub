
# Project Status: LinkHub

**Datum:** 2025-08-09
**Auteur:** Gemini Analyse

Dit document beschrijft de huidige status, architectuur en openstaande werkzaamheden voor de LinkHub-applicatie. Het vervangt de verouderde en verspreide bestanden in de `/docs` map.

## 1. Projectoverzicht

LinkHub is een full-stack "link-in-bio" applicatie. Het stelt gebruikers (zoals content creators) in staat om een persoonlijke pagina te creëren met daarop meerdere links, social media profielen en een "Ask Me Anything" AI-chatbot. De pagina is volledig aanpasbaar qua thema en stijl.

De applicatie is succesvol getransformeerd van een client-side prototype naar een volwaardige full-stack oplossing.

## 2. Architectuur

De applicatie bestaat uit een frontend, een backend en een database, die nauw met elkaar samenwerken.

### Frontend
- **Framework:** React (v19) met TypeScript.
- **Build Tool:** Vite.
- **Styling:** Tailwind CSS (v3).
- **State Management:** De status wordt beheerd via custom hooks:
    - `useAuth.ts`: Beheert de authenticatiestatus (JWT-gebaseerd) en slaat de token en gebruikersnaam op in `localStorage`.
    - `useAppData.ts`: Haalt alle applicatiedata (profiel, links, thema, etc.) op van de backend, beheert de lokale staat en synchroniseert wijzigingen terug naar de backend. Het bevat ook logica voor een undo-geschiedenis.
- **Services:**
    - `services/backendApi.ts`: Een centrale Axios-client die alle communicatie met de backend-API afhandelt.
    - `services/geminiService.ts`: Handelt de aanroepen naar de AI-proxy-endpoints op de backend af.

### Backend
- **Platform:** Firebase Cloud Functions (2e generatie, Node.js 20).
- **Framework:** Express.js.
- **API:** Een RESTful API (`/api/**`) die de volgende functionaliteiten biedt:
    - **Authenticatie:** Gebruikersregistratie (`/users/register`) en login (`/users/login`) met bcrypt voor wachtwoord-hashing en JWT voor sessiebeheer.
    - **Data Beheer:** Ophalen en bijwerken van alle gebruikersdata via `GET` en `PUT` op `/users/:username/appData`.
    - **Analytics:** Registreren van link-kliks.
    - **AI Proxy:** Beveiligde endpoints die verzoeken doorsturen naar de Google Gemini API voor het genereren van content (bio's, thema's, etc.). De API-sleutel wordt veilig op de backend bewaard.
- **Secrets:** API-sleutels en secrets (zoals `JWT_SECRET` en `GEMINI_API_KEY`) worden beheerd via Firebase Secret Manager.

### Database
- **Type:** Firebase Realtime Database (RTDB).
- **Structuur:** Alle data voor een gebruiker wordt opgeslagen onder een `users/{username}` pad.
- **Data Transformatie:** De backend slaat gerelateerde data (zoals links binnen een groep) op als objecten (de standaard voor RTDB), terwijl de frontend met arrays werkt. De `useAppData` hook in de frontend bevat logica om de objecten van de database om te zetten naar arrays voor correcte rendering.

## 3. Huidige Status

- **Functioneel:** De applicatie is stabiel en de kernfunctionaliteiten werken. Gebruikers kunnen zich registreren, inloggen, hun profiel en links beheren, en het uiterlijk van hun pagina aanpassen. Data wordt correct opgeslagen in en opgehaald uit de Realtime Database.
- **Deployment:** De frontend is gedeployed op Firebase Hosting en de backend op Cloud Functions. De `firebase.json` is correct geconfigureerd om API-verzoeken door te sturen.
- **Debugging:** Grote problemen rondom deployment, CORS, frontend-builds (o.a. downgrade van Tailwind v4 naar v3) en een database-migratie (van Firestore naar RTDB) zijn opgelost.

## 4. Kritieke Openstaande Werkzaamheden (Actie Vereist)

Dit zijn de belangrijkste taken die met hoge prioriteit moeten worden opgepakt.

### 1. Beveiliging van de Realtime Database (Hoogste Prioriteit)
- **Probleem:** De huidige security rules in `database.rules.json` zijn onveilig. De write-regel voor analytics is `true`, en de regels voor gebruikersdata zijn weliswaar aanwezig, maar moeten grondig worden geverifieerd.
- **Risico:** Ongeautoriseerde gebruikers kunnen mogelijk data lezen of wijzigen, wat leidt tot datalekken en misbruik.
- **Actie:** Herschrijf en test de security rules in `database.rules.json` om te garanderen dat:
    1. Een gebruiker alleen zijn/haar eigen data kan schrijven.
    2. Publieke profielinformatie leesbaar is voor iedereen, maar gevoelige data niet.
    3. De analytics-schrijfactie zo beperkt mogelijk is.
- **Deployment:** Deploy de nieuwe regels met `firebase deploy --only database`.

### 2. Migratie van Firebase Functions Configuratie
- **Probleem:** De backend gebruikt `functions.config()` om secrets te laden. Deze API is verouderd (deprecated) en zal na eind 2025 niet meer werken voor nieuwe deployments.
- **Risico:** Toekomstige deployments van de backend zullen mislukken.
- **Actie:** Migreer het beheer van secrets (`JWT_SECRET`, `GEMINI_API_KEY`) naar de aanbevolen methode. De `functions/index.js` is al geconfigureerd om `process.env` te gebruiken en de secrets zijn gedefinieerd in `firebase.json` onder `functions.secrets`. Verifieer dat dit correct werkt en verwijder de oude `functions.config()` logica volledig.

## 5. Overige Openstaande Werkzaamheden

Deze taken zijn belangrijk voor de kwaliteit en onderhoudbaarheid van de applicatie.

- **Volledige Functionele Tests:** Voer end-to-end tests uit voor alle gebruikersstromen:
    - Registratie van een nieuwe gebruiker.
    - CRUD-operaties (Create, Read, Update, Delete) voor links, groepen en social media iconen.
    - Werking van de AI-functies.
    - Correcte registratie en weergave van analytics.
    - Import/Export functionaliteit.

- **Verbeteren Foutafhandeling Frontend:** Vervang `alert()` en `console.error` meldingen door een gebruiksvriendelijker notificatiesysteem (zoals het reeds geïnstalleerde `react-hot-toast`) voor API-fouten en andere problemen.

- **Heractiveren van Backend Linting:** De `predeploy` hook die `npm run lint` uitvoert in `firebase.json` is uitgeschakeld om deployment-problemen te omzeilen. Configureer de ESLint-regels in de `functions` map zodat ze overeenkomen met de code-stijl en activeer de `predeploy` hook opnieuw om de codekwaliteit te waarborgen.

- **API Documentatie:** Creëer formele documentatie voor de backend API. Beschrijf alle endpoints, verwachte request/response formats, en authenticatievereisten.

- **Unit & Integratie Tests:** Schrijf geautomatiseerde tests voor zowel de frontend (React componenten, hooks) als de backend (Cloud Functions) om regressie te voorkomen en de betrouwbaarheid te verhogen.

## 6. Lokale Setup en Deployment

De instructies in `README.md` zijn nog steeds grotendeels accuraat.

- **Installatie:**
  ```bash
  npm install
  cd functions
  npm install
  cd ..
  ```
- **Lokale Emulatie:**
  - Maak een `.env` bestand aan in de `functions` map met de `JWT_SECRET` en `GEMINI_API_KEY`.
  - Start de emulators: `firebase emulators:start`
  - Start de frontend dev server: `npm run dev`
- **Deployment:**
  ```bash
  firebase deploy
  ```
