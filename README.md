# TagliandOnline


## Docker setup

1. Install Docker\
https://docs.docker.com/engine/install/

2. Create the following folder three
```
tagliandonline/
├─ storage_data/
├─ db_data/
├─ docker-compose.yml
├─ .env
```
3. Set permissions for the `storage_data` folder
```sh
sudo chown -R 1001:1001 tagliandonline/storage_data
```
4. Add the following configuration to the docker-compose.yml file
```YML
# docker-compose.yml
services:
  tagliandonline:
    # may want to choose a fixed version number to avoid compatibility issues when updating
    image: cedcastagneto/tagliandonline:latest
    env_file:
      - .env
    ports:
    # exposes port 8080 on host machine: change this based on your needings
      - 8080:3000
    volumes:
      - ./storage_data:/app/data
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:18-alpine
    env_file:
      - .env
    volumes:
      - ./db_data:/var/lib/postgresql
    healthcheck:
      test:
        - CMD
        - pg_isready
        - -d
        - ${DB_NAME}
        - -U
        - ${DB_USER}
      interval: 30s
      timeout: 20s
      retries: 3
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    restart: unless-stopped
```
4. Setup the `.env` file with the following:
```properties
# Exposed port in docker container
PORT=3000
# DB psw. Please generate your own.
DB_PASSWORD=CHANGEMECHANGEMECHANGEME
# DB user
DB_USER=postgres
# DB name
DB_NAME=tagliandonline
# DB host: if using docker you can just put here the db container name
DB_HOST=postgres
# DB port
DB_PORT=5432
# secret used for session management. Please generate your own.
JWT_SECRET=CHANGEMECHANGEMECHANGEME
# If it's the first time you login or you forgot the password of the "admin" user you can put a new one here and it will forcefully replace it in the DB. After that it's suggested to remove this variable entirely.
REPLACING_ADMIN_PASSWORD=DEFAULTPASSWORDFORADMINUSER
# public URL from which the application will be reachable. You can optionally specify a port (:8080)
BASE_URL=https://yourdomain.example.com
# SMTP connections info. The app uses SMTP to send mails for password recovery and vouchers.
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=mailusername@example.com
SMTP_PASSWORD=YOURSMTPACCOUNTPASSWORD
# enable this to make a secure connection. Check this for more informations: https://nodemailer.com/smtp#general-options
SMTP_SECURE=true
# Informations that will appear in TagliandOnline header and footer, that link back to your official website.
PA_NAME=Comune di ________
PA_LINK=https://www.comune.______.__.it/
PA2_NAME=Regione _______
PA2_LINK=https://www.regione._______.it/
```
5. Pull the containers
```sh
cd tagliandonline
sudo docker compose pull
```
6. Start the containers
```sh
sudo docker compose up -D
```
