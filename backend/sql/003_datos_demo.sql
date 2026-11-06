-- Datos de demostración (ficticios)
insert into public.categorias (nombre, descripcion) values
  ('Urbanas',    'Tenis de uso diario y estilo casual'),
  ('Deportivas', 'Running, básquet y entrenamiento'),
  ('Botas',      'Caña alta y modelos de invierno');

insert into public.productos (categoria_id, nombre, marca, talla, condicion, precio, stock) values
  ((select id from public.categorias where nombre = 'Urbanas'),    'Air Force 1 Low',   'Nike',        41,   'Usado - como nuevo',  420, 2),
  ((select id from public.categorias where nombre = 'Urbanas'),    'Samba OG',          'Adidas',      40,   'Usado - buen estado', 380, 1),
  ((select id from public.categorias where nombre = 'Urbanas'),    'Old Skool',         'Vans',        39,   'Usado - buen estado', 250, 3),
  ((select id from public.categorias where nombre = 'Urbanas'),    'Chuck 70 Hi',       'Converse',    42,   'Nuevo',               450, 1),
  ((select id from public.categorias where nombre = 'Deportivas'), 'Pegasus 40',        'Nike',        42,   'Usado - como nuevo',  480, 1),
  ((select id from public.categorias where nombre = 'Deportivas'), 'Ultraboost Light',  'Adidas',      41.5, 'Usado - buen estado', 520, 2),
  ((select id from public.categorias where nombre = 'Deportivas'), 'Jordan 1 Mid',      'Jordan',      43,   'Usado - como nuevo',  650, 1),
  ((select id from public.categorias where nombre = 'Deportivas'), 'Gel-Kayano 30',     'Asics',       40,   'Usado - buen estado', 410, 2),
  ((select id from public.categorias where nombre = 'Botas'),      '6-Inch Premium',    'Timberland',  42,   'Usado - buen estado', 590, 1),
  ((select id from public.categorias where nombre = 'Botas'),      '1460 Smooth',       'Dr. Martens', 41,   'Usado - como nuevo',  560, 1);

insert into public.ventas (producto_id, cantidad, precio_unitario, canal) values
  ((select id from public.productos where nombre = 'Old Skool'),        1, 250, 'Marketplace'),
  ((select id from public.productos where nombre = 'Air Force 1 Low'),  1, 420, 'WhatsApp'),
  ((select id from public.productos where nombre = 'Ultraboost Light'), 1, 500, 'Tienda');
