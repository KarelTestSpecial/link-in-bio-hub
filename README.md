# Link-in-bio-Hub - Your Unified Digital Presence

Link-in-bio-Hub is a platform designed to consolidate your online presence, allowing you to share multiple links, social media profiles, and even collect questions via an "Ask Me Anything" section, all from a single, customizable page. The project utilizes **Firebase Hosting** for the frontend web application and **Firebase Cloud Functions** for the backend API logic.

## Run Locally

**Prerequisites:**
*   Node.js (recommended LTS version)
*   Firebase CLI (`npm install -g firebase-tools`)

1.  Clone the repository:
    `git clone <repository_url>`
    `cd link-in-bio-hub`

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
3. Set the `GEMINI_API_KEY` and `JWT_SECRET`:
    *   For local testing, you can set `GEMINI_API_KEY` and `JWT_SECRET` in a `.env.local` file in the root of your project.
    *   For Cloud Functions, these secrets are managed securely using **Google Secret Manager**. Ensure you have created secrets named `GEMINI_API_KEY` and `JWT_SECRET` in your Firebase project's Secret Manager. You can manage them via the Google Cloud Console or Firebase CLI.
4. Start Firebase Emulators:
    `firebase emulators:start`
    This will start the emulators for Functions, Firestore, and Hosting.
5. Run the frontend development server:
   `npm run dev`
    The frontend will be served locally, typically on `http://localhost:5173`. The Firebase Emulators will serve the functions and host the built frontend files.

## Project Configuration and Overview

This project is configured for the following Firebase setup:

*   **Firebase Project ID:** `linkinbiohub`
*   **Firebase Functions Region:** `europe-west3`
*   **Firebase Realtime Database Region:** `europe-west1`
*   **Authentication:** Custom JWT-based authentication.

## Deployment

To deploy the application to Firebase, follow these steps. This process will publish the frontend to Firebase Hosting and the backend to Firebase Cloud Functions.

### 1. Configure Production Environment

Before the first deployment, you need to ensure the frontend knows how to communicate with the backend API.

Create a file named `.env.production` in the root of the project and add the following line. This file tells the Vite build process what the base URL of your API is.

```
VITE_API_BASE_URL="https://europe-west3-linkinbiohub.cloudfunctions.net/api"
```

**Note:** This file should only contain non-sensitive information.

### 2. Build the Frontend

Compile and optimize the frontend application for production by running the following command in your terminal:

```bash
npm run build
```

This command creates a `dist/` directory containing the static HTML, CSS, and JavaScript files.

### 3. Deploy to Firebase

Finally, deploy all parts of the project (Hosting, Functions, Rules) to Firebase.

First, ensure you are logged into the Firebase CLI:
```bash
firebase login
```

Then, run the deployment command:
```bash
firebase deploy
```

This command will:
- Upload the contents of the `dist/` directory to **Firebase Hosting**.
- Deploy the backend code from the `functions/` directory to **Cloud Functions**.
- Apply any database and Firestore rules defined in your project.

Once completed, your application will be live at your Firebase Hosting URL (e.g., `https://linkinbiohub.web.app`).
