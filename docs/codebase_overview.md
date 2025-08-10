## Overzicht van Essentiële Bestanden voor Begrip van de Webapp

Om de inhoud en werking van deze webapp volledig te begrijpen, raad ik aan de volgende bestanden en mappen te lezen:

### Kernapplicatielogica:
*   `App.tsx`: De hoofdcomponent die de UI orkestreert en de kernhooks gebruikt.
*   `index.tsx`: Het startpunt van de React-applicatie.
*   `constants.tsx`: Bevat constante waarden die belangrijk zijn voor configuraties en standaardgegevens.
*   `types.ts`: Definieert TypeScript-interfaces voor datastructuren, cruciaal voor het begrijpen van datamodellen.

### Frontend Componenten (UI):
*   `components/`: Deze map bevat alle herbruikbare UI-componenten.

### Frontend Hooks (Statusbeheer & Logica):
*   `hooks/useAuth.ts`: Beheert de authenticatiestatus.
*   `hooks/useAppData.ts`: Beheert alle applicatiegegevens, inclusief ophalen, opslaan en undo/redo-logica.

### Frontend Services (API-interactie):
*   `services/backendApi.ts`: De centrale Axios-client voor alle backend API-interacties.
*   `services/geminiService.ts`: Handelt interacties met AI-proxy-endpoints af.

### Backend (Cloud Functions):
*   `functions/index.js`: De hoofd Firebase Cloud Function, die de Express.js API implementeert.
*   `functions/package.json`: Lijst van backend-afhankelijkheden.

### Configuratie & Build:
*   `firebase.json`: Firebase-projectconfiguratie (functies, hosting, Firestore/Realtime Database-regels).
*   `package.json`: Projectafhankelijkheden en scripts voor zowel frontend als backend.
*   `tsconfig.json`: TypeScript-configuratie.
*   `vite.config.ts`: Vite (frontend build tool) configuratie.
*   `database.rules.json`: Firebase Realtime Database-beveiligingsregels.

### Documentatie:
*   `README.md`: Projectoverzicht en installatie-instructies.
*   `docs/PROJECT_STATUS.md`: Huidige projectstatus, architectuur en openstaande taken.
*   `docs/samenvatting_2025-08-09.txt`: Recente wijzigingen en configuratieoverzicht.
