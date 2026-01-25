import dotenv from 'dotenv'
dotenv.config();

/**
 * Di base si vuole caricare tutto dall'env di docker. Quindi il file .env dovrebbe rimanere vuoto e serve solo per
 * quando l'utente vuole setuppare il server fuori da docker.
 */
export const configProvider = {
    port: process.env.PORT || 80, // il valore di destra verrà usato in docker

}