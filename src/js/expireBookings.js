import { supabaseClient } from './supabaseClient.js';
import { isExpired } from './availability.js';

export async function expireStaleBookings() {
  const { data: pendientes } = await supabaseClient
    .from('bookings')
    .select('id,estado,expira_en')
    .eq('estado', 'pendiente_abono');

  const vencidas = (pendientes || []).filter((b) => isExpired(b));
  if (vencidas.length === 0) return;

  await Promise.all(
    vencidas.map((b) =>
      supabaseClient.from('bookings').update({ estado: 'expirada' }).eq('id', b.id)
    )
  );
}

expireStaleBookings();
