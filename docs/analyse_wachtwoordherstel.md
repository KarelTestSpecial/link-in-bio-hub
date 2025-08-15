# Analyse: Wachtwoordherstel Functionaliteit

Dit document beschrijft de werking van de "wachtwoord vergeten" functionaliteit en de stappen die nodig zijn om deze in een productie-omgeving te gebruiken.

## Huidige Werking

De functionaliteit bestaat uit een frontend- en een backend-gedeelte die samenwerken om een gebruiker in staat te stellen zijn of haar wachtwoord opnieuw in te stellen.

### Frontend Flow

1.  **Initiatie**: In de 'Login' popup (`AuthModal.tsx`) klikt de gebruiker op de "Forgot Password?" link.
2.  **E-mail Invoeren**: De popup verandert naar een weergave waar de gebruiker zijn/haar e-mailadres kan invoeren en op "Send Reset Link" kan klikken.
3.  **API Call (Verzoek)**: De frontend roept het `/users/forgot-password` endpoint op de backend aan met het opgegeven e-mailadres.
4.  **Feedback**: De gebruiker krijgt een algemene boodschap te zien die aangeeft dat, als het e-mailadres bestaat, er een reset-link is verzonden. Dit wordt gedaan om te voorkomen dat kwaadwillenden kunnen controleren welke e-mailadressen geregistreerd zijn.
5.  **Reset Pagina**: De gebruiker ontvangt een e-mail met een unieke link. Deze link leidt naar de `/reset-password` pagina van de applicatie (`ResetPasswordPage.tsx`).
6.  **Nieuw Wachtwoord Invoeren**: Op deze pagina kan de gebruiker een nieuw wachtwoord en een bevestiging daarvan invoeren. De unieke token wordt uit de URL gehaald.
7.  **API Call (Bevestiging)**: Na het klikken op "Reset Password", roept de frontend het `/users/reset-password` endpoint aan met de token en het nieuwe wachtwoord.
8.  **Finale Feedback**: De gebruiker krijgt een succesbericht te zien en wordt na enkele seconden doorgestuurd naar de hoofdpagina.

### Backend Flow (`functions/index.js`)

De backend heeft twee endpoints om dit proces te ondersteunen:

1.  **`POST /users/forgot-password`**:
    *   Ontvangt een e-mailadres.
    *   Zoekt in de Firebase Realtime Database naar een gebruiker met dit e-mailadres.
    *   **Als de gebruiker niet bestaat**, wordt er toch een succesbericht teruggestuurd om e-mail enumeratie te voorkomen. Er gebeurt verder niets.
    *   **Als de gebruiker wel bestaat**:
        1.  Er wordt een cryptografisch veilige, willekeurige token gegenereerd (`crypto.randomBytes`).
        2.  Deze token wordt gehasht (`sha256`) en samen met een vervaldatum (1 uur in de toekomst) opgeslagen in het gebruikersprofiel in de database. Het hashen van de token is een extra veiligheidsmaatregel; mocht de database lekken, dan zijn de reset-tokens niet direct bruikbaar.
        3.  Via `nodemailer` wordt er een e-mail verstuurd naar de gebruiker. Deze e-mail bevat de **niet-gehashte** token in een link naar de reset-pagina.

2.  **`POST /users/reset-password`**:
    *   Ontvangt de token (uit de e-mail link) en een nieuw wachtwoord.
    *   De ontvangen token wordt gehasht (`sha256`).
    *   De backend zoekt een gebruiker in de database met een overeenkomende `passwordResetToken` en een `passwordResetExpires` datum die nog niet is verlopen.
    *   **Als er geen gebruiker wordt gevonden of de token is verlopen**, wordt er een foutmelding teruggestuurd.
    *   **Als de token geldig is**:
        1.  Het nieuwe wachtwoord wordt gehasht met `bcrypt`.
        2.  Het gehashte wachtwoord wordt opgeslagen in het gebruikersprofiel.
        3.  De `passwordResetToken` en `passwordResetExpires` velden worden uit de database verwijderd om de token ongeldig te maken voor toekomstig gebruik.
        4.  Er wordt een succesbericht teruggestuurd.

---

## Stappen voor Productie

De huidige implementatie maakt gebruik van een test-setup voor het versturen van e-mails. Om dit robuust in productie te gebruiken, zijn de volgende stappen cruciaal:

1.  **Email Service (SMTP) Configuratie (Meest Kritiek)**:
    *   **Probleem**: De huidige configuratie gebruikt `Ethereal`, een service voor het testen van e-mails. E-mails worden niet echt afgeleverd, maar kunnen bekeken worden via een speciale link die in de console wordt gelogd. Dit is ongeschikt voor productie.
    *   **Oplossing**: U moet een productie-e-mailservice configureren. Dit kan een dienst zijn zoals **SendGrid**, **Mailgun**, **Amazon SES**, of uw eigen SMTP-server.
    *   **Actie**: U moet de volgende variabelen in het `.env` bestand in de `functions` map aanpassen met de gegevens van uw gekozen e-mailservice:
        *   `EMAIL_HOST`: (bv. `smtp.sendgrid.net`)
        *   `EMAIL_PORT`: (bv. `587`)
        *   `EMAIL_USER`: (De gebruikersnaam voor uw SMTP-service)
        *   `EMAIL_PASS`: (Het wachtwoord of API-key voor uw SMTP-service)
        *   `EMAIL_FROM`: (Het "Van" e-mailadres, bv. `"Uw App Naam" <noreply@uwdomein.com>`)

2.  **Frontend URL Configuratie**:
    *   **Probleem**: De link in de reset-e-mail wordt opgebouwd met de `FRONTEND_URL` variabele. Deze staat nu ingesteld op een test-URL.
    *   **Actie**: Zorg ervoor dat de `FRONTEND_URL` variabele in `functions/.env` wordt ingesteld op de definitieve, publieke URL van uw live website (bv. `https://www.uwdomein.com`).

3.  **Secrets Management**:
    *   **Actie**: De e-mail- en JWT-geheimen worden momenteel via `.env` beheerd. Voor Firebase is het de aanbevolen praktijk om deze op te slaan via de Google Cloud Secret Manager en deze te koppelen aan de Cloud Function. Dit is veiliger. De huidige setup werkt, maar voor verhoogde veiligheid in productie is dit een aanbevolen stap.

4.  **(Optioneel) E-mail Template Verbeteren**:
    *   **Suggestie**: De huidige e-mail is een simpele HTML-e-mail. U kunt overwegen om een mooier, branded e-mail template te maken voor een professionelere uitstraling. Dit zou een aanpassing vergen in de `mailOptions.html` sectie in `functions/index.js`.
