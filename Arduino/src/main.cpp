#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"

struct Network { const char *ssid; const char *password; };
const Network networks[] = {
  { WIFI_SSID, WIFI_PASSWORD },
};
const int  numNetworks = sizeof(networks) / sizeof(networks[0]);
const char *serverName = "http://" SERVER_IP ":8000/post";

const int pinTrig = 5;
const int pinEcho = 18;

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
bool displayOk = false;

float medirDistancia() {
  digitalWrite(pinTrig, LOW);  delayMicroseconds(4);
  digitalWrite(pinTrig, HIGH); delayMicroseconds(10);
  digitalWrite(pinTrig, LOW);
  long dur = pulseIn(pinEcho, HIGH, 60000);
  Serial.printf("[sensor] dur=%ld us\n", dur);
  if (dur == 0) return -1;
  return dur * 0.034f / 2.0f;
}

void showDisplay(const String &name, float fillPct, const String &nivel) {
  if (!displayOk) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(1);
  String n = (name.length() == 0) ? "Sem recipiente" : name;
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
  display.invertDisplay(nivel == "vazio");
}

void setup() {
  Serial.begin(115200);

  pinMode(pinTrig, OUTPUT);
  pinMode(pinEcho, INPUT);

  Wire.begin();
  uint8_t oledAddr = 0;
  for (uint8_t addr : {0x3C, 0x3D}) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) { oledAddr = addr; break; }
  }
  Serial.printf("Display I2C: %s\n", oledAddr ? String("0x" + String(oledAddr, HEX)).c_str() : "nao encontrado");

  displayOk = oledAddr && display.begin(SSD1306_SWITCHCAPVCC, oledAddr);
  if (!displayOk) {
    Serial.println("Falha ao iniciar display — continuando sem ele");
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Conectando WiFi...");
    display.display();
  }

  bool connected = false;
  for (int n = 0; n < numNetworks && !connected; n++) {
    Serial.printf("Tentando: %s\n", networks[n].ssid);
    if (displayOk) {
      display.clearDisplay();
      display.setTextSize(1);
      display.setTextColor(SSD1306_WHITE);
      display.setCursor(0, 0);
      display.println("Conectando WiFi...");
      display.println(networks[n].ssid);
      display.display();
    }

    WiFi.disconnect(true);
    delay(200);
    WiFi.begin(networks[n].ssid, networks[n].password);

    for (int t = 0; WiFi.status() != WL_CONNECTED && t < 20; t++) {
      delay(500); Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) connected = true;
  }

  if (connected) {
    Serial.println("IP: " + WiFi.localIP().toString());
    if (displayOk) {
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("WiFi OK");
      display.println(WiFi.SSID());
      display.println(WiFi.localIP().toString());
      display.display();
      delay(1500);
    }
  } else {
    Serial.println("Falha em todas as redes.");
    if (displayOk) {
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("Sem WiFi!");
      display.display();
    }
  }
}

void loop() {
  float dist = medirDistancia();
  bool  wifi = (WiFi.status() == WL_CONNECTED);

  if (wifi && dist > 0) {
    HTTPClient http;
    http.begin(serverName);
    http.setTimeout(3000);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    int code = http.POST("distancia=" + String(dist, 1) + "cm");

    if (code > 0) {
      StaticJsonDocument<256> doc;
      if (deserializeJson(doc, http.getString()) == DeserializationError::Ok) {
        showDisplay(doc["container"] | "", doc["fill_pct"] | 0.0f, doc["nivel"] | "vazio");
        Serial.printf("Dist: %.1f cm | %.1f%% | HTTP %d\n", dist, (float)(doc["fill_pct"] | 0.0f), code);
      }
    } else {
      Serial.printf("Erro HTTP: %d\n", code);
    }
    http.end();

  } else if (!wifi) {
    Serial.println("Sem WiFi. Reconectando...");
    for (int n = 0; n < numNetworks && WiFi.status() != WL_CONNECTED; n++)
      WiFi.begin(networks[n].ssid, networks[n].password);
    delay(2000);
  } else {
    Serial.println("Sem objeto detectado.");
  }

  delay(500);
}
