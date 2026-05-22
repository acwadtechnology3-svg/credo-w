-- Phase 8 seed — run in Supabase SQL Editor after schema.sql + seed.sql

INSERT INTO subscriptions (name, description, price_egp, duration_days)
SELECT 'Saver', 'Basic customer membership', 500, 365
WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE name = 'Saver');

INSERT INTO subscriptions (name, description, price_egp, duration_days)
SELECT 'Super Saver', 'Premium customer membership with extra benefits', 1000, 365
WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE name = 'Super Saver');

INSERT INTO marketing_assets (title, type, language, region, file_url) VALUES
('Brand Presentation Egypt (English)', 'presentation', 'en', 'egypt', 'https://example.com/brand-eg-en.pdf'),
('Brand Presentation Egypt (Arabic)', 'presentation', 'ar', 'egypt', 'https://example.com/brand-eg-ar.pdf'),
('Brand Presentation Middle East (English)', 'presentation', 'en', 'middle_east', 'https://example.com/brand-me-en.pdf'),
('Brand Presentation Middle East (Arabic)', 'presentation', 'ar', 'middle_east', 'https://example.com/brand-me-ar.pdf'),
('Welcome Meeting Day 1', 'video', 'en', 'global', 'https://example.com/welcome-day1.mp4'),
('Welcome Meeting Day 2', 'video', 'en', 'global', 'https://example.com/welcome-day2.mp4');
