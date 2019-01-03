# Termostato-Intelligente

Il progetto fornirà un programma facilmente implementabile.
Il progetto consiste nel creare un software in grado di gestire la temperatura di una stanza, rilevando la temperatura grazie al sensore dht11, oppure attraverso il mcp9808 (più preciso), e pilotando il relé che accenderà il termosifone. Come supporto per il sensore di temperatura e il relé sarà utilizzato un raspberry o un nodemcu. I dati di temperatura vengono mandati nel cloud per essere visualizzati, sia da kibana, che mostra i grafici delle temperatura mandati al database ElasticSearch, oppure da ThingSpeak, un IoT che mostra anch'esso i grafici di temperatura e uminidità di ogni stanza gestita dal software. Il programma viene gestito da una pagina html in grado di inviare richieste al server, permettendo l'accensione e lo spegnimento manuale dei termostati o attraverso una time table facilmente programmabile.

# Prerequisiti
  - pc di supporto che gestisca il server locale con connessioni alla rete
  - 1 nodemcu/raspberry(con wifi) per ogni termostato che si vuole gestire
  - 1 sensore di temperatura mcp9808 per ogni nodemcu / 1 sensore di temperatura dht11 per ogni raspberry
  - 1 relé Tongling 5v per ogni nodemcu/raspberry
