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

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `[LoRa] P2P pronto` nunca aparece | TRIG ainda no GPIO 5 | Mover fio para GPIO 4 |
| Gateway não recebe mensagens | Chaves AppSKey/NwkSKey diferentes | Comparar `src_node/config.h` e `src_gateway/config.h` |
| `[LoRa] parse falhou` no gateway | Formato inesperado | Ver mensagem bruta no serial |
| HTTP 400/422 no servidor | Servidor não aceita `node_id` | Adicionar `node_id` ao endpoint do servidor |
