# LoRa P2P — Design Spec

**Data:** 2026-06-01  
**Escopo:** Firmware dos 3 ESP32 com comunicação LoRa P2P. Servidor Python fora do escopo (só recebe parâmetro `node_id` adicional no POST existente).

---

## Arquitetura

Dois nós sensores enviam dados via LoRa P2P de forma autônoma (broadcast periódico). Um gateway recebe as mensagens e repassa ao servidor Python via HTTP, igual ao fluxo WiFi atual — mas agora com o campo `node_id` identificando a origem.

```
[ Nó 1 · sem WiFi ]  ──LoRa──┐
                               ├──▶  [ Gateway · WiFi ]  ──HTTP POST──▶  [ Servidor Python ]
[ Nó 2 · sem WiFi ]  ──LoRa──┘
```

---

## Hardware

**Placa:** Robocore IoT DevKit v1.0 + ESP32 + LoRaWAN Bee v2.1  
**Chip LoRa:** SMW_SX1276M0 (comunicação via UART, não SPI)  
**Biblioteca:** `RoboCore_SMW_SX1276M0` (v1.1.0+, necessário suporte P2P)

### Pinagem — todos os 3 ESP32

| Função | GPIO | Observação |
|---|---|---|
| LoRa UART RX | 16 | Fixo no DevKit |
| LoRa UART TX | 17 | Fixo no DevKit |
| LoRa Reset | 5 | Fixo no DevKit |
| HC-SR04 TRIG | **4** | Movido de GPIO 5 (conflito com LoRa reset) |
| HC-SR04 ECHO | 18 | Sem conflito, mantido |
| OLED SDA | 21 | I2C, mantido (gateway apenas) |
| OLED SCL | 22 | I2C, mantido (gateway apenas) |

> **Conflito resolvido:** GPIO 5 era o pino TRIG no projeto original. Com LoRa, GPIO 5 é o reset do módulo. TRIG movido para GPIO 4.

---

## Estrutura de arquivos

O projeto passa a ter duas pastas de source em vez de uma:

```
src_node/
  main.cpp       ← firmware do nó sensor (compilado 2x com NODE_ID diferente)
  config.h       ← define NODE_ID (1 ou 2) e parâmetros LoRa

src_gateway/
  main.cpp       ← firmware do gateway (WiFi + LoRa RX + HTTP POST)
  config.h       ← WiFi credentials, SERVER_IP

platformio.ini   ← 3 environments: node1, node2, gateway
```

---

## Formato da mensagem LoRa

String ASCII simples para minimizar bytes no ar:

```
"ID:DISTANCIA"
```

Exemplos:
- `"1:23.5"` — Nó 1, 23.5 cm
- `"2:41.0"` — Nó 2, 41.0 cm
- `"1:-1"` — Nó 1, sem objeto detectado (distância inválida)

O gateway ignora mensagens com distância `-1`.

---

## Firmware: nó sensor (`src_node/main.cpp`)

**Ciclo principal (a cada ~5 s):**
1. Medir distância com HC-SR04
2. Se distância válida (> 0), formatar string `"NODE_ID:distancia"`
3. Enviar via LoRa P2P com `lorawan.sendP2P(msg)`
4. `delay(5000 + random(0, 2000))` — jitter para evitar colisão com o outro nó

**Sem WiFi, sem HTTP, sem OLED.**

---

## Firmware: gateway (`src_gateway/main.cpp`)

**Ciclo principal:**
1. Verificar se há mensagem LoRa recebida (`lorawan.available()`)
2. Fazer parse da string: split em `:` → `node_id` (int) e `distancia` (float)
3. Se WiFi conectado, HTTP POST para `http://SERVER_IP:8000/post` com body:  
   `distancia=23.5cm&node_id=1`
4. Exibir no OLED: recipiente recebido + % de preenchimento (resposta do servidor)
5. Gerenciar reconexão WiFi igual ao código atual

---

## platformio.ini — 3 environments

```ini
[env:node1]
build_flags = -DNODE_ID=1
src_dir = src_node

[env:node2]
build_flags = -DNODE_ID=2
src_dir = src_node

[env:gateway]
src_dir = src_gateway
```

---

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| Nó sem objeto detectado | Não envia mensagem (distância = -1) |
| Colisão LoRa | Jitter aleatório 0–2 s reduz probabilidade; sem retry |
| Gateway sem WiFi | Mensagem LoRa recebida mas descartada; reconexão em background |
| Parse inválido no gateway | Log serial + ignora mensagem |

---

## Fora do escopo

- Modificações no servidor Python (só precisa aceitar `node_id` no POST)
- Confirmação de entrega (ACK) entre nós e gateway
- Criptografia ou autenticação das mensagens LoRa
