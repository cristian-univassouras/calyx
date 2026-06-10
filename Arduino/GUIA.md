# Guia do Projeto — Monitor de Nível com ESP32

Sistema que mede o nível de preenchimento de um recipiente com sensor ultrassônico, exibe no display OLED e envia os dados para um servidor local com dashboard em tempo real.

---

## Componentes necessários

| Componente | Quantidade |
|---|---|
| ESP32 Dev Board | 1 |
| Sensor ultrassônico HC-SR04 | 1 |
| Display OLED SSD1306 128×64 (I2C) | 1 |
| LED verde | 1 |
| LED amarelo | 1 |
| LED vermelho | 1 |
| Resistor 220 Ω | 3 |
| Protoboard | 1 |
| Jumpers | vários |

---

## Mapa de pinos

### HC-SR04 — Sensor ultrassônico

| Pino sensor | Conecta em | Observação |
|---|---|---|
| VCC | VIN (5 V) | **Não usar 3,3 V** — sensor requer 5 V |
| GND | GND | |
| TRIG | GPIO 5 | Saída do ESP32 |
| ECHO | GPIO 18 | Entrada do ESP32 |

> **Atenção:** O pino ECHO do HC-SR04 devolve 5 V. O GPIO do ESP32 suporta no máximo 3,3 V. O ideal é usar um divisor de tensão entre ECHO e GPIO 18 (resistor 1 kΩ em série + 2 kΩ para GND).

### Display OLED SSD1306 (I2C)

| Pino display | Conecta em |
|---|---|
| VCC | 3,3 V |
| GND | GND |
| SDA | GPIO 21 |
| SCL | GPIO 22 |

### LEDs de status

Cada LED precisa de um resistor de 220 Ω em série entre o GPIO e o anodo (+) do LED. O catodo (–) vai para o GND.

| Cor | GPIO | Significado |
|---|---|---|
| Verde | GPIO 12 | WiFi conectado / leitura OK |
| Amarelo | GPIO 13 | Conectando ao WiFi / erro HTTP |
| Vermelho | GPIO 14 | Sem WiFi |

**Ligação de cada LED:**
```
GPIO → [220 Ω] → anodo (+) LED → catodo (–) → GND
```

---

## Diagrama de conexão (texto)

```
                    ┌──────────────────────────────┐
                    │         ESP32 Dev Board       │
                    │                               │
HC-SR04 VCC  ──────►│ VIN  (5V)                    │
HC-SR04 GND  ──────►│ GND                           │
HC-SR04 TRIG ◄──────│ GPIO 5                        │
HC-SR04 ECHO ──────►│ GPIO 18                       │
                    │                               │
OLED VCC     ──────►│ 3V3                           │
OLED GND     ──────►│ GND                           │
OLED SDA     ◄─────►│ GPIO 21 (I2C SDA)             │
OLED SCL     ◄─────►│ GPIO 22 (I2C SCL)             │
                    │                               │
LED Verde    ◄──────│ GPIO 12 → [220Ω] → LED → GND  │
LED Amarelo  ◄──────│ GPIO 13 → [220Ω] → LED → GND  │
LED Vermelho ◄──────│ GPIO 14 → [220Ω] → LED → GND  │
                    │                               │
                    │ USB → Computador (upload/serial)│
                    └──────────────────────────────┘
```

---

## Como funciona

### Firmware (ESP32)

1. Ao ligar, tenta conectar à rede **Adriana** (senha: `30122004`)
2. Se falhar, tenta conectar à rede **Iphone** (senha: `flipflip`)
3. A cada 500 ms, dispara o sensor ultrassônico e mede a distância até a superfície do líquido
4. Envia a distância via HTTP POST para o servidor: `POST /post` com body `distancia=XX.Xcm`
5. O servidor responde com `fill_pct`, `nivel` e `container` (nome do recipiente ativo)
6. O ESP32 exibe no OLED: nome do recipiente, percentual e barra de progresso
7. Os LEDs indicam o estado da conexão e das leituras

### Servidor (Python / FastAPI)

- Recebe os dados do ESP32
- Calcula o nível com base na altura cadastrada do recipiente
- Transmite via SSE (Server-Sent Events) para o browser em tempo real
- Persiste os recipientes cadastrados em `server/containers.json`

### Dashboard (browser)

- Acessível em `http://localhost:8000`
- Lixeira SVG animada com efeito de líquido (wave) e cor por nível
- Gerenciamento de recipientes: cadastrar, editar, excluir, ativar
- Tabela de histórico das últimas 100 leituras
- Botão "Testar UI" para simular leituras sem o ESP32

---

## Lógica de nível

| Faixa | Status | Cor dashboard | OLED |
|---|---|---|---|
| 0 – 33% | VAZIO | Vermelho | Tela invertida (alerta) |
| 34 – 66% | MÉDIO | Âmbar | Normal |
| 67 – 100% | CHEIO | Verde | Normal |

**Fórmula:**
```
fill_pct = (altura_recipiente - distancia_lida) / altura_recipiente × 100
```

---

## Configuração do ambiente

### 1. Firmware

**Dependências (`platformio.ini`):**
```ini
[env:esp32dev]
platform = espressif32@5.3.0
board = esp32dev
framework = arduino
upload_port = COM8
monitor_port = COM8
monitor_speed = 115200
lib_deps =
    adafruit/Adafruit SSD1306@^2.5.7
    adafruit/Adafruit GFX Library@^1.11.5
    bblanchon/ArduinoJson@^6.21.3
```

**Para compilar e enviar:**
- Abrir o projeto no PlatformIO (VS Code)
- Clicar em **Upload** ou usar `pio run --target upload`

**Para monitorar a serial:**
- Clicar em **Monitor** ou usar `pio device monitor`

### 2. Servidor

**Instalar dependências:**
```bash
cd server
pip install -r requirements.txt
```

**Iniciar o servidor:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Acessar o dashboard:**
```
http://localhost:8000
```

---

## Configurações que podem precisar de ajuste

| O que | Onde | Variável/campo |
|---|---|---|
| IP do servidor no firmware | `src/main.cpp` linha 9 | `serverName` |
| Redes WiFi | `src/main.cpp` array `networks[]` | `ssid` / `password` |
| Porta serial de upload | `platformio.ini` | `upload_port` |
| Porta GPIO dos sensores | `src/main.cpp` linhas 14–18 | `pinTrig`, `pinEcho`, etc. |

**Como descobrir o IP do computador (Windows):**
```powershell
ipconfig
# Procurar "Adaptador Wi-Fi" → "Endereço IPv4"
```

---

## Estrutura de arquivos

```
MyEsp32/
├── platformio.ini          # Configuração do PlatformIO
├── src/
│   └── main.cpp            # Firmware do ESP32
└── server/
    ├── main.py             # API FastAPI
    ├── requirements.txt    # Dependências Python
    ├── containers.json     # Recipientes cadastrados (gerado automaticamente)
    └── static/
        └── index.html      # Dashboard web
```

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Sem objeto detectado` | VCC do HC-SR04 no 3,3 V | Mover VCC para VIN (5 V) |
| `Erro HTTP: -1` | IP do servidor errado | Atualizar `serverName` no firmware |
| `Erro HTTP: -11` | Servidor não está rodando | Iniciar `uvicorn` |
| Serial com caracteres estranhos | Baud rate errado no monitor | Confirmar `monitor_speed = 115200` |
| Display não aparece | Endereço I2C errado | Testar com endereço `0x3D` em vez de `0x3C` |
| Não conecta ao WiFi | Senha ou SSID errado | Verificar array `networks[]` no firmware |
