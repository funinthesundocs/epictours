-- 14_seed_experiences.sql

INSERT INTO public.experiences 
(name, slogan, event_type, description, start_time, end_time, min_age, max_group_size, what_to_bring, checkin_details, cancellation_policy)
VALUES 
(
  'Grand Circle Island Tour', 
  'The ultimate Oahu experience.', 
  'Tour', 
  'Experience the circle island tour that started it all. Visit the Dole Plantation, North Shore beaches, and more.',
  '7:00 AM',
  '4:00 PM',
  3,
  14,
  ARRAY['Sunscreen', 'Camera', 'Walking shoes', 'Swimsuit'],
  'Please arrive 15 minutes prior to pickup.',
  '24-hour cancellation policy for full refund.'
),
(
  'Pearl Harbor & City', 
  'History and culture in one day.', 
  'Tour', 
  'Visit the USS Arizona Memorial and tour historic downtown Honolulu.',
  '6:00 AM',
  '1:00 PM',
  0,
  25,
  ARRAY['Valid ID', 'No bags allowed at Memorial'],
  'Bag check available at visitor center.',
  '48-hour cancellation policy.'
),
(
  'Sunset Catamaran', 
  'Sails, cocktails, and sunsets.', 
  'Activity', 
  'Enjoy a relaxing sail off Waikiki beach as the sun goes down.',
  '5:00 PM',
  '7:00 PM',
  21,
  40,
  ARRAY['Light jacket', 'ID for drinks'],
  'Check in at the beach kiosk behind the Duke Statue.',
  '24-hour cancellation policy.'
);
