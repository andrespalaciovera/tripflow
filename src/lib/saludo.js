/**
 * Determina el saludo basado en la hora actual de Bogotá (America/Bogota),
 * ignorando la zona horaria local del dispositivo del usuario.
 * 
 * Reglas (AGENTS.md):
 * 05:00–11:59 → 'Buenos días' ☀️
 * 12:00–18:59 → 'Buenas tardes' 🌤️
 * 19:00–04:59 → 'Buenas noches' 🌙
 * 
 * @returns {{ texto: string, emoji: string }} Objeto con el texto del saludo y su emoji
 */
export const obtenerSaludo = () => {
  // Obtenemos la hora actual en Bogotá. Usamos en-US con hora en formato 24h.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    hour12: false,
  });
  
  // Extraemos la hora como número entero (0-23)
  const parts = formatter.formatToParts(new Date());
  const hourPart = parts.find((part) => part.type === 'hour');
  
  // Intl.DateTimeFormat con hour12: false puede devolver "24" a la medianoche 
  // en lugar de "0" en algunos navegadores/entornos, así que lo manejamos con % 24
  const horaBogota = parseInt(hourPart.value, 10) % 24;

  if (horaBogota >= 5 && horaBogota < 12) {
    return { texto: 'Buenos días', emoji: '☀️' };
  }
  
  if (horaBogota >= 12 && horaBogota < 19) {
    return { texto: 'Buenas tardes', emoji: '🌤️' };
  }
  
  // 19:00 a 04:59
  return { texto: 'Buenas noches', emoji: '🌙' };
};
