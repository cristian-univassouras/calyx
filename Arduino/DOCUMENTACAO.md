# Tampa Inteligente para Monitoramento de Recipientes de Dispensa

---

## 1. Identificação

| Campo                                | Descrição            |
| ------------------------------------ | ---------------------- |
| **Nome do projeto**            | SmartLid               |
| **Instituição**              | Univassouras           |
| **Curso / Disciplina**         | Engenharia de Software |
| **Professor(a) orientador(a)** | Marcio Garrido         |
| **Período / Turma**           | 5° Período           |
| **Data de entrega**            | 30/06/2026             |

### 1.1 Integrantes do grupo

| Nome completo                   | Matrícula    | Função no projeto      |
| ------------------------------- | ------------- | ------------------------ |
| Andrey Violante Pereira Saraiva | _202413812_ | Desenvolvedor            |
| Cristan da Silva Barboza        | _202413716_ | _Desenvolvedor Mobile_ |
| Endriel Da Silva Medeiros       | 202322142     | _Desenvolvedor_        |
| Felipe Sodre de Freitas         | _202413293_ | _Desenvolvedor_        |

---

## 2. Resumo

O presente trabalho descreve o desenvolvimento de uma tampa inteligente
destinada a recipientes domésticos de armazenamento de alimentos secos, tais
como temperos, grãos, farinhas e demais itens de dispensa. Cada tampa
incorpora um microcontrolador ESP32 e um sensor ultrassônico, responsáveis
por estimar, de forma contínua, o percentual de preenchimento do recipiente
sobre o qual se encontra acoplada.

Para viabilizar a operação dentro de uma residência sem sobrecarregar a rede
sem fio convencional, adota-se uma arquitetura distribuída baseada em
comunicação LoRa: as tampas atuam como nós secundários que transmitem suas
leituras, em baixa potência e longo alcance, a um nó principal. Este nó
principal, dotado de conectividade Wi-Fi, consolida as informações recebidas
e as encaminha ao servidor central, que as disponibiliza ao usuário por meio
de interfaces web e móvel.

---

## 3. Introdução

O controle do estoque doméstico de produtos secos constitui uma tarefa
cotidiana cuja execução, geralmente realizada de forma visual e manual,
apresenta limitações relacionadas à frequência de verificação, à confiabilidade
da estimativa e à organização das compras de reposição. A ausência de uma
informação precisa e centralizada acerca do conteúdo da dispensa pode
ocasionar tanto a falta inesperada de itens quanto o acúmulo desnecessário de
produtos.

Diante desse cenário, o presente projeto propõe o desenvolvimento de uma
tampa instrumentada, dotada de microcontrolador e sensor ultrassônico, capaz
de ser acoplada a recipientes convencionais utilizados no armazenamento de
alimentos. O dispositivo realiza, de maneira automatizada, a estimativa do
percentual de preenchimento do recipiente e transmite os dados a uma
aplicação central, a qual disponibiliza tais informações em interfaces web e
móvel acessíveis aos moradores.

---

## 4. Objetivos

### 4.1 Objetivo geral

Desenvolver uma tampa instrumentada, acoplável a recipientes domésticos de
armazenamento de produtos secos, capaz de estimar o percentual de
preenchimento e disponibilizar tais informações ao usuário por meio de
interfaces web e móvel.

### 4.2 Objetivos específicos

- Projetar o circuito eletrônico de aquisição de dados baseado no
  microcontrolador ESP32 e no sensor ultrassônico HC-SR04, em configuração
  compatível com a fixação na tampa do recipiente.
- Implementar o firmware dos nós secundários, responsável pela medição da
  distância entre a tampa e a superfície do conteúdo, pelo cálculo do
  percentual de preenchimento e pela transmissão dos dados via protocolo LoRa.
- Implementar o firmware do nó principal, responsável pela recepção das
  mensagens LoRa originadas dos nós secundários, pela consolidação das
  informações e pela transmissão consolidada ao servidor por meio do
  protocolo HTTP em rede sem fio.
- Desenvolver uma Interface de Programação de Aplicações (API) em FastAPI
  para recepção, persistência e disponibilização dos dados.
- Implementar uma interface web em React para apresentação dos dados,
  cadastro de recipientes e visualização agregada da dispensa.
- Implementar uma interface móvel em React Native para consulta do estado
  da dispensa em dispositivos portáteis.
- Definir e aplicar critérios de alerta baseados em limiares percentuais de
  preenchimento, indicando produtos próximos ao esgotamento.
- Validar o funcionamento do dispositivo por meio de testes em recipientes
  reais contendo diferentes tipos de produtos secos.

---

## 5. Justificativa

A verificação visual do conteúdo de recipientes de dispensa é frequentemente
imprecisa, sobretudo no caso de recipientes opacos, e exige a manipulação
física do item para a confirmação do volume restante. Tal procedimento
dificulta o planejamento das compras e a manutenção de um estoque doméstico
adequado.

A adoção de uma tampa instrumentada, de baixo custo e fundamentada em
componentes acessíveis, permite automatizar a estimativa do preenchimento e
centralizar essas informações em uma aplicação consultável a qualquer
momento. Tal abordagem contribui para a redução do desperdício, para o
planejamento mais eficiente das compras e para a melhoria da organização
doméstica.

---

## 6. Fundamentação Teórica

### 6.1 Sensoriamento ultrassônico

O sensor HC-SR04 opera pela emissão de pulsos ultrassônicos a 40 kHz e pela
medição do tempo decorrido até a recepção do eco. A distância é determinada
pela equação:

$$
d = \frac{v_s \cdot t}{2}
$$

onde $v_s \approx 343\ \text{m/s}$ é a velocidade do som no ar e $t$ é o
intervalo entre a emissão e a recepção do pulso. O fator de divisão por dois
deve-se ao percurso de ida e volta da onda.

### 6.2 Cálculo do percentual de preenchimento

Considerando a tampa como referência, e sendo $H$ a altura interna do
recipiente e $d$ a distância medida pelo sensor entre a face interna da
tampa e a superfície do conteúdo, o percentual de preenchimento é dado por:

$$
P = \frac{H - d}{H} \cdot 100\%
$$

com $P$ restrito ao intervalo $[0, 100]$.

### 6.3 Comunicação LoRa

LoRa (*Long Range*) é uma tecnologia de modulação por espalhamento espectral
do tipo *chirp* (CSS), concebida para comunicação sem fio de baixa potência e
longo alcance, em faixas de frequência sub-GHz não licenciadas (915 MHz no
Brasil). Suas características — elevada sensibilidade de recepção, baixa
taxa de transmissão e baixo consumo energético — adequam-se a aplicações de
Internet das Coisas em que os dispositivos transmitem, em intervalos
regulares, pequenas quantidades de dados.

No contexto deste projeto, a adoção do LoRa permite que múltiplas tampas
distribuídas pela residência se comuniquem com um nó principal sem
necessidade de associação individual à rede Wi-Fi doméstica, reduzindo a
ocupação dessa rede e simplificando a configuração dos nós secundários.

### 6.4 Arquitetura cliente-servidor

A comunicação entre o nó principal e o servidor utiliza o protocolo HTTP. A
disseminação dos dados aos clientes web é realizada por meio de
*Server-Sent Events* (SSE), garantindo atualização assíncrona e de baixa
latência.

---

## 7. Arquitetura do Sistema

O sistema é composto por quatro camadas:

1. **Camada de aquisição (nós secundários)** — Tampas instrumentadas, cada
   uma contendo um microcontrolador ESP32, um sensor ultrassônico HC-SR04
   voltado para o interior do recipiente, um módulo transceptor LoRa e,
   opcionalmente, um display OLED SSD1306 para indicação local. Cada nó
   secundário possui um identificador único e transmite, em intervalos
   regulares, sua leitura ao nó principal.
2. **Camada de consolidação (nó principal)** — Microcontrolador ESP32 dotado
   de módulo transceptor LoRa e de conectividade Wi-Fi. Recebe as mensagens
   provenientes dos nós secundários, consolida as informações e as encaminha
   ao servidor central via HTTP.
3. **Camada de serviço** — Servidor desenvolvido em FastAPI, responsável pela
   recepção dos dados, persistência local, exposição da API REST e
   distribuição em tempo real via SSE.
4. **Camada de apresentação** — Aplicação web em React e aplicação móvel em
   React Native, ambas consumindo a mesma API.

### 7.1 Diagrama lógico

```
┌──────────────┐
│ Tampa #1     │ ─┐
│ ESP32+HC-SR04│  │
│  + LoRa      │  │
└──────────────┘  │
                  │  LoRa
┌──────────────┐  │   ┌──────────────┐   HTTP    ┌──────────────┐
│ Tampa #2     │ ─┼──▶│ Nó Principal │ ────────▶ │   FastAPI    │
│ ESP32+HC-SR04│  │   │ ESP32 + LoRa │           │  (Servidor)  │
│  + LoRa      │  │   │  + Wi-Fi     │           └──────┬───────┘
└──────────────┘  │   └──────────────┘                  │ SSE / REST
                  │                        ┌────────────┼────────────┐
┌──────────────┐  │                        ▼                         ▼
│ Tampa #N     │ ─┘                 ┌────────────┐            ┌──────────────┐
│ ESP32+HC-SR04│                    │  Web React │            │ React Native │
│  + LoRa      │                    └────────────┘            └──────────────┘
└──────────────┘
```

### 7.2 Protocolo de comunicação entre os nós

Cada nó secundário transmite periodicamente, via LoRa, um quadro contendo o
seu identificador único, o valor da distância medida e, quando aplicável, o
percentual de preenchimento calculado localmente. O nó principal mantém uma
tabela com as últimas leituras recebidas e encaminha cada nova mensagem ao
servidor por meio de uma requisição HTTP POST, incluindo o identificador do
recipiente (`cid`) correspondente ao nó secundário emissor.

---

## 8. Materiais e Métodos

### 8.1 Materiais

| Componente                             | Especificação                                                                   | Localização                     |
| -------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| Microcontrolador                       | ESP32 DevKit (Wi-Fi 802.11 b/g/n)                                                 | Nós secundários e nó principal |
| Módulo LoRa                           | Transceptor SX1276/SX1278 (915 MHz) ou placa integrada (ex.: Heltec WiFi LoRa 32) | Nós secundários e nó principal |
| Sensor de distância                   | HC-SR04 (2 cm – 400 cm)                                                          | Nós secundários                 |
| Display                                | OLED SSD1306 128×64 px (I²C)                                                    | Nós secundários (opcional)      |
|                                        |                                                                                   | Nós secundários                 |
| Protoboard, jumpers, cabo USB de dados | —                                                                                | —                                |

### 8.2 Tecnologias de software

| Camada                                   | Tecnologia                                                 |
| ---------------------------------------- | ---------------------------------------------------------- |
| Firmware (nós secundários e principal) | C++ / Arduino Core para ESP32, PlatformIO, biblioteca LoRa |
| Servidor                                 | Python 3.10+, FastAPI, Uvicorn                             |
| Interface web                            | React                                                      |
| Interface móvel                         | React Native                                               |
| Persistência                            | Banco de dados Mongodb                                     |

### 8.3 Esquema de ligações

| Componente   | Pino do componente | Pino do ESP32 |
| ------------ | ------------------ | ------------- |
| HC-SR04      | VCC                | VIN (5 V)     |
| HC-SR04      | GND                | GND           |
| HC-SR04      | TRIG               | GPIO 5        |
| HC-SR04      | ECHO ¹            | GPIO 18       |
| OLED SSD1306 | VCC                | 3,3 V         |
| OLED SSD1306 | GND                | GND           |
| OLED SSD1306 | SDA                | GPIO 21       |
| OLED SSD1306 | SCL                | GPIO 22       |

¹ O pino ECHO opera em 5 V; sua conexão ao ESP32 (3,3 V) requer um divisor de
tensão composto por resistor de 1 kΩ em série e 2 kΩ entre o pino GPIO 18 e o
GND.

### 8.4 Procedimentos

1. Montagem do circuito em protoboard, conforme o esquema apresentado.
2. Acoplamento do conjunto eletrônico à tampa do recipiente, de modo que o
   sensor permaneça voltado para o interior.
3. Configuração do ambiente PlatformIO e gravação do firmware no ESP32.
4. Instalação das dependências do servidor (`fastapi`, `uvicorn`).
5. Execução do servidor em rede local acessível ao dispositivo.
6. Cadastro do recipiente na interface, informando o nome do produto e a
   altura interna do recipiente.
7. Verificação da atualização contínua dos dados nas interfaces web e móvel.

---

## 9. Funcionalidades

- Medição automática e contínua da distância entre a tampa e o conteúdo do
  recipiente.
- Cálculo do percentual de preenchimento com base na altura interna
  cadastrada.
- Classificação do estado em três níveis: vazio, médio e cheio.
- Cadastro de múltiplos recipientes, identificados pelo nome do produto
  armazenado.
- Visualização agregada da dispensa em um único painel.
- Emissão de alertas para itens em nível crítico de preenchimento.
- Histórico de leituras e atualização em tempo real via SSE.
- Suporte a múltiplos dispositivos simultâneos, por meio de identificador de
  recipiente (`cid`).
- Comunicação interna por meio de rede LoRa, com consolidação das leituras
  em um nó principal único, responsável pelo acesso à Internet.

---

## 10. Resultados Esperados

Espera-se que a tampa instrumentada apresente:

- Resposta em tempo inferior a um segundo entre a medição e a atualização nas
  interfaces de visualização.
- Erro de medição compatível com a precisão nominal do sensor HC-SR04, dentro
  das faixas típicas de recipientes domésticos.
- Operação contínua estável em rede sem fio doméstica.
- Compatibilidade simultânea com múltiplos recipientes da dispensa.
- Estimativas coerentes do percentual de preenchimento para produtos secos de
  diferentes granulometrias, tais como temperos, grãos e farinhas.
