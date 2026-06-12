#if !defined(ARDUINO_ESP32_DEV)
#error Use este firmware com o ESP32
#endif

#include <RoboCore_SMW_SX1276M0.h>
#include <HardwareSerial.h>

HardwareSerial LoRaSerial(2);
SMW_SX1276M0 lorawan(LoRaSerial);

void setup() {
  Serial.begin(115200);
  Serial.println("--- AT PASSTHROUGH ---");
  Serial.println("Digite AT commands. Ex: AT, AT+VER, AT+FACNEW");

  LoRaSerial.begin(115200, SERIAL_8N1, 16, 17);
  lorawan.setPinReset(5);
  lorawan.reset();
  delay(2000);

  Serial.println("Modulo pronto.");
}

void loop() {
  while (LoRaSerial.available()) Serial.write(LoRaSerial.read());
  while (Serial.available()) LoRaSerial.write(Serial.read());
}
