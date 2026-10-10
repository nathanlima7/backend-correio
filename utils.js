import crypto from 'node:crypto';

export function generateTrackingCode() {
  const block = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BR-${block()}-${block()}-${block()}`;
}

export function normalizeUsername(u) {
  return String(u).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function validateUsername(u) {
  return /^[a-z0-9_]{3,20}$/.test(normalizeUsername(u));
}

export const TRACKING_STATES = [
  'postada',
  'aguardando_coleta',
  'em_transito',
  'centro_de_distribuicao',
  'saiu_para_entrega',
  'entregue',
  'extraviada',
  'endereco_nao_localizado',
  'devolvendo_ao_remetente',
  'devolvida',
];

export const STATE_MESSAGES = {
  postada: 'Sua carta foi postada e recebeu um código de rastreamento.',
  aguardando_coleta: 'A correspondência aguarda coleta na agência postal.',
  em_transito: 'Sua carta atravessou a cidade.',
  centro_de_distribuicao: 'A correspondência chegou ao centro de distribuição.',
  saiu_para_entrega: 'A carta saiu para entrega.',
  entregue: 'A correspondência foi entregue.',
  extraviada: 'Infelizmente, sua carta parece ter se perdido no caminho.',
  endereco_nao_localizado: 'O endereço não foi localizado. A carta está retornando.',
  devolvendo_ao_remetente: 'A correspondência está voltando para o remetente.',
  devolvida: 'A carta retornou ao remetente e pode ser reenviada.',
};

export const LOST_LETTER_CHANCE = 0.03; // 3%

// ---------------------------------------------------------------
// Endereço em componentes
// ---------------------------------------------------------------
export function buildDisplayAddress({ street, number, city, complement }) {
  const s = String(street || '').trim().replace(/\s+/g, ' ');
  const n = String(number || '').trim();
  const c = String(city || '').trim().replace(/\s+/g, ' ');
  const comp = String(complement || '').trim();

  if (!s || !n || !c) return null;

  const base = `${s}, nº ${n} — ${c}`;
  return comp ? `${base} (${comp})` : base;
}

export function validateAddressParts({ street, number, city }) {
  if (!street || street.length < 3 || street.length > 60) return false;
  if (!number || number.length < 1 || number.length > 6) return false;
  if (!city || city.length < 2 || city.length > 40) return false;
  if (!/^[A-Za-z0-9/º°\s-]{1,6}$/.test(number)) return false;
  return true;
}

// ---------------------------------------------------------------
// Validação de imagem para selos autorais
// ---------------------------------------------------------------
export function sniffImageMime(buffer) {
  if (!buffer || buffer.length < 8) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  return null;
}

export function readPngDimensions(buffer) {
  // PNG: bytes 16..23 contêm width e height (big-endian) após o IHDR
  if (buffer.length < 24) return null;
  const w = buffer.readUInt32BE(16);
  const h = buffer.readUInt32BE(20);
  return { width: w, height: h };
}

export function readJpegDimensions(buffer) {
  // JPEG: varre os segmentos até achar SOF0/SOF2
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) { offset++; continue; }
    const marker = buffer[offset + 1];
    // SOF0..SOF15 (exceto DHT, DAC, RST)
    if (marker >= 0xC0 && marker <= 0xCF &&
        marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      const height = buffer.readUInt16BE(offset + 5);
      const width  = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    const segLen = buffer.readUInt16BE(offset + 2);
    offset += 2 + segLen;
  }
  return null;
}

export function validateStampImage(buffer, expectedSize = 32) {
  const mime = sniffImageMime(buffer);
  if (!mime) {
    return { ok: false, error: 'Formato não suportado. Use PNG ou JPG.' };
  }

  let dims = null;
  if (mime === 'image/png') dims = readPngDimensions(buffer);
  else if (mime === 'image/jpeg') dims = readJpegDimensions(buffer);

  if (!dims) {
    return { ok: false, error: 'Não foi possível ler as dimensões da imagem.' };
  }
  if (dims.width !== expectedSize || dims.height !== expectedSize) {
    return {
      ok: false,
      error: `A imagem precisa ter exatamente ${expectedSize}×${expectedSize} pixels (a sua tem ${dims.width}×${dims.height}).`,
    };
  }

  return { ok: true, mime, width: dims.width, height: dims.height };
}