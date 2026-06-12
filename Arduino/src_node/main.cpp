#if !defined(ARDUINO_ESP32_DEV)
#error Use este firmware com o ESP32
#endif

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

float medirDistancia() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(4);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 60000);
  if (dur == 0) return -1.0f;
  return dur * 0.034f / 2.0f;
}

void setup() {
  Serial.begin(115200);
  Serial.printf("[Node %d] iniciando...\n", NODE_ID);

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] conectando");
  for (int t = 0; WiFi.status() != WL_CONNECTED && t < 20; t++) {
    delay(500); Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED)
    Serial.println("[WiFi] conectado: " + WiFi.localIP().toString());
  else
    Serial.println("[WiFi] falha na conexao");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastWifi = 0;
    if (millis() - lastWifi > 5000) {
      lastWifi = millis();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
    return;
  }

  static unsigned long lastSend = 0;
  if (millis() - lastSend < SEND_INTERVAL_MS + (unsigned long)random(0, 2000)) return;
  lastSend = millis();

  float dist = medirDistancia();
  if (dist < 0) {
    Serial.println("[sensor] sem objeto detectado");
    return;
  }
  Serial.printf("[sensor] distancia: %.1f cm\n", dist);

  char url[64];
  snprintf(url, sizeof(url), "http://" GATEWAY_IP ":%d/data", GATEWAY_PORT);

  StaticJsonDocument<64> doc;
  doc["node_id"]  = NODE_ID;
  doc["distance"] = dist;
  char body[64];
  serializeJson(doc, body, sizeof(body));

  HTTPClient http;
  http.begin(url);
  http.setTimeout(4000);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);

  if (code > 0) {
    Serial.printf("[HTTP] node=%d dist=%.1f status=%d\n", NODE_ID, dist, code);
    digitalWrite(PIN_LED, HIGH); delay(80); digitalWrite(PIN_LED, LOW);
  } else {
    Serial.printf("[HTTP] erro gateway: %d\n", code);
  }
  http.end();
}
