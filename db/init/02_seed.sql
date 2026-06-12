-- =========================================================
-- Calyx - dados de exemplo (seed)
-- Util para testar a API e a validacao de dimensions
-- =========================================================

-- senha do usuario de exemplo: "senha123" (hash bcrypt gerado pelo pgcrypto)
INSERT INTO users (name, email, password_hash) VALUES
    ('Felipe Sodre', 'felipesodre01e@gmail.com', crypt('senha123', gen_salt('bf')));

INSERT INTO categories (name, method) VALUES
    ('Graos e cereais',       'volume_to_mass'),
    ('Farinhas e pos',        'volume_to_mass'),
    ('Acucares e adocantes',  'volume_to_mass'),
    ('Liquidos',              'volume_to_mass'),
    ('Oleos e gorduras',      'volume_to_mass'),
    ('Condimentos',           'volume_to_mass'),
    ('Outros',                'volume_to_mass');

-- density em g/cm3 (valores aproximados de densidade aparente / a granel).
-- icon = emoji ilustrativo. content_category resolvido por nome (robusto a ids).
INSERT INTO products (name, density, icon, content_category) VALUES
    -- Graos e cereais
    ('Arroz',            0.85, '🍚', (SELECT id FROM categories WHERE name='Graos e cereais')),
    ('Feijao',           0.80, '🫘', (SELECT id FROM categories WHERE name='Graos e cereais')),
    ('Lentilha',         0.85, '🫛', (SELECT id FROM categories WHERE name='Graos e cereais')),
    ('Grao-de-bico',     0.80, '🟤', (SELECT id FROM categories WHERE name='Graos e cereais')),
    ('Milho de pipoca',  0.78, '🌽', (SELECT id FROM categories WHERE name='Graos e cereais')),
    ('Aveia em flocos',  0.41, '🥣', (SELECT id FROM categories WHERE name='Graos e cereais')),
    ('Granola',          0.40, '🥗', (SELECT id FROM categories WHERE name='Graos e cereais')),
    ('Macarrao seco',    0.35, '🍝', (SELECT id FROM categories WHERE name='Graos e cereais')),
    ('Cafe em graos',    0.40, '☕', (SELECT id FROM categories WHERE name='Graos e cereais')),
    -- Farinhas e pos
    ('Farinha de trigo', 0.55, '🌾', (SELECT id FROM categories WHERE name='Farinhas e pos')),
    ('Farinha de mandioca', 0.65, '🥔', (SELECT id FROM categories WHERE name='Farinhas e pos')),
    ('Fuba',             0.65, '🌽', (SELECT id FROM categories WHERE name='Farinhas e pos')),
    ('Cacau em po',      0.50, '🍫', (SELECT id FROM categories WHERE name='Farinhas e pos')),
    ('Leite em po',      0.50, '🥛', (SELECT id FROM categories WHERE name='Farinhas e pos')),
    ('Cafe em po',       0.45, '☕', (SELECT id FROM categories WHERE name='Farinhas e pos')),
    -- Acucares e adocantes
    ('Acucar refinado',  0.85, '🍬', (SELECT id FROM categories WHERE name='Acucares e adocantes')),
    ('Acucar mascavo',   0.80, '🟫', (SELECT id FROM categories WHERE name='Acucares e adocantes')),
    ('Mel',              1.42, '🍯', (SELECT id FROM categories WHERE name='Acucares e adocantes')),
    -- Liquidos
    ('Agua',             1.00, '💧', (SELECT id FROM categories WHERE name='Liquidos')),
    ('Leite',            1.03, '🥛', (SELECT id FROM categories WHERE name='Liquidos')),
    ('Suco de laranja',  1.05, '🧃', (SELECT id FROM categories WHERE name='Liquidos')),
    ('Vinagre',          1.01, '🧪', (SELECT id FROM categories WHERE name='Liquidos')),
    ('Alcool',           0.79, '🍶', (SELECT id FROM categories WHERE name='Liquidos')),
    ('Detergente',       1.03, '🧴', (SELECT id FROM categories WHERE name='Liquidos')),
    -- Oleos e gorduras
    ('Oleo de soja',     0.92, '🛢️', (SELECT id FROM categories WHERE name='Oleos e gorduras')),
    ('Azeite',           0.91, '🫒', (SELECT id FROM categories WHERE name='Oleos e gorduras')),
    -- Condimentos
    ('Sal',              1.20, '🧂', (SELECT id FROM categories WHERE name='Condimentos')),
    -- Outros
    ('Racao pet',        0.45, '🐾', (SELECT id FROM categories WHERE name='Outros'));

-- Armarios do usuario
INSERT INTO cabinets (user_id, name, icon) VALUES
    (1, 'Despensa',  '🥫'),
    (1, 'Geladeira', '🧊'),
    (1, 'Armario da cozinha', '🍽️');

-- Recipientes (um de cada formato, usando as chaves do jsons.json).
-- product_id e cabinet_id resolvidos por nome para nao depender da ordem.
INSERT INTO recipients (user_id, cabinet_id, product_id, name, format, dimensions) VALUES
    (1, (SELECT id FROM cabinets WHERE name='Despensa'),  (SELECT id FROM products WHERE name='Arroz'),           'Pote cilindrico', 'cilindric',   '{"radius": 5.0, "height": 20.0}'),
    (1, (SELECT id FROM cabinets WHERE name='Despensa'),  (SELECT id FROM products WHERE name='Acucar refinado'), 'Caixa quadrada',  'square',      '{"side": 10.0, "height": 20.0}'),
    (1, (SELECT id FROM cabinets WHERE name='Despensa'),  (SELECT id FROM products WHERE name='Feijao'),          'Caixa retangular','rectangular', '{"width": 8.0, "length": 12.0, "height": 20.0}'),
    (1, (SELECT id FROM cabinets WHERE name='Armario da cozinha'), (SELECT id FROM products WHERE name='Sal'),    'Funil conico',    'conical',     '{"base_radius": 5.0, "height": 15.0}'),
    (1, (SELECT id FROM cabinets WHERE name='Geladeira'), (SELECT id FROM products WHERE name='Agua'),            'Bola',            'spherical',   '{"radius": 7.5}'),
    -- Recipientes especificos (formato custom = curva de calibracao medida)
    (1, (SELECT id FROM cabinets WHERE name='Geladeira'), (SELECT id FROM products WHERE name='Agua'),
        'Garrafa Calyx 600ml', 'custom',
        '{"profile": [{"h":0,"v":0},{"h":2,"v":50},{"h":16,"v":520},{"h":19,"v":565},{"h":22,"v":600}]}'),
    (1, (SELECT id FROM cabinets WHERE name='Despensa'),  (SELECT id FROM products WHERE name='Arroz'),
        'Pote Calyx 1.5L', 'custom',
        '{"profile": [{"h":0,"v":0},{"h":2,"v":210},{"h":13,"v":1380},{"h":15,"v":1500}]}');

-- Leituras de exemplo do sensor (recipientes 1 e 2)
INSERT INTO measurements (recipient_id, distance_from_lid) VALUES
    (1, 4.0),
    (1, 8.0),
    (2, 5.0);
