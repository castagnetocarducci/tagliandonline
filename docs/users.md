# Utenti
## Primo avvio
Al primo avvio l'applicativo ha solo l'utente `admin`, avente come password quella impostata all'interno della variabile d'ambiente `REPLACING_ADMIN_PASSWORD` ([consulta il readme per maggioli informazioni](../README.md#environment))
*(Se si cambia la variabile d'ambiente è necessario riavviare l'applicativo)*

## Perdere il ruolo di admin
Qualora per errore si cambi il ruolo dell'utente `admin`, basta riavviare l'applicativo con `REPLACING_ADMIN_PASSWORD` impostato e verrà corretto il ruolo automaticamente.

## Ruoli
- admin: Ha tutti i permessi. Può gestire anche gli altri utenti, compresi gli admin.
-  operatore: A meno della gestione degli utenti ha tutti i permessi.
-  vigile: Può solamente visualizzare domande, permessi, tagliandi e veicoli. Può creare e modificare le ispezioni.


## Gestione utenti
Gli utenti con ruolo `admin` possono creare e gestire gli utenti a sistema.

### Creazione
In fase di creazione di un utente il sistema obbliga ad inserire una email. Appena creato,  il nuovo utente riceve subito una mail per il recupero della password.

### Modifica
È possibile modificare un utente entrando nella pagina di modifica corrispondente. Da qui è anche possibile forzare l'invio della mail di recupero password. \
Non è possibile scegliere la password a mano dell'utente: sarà direttamente quest'ultimo a sceglierla.

### Eliminazione
Non è possibile eliminare gli utenti a sistema: si possono solo disabilitare dalla pagina di modifica.

### Recupero e cambio password
Un utente che ha perso la password può scegliere l'opzione "Password dimenticata" nella schermata di login. In alternativa un amministratore può forzare l'invio della mail di recupero, oppure correggerla se necessario.




