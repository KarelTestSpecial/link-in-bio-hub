# Deployment and Testing Instructions

There has been a persistent issue with our chat, so these instructions have been saved to a file. Please follow them carefully.

There are two separate fixes that need to be tested:
1.  **Backend CORS Fix** (on the `fix-cors` branch)
2.  **Frontend Redirect Fix** (on the `fix-auth-redirect` branch)

We must deploy the backend fix first, then test the frontend fix.

---

### **Part 1: Deploy the Backend CORS Fix**

1.  **Get the backend code:**
    Open your terminal in the root of the project and run these commands to switch to the `fix-cors` branch.
    ```bash
    git fetch
    git checkout fix-cors
    ```

2.  **Install backend dependencies:**
    The backend (Firebase Functions) has its own dependencies. Run these commands:
    ```bash
    cd functions
    npm install
    cd ..
    ```

3.  **Deploy to Firebase:**
    This is the most important step. It updates your live backend server. This command may take a minute or two.
    ```bash
    firebase deploy --only functions
    ```
    If this command asks you to log in or select a project, please follow the on-screen prompts. Wait for it to say "Deploy complete!".

---

### **Part 2: Test the Frontend Fix**

Now that the backend is updated, the login process should work. Let's test the original fix.

1.  **Get the frontend code:**
    Switch to the branch containing the frontend fix.
    ```bash
    git checkout fix-auth-redirect
    ```

2.  **Run the frontend application:**
    ```bash
    npm install
    npm run dev
    ```
    This will start the local server, likely at `http://localhost:5173`.

3.  **Perform the test in your browser:**
    - Open `http://localhost:5173`.
    - You should now be able to **log in**. The CORS error from before should be gone. Please try to log in.
    - After you have successfully logged in and are on your profile page, **close the browser tab**.
    - Open a **new browser tab** and navigate to `http://localhost:5173` again.
    - **Expected Result:** The application should automatically redirect you to your profile page (e.g., `http://localhost:5173/your-username`), and you should see the "Logout" and "Edit" buttons.

---

Please follow these steps and report back on whether you were able to log in and whether the final redirect worked as expected.
