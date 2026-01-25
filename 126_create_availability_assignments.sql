-- Create table for functionality to assign multiple vehicles to an availability
-- This supports the "Cluster" model (Vehicle + Route + Driver + Guide)

CREATE TABLE IF NOT EXISTS public.availability_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    availability_id UUID NOT NULL REFERENCES public.availabilities(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
    transportation_route_id UUID REFERENCES public.schedules(id),
    driver_id UUID REFERENCES public.staff(id),
    guide_id UUID REFERENCES public.staff(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avail_assignments_avail_id ON public.availability_assignments(availability_id);
