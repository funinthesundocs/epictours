-- 1. Add New Columns to Vehicles Table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS license_requirement text,
ADD COLUMN IF NOT EXISTS miles_per_gallon numeric,
ADD COLUMN IF NOT EXISTS vin_number text,
ADD COLUMN IF NOT EXISTS dot_number text,
ADD COLUMN IF NOT EXISTS rate_per_hour numeric,
ADD COLUMN IF NOT EXISTS fixed_rate numeric;

-- 2. Seed Dummy Data (Clear existing first to ensure clean state for testing)
TRUNCATE TABLE public.vehicles CASCADE;

INSERT INTO public.vehicles 
(name, capacity, license_requirement, miles_per_gallon, plate_number, vin_number, dot_number, rate_per_hour, fixed_rate, status)
VALUES
-- Vehicle 1: Large Bus
('Coach Bus 101', 55, 'CDL Class B', 6.5, 'BUS-101', '1HGCM82633001', 'DOT-98212', 150.00, 1200.00, 'active'),

-- Vehicle 2: Luxury Van
('Mercedes Sprinter 01', 14, 'Regular (Class D)', 18.2, 'SPR-001', 'WD3PF0CD58912', 'DOT-98212', 85.00, 600.00, 'active'),

-- Vehicle 3: Mini Bus
('Ford F550 Mini', 28, 'CDL Class C', 10.5, 'MINI-22', '1FDUF5GT8DA11', 'DOT-98212', 110.00, 900.00, 'maintenance'),

-- Vehicle 4: SUV
('Cadillac Escalade', 6, 'Regular (Class D)', 16.0, 'VIP-SUV', '1GY6HKL89221', 'DOT-98212', 75.00, 400.00, 'active'),

-- Vehicle 5: Old Van (Retired)
('Ford Econoline 2010', 12, 'Regular (Class D)', 12.0, 'OLD-VAN', '1FTNE22L9981', 'DOT-98212', 50.00, 300.00, 'retired');
