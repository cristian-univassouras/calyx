#pragma once

// ─── WIFI / SERVIDOR ──────────────────────────────────────────
#define WIFI_SSID     "flamengo"
#define WIFI_PASSWORD "12344321"
#define SERVER_IP     "192.168.1.8"
#define SERVER_PORT   8080

// ─── PINOS ────────────────────────────────────────────────────
#define PIN_LED    2   // LED onboard do ESP32 DevKit

// ─── LORA UART ────────────────────────────────────────────────
#define LORA_RXD   16
#define LORA_TXD   17
#define LORA_RESET 5

// ─── ENDEREÇO P2P DO GATEWAY ──────────────────────────────────
#define LORA_DEV_ADDR  "00000000"
#define LORA_APP_SKEY  "2B7E151628AED2A6ABF7158809CF4F3C"
#define LORA_NWK_SKEY  "2B7E151628AED2A6ABF7158809CF4F3C"
#define LORA_SYNC_WORD 0x34

// ─── MAPEAMENTO node_id → device_token (nós remotos via LoRa) ─
// Cada nó LoRa tem um node_id fixo (configurado no firmware do nó).
// Adicione uma entrada por sensor remoto.
struct NodeToken { int nodeId; const char *deviceToken; };
static const NodeToken NODE_TOKENS[] = {
  { 1, "28fc7abc0e8b135addf3ada9eddd5009" },
  // { 2, "COLE_AQUI_O_DEVICE_TOKEN_DO_POTE_DO_NO_2" },
};
static const int NODE_TOKENS_COUNT = sizeof(NODE_TOKENS) / sizeof(NODE_TOKENS[0]);
