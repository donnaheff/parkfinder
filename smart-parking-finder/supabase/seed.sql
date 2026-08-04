insert into public.parking_lots (name, area, type, address, latitude, longitude, map_x, map_y, capacity, available_spaces, walk_meters, drive_minutes, rating, amenities, owner_listed, verification_status, is_open)
values
('Civic Centre Garage','Victoria Island','Multi-storey garage','Ozumba Mbadiwe corridor',6.4281,3.4219,83,23,80,42,240,5,4.8,'{"ev_charging":true,"accessible":true,"motorbike":true,"covered":true,"security":true,"lighting":true}',false,'verified',true),
('Marina Multi-Storey','Lagos Island','Multi-storey garage','Marina district',6.4541,3.3947,58,52,65,17,420,8,4.5,'{"ev_charging":false,"accessible":true,"motorbike":true,"covered":true,"security":true,"lighting":true}',false,'verified',true),
('Lekki Link Lot','Lekki Phase 1','Open car park','Admiralty Road area',6.4474,3.4723,71,67,48,6,680,11,4.2,'{"ev_charging":true,"accessible":false,"motorbike":true,"covered":false,"security":true,"lighting":true}',false,'verified',true),
('Adeniji Central Park','Ikoyi','Open car park','Ikoyi central',6.4557,3.4329,36,37,55,31,320,7,4.6,'{"ev_charging":true,"accessible":true,"motorbike":false,"covered":false,"security":true,"lighting":true}',false,'verified',true),
('Eko Atlantic Bay A','Eko Atlantic','Underground garage','Eko Atlantic boulevard',6.4101,3.4087,24,74,90,0,150,9,4.7,'{"ev_charging":true,"accessible":true,"motorbike":true,"covered":true,"security":true,"lighting":true}',false,'verified',true),
('Yaba Tech Hub Park','Yaba','Office parking','Herbert Macaulay corridor',6.5179,3.3869,48,19,40,24,760,14,4.3,'{"ev_charging":false,"accessible":false,"motorbike":true,"covered":false,"security":true,"lighting":true}',false,'verified',true)
on conflict do nothing;
