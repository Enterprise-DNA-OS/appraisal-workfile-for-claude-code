insert into properties(id,code,address,property_type,area_sqm,interest,source_ref) values
 ('10000000-0000-0000-0000-000000000001','PROP-001','14 Harbour Lane, Demo City','industrial',1000,'Freehold','demo-title-1'),
 ('10000000-0000-0000-0000-000000000002','PROP-002','8 Orchard Road, Demo City','office',650,null,'demo-title-2'),
 ('10000000-0000-0000-0000-000000000003','PROP-003','21 Harbour Lane, Demo City','industrial',800,'Freehold','demo-title-3') on conflict do nothing;
insert into assignments(id,code,property_id,client,valuer,due_date,valuation_date,currency,purpose,intended_users,basis,scope_ref,conflict_ref,inspection_date,inspection_ref,assumptions,conclusion_amount,rationale) values
 ('20000000-0000-0000-0000-000000000001','JOB-001','10000000-0000-0000-0000-000000000001','Demo Harbour Trust','Mere',current_date-5,current_date-10,'NZD','Internal planning','Trust directors','Market value','demo-engagement-1','demo-conflict-1',current_date-12,'demo-inspection-1','Vacant possession; no hidden defects assumed',2250000,'Recent verified industrial sales support this conclusion'),
 ('20000000-0000-0000-0000-000000000002','JOB-002','10000000-0000-0000-0000-000000000002','Demo Orchard Holdings','Alex',current_date-2,current_date-5,'NZD',null,null,null,null,null,null,null,null,null,null),
 ('20000000-0000-0000-0000-000000000003','JOB-003','10000000-0000-0000-0000-000000000003','Demo Harbour Trust','Mere',current_date+7,current_date-10,'NZD','Internal planning','Trust directors','Market value','demo-engagement-3','demo-conflict-3',current_date-11,'demo-inspection-3',null,null,null) on conflict do nothing;
insert into comparables(id,code,address,property_type,area_sqm,sale_amount,currency,sale_date,source_ref,verification_ref) values
 ('30000000-0000-0000-0000-000000000001','SALE-001','3 Basin Street, Demo City','industrial',900,1980000,'NZD',current_date-60,'demo-sale-1','demo-verification-1'),
 ('30000000-0000-0000-0000-000000000002','SALE-002','18 Wharf Road, Demo City','industrial',1100,2530000,'NZD',current_date-90,'demo-sale-2','demo-verification-2'),
 ('30000000-0000-0000-0000-000000000003','SALE-003','5 Orchard Road, Demo City','office',700,2100000,'NZD',current_date-800,'demo-sale-3',null) on conflict do nothing;
insert into selections(id,assignment_id,comparable_id,adjustment_pct,weight,reason) values
 ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',0,1,'Similar industrial unit, nearby location'),
 ('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',0,1,'Similar freehold industrial sale'),
 ('40000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003',0,1,'Old office sale needs verification') on conflict do nothing;
insert into evidence(id,assignment_id,kind,reference,note,actor) values
 ('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','title','demo-title-1','Fictional title evidence for demo','Demo operator') on conflict do nothing;
