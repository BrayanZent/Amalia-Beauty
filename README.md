# Amalia Beauty — Sitio y sistema de reservas

## Requisitos previos (pendientes del lado del cliente)
1. Crear un proyecto en https://supabase.com, ejecutar `supabase/schema.sql` en el SQL Editor,
   y completar `src/js/supabaseConfig.js` con el Project URL y el anon key.
2. Crear el usuario admin de Amalia en Supabase (Authentication > Users).
3. Tener una cuenta en https://vercel.com para conectar el repositorio.

## Deploy en Vercel
1. Subir este proyecto a un repositorio git (ej. GitHub).
2. En Vercel: "Add New Project" → importar el repositorio.
3. Framework preset: "Other". Output directory: `src` (ya configurado en `vercel.json`).
4. Deploy. Vercel entrega una URL `https://<proyecto>.vercel.app` lista para usar; el dominio propio se agrega después en Project Settings > Domains.

## Desarrollo local
```bash
npm install
npm test              # corre los tests de lógica pura (vitest)
npx serve src         # sirve el sitio localmente para probar en navegador
```
