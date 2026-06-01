#pragma once

// ─── PINOS ────────────────────────────────────────────────────
#define PIN_TRIG   4   // movido de GPIO5 (conflito com LoRa reset)
#define PIN_ECHO   18
#define PIN_LED    2   // LED onboard do ESP32 DevKit

// ─── LORA UART ────────────────────────────────────────────────
#define LORA_RXD   16
#define LORA_TXD   17
#define LORA_RESET 5

// ─── ENDEREÇOS P2P ────────────────────────────────────────────
// Todos os dispositivos da rede compartilham AppSKey e NwkSKey.
// Cada nó tem um DevAddr único; o gateway tem "00000000".
#if NODE_ID == 1
  #define LORA_DEV_ADDR   "00000001"
#elif NODE_ID == 2
  #define LORA_DEV_ADDR   "00000002"
#endif

#define LORA_GATEWAY_ADDR "00000000"   // destino P2P (gateway)
#define LORA_APP_SKEY     "2B7E151628AED2A6ABF7158809CF4F3C"
#define LORA_NWK_SKEY     "2B7E151628AED2A6ABF7158809CF4F3C"
#define LORA_SYNC_WORD    0x34          // word privada (não LoRaWAN público)

// ─── INTERVALO ────────────────────────────────────────────────
#define SEND_INTERVAL_MS  5000UL
