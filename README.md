# Calyx

API para cadastro de recipientes e estimativa do peso do conteudo a partir de um
sensor IoT que mede a distancia da tampa ate a superficie do conteudo.

## Stack

- **Postgres 16** — banco `calyx` (schema em `db/init/`)
- **FastAPI** + SQLAlchemy + JWT (codigo em `api/`)
- Tudo orquestrado via **docker compose**

## Subir o projeto

```bash
cp .env.example .env      # ajuste portas/segredo se quiser
docker compose up -d --build
```

- API: http://localhost:8080  (Swagger em **/docs**)
- Postgres: `localhost:5433`

> As portas padrao (5432 e 8000) ja estavam ocupadas neste ambiente, por isso o
> `.env` usa **5433** (db) e **8080** (api). Mude no `.env` se precisar.

> ⚠️ Os scripts em `db/init/` so rodam quando o volume esta vazio. Se alterar o
> schema, recrie com `docker compose down -v && docker compose up -d`.

## Autenticacao (JWT)

Usuario de exemplo do seed: `felipesodre01e@gmail.com` / senha `senha123`.

```bash
# login (form-urlencoded; o campo "username" e o email)
curl -X POST http://localhost:8080/auth/login \
  -d "username=felipesodre01e@gmail.com&password=senha123"
# -> {"access_token":"...","token_type":"bearer"}
```

Use o token nas demais rotas: `Authorization: Bearer <token>`.

## Endpoints

Documentacao completa (entradas, respostas e exemplos) em **[API.md](API.md)**.
Swagger interativo em `http://localhost:8080/docs`.

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/auth/register` | cria usuario |
| POST | `/auth/login` | retorna o JWT |
| GET  | `/auth/me` | dados do usuario logado |
| GET/POST | `/categories` | categorias de conteudo |
| GET/POST | `/products` | produtos (com `density` em g/cm3 e `icon`) |
| GET/POST | `/recipients` | recipientes do usuario (com estado atual) |
| GET/PATCH/DELETE | `/recipients/{id}` | detalhe/edicao/remocao |
| POST | `/recipients/{id}/measurements` | grava leitura e **retorna o calculo** |
| GET  | `/recipients/{id}/measurements` | historico de leituras |
| GET  | `/recipients/{id}/fill` | calculo a partir da ultima leitura |
| POST | `/ingest` | **ingestao do sensor IoT** (auth por `X-Device-Token`) |

## Como o calculo funciona

O sensor envia `distance_from_lid` (cm da tampa ate o conteudo). A partir do
`format` e das `dimensions` do recipiente, a API calcula o volume preenchido e,
multiplicando pela `density` do produto vinculado, estima o peso:

```
altura_preenchida = altura_total - distance_from_lid
peso (g) = volume_preenchido (cm3) * densidade (g/cm3)
```

Formatos e chaves de `dimensions` (ver `jsons.json`):

| format | dimensions | volume |
|--------|-----------|--------|
| cilindric | `radius`, `height` | cilindro |
| square | `side`, `height` | prisma quadrado |
| rectangular | `width`, `length`, `height` | prisma retangular |
| conical | `base_radius`, `height` | cone (base larga embaixo) |
| spherical | `radius` | esfera (vazio = calota esferica no topo) |

Se o recipiente nao tiver produto vinculado, `mass_g` vem `null` (so o volume e %).
