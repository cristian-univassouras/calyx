# Monitor de Nível com ESP32

Mede o nível de preenchimento de recipientes com sensor ultrassônico e exibe em tempo real num dashboard web.

---

## Componentes

- ESP32 Dev Board
- Sensor ultrassônico HC-SR04
- Display OLED SSD1306 128×64 (I2C) — opcional
- Resistores 1kΩ e 2kΩ (divisor de tensão no ECHO)

---

## Ligações

| Componente | Pino | ESP32 |
|---|---|---|
| HC-SR04 | VCC | VIN (5V) |
| HC-SR04 | GND | GND |
| HC-SR04 | TRIG | GPIO 5 |
| HC-SR04 | ECHO | GPIO 18 ¹ |
| OLED | VCC | 3.3V |
| OLED | GND | GND |
| OLED | SDA | GPIO 21 |
| OLED | SCL | GPIO 22 |

¹ O ECHO devolve 5V. Proteja o ESP32 com divisor de tensão:
`ECHO → 1kΩ → GPIO 18`, com `2kΩ entre GPIO 18 e GND`.

---

## Servidor (Python)

**Requisitos:** Python 3.10+

```bash
cd server
pip install fastapi uvicorn[standard]
uvicorn main:app --host 0.0.0.0 --port 8000
```

Abra `http://localhost:8000` no navegador.

---

## Firmware (ESP32)

**Requisitos:** VS Code + PlatformIO

1. Edite `src/main.cpp` — ajuste o IP do servidor e as redes WiFi:
```cpp
const char *serverName = "http://SEU_IP:8000/post";

const Network networks[] = {
  { "NomeDaRede", "senha" },
};
```

2. Compile e envie pelo PlatformIO (botão **Upload**).

> Para descobrir o IP do computador no Windows: `ipconfig` → "Endereço IPv4" do adaptador Wi-Fi.

---

## Como usar

1. Inicie o servidor Python
2. Ligue o ESP32 (conecta ao WiFi automaticamente)
3. No dashboard, cadastre um recipiente informando nome, altura em cm e localização opcional
4. O nível é atualizado em tempo real

**Três abas no dashboard:**
- **Geral** — todos os recipientes ao mesmo tempo
- **Mapa** — localização geográfica de cada recipiente
- **Detalhe** — lixeira animada + histórico de leituras

---

## Para múltiplos dispositivos

Cada ESP32 envia os dados para o mesmo servidor. Para associar um dispositivo a um recipiente específico, inclua o ID do recipiente no POST:

```
distancia=15.3cm&cid=ID_DO_RECIPIENTE
```

O ID aparece na URL ao selecionar o recipiente no dashboard.
