# Modelli
L'applicativo sfrutta [docx-templates](https://github.com/guigrpa/docx-templates) per generare tagliandi e autorizzazione a partire da file docx. \
Per le mail invece rimpiazza il testo automaticamente in base alle variabili riportate.

## Modelli predefiniti
Appena avviato l'applicativo contiene già due modelli predefiniti:

- modello documento "contrassegno predefinito": modelli utilizzato per la generazione dei tagliandi
  > Contiene un esempio di tempalte per QRCode 
- modello documento "autorizzazione predefinita": modello per la generazione delle autorizzazioni dei tagliandi
  > Il modello di autorizzazione è il riferimento per la lista delle variabili disponibili. Si consiglia di conservare la versione originale.
- modello email "accettata": utilizzato per la trasmissione del tagliando (e dell'autorizzazione firmata)
- modello email "revocato": utilizzato per comunicare la revoca del tagliando

Se si utilizza la stampa in PDF è necessario almeno personalizzare il modello di tagliando.

## Modificare modelli
Per modificare i modelli basa andare su Permessi > Modelli documento (o Modelli email)

## Variabili disponibili

```yml
# Acquisiti dal tagliando
numeroTagliandoStr: {#numeroTagliandoStr#}
dataInizioValiditaStr: {#dataInizioValiditaStr#}
dataFineValiditaStr: {#dataFineValiditaStr#}

# Acquisite dal campo "Nome nel modello" del permesso associato
descrizionePermessoStr: {#descrizionePermessoStr#}

# Acquisiti dalla domanda con esito più recente
tipologiaDomanda: {#tipologiaDomanda#}
dataProtocolloStr: {#dataProtocolloStr#}
numeroProtocolloStr: {#numeroProtocolloStr#}
dataCompletamentoStr: {#dataCompletamentoStr#}
cognomeIstruttoreStr: {#cognomeIstruttoreStr#}
nomeIstruttoreStr: {#nomeIstruttoreStr#}
cognomeRichiedenteStr: {#cognomeRichiedenteStr#}
nomeRichiedenteStr: {#nomeRichiedenteStr#}
comuneNascitaRichiedenteStr: {#comuneNascitaRichiedenteStr#}
dataNascitaRichiedenteStr: {#dataNascitaRichiedenteStr#}
codiceFiscaleRichiedenteStr: {#codiceFiscaleRichiedenteStr#}
comuneResidenzaRichiedenteStr: {#comuneResidenzaRichiedenteStr#}
indirizzoResidenzaRichiedenteStr: {#indirizzoResidenzaRichiedenteStr#}
indirizzoAbitazioneDesignataStr: {#indirizzoAbitazioneDesignataStr#}
catastoFoglioAbitazioneDesignataStr: {#catastoFoglioAbitazioneDesignataStr#}
catastoMappaleAbitazioneDesignataStr: {#catastoMappaleAbitazioneDesignataStr#}
catastoSubalternoAbitazioneDesignataStr: {#catastoSubalternoAbitazioneDesignataStr#}
catastoCategoriaAbitazioneDesignataStr: {#catastoCategoriaAbitazioneDesignataStr#}

# URL che comparirà anche nel QR Code - Dipende dalla variabile d'ambiente BASE_URL
# Si basa sull'ID univoco del tagliando
verificationUrl: {#verificationUrl#}

# Le targhe sono sempre acquisite dal tagliando

# Solo per modelli di documento
QR Code: {#IMAGE qrCode(verificationUrl)#}
Targhe autorizzate: {#FOR targaObj IN targheArr#}
{#$idx + 1#}): {#INS $targaObj.targaStr#}
{#END-FOR targaObj#}

# Solo per modelli di email
Targhe autorizzate: {#targheArr#}
```


