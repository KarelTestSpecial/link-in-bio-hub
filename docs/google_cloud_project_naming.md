# Kan ik de naam van een Google Cloud project veranderen?

**Vraag:** Kan ik de naam van een Google Cloud project veranderen nadat het is aangemaakt -- met het doel dat de url van de webapp die erop gehost wordt, ook aangepast zal zijn?

**Antwoord:**

Nee, de **project-ID** van een Google Cloud-project kan niet worden gewijzigd nadat het is aangemaakt. Dit is een permanente, unieke identifier voor het project.

Het wijzigen van de **projectnaam** is wel mogelijk, maar dit heeft geen invloed op de URL van je gehoste webapp. De URL van een webapp in Google Cloud, bijvoorbeeld gehost op App Engine, bevat de project-ID. Omdat de project-ID onveranderlijk is, zal ook de URL onveranderlijk blijven.

Als je een andere URL wilt voor je webapp, dan moet je:

1.  Een **nieuw** Google Cloud-project aanmaken met de gewenste project-ID (die dan ook in de URL zal verschijnen).
2.  Alle diensten en code overzetten naar dit nieuwe project.

Dit is een belangrijke overweging bij het starten van een nieuw project, aangezien de project-ID permanent is en de basis vormt voor de standaard URL's van veel Google Cloud-services.
