-- Clear existing data (and potential orphans if cascading set up, otherwise we might need to handle hotels linkage later)
-- For now, we assume it's safe to clear as we are in dev mode.
TRUNCATE TABLE public.pickup_points CASCADE;

-- Insert Real Data
INSERT INTO public.pickup_points (name, map_link) VALUES
('Ala Moana Hotel', 'https://goo.gl/maps/cV29aXX2sMJp8RCo9'),
('Aloha Mart Gas Station', 'https://maps.app.goo.gl/ifZWm8kB1cX29bjAA'),
('Aloha Tower Cruise Ship Pickup', 'https://goo.gl/maps/ofTsqmUMAi6msbn59'),
('Army Museum (Roundabout)', 'https://goo.gl/maps/5eNzvBpujUjjeZXo6'),
('Aston Waikiki Beach Hotel', 'https://goo.gl/maps/35PygkcRUds5Rskr7'),
('Hawaiian Monarch Hotel', 'https://maps.app.goo.gl/cGvyngueSAiCQZrR7'),
('Holiday Inn Express', 'https://maps.app.goo.gl/d71Cgm463gtJxR9u6'),
('Hyatt on Koa Ave', 'https://goo.gl/maps/N4xNH3bx1iT9oNew5'),
('Hyatt Place Hotel', 'https://maps.app.goo.gl/maYSw1jERvdCDKkCA'),
('Ilikai Hotel (Flag Pole)', 'https://g.page/ilikaihotel?share'),
('Ka La''i Hotel (Old Trump Tower)', 'https://maps.app.goo.gl/SXo2yP5KqV2UsGfT6'),
('La Croix Hotel', 'https://maps.app.goo.gl/nASjLJYttdx8SQ799'),
('Lotus Hotel @ Diamond Head', 'https://g.page/lotushonolulu?share'),
('Luana Hotel', 'https://goo.gl/maps/AbBxPRw8WFbWqeaZ7'),
('New Otani Hotel', 'https://goo.gl/maps/e8U1iDWwtNo5jKrt8'),
('New Otani Hotel (Duplicate Entry - Verify)', 'https://maps.app.goo.gl/pcgWwEjBnT19KUHZ9'),
('Outrigger Reef Hotel', 'https://g.page/OutriggerReef?share'),
('Pagoda Hotel', 'https://goo.gl/maps/hBwzjizPvXNbBsGH7'),
('Queen Kapiolani Hotel', 'https://maps.google.com/?cid=9249223745411661385'),
('Red Lobster', 'https://maps.app.goo.gl/js2Hvf1Rx4ASysG58'),
('Ross on Seaside Ave.', 'https://goo.gl/maps/jPXLdyQPm3aPmdfk6'),
('Sheraton Waikiki (Aloha Landing)', 'https://maps.app.goo.gl/qxwEkPYFKpzRsVGv7'),
('The Duke Statue', 'https://goo.gl/maps/mvNK9G7B194wRq7J8'),
('Twin Fin Hotel (FKA Aston Waikiki Beach)', 'https://goo.gl/maps/35PygkcRUds5Rskr7'),
('Waikiki Gateway', 'https://goo.gl/maps/888heiMYE75K2eeS9'),
('Wyndham Royal Garden Hotel', 'https://goo.gl/maps/P3uM9vDPTf7eUccJ8');
