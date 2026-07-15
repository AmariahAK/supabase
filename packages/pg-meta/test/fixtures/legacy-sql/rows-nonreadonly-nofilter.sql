

CREATE OR REPLACE FUNCTION pg_temp.count_estimate(
    query text
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
    plan jsonb;
BEGIN
    EXECUTE 'EXPLAIN (FORMAT JSON)' || query INTO plan;
    RETURN plan->0->'Plan'->'Plan Rows';
END;
$$;


with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = 424242
)
select 
  case 
    when estimate > 50000 then estimate
    else (select count(*) from public.my_table)
  end as count,
  estimate > 50000 as is_estimate
from approximation;
