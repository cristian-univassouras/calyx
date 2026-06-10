#if !defined(ARDUINO_ESP32_DEV)
#error Use este firmware com o ESP32
#endif

#include <RoboCore_SMW_SX1276M0.h>
#include <HardwareSerial.h>
#include "config.h"

HardwareSerial LoRaSerial(2);
SMW_SX1276M0 lorawan(LoRaSerial);
CommandResponse resp;

bool loraReady = false;

void event_handler(Event type) {
  if (type == Event::JOINED) {
    loraReady = true;
    Serial.println("[LoRa] P2P pronto");
  }
}

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

  LoRaSerial.begin(115200, SERIAL_8N1, LORA_RXD, LORA_TXD);

  lorawan.event_listener = &event_handler;
  lorawan.setPinReset(LORA_RESET);
  lorawan.reset();
  delay(1000);

  lorawan.set_JoinMode(SMW_SX1276M0_JOIN_MODE_P2P);
  lorawan.set_DevAddr(LORA_DEV_ADDR);
  lorawan.set_AppSKey(LORA_APP_SKEY);
  lorawan.set_NwkSKey(LORA_NWK_SKEY);
  lorawan.set_P2P_DevAddr(LORA_GATEWAY_ADDR);
  lorawan.set_P2P_SyncWord(LORA_SYNC_WORD);

  lorawan.join();
  Serial.println("[LoRa] aguardando P2P join...");
}

void loop() {
  lorawan.listen();

  if (!loraReady) return;

  static unsigned long lastSend = 0;
  unsigned long now = millis();
  if (now - lastSend < SEND_INTERVAL_MS + random(0, 2000)) return;
  lastSend = now;

  float dist = medirDistancia();
  if (dist < 0) {
    Serial.println("[sensor] sem objeto detectado");
  } else {
    char msg[16];
    snprintf(msg, sizeof(msg), "%d:%.1f", NODE_ID, dist);
    Serial.printf("[LoRa] enviando: %s\n", msg);
    resp = lorawan.sendT(1, msg);
    if (resp != CommandResponse::OK) {
      Serial.println("[LoRa] erro no envio");
    } else {
      digitalWrite(PIN_LED, HIGH); delay(80); digitalWrite(PIN_LED, LOW);
    }
  }
}
