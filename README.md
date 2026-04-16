# FileTransferAWS Backend

Backend für das FileTransferAWS Projekt.
Stellt die AWS-Infrastruktur bereit, die vom Frontend genutzt wird.

Dazugehöriges Frontend: https://github.com/markusschneider2710/FileTransferAWS-Frontend

## Was macht das Backend?

* Erstellt S3 Bucket für Dateien
* Richtet Authentifizierung über Cognito ein
* Stellt die Basis für Datei-Uploads und Zugriffe bereit
* Wird vom Frontend direkt verwendet

## Tech Stack

* AWS CDK
* AWS S3
* AWS Cognito

## Setup

Repo klonen:

```bash
git clone https://github.com/markusschneider2710/FileTransferAWS-Backend.git
cd FileTransferAWS-Backend
```

Dependencies installieren:

```bash
npm install
```

## Deployment

Infrastructure deployen:

```bash
cdk deploy
```

Falls CDK noch nicht installiert ist:

```bash
npm install -g aws-cdk
```

## Struktur (grob)

```bash
.
 ├── bin/        Einstiegspunkt für CDK
 ├── lib/        Definition der AWS Ressourcen
 └── package.json
```

## Verbindung zum Frontend

Das Frontend nutzt die hier erstellten AWS-Ressourcen.

Nach dem Deployment bekommst du z. B.:

* S3 Bucket Name
* Cognito User Pool
* Region

Diese Werte musst du im Frontend eintragen:

```bash
src/aws-config.ts
```

Ohne diese Verbindung funktioniert das Frontend nicht.
