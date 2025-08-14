// Script de inspección de thumbnails para diagnosticar "Object not found" al firmar URLs
// Requisitos:
// - Lee SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY desde .env.local (con fallback a EXPO_PUBLIC_* para robustez)
// - Replica exactamente la normalización usada en app (normalizeStoragePath)
// - Firma contra bucket 'videos' y reporta OK/ERROR
// - Si falla, lista el prefijo (dirname) para ver qué hay realmente en Storage
// Extensiones de diagnóstico:
// - --probe <path>: probar firma directa de un path concreto (sin depender de BD)
// - Fallback automático a patrón con orden de carpetas intercambiado (tier/thumbnails -> thumbnails/tier y viceversa)
// - --only-premium y --max <N> para ampliar el muestreo

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // Fallback: no ideal para listados privados

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes.');
  console.error('Requerido: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  console.error('Opcional (fallback): EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// === Copia de la normalización usada en la app (src/services/videosService.ts) ===
function normalizeStoragePath(input) {
  if (!input) return '';
  try {
    let raw = String(input).trim();
    if (!raw) return '';

    // Si es URL completa, extraer pathname
    if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        raw = u.pathname || '';
      } catch {
        // Mantener raw si falla el parseo
      }
    }

    // Decodificar caracteres URL si es posible
    try {
      raw = decodeURIComponent(raw);
    } catch {
      // Ignorar errores de decodificación
    }

    // Normalizar a forward slashes
    let p = raw.replace(/\\/g, '/');

    // Intentar extraer lo que va después de "/videos/"
    const lower = p.toLowerCase();
    const marker = '/videos/';
    const idx = lower.indexOf(marker);
    if (idx >= 0) {
      p = p.slice(idx + marker.length);
    } else {
      // Fallback: eliminar solo slashes iniciales
      p = p.replace(/^\/+/, '');
    }

    // Remover prefijos comunes
    p = p.replace(/^public\//i, '');
    p = p.replace(/^videos\//i, '');

    // Limpiar slashes iniciales y colapsar dobles slashes
    p = p.replace(/^\/+/, '').replace(/\/{2,}/g, '/').trim();

    return p;
  } catch {
    // Fallback defensivo
    return String(input || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/^public\//i, '')
      .replace(/^videos\//i, '')
      .replace(/\/{2,}/g, '/');
  }
}

function buildSwappedOrderPaths(p) {
  // Detectar tier/thumbnails/file -> thumbnails/tier/file
  // o thumbnails/tier/file -> tier/thumbnails/file
  const out = [];
  const m1 = p.match(/^((free|premium))\/thumbnails\/(.+)$/i);
  if (m1) {
    out.push({
      label: 'swap_to_thumbnails_tier',
      path: `thumbnails/${m1[1]}/${m1[3]}`
    });
  }
  const m2 = p.match(/^thumbnails\/(free|premium)\/(.+)$/i);
  if (m2) {
    out.push({
      label: 'swap_to_tier_thumbnails',
      path: `${m2[1]}/thumbnails/${m2[2]}`
    });
  }
  return out;
}

// Utilidad para logging limpio de arrays del list()
function formatListEntries(entries) {
  if (!entries || entries.length === 0) return '   (vacío)';
  return entries
    .filter(e => e?.name && e.name !== '.placeholder')
    .map(e => {
      const size = e?.metadata?.size != null ? ` (${(e.metadata.size / 1024).toFixed(1)} KB)` : '';
      return `   - ${e.name}${size}`;
    })
    .join('\n') || '   (sin archivos relevantes)';
}

async function trySign(pathToSign, { alsoTryRemovePublicPrefix = true, alsoTrySwappedOrder = true } = {}) {
  const attempts = [];
  // intento principal
  attempts.push({ label: 'primary', path: pathToSign });

  // reintento quitando public/
  if (alsoTryRemovePublicPrefix && /^public\//i.test(pathToSign)) {
    attempts.push({
      label: 'remove_public_prefix',
      path: pathToSign.replace(/^public\//i, '')
    });
  }

  // swaps de orden de carpetas
  if (alsoTrySwappedOrder) {
    const swaps = buildSwappedOrderPaths(pathToSign);
    for (const s of swaps) attempts.push(s);
  }

  const results = [];
  for (const att of attempts) {
    try {
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(att.path, 60);

      if (!error && data?.signedUrl) {
        results.push({
          ...att,
          ok: true,
          signedUrl: data.signedUrl,
          error: null
        });
        // Primer éxito corta la cadena, pero guardamos lo hecho
        return { ok: true, best: results[results.length - 1], attempts: results };
      } else {
        results.push({
          ...att,
          ok: false,
          signedUrl: null,
          error: error || new Error('Unknown signing error')
        });
      }
    } catch (e) {
      results.push({
        ...att,
        ok: false,
        signedUrl: null,
        error: e
      });
    }
  }

  return { ok: false, best: null, attempts: results };
}

async function listDir(prefix) {
  const dir = prefix || '';
  const { data, error } = await supabase.storage.from('videos').list(dir, { limit: 100 });
  return { data, error, dirDisplay: dir || '(raíz)' };
}

async function inspectRows({ onlyPremium = false, maxRows = 50 } = {}) {
  console.log('🔍 Inspección de thumbnails (firmado directo contra Storage)');
  console.log('   SUPABASE_URL:', supabaseUrl);
  console.log('   KEY tipo:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon (fallback)');
  console.log('---\n');

  let query = supabase.from('videos')
    .select('id, title, is_premium, thumbnail_url')
    .order('is_premium', { ascending: false })
    .order('title', { ascending: true })
    .limit(maxRows);

  if (onlyPremium) {
    query = query.eq('is_premium', true);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error('❌ Error consultando public.videos:', error);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('📭 No hay registros en videos con los criterios dados.');
    return;
  }

  let totalWithThumb = 0;
  let failures = 0;
  let oks = 0;

  for (const v of rows) {
    const id = v.id;
    const isPremium = !!v.is_premium;
    const original = v.thumbnail_url;

    if (!original) {
      console.log('------------------------------');
      console.log(`ID: ${id}`);
      console.log(`Premium: ${isPremium}`);
      console.log(`Title: ${v.title || '(sin título)'}`);
      console.log(`thumbnail_url (original): ${original}`);
      console.log('RESULT: OMITIDO (sin thumbnail_url)\n');
      continue;
    }

    totalWithThumb += 1;

    const normalized = normalizeStoragePath(original);
    const signRes = await trySign(normalized, { alsoTryRemovePublicPrefix: true, alsoTrySwappedOrder: true });

    console.log('------------------------------');
    console.log(`ID: ${id}`);
    console.log(`Premium: ${isPremium}`);
    console.log(`Title: ${v.title || '(sin título)'}`);
    console.log(`thumbnail_url (original): ${original}`);
    console.log(`normalized: ${normalized}`);

    for (const att of signRes.attempts) {
      const tag = att.ok ? 'OK' : 'ERROR';
      const msg = att.ok ? '' : (att?.error?.message || String(att.error || 'Unknown error'));
      console.log(`Attempt [${att.label}]: ${att.path} -> ${tag}${msg ? ` | ${msg}` : ''}`);
    }

    if (signRes.ok) {
      oks += 1;
      console.log('RESULT: OK (URL firmada generada)');
    } else {
      failures += 1;
      console.log('RESULT: ERROR (no se pudo firmar con ninguno de los intentos)');

      // Listar los prefijos de los intentos para inspección
      const listed = new Set();
      for (const att of signRes.attempts) {
        const dir = (att.path && att.path.includes('/'))
          ? path.posix.dirname(att.path)
          : '';
        const key = dir || '(raíz)';
        if (listed.has(key)) continue;
        listed.add(key);

        const { data: listData, error: listErr, dirDisplay } = await listDir(dir || '');
        console.log(`Listando contenido en prefix: "${dirDisplay}"`);
        if (listErr) {
          console.log(`  (list error) ${listErr.message || String(listErr)}`);
        } else {
          console.log(formatListEntries(listData));
        }
      }
    }
  }

  console.log('\n=== Resumen ===');
  console.log(`Total con thumbnail_url: ${totalWithThumb}`);
  console.log(`Fallidos: ${failures}`);
  console.log(`OK: ${oks}`);
  console.log('===============\n');
}

async function probeSinglePath(inputPath) {
  console.log('🔎 Probe directo de path de thumbnail');
  console.log('   SUPABASE_URL:', supabaseUrl);
  console.log('   KEY tipo:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon (fallback)');
  console.log('---');

  const normalized = normalizeStoragePath(inputPath);
  console.log(`Input: ${inputPath}`);
  console.log(`normalized: ${normalized}`);

  const signRes = await trySign(normalized, { alsoTryRemovePublicPrefix: true, alsoTrySwappedOrder: true });

  for (const att of signRes.attempts) {
    const tag = att.ok ? 'OK' : 'ERROR';
    const msg = att.ok ? '' : (att?.error?.message || String(att.error || 'Unknown error'));
    console.log(`Attempt [${att.label}]: ${att.path} -> ${tag}${msg ? ` | ${msg}` : ''}`);
  }

  if (!signRes.ok) {
    console.log('RESULT: ERROR');
    // Listar prefijos de todos los intentos
    const listed = new Set();
    for (const att of signRes.attempts) {
      const dir = (att.path && att.path.includes('/'))
        ? path.posix.dirname(att.path)
        : '';
      const key = dir || '(raíz)';
      if (listed.has(key)) continue;
      listed.add(key);

      const { data: listData, error: listErr, dirDisplay } = await listDir(dir || '');
      console.log(`Listando contenido en prefix: "${dirDisplay}"`);
      if (listErr) {
        console.log(`  (list error) ${listErr.message || String(listErr)}`);
      } else {
        console.log(formatListEntries(listData));
      }
    }
  } else {
    console.log('RESULT: OK (URL firmada generada)');
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const hasProbe = args.includes('--probe');
  const onlyPremium = args.includes('--only-premium');
  const maxIdx = args.indexOf('--max');
  const maxRows = maxIdx >= 0 && args[maxIdx + 1] ? parseInt(args[maxIdx + 1], 10) : 50;

  if (hasProbe) {
    const idx = args.indexOf('--probe');
    const p = args[idx + 1];
    if (!p) {
      console.error('❌ Debes especificar un path tras --probe, por ejemplo:');
      console.error('   node scripts/inspectThumbnails.js --probe premium/thumbnails/archivo-thumb.png');
      process.exit(1);
    }
    await probeSinglePath(p);
    return;
  }

  await inspectRows({ onlyPremium, maxRows });
}

main().catch(err => {
  console.error('❌ Excepción no controlada en inspección:', err);
  process.exit(1);
});