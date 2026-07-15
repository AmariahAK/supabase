
with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = 424242
)
select 
  case 
    when estimate > 50000 then (select -1)
    else (select count(*) from public.my_table where status = 'active')
  end as count,
  estimate > 50000 as is_estimate
from approximation;
