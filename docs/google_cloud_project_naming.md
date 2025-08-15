# Projectmigratie en URL Wijziging in Google Cloud

U kunt de **project-ID** van uw Google Cloud-project, die de basis vormt voor uw URL (`link-in-bio-fbase-project`), **niet wijzigen** nadat deze is aangemaakt. De enige manier om de URL te veranderen naar de gewenste `https://link-in-bio-hub.web.app/` is door een **nieuw project** te creëren met de correcte ID en vervolgens alle data en services van het oude project over te zetten.

---

### 1. Wat U Niet Kunt Doen

De project-ID (`link-in-bio-fbase-project`) is een **permanente, wereldwijd unieke identifier**. Hoewel u de zichtbare projectnaam in de Google Cloud Console kunt aanpassen, verandert dit niet de onderliggende ID die wordt gebruikt voor URL's van services zoals Firebase Hosting.

---

### 2. De Oplossing: Projectmigratie

Om uw doel te bereiken, moet u de volgende stappen ondernemen:

1.  **Creëer een nieuw Google Cloud Project**: Maak een gloednieuw project aan via de Google Cloud Console of de Firebase Console. Geef het de gewenste project-ID, in dit geval `link-in-bio-hub`. Controleer zorgvuldig of deze ID beschikbaar is en aan de vereisten voldoet, aangezien deze ook niet meer te wijzigen is.
2.  **Stel Firebase Services in**: Na het aanmaken van het nieuwe project, moet u alle Firebase-services die u in het oude project gebruikte, opnieuw instellen. Dit omvat onder andere:
    * **Firebase Hosting**: Volg de stappen om uw webapp-code te linken en te deployen naar het nieuwe project.
    * **Firebase Authentication**: Configureer alle authenticatiemethoden (e-mail, Google-login, etc.) opnieuw.
    * **Firebase Firestore / Realtime Database**: Dit is de meest cruciale stap. U moet de data exporteren uit het oude project en importeren in de nieuwe.
        * **Firestore**: Gebruik de `gcloud` CLI om uw database te exporteren. U kunt een export maken van de hele database of specifieke collecties en vervolgens de data importeren in het nieuwe project.
        * **Realtime Database**: Gebruik de console om uw data te exporteren als een JSON-bestand en importeer het in de nieuwe database.
    * **Overige Services**: Indien u andere services zoals Cloud Functions, Cloud Storage, of Extensions gebruikt, moeten deze ook handmatig worden overgezet.
3.  **Update Uw Code**: Aangezien uw app-URL is veranderd, moet u ook de code van uw webapp bijwerken. Dit kan betrekking hebben op links, API-endpoints of andere hardgecodeerde referenties naar de oude project-ID.

### 3. Alternatief: Eigen Domein

Een elegantere oplossing, die geen projectmigratie vereist, is het koppelen van een **eigen domein** aan uw webapp. U kunt bijvoorbeeld een domein zoals `linkinbiohub.com` registreren en dit linken aan uw huidige Firebase Hosting. Dit is een veelvoorkomende praktijk en de URL wordt dan `https://www.linkinbiohub.com`, wat professioneler en gebruiksvriendelijker is. Deze methode is minder ingrijpend dan een volledige projectmigratie.

---

### Technisch Stappenplan voor Migratie (Gedetailleerd)

Hieronder volgt een meer gedetailleerd technisch stappenplan om de migratie uit te voeren.

**Fase 1: Nieuw Project Aanmaken (Google Cloud / Firebase Console)**
1.  **Maak een nieuw Google Cloud Project aan:** Ga naar de [Google Cloud Console](https://console.cloud.google.com/) en maak een nieuw project aan. Zorg ervoor dat u de **Project-ID** instelt op `link-in-bio-hub`.
2.  **Koppel Firebase aan het nieuwe project:** Ga naar de [Firebase Console](https://console.firebase.google.com/), klik op 'Add project', en selecteer uw zojuist aangemaakte Google Cloud-project.
3.  **Activeer de benodigde diensten:** Zorg ervoor dat in uw nieuwe Firebase-project de volgende diensten zijn geactiveerd:
    *   **Realtime Database:** Maak een nieuwe Realtime Database aan.
    *   **Hosting:** Zet Firebase Hosting op. U krijgt nu de nieuwe URL `https://link-in-bio-hub.web.app`.

**Fase 2: Data Migreren (Firebase Console)**
1.  **Exporteer de data uit uw oude database:** Ga in de Firebase Console naar uw oude project (`link-in-bio-fbase-project`), navigeer naar de Realtime Database, klik op de drie puntjes (...) en kies 'Export JSON'. Sla dit bestand op.
2.  **Importeer de data in uw nieuwe database:** Ga in de Firebase Console naar uw nieuwe project (`link-in-bio-hub`), navigeer naar de Realtime Database, klik op de drie puntjes en kies 'Import JSON'. Selecteer het bestand dat u zojuist heeft geëxporteerd.

**Fase 3: Code en Configuratie Aanpassen (Lokaal in dit project)**
*Deze stappen kan ik voor u uitvoeren.*
1.  **Update de `.firebaserc` file:** Dit bestand koppelt uw lokale code aan een Firebase-project. De `project` waarde moet worden veranderd naar `link-in-bio-hub`.
2.  **Update de `.env` file:** De `DATABASE_URL` en `CORS_ORIGINS` in `functions/.env` moeten worden bijgewerkt naar de URL's van uw nieuwe project.

**Fase 4: Deployment (Vanuit uw lokale terminal)**
1.  **Deploy de database regels:** Zorg ervoor dat u de `database.rules.json` en `firestore.rules` bestanden deployt naar uw nieuwe project via de Firebase CLI.
2.  **Deploy de Cloud Functions:** Deploy de functions uit de `functions` map naar uw nieuwe project.
3.  **Deploy de web-app:** Bouw uw web-app (`npm run build`) en deploy deze naar Firebase Hosting (`firebase deploy --only hosting`).
