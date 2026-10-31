create function touch_updated() returns trigger language plpgsql as $$ begin
 if tg_table_name='assignments' and to_jsonb(old)->>'status'='active' and to_jsonb(new)->>'status'='closed'
 and (to_jsonb(old)-'status'-'updated_at')=(to_jsonb(new)-'status'-'updated_at') then new.updated_at=old.updated_at;
 else new.updated_at=clock_timestamp(); end if; return new; end $$;
create table properties (
 id uuid primary key default gen_random_uuid(), code text not null unique check(length(trim(code))>0),
 address text not null check(length(trim(address))>0), property_type text not null default 'unclassified',
 area_sqm numeric(14,2) check(area_sqm>0), interest text, source_ref text,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp()
);
create unique index property_code_ci on properties(lower(code));
create table assignments (
 id uuid primary key default gen_random_uuid(), code text not null unique check(length(trim(code))>0),
 property_id uuid not null references properties, client text not null, valuer text not null,
 due_date date, valuation_date date, currency text not null check(currency ~ '^[A-Z]{3}$'),
 purpose text, intended_users text, basis text, scope_ref text, conflict_ref text, inspection_date date, inspection_ref text,
 assumptions text, conclusion_amount numeric(18,2) check(conclusion_amount>0), rationale text,
 status text not null default 'active' check(status in ('active','closed')), source_key text unique,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp()
);
create unique index assignment_code_ci on assignments(lower(code));
create table comparables (
 id uuid primary key default gen_random_uuid(), code text not null unique, address text not null,
 property_type text not null, area_sqm numeric(14,2) not null check(area_sqm>0),
 sale_amount numeric(18,2) not null check(sale_amount>0), currency text not null check(currency ~ '^[A-Z]{3}$'),
 sale_date date not null, source_ref text not null check(length(trim(source_ref))>0), verification_ref text,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp()
);
create unique index comparable_code_ci on comparables(lower(code));
create table selections (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references assignments,
 comparable_id uuid not null references comparables, adjustment_pct numeric(8,3) not null default 0 check(adjustment_pct > -100 and adjustment_pct<=100),
 weight numeric(10,4) not null check(weight>0), reason text not null check(length(trim(reason))>0),
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(assignment_id,comparable_id)
);
create table evidence (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references assignments,
 kind text not null check(kind in ('title','scope','inspection','market','other')), reference text not null check(length(trim(reference))>0),
 note text not null, actor text not null, created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp()
);
create table reviews (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references assignments,
 reviewer text not null, reference text not null, note text not null,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp()
);
create table events (
 id uuid primary key default gen_random_uuid(), assignment_id uuid references assignments, actor text not null,
 action text not null, detail jsonb not null, created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp()
);
create table imports (
 id uuid primary key default gen_random_uuid(), source text not null, kind text not null, digest text not null,
 rows_count integer not null, original_rows jsonb not null, actor text not null,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(source,kind,digest)
);
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Append-only record'; end $$;
do $$ declare t text; begin
 foreach t in array array['properties','assignments','comparables','selections'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 end loop;
 foreach t in array array['events','evidence','reviews','imports'] loop
 execute format('create trigger immutable before update or delete on %I for each row execute function immutable_record()',t);
 end loop;
 foreach t in array array['properties','assignments','comparables','selections','evidence','reviews','events','imports'] loop
 execute format('alter table %I enable row level security',t);execute format('revoke all on %I from public',t);
 end loop;
end $$;
create view comparison_grid as
 select s.id,s.assignment_id,a.code as assignment,c.code as comparable,c.address,c.currency,c.sale_date,c.area_sqm,
 c.sale_amount,round(c.sale_amount/c.area_sqm,2) as rate_per_sqm_amount,
 s.adjustment_pct,s.weight,round(c.sale_amount/c.area_sqm*(1+s.adjustment_pct/100),2) as adjusted_rate_amount,
 s.reason,c.source_ref,c.verification_ref,
 c.currency=a.currency as same_currency, c.property_type=p.property_type as same_type,
 c.sale_date<=a.valuation_date as known_at_valuation,
 greatest(s.updated_at,c.updated_at) as changed_at
 from selections s join assignments a on a.id=s.assignment_id join comparables c on c.id=s.comparable_id join properties p on p.id=a.property_id;
create view indications as
 select a.id,a.code,a.currency,p.area_sqm,count(g.id)::int as comps,
 round(sum(g.adjusted_rate_amount*g.weight)/nullif(sum(g.weight),0)*p.area_sqm,2) as indicated_amount,
 a.conclusion_amount,
 round(a.conclusion_amount/nullif(sum(g.adjusted_rate_amount*g.weight)/nullif(sum(g.weight),0)*p.area_sqm,0)*100-100,2) as conclusion_variance_pct
 from assignments a join properties p on p.id=a.property_id left join comparison_grid g on g.assignment_id=a.id
 and g.same_currency and g.same_type and g.known_at_valuation and coalesce(trim(g.verification_ref),'')<>''
 group by a.id,a.code,a.currency,p.area_sqm,a.conclusion_amount;
create view compliance_issues as
 select a.id as assignment_id,a.code,x.rule,x.issue from assignments a join properties p on p.id=a.property_id
 cross join lateral (values
 ('SCOPE',case when coalesce(trim(a.scope_ref),'')='' or coalesce(trim(a.purpose),'')='' or coalesce(trim(a.intended_users),'')='' or coalesce(trim(a.basis),'')='' or a.valuation_date is null then 'Complete the scope, purpose, users, basis and valuation date' end),
 ('CONFLICT',case when coalesce(trim(a.conflict_ref),'')='' then 'Record the conflict and competence check reference' end),
 ('PROPERTY',case when p.area_sqm is null or coalesce(trim(p.interest),'')='' then 'Record the property area and interest valued' end),
 ('TITLE',case when not exists(select 1 from evidence e where e.assignment_id=a.id and e.kind='title') then 'Record the title or interest evidence' end),
 ('INSPECTION',case when a.inspection_date is null or coalesce(trim(a.inspection_ref),'')='' then 'Record inspection date and evidence' end),
 ('CONCLUSION',case when a.conclusion_amount is null or coalesce(trim(a.rationale),'')='' or coalesce(trim(a.assumptions),'')='' then 'Record the conclusion, rationale and assumptions' end),
 ('COMPARABLES',case when (select count(*) from comparison_grid g where g.assignment_id=a.id and g.same_currency and g.same_type and g.known_at_valuation and coalesce(trim(g.verification_ref),'')<>'')<2 then 'Local control: select at least two verified comparable sales' end),
 ('COMP_REVIEW',case when exists(select 1 from comparison_grid g where g.assignment_id=a.id and (not g.same_currency or not g.same_type or g.known_at_valuation is not true or coalesce(trim(g.verification_ref),'')='')) then 'Review selected sales with mismatched currency, type, date or missing verification' end),
 ('STALE',case when exists(select 1 from comparison_grid g where g.assignment_id=a.id and g.sale_date<a.valuation_date-365) then 'Local control: a selected sale is over one year before valuation' end)
 ) x(rule,issue) where x.issue is not null;
create view work_queue as
 select a.id,a.code,p.address,a.client,a.valuer,a.due_date,a.status,a.currency,
 greatest(current_date-a.due_date,0) as overdue_days,
 (select count(*)::int from compliance_issues i where i.assignment_id=a.id) as issues,
 (select max(r.created_at) from reviews r where r.assignment_id=a.id) as reviewed_at,
 greatest(a.updated_at,p.updated_at,coalesce((select max(g.changed_at) from comparison_grid g where g.assignment_id=a.id),a.updated_at),coalesce((select max(e.created_at) from evidence e where e.assignment_id=a.id),a.updated_at)) as changed_at
 from assignments a join properties p on p.id=a.property_id;
create view review_ready as select * from work_queue where issues=0 and reviewed_at>=changed_at;
