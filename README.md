# LinkHub - Your Unified Digital Presence

LinkHub is a platform designed to consolidate your online presence, allowing you to share multiple links, social media profiles, and even collect questions via an "Ask Me Anything" section, all from a single, customizable page. The project utilizes **Firebase Hosting** for the frontend web application and **Firebase Cloud Functions** for the backend API logic.

## Run Locally

**Prerequisites:**
*   Node.js (recommended LTS version)
*   Firebase CLI (`npm install -g firebase-tools`)

1.  Clone the repository:
    `git clone <repository_url>`
    `cd linkhub`

1. Install dependencies:
   `npm install`
    `cd functions`
    `npm install`
    `cd ..`

2. Set up Firebase project:
    *   If you don't have one, create a new Firebase project in the Firebase Console.
    *   Initialize Firebase in your project:
        `firebase init`
        Follow the prompts to select the features you want to use (Functions, Hosting, Firestore). Link it to your Firebase project.
3. Set the `GEMINI_API_KEY`:
    *   For local testing, you can set the `GEMINI_API_KEY` in a `.env.local` file in the root of your project.
    *   For Cloud Functions, you'll need to configure this securely using Firebase Environment Configuration:
        `firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"`
4. Start Firebase Emulators:
    `firebase emulators:start`
    This will start the emulators for Functions, Firestore, and Hosting.
5. Run the frontend development server:
   `npm run dev`
    The frontend will be served locally, typically on `http://localhost:5173`. The Firebase Emulators will serve the functions and host the built frontend files.

## Deployment
To deploy your application to Firebase Hosting and Cloud Functions:
-   Ensure you are logged in to Firebase CLI (`firebase login`).
-   Make sure your project is linked correctly (`firebase use --add`).
-   Run the deploy command:
    `firebase deploy`
This command will build your frontend (if configured in `firebase.json`), deploy your Cloud Functions, and deploy your frontend static files to Firebase Hosting.
