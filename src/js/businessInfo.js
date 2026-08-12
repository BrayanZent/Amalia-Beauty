export const BUSINESS = {
  nombre: 'Amalia Beauty',
  instagram: '@amaliabeauty.cl',
  instagramUrl: 'https://instagram.com/amaliabeauty.cl',
  whatsappPhone: '56991569439',
  direccion: 'Camino San Ramón, sector Vista Valle',
  horarioTexto: 'Lunes a sábado, según cupos disponibles',
  abonoMonto: 3000,
  datosTransferencia: {
    titular: 'Daniela Álvarez Mardones',
    rut: '21.340.588-8',
    tipoCuenta: 'Cuenta RUT',
    banco: 'BancoEstado',
    email: 'Damii.alvarez11@gmail.com',
  },
};

export const ADDONS = [
  { id: 'kapping', nombre: 'Kapping', precio: 4000, aplicaA: ['Esmaltado permanente'] },
  { id: 'spa', nombre: 'Spa de manos', precio: 7000, aplicaA: ['Esmaltado permanente', 'Extensión de Polygel'] },
  { id: 'retiro', nombre: 'Retiro de trabajo anterior', precio: 4000, aplicaA: ['Esmaltado permanente', 'Extensión de Polygel', 'Spa y arreglo de uñas'] },
];

export const SERVICE_DESCRIPTIONS = {
  'Extensión de Polygel': 'Extensión con Polygel para largo y forma a medida, terminación pulida y resistente al uso diario.',
  'Esmaltado permanente': 'Esmaltado de larga duración, sin descascararse ni perder brillo. Suma Kapping como adicional para reforzar la uña.',
  'Spa y arreglo de uñas': 'Ritual de higienizante, exfoliante de perlas de jojoba, mascarilla de karité, loción con aloe vera y vitamina E, y aceite de cutículas. Productos cruelty free y veganos.',
};

export const RETIRO_ADICIONAL = {
  nombre: 'Retiro de trabajo',
  resena: 'Retiramos tu esmaltado permanente o extensión de Polygel anterior de forma segura, cuidando la uña natural. No lo hagas tú misma en casa: un retiro incorrecto puede dañar y debilitar la uña.',
  duracionTexto: '30-40 min',
};
