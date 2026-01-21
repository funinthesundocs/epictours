-- Add vehicle_id column to availabilities table
ALTER TABLE availabilities 
ADD COLUMN vehicle_id UUID REFERENCES vehicles(id);

-- Add index for performance
CREATE INDEX idx_availabilities_vehicle_id ON availabilities(vehicle_id);
