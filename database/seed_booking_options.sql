-- Seed Booking Option Schedules
INSERT INTO public.booking_option_schedules (name, description, config_retail, config_online, config_special, config_custom)
VALUES 
(
    'Standard Options',
    'Default options for most tours',
    '[
        {"id": "opt_1", "label": "Souvenir Photo", "price": 20, "description": "High-res digital photo"},
        {"id": "opt_2", "label": "Lunch Upgrade", "price": 15, "description": "Premium bento box"}
    ]'::jsonb,
    '[
        {"id": "opt_1", "label": "Souvenir Photo", "price": 15, "description": "Online discount"}
    ]'::jsonb,
    '[
        {"id": "opt_3", "label": "VIP Seating", "price": 50, "description": "Front row seats"}
    ]'::jsonb,
    '[]'::jsonb
);
