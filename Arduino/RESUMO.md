# Calyx IoT — Resumo

Sistema de monitoramento de estoque de cozinha com ESP32 + LoRa + API Calyx + app mobile.

---

## Hardware

| Placa | Função | Conectividade |
|---|---|---|
| **Nó 1** | Mede distância e envia via LoRa | LoRa P2P (sem WiFi) |
| **Gateway** | Relaya dados do nó + monitora seu próprio pote | LoRa + WiFi → API |

---

## Ligações (ambas as placas)

| Componente | Pino | GPIO |
|---|---|---|
| HC-SR04 | VCC | VIN (5 V) |
| HC-SR04 | GND | GND |
| HC-SR04 | TRIG | GPIO 27 |
| HC-SR04 | ECHO | GPIO 32 |
| LoRa | RXD | GPIO 16 |
| LoRa | TXD | GPIO 17 |
| LoRa | RESET | GPIO 5 |

**Gateway adicional:**

| Componente | Pino | GPIO |
|---|---|---|
| OLED | SDA | GPIO 21 |
| OLED | SCL | GPIO 22 |

---

## API

| Campo | Valor |
|---|---|
| Endpoint | `POST /ingest` |
| Porta | `8080` |
| Auth | `X-Device-Token: <token>` |
| Body | `{ "distance_from_lid": 23.5 }` |

O `device_token` de cada pote aparece na tela de detalhe do recipiente no app mobile.

---

## Gravar firmware

```bash
pio run -e node1   -t upload   # grava o nó
pio run -e gateway -t upload   # grava o gateway
```

Preencher `src_gateway/config.h` com WiFi, IP do servidor e device_tokens antes de gravar.

Veja [COMO_GRAVAR.md](COMO_GRAVAR.md) para detalhes.
