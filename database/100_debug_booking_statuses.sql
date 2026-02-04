-- Debug Booking Statuses
-- Description: Check if bookings are hidden because of their status (e.g. 'cancelled').

SELECT 
    'Booking Status Distribution' as section,
    status,
    count(*) 
FROM public.bookings
WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35'
GROUP BY status;

-- Detailed Sample of Recent Bookings
SELECT 
    'Recent Bookings Sample' as section,
    id,
    created_at,
    status,
    availability_id
FROM public.bookings
WHERE organization_id = '6065c460-ce9c-418a-8071-6367f8a20f35'
ORDER BY created_at DESC
LIMIT 10;
