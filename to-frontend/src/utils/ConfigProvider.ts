/**
 * Di base si vuole caricare tutto dall'env di docker. Quindi il file .env dovrebbe rimanere vuoto e serve solo per
 * quando l'utente vuole setuppare il server fuori da docker.
 */
export const configProvider = {
    apiPort: import.meta.env.VITE_API_URL || window.location.host // il valore di destra verrà usato in docker
}
