#if !defined(ARDUINO_ESP32_DEV)
#error Use este firmware com o ESP32
#endif

#include <RoboCore_SMW_SX1276M0.h>
#include <HardwareSerial.h>

HardwareSerial LoRaSerial(2);
#define RXD2 16
#define TXD2 17

SMW_SX1276M0 lorawan(LoRaSerial);
CommandResponse response;

const char DEVADDR[]     = "00000001";
const char DEVADDR_P2P[] = "00000000";
const char APPSKEY[]     = "2B7E151628AED2A6ABF7158809CF4F3C";
const char NWKSKEY[]     = "2B7E151628AED2A6ABF7158809CF4F3C";

const unsigned long PAUSE_TIME = 5000;
unsigned long timeout = 0;
int count = 0;

void event_handler(Event type) {
  if (type == Event::JOINED) {
    Serial.println(">> JOINED");
  } else if (type == Event::RECEIVED_X) {
    Serial.println(">> RECEIVED_X");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("--- TX P2P TEST ---");

  LoRaSerial.begin(115200, SERIAL_8N1, RXD2, TXD2);
  lorawan.event_listener = &event_handler;

  lorawan.setPinReset(5);
  lorawan.reset();
  delay(2000);

  lorawan.set_DevAddr(DEVADDR);
  lorawan.set_P2P_DevAddr(DEVADDR_P2P);
  lorawan.set_AppSKey(APPSKEY);
  lorawan.set_NwkSKey(NWKSKEY);
  lorawan.set_P2P_SyncWord(18);
  lorawan.set_JoinMode(SMW_SX1276M0_JOIN_MODE_P2P);
}

void loop() {
  lorawan.listen();

  if (timeout < millis()) {
    count++;
    if (count > 255) count = 0;

    char data[3] = {'0', '0', 0};
    data[0] += (count / 16);
    if (data[0] > '9') data[0] += 7;
    data[1] += (count % 16);
    if (data[1] > '9') data[1] += 7;

    Serial.print("Enviando: ");
    Serial.println(data);
    response = lorawan.sendX(10, data);
    if (response != CommandResponse::OK)
      Serial.println("ERRO no envio");

    timeout = millis() + PAUSE_TIME;
  }
}
