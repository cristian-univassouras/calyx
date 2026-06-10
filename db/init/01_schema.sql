-- =========================================================
-- Calyx - schema do banco de dados
-- Executado automaticamente pelo Postgres na primeira subida
-- (arquivos em /docker-entrypoint-initdb.d rodam em ordem alfabetica)
-- =========================================================

-- Extensao usada para gerar o hash da senha do usuario de exemplo (seed)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum de formatos suportados de recipiente
-- cilindric   -> requer: radius, height
-- square      -> requer: side, height
-- rectangular -> requer: width, length, height
-- conical     -> requer: base_radius, height
-- spherical   -> requer: radius
-- custom -> requer: profile = [{"h": altura_cm, "v": volume_acumulado_cm3}, ...]
--           (curva de calibracao medida; serve p/ garrafas, potes, etc.)
CREATE TYPE format AS ENUM (
    'cilindric',
    'square',
    'conical',
    'spherical',
    'rectangular',
    'custom'
);

-- ---------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------
CREATE TABLE users (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL  -- bcrypt
);

-- ---------------------------------------------------------
-- Categorias de conteudo (define o metodo de conversao)
-- ---------------------------------------------------------
CREATE TABLE categories (
    id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name   VARCHAR(120) NOT NULL,
    method TEXT  -- ex: "volume_to_mass"
);

-- ---------------------------------------------------------
-- Produtos (o material que preenche o recipiente)
-- density: gramas por cm3 (g/cm3) -> usada p/ converter volume em peso
-- ---------------------------------------------------------
CREATE TABLE products (
    id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name             VARCHAR(120)     NOT NULL,
    density          DOUBLE PRECISION NOT NULL CHECK (density > 0),
    icon             VARCHAR(16),  -- emoji ilustrativo (ex: arroz -> rice bowl)
    content_category INTEGER          REFERENCES categories (id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- Armarios: agrupam recipientes (ex: "Despensa", "Geladeira")
-- ---------------------------------------------------------
CREATE TABLE cabinets (
    id      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name    VARCHAR(120) NOT NULL,
    icon    VARCHAR(16)  -- emoji ilustrativo do armario
);

-- ---------------------------------------------------------
-- Recipientes cadastrados pelo usuario
-- dimensions: medidas do formato em JSON (ver jsons.json)
-- ---------------------------------------------------------
-- product_id: o material que esta dentro (fornece a density p/ o calculo de peso).
-- Opcional: o recipiente pode existir sem produto definido ainda.
CREATE TABLE recipients (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    INTEGER      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id INTEGER      REFERENCES products (id) ON DELETE SET NULL,
    cabinet_id INTEGER      REFERENCES cabinets (id) ON DELETE SET NULL,
    name       VARCHAR(120) NOT NULL,
    format     format       NOT NULL,
    dimensions JSONB        NOT NULL,
    -- token usado pelo sensor IoT para enviar leituras (sem login de usuario)
    device_token VARCHAR(64) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')
);

-- ---------------------------------------------------------
-- Leituras do sensor IoT
-- distance_from_lid: distancia da tampa ate o conteudo (cm)
-- ---------------------------------------------------------
CREATE TABLE measurements (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_id      INTEGER          NOT NULL REFERENCES recipients (id) ON DELETE CASCADE,
    distance_from_lid DOUBLE PRECISION NOT NULL CHECK (distance_from_lid >= 0),
    "timestamp"       TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- Indices para consultas comuns
CREATE INDEX idx_recipients_user        ON recipients (user_id);
CREATE INDEX idx_recipients_product     ON recipients (product_id);
CREATE INDEX idx_recipients_cabinet     ON recipients (cabinet_id);
CREATE INDEX idx_cabinets_user          ON cabinets (user_id);
CREATE INDEX idx_products_category      ON products (content_category);
CREATE INDEX idx_measurements_recipient ON measurements (recipient_id);
CREATE INDEX idx_measurements_time      ON measurements (recipient_id, "timestamp" DESC);

-- =========================================================
-- Validacao: garante que o JSON dimensions tem as chaves
-- exigidas pelo formato escolhido, com valores numericos > 0
-- =========================================================
CREATE OR REPLACE FUNCTION validate_recipient_dimensions()
RETURNS TRIGGER AS $$
DECLARE
    required_keys TEXT[];
    k             TEXT;
    v             JSONB;
BEGIN
    -- Formato personalizado: valida a curva de calibracao (profile)
    IF NEW.format = 'custom' THEN
        IF jsonb_typeof(NEW.dimensions -> 'profile') <> 'array' THEN
            RAISE EXCEPTION 'dimensions do formato custom deve conter "profile" (array)';
        END IF;
        IF jsonb_array_length(NEW.dimensions -> 'profile') < 2 THEN
            RAISE EXCEPTION 'profile deve ter ao menos 2 pontos (h, v)';
        END IF;
        RETURN NEW;
    END IF;

    required_keys := CASE NEW.format
        WHEN 'cilindric'   THEN ARRAY['radius', 'height']
        WHEN 'square'      THEN ARRAY['side', 'height']
        WHEN 'rectangular' THEN ARRAY['width', 'length', 'height']
        WHEN 'conical'     THEN ARRAY['base_radius', 'height']
        WHEN 'spherical'   THEN ARRAY['radius']
    END;

    FOREACH k IN ARRAY required_keys LOOP
        IF NOT (NEW.dimensions ? k) THEN
            RAISE EXCEPTION 'dimensions do formato % deve conter a chave "%"', NEW.format, k;
        END IF;

        v := NEW.dimensions -> k;
        IF jsonb_typeof(v) <> 'number' OR (v)::text::numeric <= 0 THEN
            RAISE EXCEPTION 'dimensions."%" deve ser um numero maior que zero', k;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_recipient_dimensions
    BEFORE INSERT OR UPDATE ON recipients
    FOR EACH ROW
    EXECUTE FUNCTION validate_recipient_dimensions();
