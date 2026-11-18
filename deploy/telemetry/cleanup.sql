-- Срок хранения 12 месяцев, как обещано на странице конфиденциальности.
DELETE FROM event_data WHERE created_at < now() - interval '12 months';
DELETE FROM website_event WHERE created_at < now() - interval '12 months';
DELETE FROM session WHERE created_at < now() - interval '12 months';
