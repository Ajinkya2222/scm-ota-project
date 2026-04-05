#include <WiFi.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>
#include <ArduinoJson.h>
#include "config.h"

// -------- VERSION --------
#define FIRMWARE_VERSION "2.0.0"

String current_version = FIRMWARE_VERSION;

// -------- SETUP --------
void setup() {
  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
  checkForUpdate();
}

void loop() {}

// -------- CHECK UPDATE --------
void checkForUpdate() {
  HTTPClient http;
  http.begin(SERVER_URL);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();

    StaticJsonDocument<512> doc;
    deserializeJson(doc, payload);

    String latest_version = doc["latest_version"];
    String firmware_url = doc["firmware_url"];

    Serial.println("Current: " + current_version);
    Serial.println("Latest: " + latest_version);

    if (latest_version != current_version) {
      performOTA(firmware_url);
    } else {
      Serial.println("Already up to date");
    }
  }

  http.end();
}

// -------- OTA --------
void performOTA(String url) {
  WiFiClient client;
  t_httpUpdate_return ret = httpUpdate.update(client, url);

  if (ret == HTTP_UPDATE_OK) {
    Serial.println("Update successful!");
  } else {
    Serial.println("Update failed");
  }
}
