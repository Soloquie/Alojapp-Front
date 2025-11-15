export interface Reserva {
}

export type EstadoReserva = 'PENDIENTE'|'CONFIRMADA'|'CANCELADA'|'COMPLETADA'|'EN_PROCESO'|string;

export interface Reserva {
  id: number;
  estado: EstadoReserva;
  fechaCheckin: string;   // ISO
  fechaCheckout: string;  // ISO
  alojamientoTitulo?: string;
  alojamientoImagen?: string | null;

  alojamientoId: number;

}
