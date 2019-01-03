#include <JsonHashTable.h>
#include <JsonArray.h>
#include <JsonParser.h>
#include <JsonObjectBase.h>

#include <time.h>

#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include "cactus_io_MCP9808.h"

char id[100];

const char* ssid = "***********************";
const char* pass = "***********************";

MCP9808 mcp = MCP9808();

JsonParser<200> parser;
JsonHashTable hashTable;

void setup() {
  Serial.begin(115200); //Serial connection
  pinMode(13, OUTPUT);
  digitalWrite(13, HIGH);
  Serial.setDebugOutput(true);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass); //WiFi connection
  IPAddress ip(192, 168, 192, 80);
  IPAddress gateway(192, 168, 192, 2);
  IPAddress subnet(255, 255, 255, 0);
  IPAddress dns(8, 8, 8, 8);
  WiFi.config(ip, dns, gateway, subnet);

  Serial.print("Connecting ");
  while (WiFi.status() != WL_CONNECTED) {  //Wait for the WiFI connection completion
    delay(500);
    Serial.print(".");
  }
  Serial.println("connected.");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  configTime(3 * 3600, 0, "0.it.pool.ntp.org", "pool.ntp.org");
  Serial.println("\nWaiting for time");
  while (!time(nullptr)) {
    Serial.print(".");
    delay(1000);
  }

  Serial.println("");

  if (!mcp.begin()) {
    Serial.println("Couldn't find MCP9808!");
    while(1);
  }
  Serial.print("MAC address: ");
  Serial.println(WiFi.macAddress());
  char mac[100];
  strcpy(mac, WiFi.macAddress().c_str());
  int i;
  for (i = 0; i < 100; i++) {
    if (mac[i] == ':') {
      mac[i] = '_';
    }
  }
  strcpy(id, mac);
  Serial.print("Id: ");
  Serial.println(id);
}

void loop() {
  delay(1000);
  time_t now = time(nullptr);
  delay(1000);
  Serial.println(ctime(&now));

  char temperatura[10];
  char url[100];
  Serial.println("\n\t---inizio loop---");
 if(WiFi.status()== WL_CONNECTED){   //Check WiFi connection status
   HTTPClient http;    //Declare object of class HTTPClient

   strcpy(url, "http://elastic.gnet.it/timetabletermostato/_doc/");
   strcat(url, id);
   Serial.print("Richiesta time table da Elatic: ");
   Serial.println(url);
   http.begin(url);
   http.addHeader("Content-Type", "application/json");
   int httpCode = http.GET();
   String payload = http.getString();
   Serial.println("Risposta GET time table");
   Serial.println(httpCode);
   Serial.println(payload);
   char roba[100];
   strcpy(roba, payload.c_str());

   char* timetable;

   /*if (httpCode < 400){
    Serial.println("\t---Start parsing---");
     hashTable = parser.parseHashTable(roba);
     if (!hashTable.success()){
      Serial.println("parse error");
     }
   }*/
   //Serial.println(temperatura);
   strcpy(url, "http://elastic.gnet.it/configtermostato/_doc/");
   strcat(url, id);
   Serial.print("Richiesta configurazione su Elastic: ");
   Serial.println(url);
   http.begin(url);
   http.addHeader("Content-Type", "application/json");
   httpCode = http.GET();
   //payload = "{\"sort\":{\"date\":\"desc\"}}";
   //httpCode = http.sendRequest("GET", (uint8_t *) payload.c_str(), payload.length());
   payload = http.getString();
   Serial.println("Risposta GET");
   Serial.println(httpCode);
   Serial.println(payload);
   roba[100];
   strcpy(roba, payload.c_str());

   char* data;
   char* date = "0";
   char* Dtemp;
   char* sw;
   char json[100];

   if (httpCode < 400){
     Serial.println("\t---Start parsing---");

     hashTable = parser.parseHashTable(roba);
     if(!hashTable.success()){
      Serial.println("parse error");
     }
     char* source = hashTable.getString("_source");
     Serial.println(source);

     hashTable = parser.parseHashTable(source);
     if(!hashTable.success()){
      Serial.println("parse error");
     }
     data = hashTable.getString("data");
     date = hashTable.getString("date");
     Serial.println(data);
     Serial.println(date);

     hashTable = parser.parseHashTable(data);
     if(!hashTable.success()){
      Serial.println("parse error");
     }
     Dtemp = hashTable.getString("temperature");
     sw = hashTable.getString("switch");
     Serial.println(Dtemp);
     Serial.println(sw);

     Serial.println("\t---parsing completed---\n\n");
   }
   Serial.println(strcmp(sw, "true"));

    mcp.sensorPowerUp();
   delay(2000);
   mcp.readSensor();
   delay(250);
   gcvt(mcp.getTemperature_C(), 4, temperatura);
   float tempFloat = mcp.getTemperature_C();

   strcpy(json, "{\"data\":{\"temperature\":\"");
   strcat(json, temperatura);
   strcat(json, "\",\"mac\":\"");
   strcat(json, id);
   strcat(json, "\"},\"date\":\"");
   strcat(json, date);
   strcat(json, "\"}");

   if (strcmp(sw, "true") == 0){
    int n = atoi( Dtemp );
    n *= 100;
    int tempInt = tempFloat * 100;
    if (tempInt > n){
      Serial.println("Termostato acceso");
      digitalWrite(13, LOW);
    }
    else {
      Serial.println("Termostato spento");
      digitalWrite(13, HIGH);
    }
   }
   else {
    Serial.println("Termostato spento");
    digitalWrite(13, HIGH);
   }

   Serial.print("Invio dati su elastic: temperatura = ");
   Serial.println(temperatura);
   mcp.sensorPowerDown();
   strcpy(url, "http://elastic.gnet.it/logtemperature/_doc/");
   strcat(url, id);
   Serial.print("url: ");
   Serial.println(url);
   http.begin(url);  //Specify request destination
   http.addHeader("Content-Type", "application/json");  //Specify content-type header

   Serial.println(json);
   httpCode = http.POST(json);   //Send the request
   payload = http.getString(); //Get the response payload
   Serial.println("Risposta POST");
   Serial.println(httpCode);   //Print HTTP return code
   Serial.println(payload);    //Print request response payload

   http.end();  //Close connection
   Serial.println("\t---fine loop---");
 }else{
    Serial.println("Error in WiFi connection");
 }
 delay(10000);  //Send a request every 30 seconds
}
