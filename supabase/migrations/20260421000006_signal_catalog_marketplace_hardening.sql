-- Hardening: add marketplace / P2P / prompt-injection signals so that advance
-- payment scams ("pagame primero por mi seguridad y después bajo") can no
-- longer fall through as Riesgo Bajo. Mirrors src/server/signals/catalog.ts.
insert into signal_catalog (code, group_name, description, user_label, default_weight, severity, is_active)
values
  ('advance_payment_request', 'payment', 'Pide que el comprador pague ANTES de recibir o ver el producto.', 'Pago por adelantado sin recibir el producto', 55, 'critical', true),
  ('payment_before_delivery', 'payment', 'La secuencia exige pagar primero y recién después entregar o mostrar el bien.', 'Pago antes de la entrega', 50, 'critical', true),
  ('refuses_in_person_exchange', 'payment', 'El vendedor se niega a mostrar o entregar el producto en el punto de encuentro antes de cobrar.', 'Se niega al intercambio en persona', 40, 'high', true),
  ('seller_safety_excuse', 'interaction', 'El vendedor usa ''por mi/tu seguridad'' como excusa para alterar la operación habitual (pagar primero, no bajar, etc.).', 'Excusa de seguridad del vendedor', 18, 'high', true),
  ('in_person_meeting_bait', 'interaction', 'Citan en un punto físico (edificio, domicilio) pero piden completar el pago antes del contacto cara a cara.', 'Encuentro físico condicionado a pago previo', 16, 'high', true),
  ('marketplace_p2p_context', 'platform', 'La operación es una compraventa P2P entre desconocidos iniciada en un marketplace.', 'Compra P2P en marketplace', 4, 'low', true),
  ('prompt_injection_attempt', 'interaction', 'El texto intenta manipular al modelo o al sistema para que ignore sus reglas o clasifique de forma sesgada.', 'Intento de manipulación del sistema', 25, 'critical', true)
on conflict (code) do update
set
  group_name = excluded.group_name,
  description = excluded.description,
  user_label = excluded.user_label,
  default_weight = excluded.default_weight,
  severity = excluded.severity,
  is_active = excluded.is_active;
