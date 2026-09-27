-- Schema for Agriculture Equipment Rental Platform

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    category_value VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    state_value VARCHAR(100),
    district VARCHAR(100),
    district_value VARCHAR(100),
    village VARCHAR(100),
    village_value VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    price_per_day NUMERIC(10, 2) NOT NULL,
    image TEXT,
    image_alt VARCHAR(255),
    availability_from DATE,
    availability_to DATE,
    owner VARCHAR(255),
    rating NUMERIC(3, 2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    description TEXT,
    features TEXT[],
    availability TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial equipment data
INSERT INTO equipment (
    id, name, category, category_value, state, state_value, district, district_value, village, village_value, city, price_per_day, image, image_alt, availability_from, availability_to, owner, rating, rating_count, description, features, availability
) VALUES
(
    1, 'Mahindra 575 DI', 'Tractor', 'tractor', 'Andhra Pradesh', 'andhra-pradesh', 'Guntur', 'guntur', 'Tadikonda', 'tadikonda', 'Tadikonda', 1200.00, 'https://placehold.co/400x300?text=Mahindra+575+DI', 'Mahindra 575 DI tractor', '2024-10-01', '2024-12-31', 'Ramesh Kumar', 4.5, 12, 'Well-maintained Mahindra 575 DI tractor, perfect for plowing and hauling. Includes basic attachments.', ARRAY['45 HP engine', 'Power steering', 'Hydraulic lift', 'Includes plow attachment'], ARRAY['October', 'November', 'December']
),
(
    2, 'Kubota Combine Harvester', 'Harvester', 'harvester', 'Telangana', 'telangana', 'Medak', 'medak', 'Sangareddy', 'sangareddy', 'Sangareddy', 4500.00, 'https://placehold.co/400x300?text=Kubota+Harvester', 'Kubota combine harvester', '2024-10-15', '2024-11-30', 'Srinivas Reddy', 4.8, 8, 'High-efficiency Kubota combine harvester for rice and wheat harvesting. Low grain loss.', ARRAY['4-row header', 'Grain tank capacity 3000L', 'Low grain loss technology', 'Diesel engine'], ARRAY['Mid-October', 'November']
),
(
    3, 'Rotavator Tiller', 'Tiller', 'tiller', 'Karnataka', 'karnataka', 'Belagavi', 'belagavi', 'Athani', 'athani', 'Athani', 600.00, 'https://placehold.co/400x300?text=Rotavator+Tiller', 'Rotavator tiller', '2024-09-01', '2024-10-31', 'Patil Suresh', 4.2, 15, 'Heavy-duty rotavator for soil preparation. Suitable for all soil types.', ARRAY['5 ft width', 'PTO driven', 'Adjustable depth', 'Heavy duty blades'], ARRAY['September', 'October']
),
(
    4, 'Seed Drill Machine', 'Seeder', 'seeder', 'Tamil Nadu', 'tamil-nadu', 'Madurai', 'madurai', 'Usilampatti', 'usilampatti', 'Usilampatti', 450.00, 'https://placehold.co/400x300?text=Seed+Drill', 'Seed drill machine', '2024-10-01', '2024-12-15', 'Karthik Rajan', 4.0, 6, 'Precision seed drill for wheat and rice sowing. Ensures uniform seed placement.', ARRAY['8-row capacity', 'Adjustable seed rate', 'Fertilizer attachment', 'Easy calibration'], ARRAY['October', 'November', 'December']
),
(
    5, 'Power Sprayer', 'Sprayer', 'sprayer', 'Maharashtra', 'maharashtra', 'Nashik', 'nashik', 'Niphad', 'niphad', 'Niphad', 350.00, 'https://placehold.co/400x300?text=Power+Sprayer', 'Power sprayer', '2024-09-15', '2024-11-30', 'Deshmukh Anna', 4.3, 9, 'High-pressure power sprayer for pesticide and fertilizer application. Large tank capacity.', ARRAY['20L tank', 'Adjustable nozzle', 'Battery operated', 'Lightweight'], ARRAY['September', 'October', 'November']
),
(
    6, 'John Deere 5050D', 'Tractor', 'tractor', 'Punjab', 'punjab', 'Ludhiana', 'ludhiana', 'Jagraon', 'jagraon', 'Jagraon', 1000.00, 'https://placehold.co/400x300?text=John+Deere+5050D', 'John Deere 5050D tractor', '2024-10-01', '2025-01-31', 'Singh Gurpreet', 4.7, 20, 'Reliable John Deere 5050D tractor for all farming operations. Fuel efficient.', ARRAY['50 HP engine', 'Power steering', 'Advanced transmission', 'Multipurpose'], ARRAY['October', 'November', 'December', 'January']
)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to max id
SELECT setval('equipment_id_seq', (SELECT MAX(id) FROM equipment));
