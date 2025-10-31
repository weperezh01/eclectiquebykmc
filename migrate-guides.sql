-- Migration script to populate guides and guide_items tables in eclectiquebykmc_db

-- Insert Fall Essentials guide
INSERT INTO guides (slug, title, intro) VALUES 
('fall-essentials', '5 Fall Essentials', 'Quick and versatile selection for cool weather.');

-- Get the ID for Fall Essentials guide and insert items
INSERT INTO guide_items (guide_id, title, image_url, href) VALUES 
((SELECT id FROM guides WHERE slug = 'fall-essentials'), 'Long cardigan', '/images/guides/cardigan.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US'),
((SELECT id FROM guides WHERE slug = 'fall-essentials'), 'Leather ankle boots', '/images/guides/boots.webp', 'https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts'),
((SELECT id FROM guides WHERE slug = 'fall-essentials'), 'Straight jeans', '/images/guides/jeans.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US'),
((SELECT id FROM guides WHERE slug = 'fall-essentials'), 'Knit scarf', '/images/guides/scarf.webp', 'https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts'),
((SELECT id FROM guides WHERE slug = 'fall-essentials'), 'Structured blazer', '/images/guides/blazer.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US');

-- Insert Work From Home guide
INSERT INTO guides (slug, title, intro) VALUES 
('work-from-home', 'Work From Home Look', 'Comfortable yet professional for video calls.');

INSERT INTO guide_items (guide_id, title, image_url, href) VALUES 
((SELECT id FROM guides WHERE slug = 'work-from-home'), 'Satin blouse', '/images/guides/blouse.webp', 'https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts'),
((SELECT id FROM guides WHERE slug = 'work-from-home'), 'Elevated jogger pants', '/images/guides/joggers.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US'),
((SELECT id FROM guides WHERE slug = 'work-from-home'), 'Minimalist slippers', '/images/guides/slippers.webp', 'https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts');

-- Insert Date Night guide
INSERT INTO guides (slug, title, intro) VALUES 
('date-night', 'Date Night', 'Elegant and sophisticated for special occasions.');

INSERT INTO guide_items (guide_id, title, image_url, href) VALUES 
((SELECT id FROM guides WHERE slug = 'date-night'), 'Black midi dress', '/images/guides/dress.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US'),
((SELECT id FROM guides WHERE slug = 'date-night'), 'Nude heels', '/images/guides/heels.webp', 'https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts'),
((SELECT id FROM guides WHERE slug = 'date-night'), 'Small handbag', '/images/guides/purse.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US'),
((SELECT id FROM guides WHERE slug = 'date-night'), 'Delicate necklace', '/images/guides/necklace.webp', 'https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts');

-- Insert Weekend Casual guide
INSERT INTO guides (slug, title, intro) VALUES 
('weekend-casual', 'Weekend Casual', 'Relaxed yet stylish for days off.');

INSERT INTO guide_items (guide_id, title, image_url, href) VALUES 
((SELECT id FROM guides WHERE slug = 'weekend-casual'), 'Oversized hoodie', '/images/guides/hoodie.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US'),
((SELECT id FROM guides WHERE slug = 'weekend-casual'), 'High-waisted leggings', '/images/guides/leggings.webp', 'https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts'),
((SELECT id FROM guides WHERE slug = 'weekend-casual'), 'White sneakers', '/images/guides/sneakers.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US');

-- Insert Spring Transition guide
INSERT INTO guides (slug, title, intro) VALUES 
('spring-transition', 'Spring Transition', 'Light pieces for the changing season.');

INSERT INTO guide_items (guide_id, title, image_url, href) VALUES 
((SELECT id FROM guides WHERE slug = 'spring-transition'), 'Denim jacket', '/images/guides/denim-jacket.webp', 'https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts'),
((SELECT id FROM guides WHERE slug = 'spring-transition'), 'Floral dress', '/images/guides/floral-dress.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US'),
((SELECT id FROM guides WHERE slug = 'spring-transition'), 'Flat sandals', '/images/guides/sandals.webp', 'https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts'),
((SELECT id FROM guides WHERE slug = 'spring-transition'), 'Tote bag', '/images/guides/tote.webp', 'https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US');

-- Verify the migration
SELECT 'Migration Summary:' as info;
SELECT COUNT(*) as total_guides FROM guides;
SELECT COUNT(*) as total_items FROM guide_items;
SELECT g.title, COUNT(gi.id) as item_count 
FROM guides g 
LEFT JOIN guide_items gi ON g.id = gi.guide_id 
GROUP BY g.id, g.title 
ORDER BY g.id;