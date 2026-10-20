-- Reference data loaded on every startup.
-- INSERT IGNORE skips rows whose unique name already exists, so it is safe to re-run.
-- Author: Ashmi Hettige

INSERT IGNORE INTO crops (name, category, shelf_life_days, needs_cold_chain, image_url) VALUES
('Carrot',   'Root vegetable',  14, false, '/images/carrot.jpg'),
('Beans',    'Legume',           5, true,  '/images/beans.jpg'),
('Tomato',   'Fruit vegetable',  7, false, '/images/tomato.jpg'),
('Leeks',    'Allium',          10, false, '/images/leeks.jpg'),
('Cabbage',  'Leafy vegetable', 14, false, '/images/cabbage.jpg'),
('Potato',   'Tuber',           30, false, '/images/potato.jpg'),
('Capsicum', 'Fruit vegetable',  7, true,  '/images/capsicum.jpg'),
('Beetroot', 'Root vegetable',  21, false, '/images/beetroot.jpg');

-- Approximate coordinates of Sri Lankan economic centres (latitude, longitude)
INSERT IGNORE INTO collection_centres (name, district, latitude, longitude) VALUES
('Dambulla Dedicated Economic Centre',     'Matale',       7.8742, 80.6511),
('Meegoda Economic Centre',                'Colombo',      6.8447, 80.0400),
('Nuwara Eliya Economic Centre',           'Nuwara Eliya', 6.9697, 80.7672),
('Thambuttegama Economic Centre',          'Anuradhapura', 8.1545, 80.2980),
('Keppetipola Economic Centre',            'Badulla',      6.8981, 80.8760),
('Veyangoda Economic Centre',              'Gampaha',      7.1566, 80.0959);