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
```
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
```env

```
