# Setup development environment

## Requisiti
- [git](https://git-scm.com/)
- [nodejs + npm](https://nodejs.org/en/download)
- [docker](https://docs.docker.com/engine/install/)
- [postgres](https://www.postgresql.org/download/) (in alternativa è possibile avviare direttamente l'immagine docker di postgres ed esporla localmente per raggiungerla con l'applicativo)
- account email con SMTP abilitato (per le notifiche)
- (facoltativo) [pgAdmin](https://www.pgadmin.org/download/)


## Sviluppo
Clona il repository con 
```sh
git clone https://github.com/castagnetocarducci/tagliandonline.git
```

### 1. Setup backend

Entra nella cartella del backend e copia il file `.env`
```sh
cd tagliandonline/to-backend
cp env.example .env
```
Configura il .env in base alle tue necessità. Consulta la guida dedicata: [Environment](../README.md#environment) \

Se stai utilizzando postgres senza immagine docker, assicurati di creare un database dedicato a tagliandonline. Quindi configura nel `.env` le seguenti variabili in base alla tua configurazione
- `DB_PASSWORD`
- `DB_USER`
- `DB_NAME`
- `DB_HOST`
- `DB_PORT`

Configura le credenziali di accesso SMTP per l'account email che vuoi utilizzare:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_SECURE`

Adesso possiamo installare le dipendenze e avviare il backend
```sh
cd tagliandonline/to-backend
npm install
npm run dev-run
```

Se riceviamo questo output significa che sta funzionando
```
Frontend config file created
Roles already populated, skipping default data insertion
Admin password updated
SMTP connection verified
Express server listening on port 3000
```

### 2. Setup frontend
Una volta avviato il backend procediamo ad avviare il frontend. \
Entriamo nella cartella del frontend. installiamo le dipendenze ed avviamo il testing
```sh
cd tagliandonline/to-frontend
npm install
npm run dev
```
Se riceviamo questo output significa che sta funzionando
```
  VITE v7.3.1  ready in 2514 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help

PWA v1.2.0
mode      generateSW
precache  2 entries (0.__ KiB)
files generated
  dev-dist/sw.js
  dev-dist/workbox-_________.js
```

A questo punto possiamo visitare http://localhost:5173/ per iniziare subito ad utilizzare il software nell'ambiente di test


## Creazione immagine docker
Una volta effettuate le modifiche al software è possibile anche creare l'immagine docker, per verificare che tutto funzioni anche nel container. Si può anche creare la propria immagine indipendente. \
Per farlo posizionarsi nella cartella generale del progetto e lanciare il build dell'immagine
```sh
cd tagliandonline
docker build --target production --tag <inserire un tag qui> .
```
A questo punto è possibile avviare l'immagine utilizzando un [docker compose](../README.md#docker-setup), oppure avviare l'immagine in standalone passando tutte le variabili d'ambiente necessarie utilizzando [`docker run`](https://docs.docker.com/reference/cli/docker/container/run/) 

Infine è possibile pubblicare la propria versione dell'immagine docker indipendente utilizzando [`docker push`](https://docs.docker.com/reference/cli/docker/image/push/)

> Per approfondire il funzionamento di Docker e scoprire come costruire la propria immagine si rimanda al [tutorial ufficiale](https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/)

