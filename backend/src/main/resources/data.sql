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

-- 30 days of sample prices for every crop at every centre (8 x 6 x 30 = 1,440 rows).
-- A sine wave gives realistic day-to-day movement; each centre is a little higher or lower.
-- New days are added on each startup; existing days are skipped by the unique key.
INSERT IGNORE INTO market_prices (crop_id, centre_id, price_date, min_price, max_price, avg_price)
WITH RECURSIVE days AS (
    SELECT 0 AS d
    UNION ALL
    SELECT d + 1 FROM days WHERE d < 29
),
priced AS (
    SELECT c.id AS crop_id,
           cc.id AS centre_id,
           days.d,
           (CASE c.name
                WHEN 'Carrot'   THEN 220
                WHEN 'Beans'    THEN 300
                WHEN 'Tomato'   THEN 180
                WHEN 'Leeks'    THEN 200
                WHEN 'Cabbage'  THEN 120
                WHEN 'Potato'   THEN 250
                WHEN 'Capsicum' THEN 350
                WHEN 'Beetroot' THEN 200
                ELSE 200
            END) * (1 + 0.10 * SIN(0.6 * days.d + c.id) + 0.02 * cc.id - 0.07) AS price
    FROM crops c
    CROSS JOIN collection_centres cc
    CROSS JOIN days
)
SELECT crop_id,
       centre_id,
       CURDATE() - INTERVAL d DAY,
       ROUND(price * 0.90, 2),
       ROUND(price * 1.10, 2),
       ROUND(price, 2)
FROM priced;