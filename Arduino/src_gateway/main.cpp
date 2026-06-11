#if !defined(ARDUINO_ESP32_DEV)
#error Use este firmware com o ESP32
#endif

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <RoboCore_SMW_SX1276M0.h>
#include <HardwareSerial.h>
#include "config.h"

// ─── LORA ─────────────────────────────────────────────────────
HardwareSerial LoRaSerial(2);
SMW_SX1276M0 lorawan(LoRaSerial);
CommandResponse resp;
bool loraReady = false;

// ─── OLED ─────────────────────────────────────────────────────
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
bool displayOk = false;

// ─── PARSE ────────────────────────────────────────────────────
// Recebe "1:23.5", preenche nodeId e dist. Retorna false se inválido.
bool parseMensagem(const char *msg, int &nodeId, float &dist) {
  const char *sep = strchr(msg, ':');
  if (!sep) return false;
  nodeId = atoi(msg);
  dist   = atof(sep + 1);
  return nodeId > 0 && dist >= 0;
}

// ─── LOOKUP device_token ──────────────────────────────────────
const char *getDeviceToken(int nodeId) {
  for (int i = 0; i < NODE_TOKENS_COUNT; i++) {
    if (NODE_TOKENS[i].nodeId == nodeId)
      return NODE_TOKENS[i].deviceToken;
  }
  return nullptr;
}

// ─── OLED ─────────────────────────────────────────────────────
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

// ─── HTTP POST → /ingest ──────────────────────────────────────
void enviarHTTP(int nodeId, float dist) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] sem conexao, descartando mensagem");
    return;
  }

  const char *token = getDeviceToken(nodeId);
  if (!token) {
    Serial.printf("[HTTP] node_id=%d sem device_token configurado\n", nodeId);
    return;
  }

  char url[64];
  snprintf(url, sizeof(url), "http://" SERVER_IP ":%d/ingest", SERVER_PORT);

  // Body JSON: { "distance_from_lid": 23.5 }
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

  if (code > 0) {
    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, http.getString()) == DeserializationError::Ok) {
      const char *name = doc["recipient_name"] | "";
      float fillPct    = doc["fill_percent"]   | 0.0f;
      showDisplay(name, fillPct);
      Serial.printf("[HTTP] node=%d dist=%.1f fill=%.1f%% recipiente=%s status=%d\n",
                    nodeId, dist, fillPct, name, code);
    }
  } else {
    Serial.printf("[HTTP] erro: %d\n", code);
  }
  http.end();
}

// ─── EVENT HANDLER LORA ───────────────────────────────────────
void event_handler(Event type) {
  if (type == Event::JOINED) {
    loraReady = true;
    Serial.println("[LoRa] gateway P2P pronto");
    return;
  }

  if (type == Event::RECEIVED_X) {
    delay(50);
    lorawan.flush();
    uint8_t port;
    Buffer buf;
    if (lorawan.readX(port, buf) != CommandResponse::OK) return;

    char msg[32] = {0};
    int i = 0;
    while (buf.available() && i < (int)sizeof(msg) - 1)
      msg[i++] = (char)buf.read();

    Serial.printf("[LoRa] recebido: %s\n", msg);

    for (int i = 0; i < 2; i++) {
      digitalWrite(PIN_LED, HIGH); delay(60);
      digitalWrite(PIN_LED, LOW);  delay(60);
    }

    int nodeId;
    float dist;
    if (parseMensagem(msg, nodeId, dist))
      enviarHTTP(nodeId, dist);
    else
      Serial.printf("[LoRa] parse falhou: %s\n", msg);
  }
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
  if (WiFi.status() == WL_CONNECTED)
    Serial.println("[WiFi] conectado: " + WiFi.localIP().toString());
  else
    Serial.println("[WiFi] falha na conexao");

  // LoRa
  LoRaSerial.begin(115200, SERIAL_8N1, LORA_RXD, LORA_TXD);
  lorawan.event_listener = &event_handler;
  lorawan.setPinReset(LORA_RESET);
  lorawan.reset();
  delay(2000);

  lorawan.set_DevAddr(LORA_DEV_ADDR);
  lorawan.set_P2P_DevAddr("00000000");
  lorawan.set_AppSKey(LORA_APP_SKEY);
  lorawan.set_NwkSKey(LORA_NWK_SKEY);
  lorawan.set_P2P_SyncWord(LORA_SYNC_WORD);
  lorawan.set_JoinMode(SMW_SX1276M0_JOIN_MODE_P2P);
  lorawan.join();
  Serial.println("[LoRa] aguardando P2P join...");
}

// ─── LOOP ─────────────────────────────────────────────────────
void loop() {
  lorawan.listen();

  // Reconexão WiFi
  static unsigned long lastWifiAttempt = 0;
  if (WiFi.status() != WL_CONNECTED && millis() - lastWifiAttempt > 5000) {
    lastWifiAttempt = millis();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.println("[WiFi] reconectando...");
  }

}
