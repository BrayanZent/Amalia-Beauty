# Amalia Beauty — Variante de diseño "brutalismo suave" (para comparar)

**Fecha:** 2026-08-15
**Estado:** Brainstorming iniciado, pausado a propósito para continuar en un chat nuevo (sesión técnica separada de esta, que ya viene larga).

## 1. Contexto y objetivo

El usuario encontró un TikTok de referencia con un estilo "Brutalismo moderno" y quiere probarlo como **alternativa visual** al sitio actual, para comparar — no reemplaza el sitio en producción (https://amalia-beauty.vercel.app/) todavía. Mismo objetivo funcional: agendamiento de horas, el mismo sistema de reservas que ya funciona.

## 2. Alcance ya decidido (confirmado con el usuario)

- **Funcional completa, no un mockup estático:** reutiliza el código de reservas/calendario ya construido y probado (`src/js/booking.js`, `monthCalendar.js`, `availability.js`, `supabaseClient.js`, `businessInfo.js`, conexión real a Supabase) — solo cambia el HTML/CSS encima. No se duplica ni reescribe la lógica de negocio.
- Vive en una **carpeta nueva** dentro de `proyectos/Amalia Beauty/` (nombre a definir, ej. `variante-brutalista/`), separada de `src/` — no toca ni reemplaza el sitio en producción.
- Importar los módulos JS existentes por ruta relativa (ej. `../src/js/booking.js`) para no duplicar código ni arriesgar la lógica ya probada.

## 3. Referencia visual (descripción de la captura de TikTok que mostró el usuario)

Estilo "Brutalismo moderno": tipografía sans-serif muy grande y en negrita (titular tipo "DISEÑO SIN FILTROS. RESULTADOS REALES." en mayúsculas), bloques de alto contraste, bordes gruesos/rectos (sin esquinas redondeadas), acento en un solo color vibrante (en el ejemplo: verde lima sobre fondo negro), nav simple con botón de contorno marcado ("CONTACTO"), franja inferior de 4 bloques con ícono + texto corto ("ESTRATEGIA", "DISEÑO", "DESARROLLO", + bloque destacado en el color de acento), layout directo, sin adornos.

## 4. Adaptación pedida (no copiar literal)

El usuario fue explícito: **no** replicar el blanco/negro + acento neón — se percibe como más masculino/tech y el sitio está dirigido a mujeres. Adaptar con:

- Paleta ya definida del proyecto: rosa palo `#c98a90`, dorado `#b8933f`, fondo crema `#fff9f7`.
- Tipografía: Merriweather (ya elegida para el sitio actual) — **pendiente de decidir** en la próxima sesión si se mantiene para titulares grandes estilo brutalista (que normalmente usan sans-serif bold, no serif) o si se explora una sans-serif bold complementaria solo para esta variante. Vale la pena resolver esto con un mockup antes de escribir CSS, es una combinación poco habitual.
- Mantener de la referencia: bloques directos, alto contraste, bordes gruesos/rectos, texto grande y confiado. Cambiar: la paleta cromática (rosa/dorado/crema en vez de blanco/negro/neón) y mantener la calidez de marca en el copy (no tono frío/corporativo).

## 5. Próximos pasos (para retomar en la sesión nueva)

1. Mockups (herramienta de vista previa) de la adaptación del hero brutalista con la paleta de Amalia Beauty, antes de tocar código — en particular resolver el punto de tipografía (sección 4).
2. Definir estructura exacta de la carpeta nueva y cómo se importan los módulos JS ya existentes.
3. Presentar diseño completo, aprobar, y recién ahí pasar a plan de implementación (writing-plans).

## 6. Fuera de alcance por ahora

- No reemplaza el sitio en producción — es una variante para comparar.
- No se toca `src/` del sitio actual ni su lógica de reservas.

## 7. Para retomar rápido en el chat nuevo

Este documento + `proyectos/Amalia Beauty/CLAUDE.md` (datos del negocio, catálogo, paleta) + `docs/superpowers/specs/2026-08-12-rediseno-reserva-design.md` (arquitectura del sistema de reservas actual) son suficiente contexto para seguir sin repasar toda la conversación anterior.
