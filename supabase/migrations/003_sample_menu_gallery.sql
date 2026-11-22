-- SAMPLE DATA ONLY (optional). Taken from the original database seed so the site isn't empty on first run.
-- Verify real names, prices and photos with the cafe, then edit or delete them in Admin → Menu / Gallery.
insert into public.categories (name, description, sort_order) values
  ('Matcha Series', 'Matcha drinks and matcha-based specialties.', 1),
  ('Coffee',        'Hot and iced coffee drinks.', 2),
  ('Bites',         'Snacks and food to enjoy with your drink.', 3);

insert into public.products (category_id, name, slug, short_description, description, price, is_featured)
select c.id, v.name, v.slug, v.short_description, v.description, v.price, v.is_featured
from public.categories c
join (values
  ('Matcha Series', 'Matcha Latte',  'matcha-latte',  'Classic creamy matcha latte.',
   'A smooth matcha drink with milk. Ask the cafe which milk and sweetness options are currently available.', 99.00, true),
  ('Matcha Series', 'Mango Matcha',  'mango-matcha',  'Matcha with mango flavor.',
   'A refreshing matcha drink with mango flavor.', 109.00, true),
  ('Matcha Series', 'Dirty Matcha',  'dirty-matcha',  'Matcha with a shot of espresso.',
   'Matcha paired with espresso for a layered drink with both earthy matcha and coffee notes.', 109.00, false)
) as v(cat, name, slug, short_description, description, price, is_featured) on v.cat = c.name;

-- Gallery samples reuse the photos shipped in /public/images.
insert into public.gallery_images (title, description, image_url, photo_date, sort_order) values
  ('Two lattes + a wrap',   'A good Tuesday.',                       '/images/lattes.jpg',     '2026-09-28', 1),
  ('The lights are on',     'Fairy lights mean we are open.',        '/images/storefront.jpg', '2026-09-28', 2),
  ('Beanbag afternoons',    'Friends, beanbags, and the cafe cat.',  '/images/beanbags.jpg',   '2026-09-28', 3),
  ('Behind the counter',    'Our barista at the window counter.',    '/images/barista.jpg',    '2026-09-28', 4);
