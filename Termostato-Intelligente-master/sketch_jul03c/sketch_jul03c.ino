#include <ESP8266WiFi.h>
#include <Wire.h>
#include "cactus_io_MCP9808.h"

const char* ssid = "***********************";
const char* password = "***********************";
WiFiServer server(80);

MCP9808 mcp = MCP9808();


void setup()
{
  Serial.begin(115200);
  Serial.println();

  Serial.printf("Connecting to %s ", ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");

  server.begin();
  Serial.printf("Web server started, open %s in a web browser\n", WiFi.localIP().toString().c_str());

  if (!mcp.begin()) {
    Serial.println("Couldn't find MCP9808!");
    while(1);
  }
}

float temperatura() {
  mcp.sensorPowerUp();
  delay(2000);
  mcp.readSensor();
  delay(250);
  float temp = mcp.getTemperature_C();
  Serial.println(temp);
  mcp.sensorPowerDown();
  return temp;
}

void loop()
{
  WiFiClient client = server.available();
  // wait for a client (web browser) to connect
  if (client)
  {
    Serial.println("\n[Client connected]");
    while (client.connected())
    {
      // read line by line what the client (web browser) is requesting
      if (client.available())
      {
        String line = client.readStringUntil('\r');
        Serial.print(line);
        // wait for end of client's request, that is marked with an empty line
        if (line.length() == 1 && line[0] == '\n')
        {
          break;
        }
        if (line == "GET /getTemperatura HTTP/1.1"){
          client.println( String("HTTP/1.1 200 OK\r\n") +
            "Content-Type: text/json\r\n" +
            "Connection: close\r\n" + "\r\n" + "Data" + "\r\n");
        }
      }
    }
    delay(10000); // give the web browser time to receive the data

    // close the connection:
    client.stop();
    Serial.println("[Client disconnected]");
  }
}
