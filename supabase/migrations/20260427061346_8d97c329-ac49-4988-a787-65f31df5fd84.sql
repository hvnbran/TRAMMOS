-- Trigger para sincronizar conductor y placa del servicio hacia la solicitud del pasajero
-- y reflejar cambios de estado en la app del pasajero.

create or replace function public.sync_servicio_to_solicitud()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado_solicitud text;
begin
  -- Mapear estado del servicio al estado visible para el pasajero
  v_estado_solicitud := case new.estado
    when 'Programado' then 'aceptada'
    when 'En curso'   then 'en_camino'
    when 'Finalizado' then 'finalizada'
    when 'Cancelado'  then 'cancelada'
    else null
  end;

  update public.solicitudes_pasajero s
     set conductor_nombre = coalesce(new.conductor, s.conductor_nombre),
         vehiculo_placa   = coalesce(new.vehiculo, s.vehiculo_placa),
         estado           = coalesce(v_estado_solicitud, s.estado),
         updated_at       = now()
   where s.servicio_id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_sync_servicio_to_solicitud on public.servicios;
create trigger trg_sync_servicio_to_solicitud
after insert or update of conductor, vehiculo, estado on public.servicios
for each row
execute function public.sync_servicio_to_solicitud();

-- Backfill: copiar conductor/placa actuales a las solicitudes ya aceptadas
update public.solicitudes_pasajero s
   set conductor_nombre = coalesce(srv.conductor, s.conductor_nombre),
       vehiculo_placa   = coalesce(srv.vehiculo, s.vehiculo_placa),
       updated_at       = now()
  from public.servicios srv
 where s.servicio_id = srv.id;