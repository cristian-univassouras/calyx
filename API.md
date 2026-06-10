# Calyx API — Documentação

API REST do Calyx (estoque virtual de cozinha). Cadastra recipientes com formatos
variados e, a partir da distância lida por um sensor IoT, calcula **quanto % o
recipiente está cheio** e o **peso estimado** do conteúdo.

- **Base URL (local):** `http://localhost:8080`
- **Documentação interativa (Swagger):** `http://localhost:8080/docs`
- **OpenAPI JSON:** `http://localhost:8080/openapi.json`
- **Formato:** JSON em todos os endpoints (exceto o login, que usa form-urlencoded)

## Autenticação

Há **dois** mecanismos:

| Quem | Como | Onde |
|------|------|------|
| Usuário (app web) | **JWT** Bearer | Header `Authorization: Bearer <token>` |
| Sensor IoT | **Token de dispositivo** | Header `X-Device-Token: <token>` |

O usuário faz login e recebe um JWT. O sensor não faz login — usa o `device_token`
do recipiente (visível na tela de detalhe / na resposta de `GET /recipients`).

---

## 1. Autenticação de usuário

### POST `/auth/register`
Cria um usuário. **Público.**

Entrada (JSON):
```json
{ "name": "Felipe", "email": "felipe@exemplo.com", "password": "senha123" }
```
- `name` (string, obrigatório)
- `email` (string, obrigatório, único)
- `password` (string, obrigatório, mín. 6 caracteres)

Resposta `201`: `{ "id": 1, "name": "Felipe", "email": "felipe@exemplo.com" }`
Erros: `409` e-mail já cadastrado.

### POST `/auth/login`
Autentica e devolve o JWT. **Público.** Usa `application/x-www-form-urlencoded`
(padrão OAuth2). O campo **`username` é o e-mail**.

Entrada (form): `username=<email>&password=<senha>`

Resposta `200`:
```json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```
Erros: `401` e-mail/senha incorretos.

Exemplo:
```bash
curl -X POST http://localhost:8080/auth/login \
  -d "username=felipe@exemplo.com&password=senha123"
```

### GET `/auth/me`
Dados do usuário logado. **Requer JWT.**
Resposta: `{ "id", "name", "email" }`

---

## 2. Categorias  *(requer JWT)*

Agrupam produtos e definem o método de conversão.

### GET `/categories`
Lista todas. Resposta: array de `{ id, name, method }`.

### POST `/categories`
```json
{ "name": "Graos e cereais", "method": "volume_to_mass" }
```
- `name` (obrigatório), `method` (opcional). Resposta `201`.

### GET `/categories/{category_id}`
Detalha uma categoria. `404` se não existir.

---

## 3. Produtos  *(requer JWT)*

O material que enche o recipiente. A **densidade** (g/cm³) é o que converte
volume em peso.

### GET `/products`
Lista todos. Resposta: array de
`{ id, name, density, icon, content_category }`.

### POST `/products`
```json
{ "name": "Arroz", "density": 0.85, "icon": "🍚", "content_category": 1 }
```
- `name` (obrigatório)
- `density` (float, obrigatório, **> 0**, em g/cm³)
- `icon` (string opcional, emoji ilustrativo)
- `content_category` (int opcional, ref. categoria — `404` se não existir)

Resposta `201`.

### GET `/products/{product_id}`
Detalha um produto. `404` se não existir.

---

## 4. Recipientes  *(requer JWT)*

Cada usuário só enxerga/edita os seus.

### GET `/recipients`
Lista os recipientes do usuário, **já com o estado atual** (última leitura):
```json
[
  {
    "id": 1, "user_id": 1, "product_id": 1,
    "name": "Pote cilindrico", "format": "cilindric",
    "dimensions": { "radius": 5.0, "height": 20.0 },
    "device_token": "27e44c72c027...",
    "last_fill_percent": 80.0,
    "last_distance_from_lid": 4.0,
    "last_mass_g": 1068.14,
    "last_reading_at": "2026-06-01T18:00:00Z"
  }
]
```
Os campos `last_*` vêm `null` enquanto não houver leitura.

### POST `/recipients`
Cria um recipiente (e gera o `device_token` automaticamente).
```json
{
  "name": "Pote de arroz",
  "format": "cilindric",
  "dimensions": { "radius": 5.0, "height": 20.0 },
  "product_id": 1
}
```
- `name` (obrigatório)
- `format` (obrigatório): `cilindric | square | rectangular | conical | spherical | custom`
- `dimensions` (obrigatório): **chaves conforme o formato** (ver tabela abaixo)
- `product_id` (opcional, ref. produto)

Resposta `201` (mesmo shape do GET). Erros: `422` dimensões inválidas para o
formato; `404` produto inexistente.

**Chaves de `dimensions` por formato** (medidas em cm):

| format | dimensions |
|--------|-----------|
| `cilindric` | `{ "radius", "height" }` |
| `square` | `{ "side", "height" }` |
| `rectangular` | `{ "width", "length", "height" }` |
| `conical` | `{ "base_radius", "height" }` |
| `spherical` | `{ "radius" }` |
| `custom` | `{ "profile": [ {"h":0,"v":0}, {"h":5,"v":120}, ... ] }` |

> **`custom`** = curva de calibração medida (garrafas, potes irregulares):
> cada ponto é `(altura em cm, volume acumulado em cm³)`. Precisa de ≥ 2 pontos,
> alturas crescentes e volumes não-decrescentes. O último ponto define a capacidade.

### GET `/recipients/{recipient_id}`
Detalha um recipiente (mesmo shape, com `last_*`). `404` se não for seu.

### PATCH `/recipients/{recipient_id}`
Atualiza parcialmente. Todos os campos são opcionais:
```json
{ "name": "Novo nome", "product_id": 2, "format": "square",
  "dimensions": { "side": 10, "height": 20 } }
```
Se mudar `format` ou `dimensions`, são revalidados (`422` se inconsistentes).

### DELETE `/recipients/{recipient_id}`
Remove o recipiente (e suas leituras em cascata). Resposta `204`.

---

## 5. Leituras / Cálculo  *(requer JWT)*

Rotas para o app consultar/registrar leituras manualmente.

### POST `/recipients/{recipient_id}/measurements`
Registra uma leitura e devolve o cálculo.
```json
{ "distance_from_lid": 4.0 }
```
- `distance_from_lid` (float, **≥ 0**): cm da tampa até a superfície do conteúdo.

Resposta `201`:
```json
{
  "recipient_id": 1, "distance_from_lid": 4.0,
  "filled_volume_cm3": 1256.64, "total_volume_cm3": 1570.80,
  "fill_percent": 80.0, "mass_g": 1068.14, "product_id": 1
}
```
`mass_g` vem `null` se o recipiente não tiver produto vinculado.

### GET `/recipients/{recipient_id}/measurements?limit=50`
Histórico de leituras (mais recentes primeiro).
- `limit` (opcional, 1–500, padrão 50).
Resposta: array de `{ id, recipient_id, distance_from_lid, timestamp }`.

### GET `/recipients/{recipient_id}/fill`
Recalcula a partir da **última** leitura, sem gravar nada. Mesmo shape do POST.
`404` se ainda não houver leitura.

---

## 6. Ingestão do sensor IoT

### POST `/ingest`
Endpoint que o **sensor** chama a cada leitura. **Não usa JWT** — autentica pelo
header `X-Device-Token` (token do recipiente).

Headers: `X-Device-Token: <device_token>` + `Content-Type: application/json`
Entrada:
```json
{ "distance_from_lid": 4.2 }
```

Resposta `201`:
```json
{
  "recipient_id": 6,
  "recipient_name": "Garrafa Calyx 600ml",
  "fill_percent": 96.11,
  "filled_volume_cm3": 576.67,
  "total_volume_cm3": 600.0,
  "mass_g": 576.67
}
```
Erros: `401` token ausente ou inválido.

Exemplo (firmware/script do leitor):
```bash
curl -X POST http://localhost:8080/ingest \
  -H "X-Device-Token: <device_token>" \
  -H "Content-Type: application/json" \
  -d '{"distance_from_lid": 4.2}'
```

---

## 7. Saúde

### GET `/health`
Sem autenticação. Resposta: `{ "status": "ok" }`.

---

## Como o cálculo funciona

```
altura_preenchida = altura_total - distance_from_lid   (limitada a [0, altura_total])
volume_preenchido = f(formato, dimensions, altura_preenchida)
fill_percent      = volume_preenchido / volume_total * 100
mass_g            = volume_preenchido (cm³) * density (g/cm³)
```

Volumes por formato: cilindro/prisma (área × altura), cone (cone cheio − cone
vazio no topo), esfera (esfera − calota vazia no topo) e `custom` (interpolação
linear na curva de calibração). Implementação em `api/app/calc.py`.

## Códigos de status usados

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Criado |
| 204 | Sem conteúdo (delete) |
| 401 | Não autenticado / token inválido |
| 404 | Não encontrado (ou não pertence ao usuário) |
| 409 | Conflito (e-mail já existe) |
| 422 | Entrada inválida (validação de dimensões/payload) |
