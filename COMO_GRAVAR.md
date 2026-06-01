# Como gravar o firmware LoRa P2P

## Pré-requisito: ajuste físico de hardware

Nos **2 ESP32 nós sensores**, mover o fio do HC-SR04:

```
TRIG:  GPIO 5  →  GPIO 4   ⚠️ obrigatório (GPIO 5 é o reset do LoRaWAN Bee)
ECHO:  GPIO 18 →  GPIO 18  (sem mudança)
```

---

## Passo 1 — Gravar o Nó 1

1. Conectar o **primeiro ESP32 sensor** via USB
2. Verificar/ajustar a porta no `platformio.ini` → `[env:node1]` → `upload_port`
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

## Passo 2 — Gravar o Nó 2

1. **Trocar o cabo USB** para o **segundo ESP32 sensor**
2. Verificar/ajustar a porta no `platformio.ini` → `[env:node2]` → `upload_port`
3. Gravar:

```bash
pio run -e node2 -t upload
```

4. Verificar no monitor serial:

```bash
pio device monitor -e node2
```

Saída esperada:
```
[Node 2] iniciando...
[LoRa] P2P pronto
[LoRa] enviando: 2:41.0
```

---

## Passo 3 — Gravar o Gateway

1. Conectar o **ESP32 gateway** (o que tem WiFi + OLED) via USB
2. Verificar/ajustar a porta no `platformio.ini` → `[env:gateway]` → `upload_port`
3. Abrir `src_gateway/config.h` e atualizar as credenciais WiFi e o IP do servidor:

```cpp
#define WIFI_SSID     "sua_rede"
#define WIFI_PASSWORD "sua_senha"
#define SERVER_IP     "IP_DO_SERVIDOR"
```

4. Gravar:

```bash
pio run -e gateway -t upload
```

5. Verificar no monitor serial:

```bash
pio device monitor -e gateway
```

Saída esperada (com os nós já ligados):
```
[Gateway] iniciando...
[WiFi] conectado: 10.198.x.x
[LoRa] gateway P2P pronto
[LoRa] recebido: 1:23.5
[HTTP] node=1 dist=23.5 fill=47.0% status=200
[LoRa] recebido: 2:41.0
[HTTP] node=2 dist=41.0 fill=18.0% status=200
```

---

## Como testar a conexão LoRa entre as placas

### Via LED (visual, sem cabo)

Cada placa tem um LED onboard no **GPIO 2** que indica atividade LoRa:

| Placa | Evento | LED |
|---|---|---|
| **Nó 1 / Nó 2** | Enviou com sucesso via LoRa | 1 piscada (80 ms) |
| **Gateway** | Recebeu dado via LoRa | 2 piscadas rápidas (60 ms cada) |

**Fluxo de teste:**
1. Ligue o **gateway** → espere o LED piscar 1x ao iniciar (não há blink de init, mas o Serial dirá `P2P pronto`)
2. Ligue um **nó** → a cada ~5 s ele pisca 1x ao enviar
3. No mesmo instante, o **gateway pisca 2x** → conexão LoRa funcionando ✅
4. Se o nó pisca mas o gateway não → problema de alcance, chaves ou sync word

> Se o LED não responder, o pino pode ser diferente de GPIO 2 no seu IoT DevKit.
> Ajuste `PIN_LED` em `src_node/config.h` e `src_gateway/config.h`.

### Via Serial Monitor (mais detalhado)

Com o gateway conectado ao PC:

```bash
pio device monitor -e gateway
```

Cada mensagem recebida aparece como:
```
[LoRa] recebido: 1:23.5
[HTTP] node=1 dist=23.5 fill=47.0% status=200
```

Para ver o nó enviando simultaneamente, abra um segundo terminal:
```bash
pio device monitor -e node1
```

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `[LoRa] P2P pronto` nunca aparece | TRIG ainda no GPIO 5 | Mover fio para GPIO 4 |
| Nó pisca mas gateway não | Chaves AppSKey/NwkSKey ou sync word diferentes | Comparar `src_node/config.h` e `src_gateway/config.h` |
| Nó não pisca ao enviar | `sendT` retornou erro | Ver `[LoRa] erro no envio` no serial do nó |
| LED não responde em nenhuma placa | Pino do LED diferente de GPIO 2 | Ajustar `PIN_LED` nos dois `config.h` |
| `[LoRa] parse falhou` no gateway | Formato inesperado | Ver mensagem bruta no serial |
| HTTP 400/422 no servidor | Servidor não aceita `node_id` | Adicionar `node_id` ao endpoint do servidor |
