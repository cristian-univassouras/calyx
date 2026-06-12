#pragma once

// ─── WIFI / SERVIDOR ──────────────────────────────────────────
#define WIFI_SSID     "flamengo"
#define WIFI_PASSWORD "12344321"
#define SERVER_IP     "192.168.1.8"
#define SERVER_PORT   8080

// ─── PINOS ────────────────────────────────────────────────────
#define PIN_LED    2

// ─── MAPEAMENTO node_id → device_token ────────────────────────
struct NodeToken { int nodeId; const char *deviceToken; };
static const NodeToken NODE_TOKENS[] = {
  { 1, "161bd8eb3253e8b352276fc3fad3e386" },
  { 2, "fe8792ba4cb58fc5a52802292d863d98" },
};
static const int NODE_TOKENS_COUNT = sizeof(NODE_TOKENS) / sizeof(NODE_TOKENS[0]);
