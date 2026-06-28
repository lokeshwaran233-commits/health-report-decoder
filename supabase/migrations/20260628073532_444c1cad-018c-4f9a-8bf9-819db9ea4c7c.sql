
create or replace function public.fulfill_order_atomic(
  p_order_id uuid,
  p_razorpay_payment_id text default null
)
returns table (
  fulfilled boolean,
  kind text,
  user_id uuid,
  item_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders%rowtype;
  v_credits int;
begin
  update public.payment_orders
     set status = 'paid',
         fulfilled_at = now(),
         razorpay_payment_id = coalesce(p_razorpay_payment_id, razorpay_payment_id)
   where id = p_order_id
     and status = 'created'
   returning * into v_order;

  if not found then
    fulfilled := false;
    kind := null;
    user_id := null;
    item_code := null;
    return next;
    return;
  end if;

  if v_order.kind = 'credit_pack' then
    select credits into v_credits
      from public.credit_packs
     where code = v_order.item_code;
    if v_credits is null then
      raise exception 'Credit pack % not found', v_order.item_code;
    end if;

    insert into public.user_entitlements (user_id, plan_code, credit_balance)
    values (v_order.user_id, 'free', v_credits)
    on conflict (user_id) do update
      set credit_balance = public.user_entitlements.credit_balance + excluded.credit_balance;

  elsif v_order.kind = 'subscription' then
    insert into public.user_entitlements (
      user_id, plan_code, plan_started_at, plan_renews_at,
      plan_status, period_started_at, reports_used_this_period
    ) values (
      v_order.user_id, v_order.item_code, now(), now() + interval '1 month',
      'active', now(), 0
    )
    on conflict (user_id) do update
      set plan_code = excluded.plan_code,
          plan_started_at = excluded.plan_started_at,
          plan_renews_at = excluded.plan_renews_at,
          plan_status = excluded.plan_status,
          period_started_at = excluded.period_started_at,
          reports_used_this_period = 0;
  end if;

  fulfilled := true;
  kind := v_order.kind;
  user_id := v_order.user_id;
  item_code := v_order.item_code;
  return next;
end;
$$;

revoke all on function public.fulfill_order_atomic(uuid, text) from public;
revoke all on function public.fulfill_order_atomic(uuid, text) from anon;
revoke all on function public.fulfill_order_atomic(uuid, text) from authenticated;
grant execute on function public.fulfill_order_atomic(uuid, text) to service_role;
