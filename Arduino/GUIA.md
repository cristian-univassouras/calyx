# Guia do Projeto — Calyx IoT

Sistema de monitoramento de estoque de cozinha via IoT. Sensores ultrassônicos medem o nível de preenchimento dos recipientes e enviam os dados para a API Calyx, que alimenta o app mobile em tempo real.

---

## Arquitetura

```
[Nó 1]  ──LoRa──►  [Gateway]  ──WiFi/HTTP──►  [API Calyx :8080]  ──►  [App Mobile]
 ESP32                ESP32
 HC-SR04              HC-SR04
 (sem WiFi)           (com WiFi + OLED)
```

- **Nó:** mede a distância com HC-SR04 e envia via LoRa P2P para o gateway a cada 5 s
- **Gateway:** recebe os dados LoRa do nó E monitora seu próprio pote diretamente, enviando ambos para a API via HTTP
- **API:** processa os dados, calcula o fill_percent e persiste no banco
- **App mobile:** exibe o nível de cada pote em tempo real

---

## Componentes por placa

### Nó (sem WiFi)

| Componente | Qtd |
|---|---|
| ESP32 Dev Board | 1 |
| Módulo LoRa SMW_SX1276M0 (LoRaWAN Bee V2) | 1 |
| Sensor ultrassônico HC-SR04 | 1 |

### Gateway (com WiFi)

| Componente | Qtd |
|---|---|
| ESP32 Dev Board | 1 |
| Módulo LoRa SMW_SX1276M0 (LoRaWAN Bee V2) | 1 |
| Sensor ultrassônico HC-SR04 | 1 |
| Display OLED SSD1306 128×64 I2C | 1 (opcional) |

---

## Mapa de pinos

### HC-SR04 (igual nos dois ESP32)

| Pino sensor | GPIO ESP32 | Observação |
|---|---|---|
| VCC | VIN (5 V) | Não usar 3,3 V |
| GND | GND | |
| TRIG | GPIO 27 | Saída |
| ECHO | GPIO 32 | Entrada |

> O ECHO do HC-SR04 opera em 5 V. O GPIO 32 do ESP32 é tolerante a 5 V, mas use um divisor de tensão se possível: `ECHO → 1 kΩ → GPIO 32`, com `2 kΩ entre GPIO 32 e GND`.

### Módulo LoRa SMW_SX1276M0 (igual nos dois ESP32)

| Função | GPIO ESP32 |
|---|---|
| UART RXD | GPIO 16 |
| UART TXD | GPIO 17 |
| RESET | GPIO 5 |

### Display OLED SSD1306 I2C (somente gateway)

| Pino display | GPIO ESP32 |
|---|---|
| VCC | 3,3 V |
| GND | GND |
| SDA | GPIO 21 |
| SCL | GPIO 22 |

> O display é detectado automaticamente nos endereços I2C 0x3C ou 0x3D. Se não tiver o display, o gateway funciona normalmente (só sem exibição local).

---

## Comunicação com a API

O gateway envia para o endpoint `/ingest` da API Calyx:

```
POST http://<SERVER_IP>:8080/ingest
X-Device-Token: <device_token_do_pote>
Content-Type: application/json

{ "distance_from_lid": 23.5 }
```

A API responde com:
```json
{
  "recipient_name": "Pote de Arroz",
  "fill_percent": 64.3,
  "filled_volume_cm3": 385.9,
  "total_volume_cm3": 600.0,
  "mass_g": 328.0
}
```

O `device_token` de cada pote é gerado automaticamente pela API ao criar o recipiente e aparece na tela de detalhe do pote no app mobile.

---

## Configuração

Toda a configuração fica em `src_gateway/config.h` e `src_node/config.h`. Veja [COMO_GRAVAR.md](COMO_GRAVAR.md) para o passo a passo completo.

---

## Estrutura de arquivos

```
Arduino/
├── platformio.ini          # Ambientes de build (node1, gateway)
├── src_node/
│   ├── config.h            # Pinos e endereços LoRa do nó
│   └── main.cpp            # Firmware do nó
├── src_gateway/
│   ├── config.h            # WiFi, IP, device_tokens, pinos do gateway
│   └── main.cpp            # Firmware do gateway
├── COMO_GRAVAR.md          # Passo a passo para gravar o firmware
├── GUIA.md                 # Este arquivo
└── RESUMO.md               # Visão rápida do projeto
```

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| Sensor retorna -1 | HC-SR04 sem objeto detectado ou VCC em 3,3 V | Mover VCC para VIN (5 V) |
| `[HTTP] erro: 401` | device_token inválido | Copiar o token correto do app |
| `[HTTP] erro: -1` | API fora do ar ou IP errado | Verificar `SERVER_IP` e iniciar a API |
| OLED não exibe nada | Display não encontrado no I2C | Testar endereço 0x3D em vez de 0x3C |
| Nó não recebe join LoRa | Chaves incompatíveis | Comparar AppSKey/NwkSKey nos dois `config.h` |
