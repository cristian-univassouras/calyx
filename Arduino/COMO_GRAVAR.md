# Como gravar o firmware

## Pré-requisitos

- VS Code com extensão PlatformIO instalada
- Dois ESP32 com módulo LoRa SMW_SX1276M0
- Sensor ultrassônico conectado em ambas as placas: **TRIG → GPIO 27**, **ECHO → GPIO 32**

---

## Antes de gravar: configurar os tokens

Cada placa monitora um pote cadastrado no app Calyx. O `device_token` aparece na tela de detalhe do pote no app.

**`src_gateway/config.h`** — preencher antes de gravar o gateway:

```cpp
#define WIFI_SSID     "sua_rede"
#define WIFI_PASSWORD "sua_senha"
#define SERVER_IP     "IP_do_PC_onde_roda_a_API"

// Token do pote monitorado pelo próprio gateway
#define GATEWAY_DEVICE_TOKEN  "token_do_pote_do_gateway"

// Token do pote monitorado pelo nó 1 (via LoRa)
static const NodeToken NODE_TOKENS[] = {
  { 1, "token_do_pote_do_no1" },
};
```

> Para descobrir o IP do PC no Windows: `ipconfig` → "Endereço IPv4" do adaptador Wi-Fi.

---

## Passo 1 — Gravar o Nó 1

1. Conectar o ESP32 nó via USB
2. Ajustar a porta em `platformio.ini` → `[env:node1]` → `upload_port`
3. Gravar:

```bash
pio run -e node1 -t upload
```

4. Verificar no monitor serial:

```bash
pio device monitor -e node1
```

Saída esperada:
```
[Node 1] iniciando...
[LoRa] aguardando P2P join...
[LoRa] P2P pronto
[LoRa] enviando: 1:23.5
```

---

## Passo 2 — Gravar o Gateway

1. Trocar o cabo USB para o ESP32 gateway
2. Ajustar a porta em `platformio.ini` → `[env:gateway]` → `upload_port`
3. Gravar:

```bash
pio run -e gateway -t upload
```

4. Verificar no monitor serial:

```bash
pio device monitor -e gateway
```

Saída esperada (com o nó já ligado e a API rodando):
```
[Gateway] iniciando...
[WiFi] conectado: 192.168.x.x
[LoRa] gateway P2P pronto
[sensor local] dist=18.2 cm
[sensor local] fill=64.3% recipiente=Pote de Arroz
[LoRa] recebido: 1:23.5
[HTTP] node=1 dist=23.5 fill=47.0% recipiente=Pote de Sal status=201
```

---

## Como testar a comunicação LoRa

O LED onboard (GPIO 2) pisca para indicar atividade:

| Placa | Evento | LED |
|---|---|---|
| **Nó** | Enviou via LoRa com sucesso | 1 piscada (80 ms) |
| **Gateway** | Recebeu dado via LoRa | 2 piscadas rápidas (60 ms cada) |

**Fluxo de teste:**
1. Ligue o gateway → espere `[LoRa] gateway P2P pronto` no serial
2. Ligue o nó → a cada ~5 s ele pisca 1x ao enviar
3. No mesmo instante o gateway pisca 2x → LoRa funcionando ✅

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `[LoRa] P2P pronto` nunca aparece | Problema na inicialização do módulo LoRa | Verificar conexão UART (RXD=16, TXD=17, RESET=5) |
| Nó pisca mas gateway não recebe | Chaves ou sync word diferentes | Comparar `src_node/config.h` e `src_gateway/config.h` |
| `[HTTP] node=X sem device_token configurado` | Token não preenchido no config | Adicionar o device_token correto em `NODE_TOKENS[]` |
| `[HTTP] erro: 401` | device_token inválido ou errado | Copiar o token correto da tela de detalhe do pote no app |
| `[HTTP] erro: -1` | API não está rodando ou IP errado | Verificar `SERVER_IP` e se a API está no ar |
| `[sensor local] sem leitura` | HC-SR04 sem objeto na frente | Normal se não houver nada no campo de visão do sensor |
| Serial com caracteres estranhos | Baud rate errado | Confirmar `monitor_speed = 115200` |
