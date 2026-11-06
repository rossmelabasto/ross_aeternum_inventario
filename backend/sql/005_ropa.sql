-- Aeternum no vende solo tenis: también ropa. Siguen siendo 3 tablas, con 3 cambios:
--   1. categorias.tipo  → qué clase de producto es (y qué modelo 3D se dibuja)
--   2. productos.talla  → texto, porque la ropa usa S/M/L y los pantalones 30/32/34
--   3. productos.color  → color principal en hexadecimal

alter table public.categorias
  add column tipo text not null default 'calzado'
  check (tipo in ('calzado', 'polera', 'hoodie', 'chamarra', 'pantalon', 'gorra'));

alter table public.productos drop constraint productos_talla_check;
alter table public.productos
  alter column talla type text
  using (case when talla = trunc(talla) then trunc(talla)::int::text else talla::text end);
alter table public.productos
  add constraint productos_talla_check check (char_length(talla) between 1 and 8);

alter table public.productos
  add column color text check (color ~ '^#[0-9a-fA-F]{6}$');

-- Categorías nuevas
insert into public.categorias (nombre, descripcion, tipo) values
  ('Poleras',    'Poleras de algodón, básicas y estampadas', 'polera'),
  ('Hoodies',    'Hoodies y polerones con capucha',           'hoodie'),
  ('Chamarras',  'Chamarras de jean, rompevientos y abrigos', 'chamarra'),
  ('Pantalones', 'Jeans, cargos y joggers',                   'pantalon'),
  ('Gorras',     'Gorras y viseras',                          'gorra');

-- Más calzado y ropa (datos ficticios)
insert into public.productos (categoria_id, nombre, marca, talla, condicion, precio, stock, color) values
  ((select id from public.categorias where nombre = 'Urbanas'),    'Air Max 90',             'Nike',           '42',   'Usado - como nuevo',  460, 1, null),
  ((select id from public.categorias where nombre = 'Urbanas'),    'Forum Low',              'Adidas',         '41',   'Usado - buen estado', 390, 2, null),
  ((select id from public.categorias where nombre = 'Urbanas'),    'Club C 85',              'Reebok',         '40',   'Usado - buen estado', 300, 1, '#f2efe6'),
  ((select id from public.categorias where nombre = 'Urbanas'),    '550',                    'New Balance',    '43',   'Usado - como nuevo',  540, 1, '#f2f2ee'),
  ((select id from public.categorias where nombre = 'Deportivas'), 'Gel-Nimbus 25',          'Asics',          '42',   'Usado - como nuevo',  470, 1, null),
  ((select id from public.categorias where nombre = 'Deportivas'), 'Fresh Foam 1080',        'New Balance',    '41',   'Usado - buen estado', 430, 2, '#8a8f98'),
  ((select id from public.categorias where nombre = 'Deportivas'), 'Velocity Nitro 3',       'Puma',           '40',   'Usado - buen estado', 350, 1, '#ff6a3d'),
  ((select id from public.categorias where nombre = 'Botas'),      'Chelsea 2976',           'Dr. Martens',    '40',   'Usado - buen estado', 520, 1, '#1a1a1c'),
  ((select id from public.categorias where nombre = 'Botas'),      'Premium Hiker',          'Timberland',     '43',   'Usado - como nuevo',  610, 1, null),
  ((select id from public.categorias where nombre = 'Botas'),      'Colorado',               'Caterpillar',    '42',   'Usado - buen estado', 480, 2, '#6b4a2b'),

  ((select id from public.categorias where nombre = 'Poleras'),    'Polera Box Logo',        'Stüssy',         'M',    'Usado - como nuevo',  180, 1, '#f2f2ee'),
  ((select id from public.categorias where nombre = 'Poleras'),    'Polera Pocket',          'Carhartt',       'L',    'Usado - buen estado', 140, 2, '#c98a3c'),
  ((select id from public.categorias where nombre = 'Poleras'),    'Polera Script',          'Champion',       'S',    'Usado - buen estado', 110, 3, '#2f5fd0'),
  ((select id from public.categorias where nombre = 'Poleras'),    'Polera Trefoil',         'Adidas',         'M',    'Nuevo',               160, 2, '#141416'),
  ((select id from public.categorias where nombre = 'Poleras'),    'Polera Housemark',       'Levi''s',        'XL',   'Usado - buen estado', 120, 1, '#c8102e'),
  ((select id from public.categorias where nombre = 'Poleras'),    'Polera Sportswear',      'Nike',           'L',    'Usado - como nuevo',  150, 2, '#afff00'),

  ((select id from public.categorias where nombre = 'Hoodies'),    'Hoodie Club Fleece',     'Nike',           'M',    'Usado - como nuevo',  320, 1, '#141416'),
  ((select id from public.categorias where nombre = 'Hoodies'),    'Hoodie Reverse Weave',   'Champion',       'L',    'Usado - buen estado', 280, 2, '#9a9aa0'),
  ((select id from public.categorias where nombre = 'Hoodies'),    'Hoodie Trefoil',         'Adidas',         'M',    'Usado - buen estado', 260, 1, '#1f6b46'),
  ((select id from public.categorias where nombre = 'Hoodies'),    'Hoodie Chase',           'Carhartt',       'XL',   'Usado - como nuevo',  300, 1, '#6b4a2b'),
  ((select id from public.categorias where nombre = 'Hoodies'),    'Hoodie Essentials',      'Fear of God',    'L',    'Usado - como nuevo',  380, 1, '#d9cdb8'),

  ((select id from public.categorias where nombre = 'Chamarras'),  'Chamarra Trucker',       'Levi''s',        'M',    'Usado - buen estado', 420, 1, '#3d5a8a'),
  ((select id from public.categorias where nombre = 'Chamarras'),  'Chamarra Nuptse 1996',   'The North Face', 'L',    'Usado - como nuevo',  650, 1, '#141416'),
  ((select id from public.categorias where nombre = 'Chamarras'),  'Rompevientos Windrunner','Nike',           'M',    'Usado - buen estado', 330, 2, '#2f5fd0'),
  ((select id from public.categorias where nombre = 'Chamarras'),  'Chamarra Firebird',      'Adidas',         'S',    'Usado - buen estado', 290, 1, '#c8102e'),
  ((select id from public.categorias where nombre = 'Chamarras'),  'Chamarra Detroit',       'Carhartt',       'L',    'Usado - como nuevo',  560, 1, '#c98a3c'),

  ((select id from public.categorias where nombre = 'Pantalones'), 'Jean 501 Original',      'Levi''s',        '32',   'Usado - buen estado', 260, 2, '#3d5a8a'),
  ((select id from public.categorias where nombre = 'Pantalones'), 'Double Knee',            'Carhartt',       '34',   'Usado - como nuevo',  320, 1, '#c98a3c'),
  ((select id from public.categorias where nombre = 'Pantalones'), 'Jogger Tech Fleece',     'Nike',           'M',    'Usado - como nuevo',  280, 1, '#4a4a50'),
  ((select id from public.categorias where nombre = 'Pantalones'), 'Pantalón Firebird',      'Adidas',         'L',    'Usado - buen estado', 210, 2, '#141416'),
  ((select id from public.categorias where nombre = 'Pantalones'), 'Pantalón 874',           'Dickies',        '32',   'Usado - buen estado', 190, 1, '#d9cdb8'),

  ((select id from public.categorias where nombre = 'Gorras'),     'Gorra 59Fifty Yankees',  'New Era',        '7 1/4','Nuevo',               160, 2, '#141416'),
  ((select id from public.categorias where nombre = 'Gorras'),     'Gorra Heritage86',       'Nike',           'Única','Usado - como nuevo',  110, 3, '#f2f2ee'),
  ((select id from public.categorias where nombre = 'Gorras'),     'Gorra Trefoil',          'Adidas',         'Única','Usado - buen estado',  90, 2, '#1f6b46'),
  ((select id from public.categorias where nombre = 'Gorras'),     'Gorra Norm Hat',         'The North Face', 'Única','Usado - buen estado', 120, 1, '#d9cdb8'),
  ((select id from public.categorias where nombre = 'Gorras'),     'Gorra 9Forty Lakers',    'New Era',        'Única','Usado - como nuevo',  140, 1, '#5b3dff'),
  ((select id from public.categorias where nombre = 'Gorras'),     'Gorra Canvas',           'Carhartt',       'Única','Nuevo',               130, 2, '#c8102e');

insert into public.ventas (producto_id, cantidad, precio_unitario, canal) values
  ((select id from public.productos where nombre = 'Hoodie Club Fleece'),  1, 320, 'Instagram'),
  ((select id from public.productos where nombre = 'Polera Script'),       1, 110, 'Marketplace'),
  ((select id from public.productos where nombre = 'Gorra Heritage86'),    1, 110, 'Tienda');
