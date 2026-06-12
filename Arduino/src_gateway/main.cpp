#if !defined(ARDUINO_ESP32_DEV)
#error Use este firmware com o ESP32
#endif

#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"

// ─── OLED ─────────────────────────────────────────────────────
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
bool displayOk = false;

// ─── HTTP SERVER ───────────────────────────────────────────────
WebServer server(80);

// ─── HELPERS ──────────────────────────────────────────────────
const char *getDeviceToken(int nodeId) {
  for (int i = 0; i < NODE_TOKENS_COUNT; i++) {
    if (NODE_TOKENS[i].nodeId == nodeId) return NODE_TOKENS[i].deviceToken;
  }
  return nullptr;
}

void showDisplay(const String &name, float fillPct) {
  if (!displayOk) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(1);
  String n = name.length() == 0 ? "Sem recipiente" : name;
  if (n.length() > 21) n = n.substring(0, 18) + "...";
  int16_t bx, by; uint16_t bw, bh;
  display.getTextBounds(n, 0, 0, &bx, &by, &bw, &bh);
  display.setCursor((128 - (int)bw) / 2, 4);
  display.print(n);

  String pctStr = String((int)fillPct) + "%";
  display.setTextSize(3);
  display.getTextBounds(pctStr, 0, 0, &bx, &by, &bw, &bh);
  display.setCursor((128 - (int)bw) / 2, 19);
  display.print(pctStr);

  const int barY = 57, barW = 124, barH = 5;
  display.drawRect(2, barY, barW, barH, SSD1306_WHITE);
  int fillPx = (int)(fillPct / 100.0f * (barW - 2));
  if (fillPx > 0)
    display.fillRect(3, barY + 1, fillPx, barH - 2, SSD1306_WHITE);

  display.display();
  display.invertDisplay(fillPct < 10.0f);
}

bool enviarHTTP(int nodeId, float dist) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] sem conexao");
    return false;
  }

  const char *token = getDeviceToken(nodeId);
  if (!token) {
    Serial.printf("[HTTP] node_id=%d sem device_token configurado\n", nodeId);
    return false;
  }

  char url[64];
  snprintf(url, sizeof(url), "http://" SERVER_IP ":%d/ingest", SERVER_PORT);

  StaticJsonDocument<64> bodyDoc;
  bodyDoc["distance_from_lid"] = dist;
  char bodyStr[64];
  serializeJson(bodyDoc, bodyStr, sizeof(bodyStr));

  HTTPClient http;
  http.begin(url);
  http.setTimeout(1500);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", token);

  int code = http.POST(bodyStr);
  bool ok = code > 0;

  if (ok) {
    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, http.getString()) == DeserializationError::Ok) {
      const char *name = doc["recipient_name"] | "";
      float fillPct    = doc["fill_percent"]   | 0.0f;
      showDisplay(name, fillPct);
      Serial.printf("[API] node=%d dist=%.1f fill=%.1f%% recipiente=%s status=%d\n",
                    nodeId, dist, fillPct, name, code);
    }
  } else {
    Serial.printf("[API] erro: %d\n", code);
  }
  http.end();
  return ok;
}

// ─── HANDLER POST /data ───────────────────────────────────────
void handleData() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"body ausente\"}");
    return;
  }

  StaticJsonDocument<128> req;
  if (deserializeJson(req, server.arg("plain")) != DeserializationError::Ok) {
    server.send(400, "application/json", "{\"error\":\"json invalido\"}");
    return;
  }

  int nodeId  = req["node_id"]  | 0;
  float dist  = req["distance"] | -1.0f;

  if (nodeId <= 0 || dist < 0) {
    server.send(400, "application/json", "{\"error\":\"dados invalidos\"}");
    return;
  }

  Serial.printf("[GW] node=%d dist=%.1f\n", nodeId, dist);
  for (int i = 0; i < 2; i++) {
    digitalWrite(PIN_LED, HIGH); delay(60);
    digitalWrite(PIN_LED, LOW);  delay(60);
  }

  bool ok = enviarHTTP(nodeId, dist);
  server.send(ok ? 200 : 502, "application/json",
              ok ? "{\"ok\":true}" : "{\"error\":\"api_fail\"}");
}

// ─── SETUP ────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("[Gateway] iniciando...");

  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);

  // OLED
  Wire.begin();
  uint8_t oledAddr = 0;
  for (uint8_t addr : {0x3C, 0x3D}) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) { oledAddr = addr; break; }
  }
  displayOk = oledAddr && display.begin(SSD1306_SWITCHCAPVCC, oledAddr);
  if (displayOk) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Iniciando...");
    display.display();
  }

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] conectando");
  for (int t = 0; WiFi.status() != WL_CONNECTED && t < 20; t++) {
    delay(500); Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] conectado: " + WiFi.localIP().toString());
    Serial.println("[WiFi] *** configure GATEWAY_IP=" + WiFi.localIP().toString() + " no config.h dos nos ***");
  } else {
    Serial.println("[WiFi] falha na conexao");
  }

  // HTTP server
  server.on("/data", HTTP_POST, handleData);
  server.begin();
  Serial.println("[HTTP] servidor na porta 80");
}

// ─── LOOP ─────────────────────────────────────────────────────
void loop() {
  server.handleClient();

  static unsigned long lastWifi = 0;
  if (WiFi.status() != WL_CONNECTED && millis() - lastWifi > 5000) {
    lastWifi = millis();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.println("[WiFi] reconectando...");
  }
}
