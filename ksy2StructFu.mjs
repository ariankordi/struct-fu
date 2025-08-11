// @ts-check
import fs from 'fs';
import * as YAML from 'js-yaml';
import _ from './lib.js';

/** Define the FFLStoreData structure which decodes a complex data record. */
const FFLStoreDataOriginal = _.struct([
  _.ubitLE('miiVersion', 8), _.ubitLE('copyable', 1), _.ubitLE('ngWord', 1), _.ubitLE('regionMove', 2),
  _.ubitLE('fontRegion', 2), _.ubitLE('reserved0', 2), _.ubitLE('roomIndex', 4), _.ubitLE('positionInRoom', 4),
  _.ubitLE('authorType', 4), _.ubitLE('birthPlatform', 3), _.ubitLE('reserved1', 1),
  _.struct('authorId', [_.uint8('data', 8)]),
  _.struct('createId', [_.uint8('data', 10)]),
  _.uint8('reserved2', 2),
  _.ubitLE('gender', 1), _.ubitLE('birthMonth', 4), _.ubitLE('birthDay', 5), _.ubitLE('favoriteColor', 4),
  _.ubitLE('favorite', 1), _.ubitLE('padding0', 1), _.char16le('name', 20), _.uint8('height'), _.uint8('build'),
  _.ubitLE('localonly', 1), _.ubitLE('faceType', 4), _.ubitLE('faceColor', 3), _.ubitLE('faceTex', 4),
  _.ubitLE('faceMake', 4), _.ubitLE('hairType', 8), _.ubitLE('hairColor', 3), _.ubitLE('hairFlip', 1), _.ubitLE('padding1', 4),
  _.ubitLE('eyeType', 6), _.ubitLE('eyeColor', 3), _.ubitLE('eyeScale', 4), _.ubitLE('eyeAspect', 3),
  _.ubitLE('eyeRotate', 5), _.ubitLE('eyeX', 4), _.ubitLE('eyeY', 5), _.ubitLE('padding2', 2),
  _.ubitLE('eyebrowType', 5), _.ubitLE('eyebrowColor', 3), _.ubitLE('eyebrowScale', 4), _.ubitLE('eyebrowAspect', 3),
  _.ubitLE('padding3', 1), _.ubitLE('eyebrowRotate', 5), _.ubitLE('eyebrowX', 4), _.ubitLE('eyebrowY', 5), _.ubitLE('padding4', 2),
  _.ubitLE('noseType', 5), _.ubitLE('noseScale', 4), _.ubitLE('noseY', 5), _.ubitLE('padding5', 2),
  _.ubitLE('mouthType', 6), _.ubitLE('mouthColor', 3), _.ubitLE('mouthScale', 4), _.ubitLE('mouthAspect', 3), _.ubitLE('mouthY', 5),
  _.ubitLE('mustacheType', 3), _.ubitLE('padding6', 8), _.ubitLE('beardType', 3), _.ubitLE('beardColor', 3),
  _.ubitLE('beardScale', 4), _.ubitLE('beardY', 5), _.ubitLE('padding7', 1),
  _.ubitLE('glassType', 4), _.ubitLE('glassColor', 3), _.ubitLE('glassScale', 4), _.ubitLE('glassY', 5),
  _.ubitLE('moleType', 1), _.ubitLE('moleScale', 4), _.ubitLE('moleX', 5), _.ubitLE('moleY', 5), _.ubitLE('padding8', 1),
  _.char16le('creatorName', 20), _.uint16le('padding9'), _.uint16('crc')
]);
// Modified from what is seen in test.js.
// "ID" -> "Id", remove underscores from reserved/padding

/**
 * U8 -> Base64
 * @param {Array<number>|Uint8Array} bytes - Input data to encode.
 * @returns {string} Base64 representation of `buffer`.
 */
const bytesToBase64 = bytes =>
    // fromCharCode should be compatible with Uint8Array, but its param type is number[].
    btoa(String.fromCharCode.apply(null, /** @type {Array<number>} */ (bytes)));

/* ksy-to-structfu.js
 *
 * Convert a parsed KSY object (via js-yaml) into a struct-fu definition.
 * No `eval`, no file emission – we directly build Field objects.
 *
 * ./struct-fu/lib.js must already be loaded (CommonJS or ESM).
 */

//#region — public API ---------------------------------------------------------

/**
 * Build a struct-fu definition from a KSY YAML string.
 * @param {string} ksyYaml Raw YAML text.
 * @returns {_.StructInstance<any>} The top-level struct-fu struct.
 */
export function buildStructFromKsy(ksyYaml) {
  const ksyRoot = YAML.load(ksyYaml, { json: true });
  const typeCache = new Map();                   // name → struct instance
  return makeType(ksyRoot,
    lowerCamelCase(ksyRoot.meta?.id ?? 'root'), typeCache, {
    byteEndian : ksyRoot.meta?.endian     ?? 'be',
    bitEndian  : ksyRoot.meta?.['bit-endian'] ?? 'be'
  });
}

//#endregion ------------------------------------------------------------------

//#region — helpers -----------------------------------------------------------

/**
 * Converts snake_case to lowerCamelCase.
 * Mimics Kaitai's doWord().
 * @param {string} s
 * @returns {string}
 */
function lowerCamelCase(s) {
  if (s.startsWith("_")) return "_" + lowerCamelCase(s.substring(1));
  const [first, ...rest] = s.split("_");
  return first + rest.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

/**
 * Build (or reuse from cache) any type node (top-level or nested).
 * Recurses into `types` members as needed.
 * @param {string} name
 */
function makeType(node, name, cache, ctx) {
  if (cache.has(name)) return cache.get(name);

  // 1. Build field list for this `seq`
  if (!Array.isArray(node.seq))
    throw new Error(`KSY ${name} has no seq; unsupported for struct-fu`);

  // 3. Build nested types (ksy.types) and hoist them to cache
  if (node.types)
    for (const [/*childName*/name, childNode] of Object.entries(node.types)) {
      cache.set(/*`${name}::${childName}`,*/ name,
        makeType(childNode, /*`${name}::${childName}`*/name, cache, ctx));
    }

  /** @type {_.Field[]} */
  const fields = node.seq.map((/** @type {any} */ fld) => makeField(fld, node, cache, ctx));

  // 2. Wrap in struct-fu struct
  const struct = _.struct(/*name, */fields);

  cache.set(name, struct);
  return struct;
}

/**
 * Convert a single KSY `seq` entry into a struct-fu field.
 * @param {any} fld - One object from KSY `seq`.
 * @param {any} parentNode
 * @param {{ get: (arg0: any) => any; }} cache
 * @param {{ bitEndian: any; byteEndian: any; }} ctx
 */
function makeField(fld, parentNode, cache, ctx) {

  const repeatCount =
    fld.repeat === 'expr' && Number.isFinite(+fld['repeat-expr'])
      ? +fld['repeat-expr']
      : null;                                  // arrays with constant length only

  const name = lowerCamelCase(fld.id);
  // ---------------------------------------------------------------- numeric & bitfields
  if (typeof fld.type === 'string') {
    // Bit-sized integer  (bX  / bXle / bXbe)
    const bitMatch = /^b(\d+)(le|be)?$/.exec(fld.type);
    if (bitMatch) {
      const width = +bitMatch[1];
      const bitEndian =
        bitMatch[2] ?? ctx.bitEndian;          // explicit > meta default
      const ctor = (bitEndian === 'le' ? _.ubitLE : _.ubit)
                   .bind(null, name, width);
      return repeatCount ? ctor()(name, width, repeatCount) : ctor();
    }

    // Handle strings.
    if (fld.type === 'str' || fld.type === 'strz') {
      // str (non-terminated) and strz (terminated) are handled the same
      // and both should be terminated.
      return makeStringField(fld); // length + encoding handled later
    }

    // Multi/single-byte scalar with endian suffix or default meta endian
    if (/^(u|s|f)[1248](le|be)?$/.test(fld.type)) {
      return makeScalarField(fld.type, ctx.byteEndian, name, repeatCount);
    }

    const refName = resolveTypePath(fld.type, parentNode, cache);
    const subType = cache.get(refName) || makeType(resolveTypeNode(fld.type), refName, cache, ctx);
    return repeatCount ? _.struct(name, [subType], repeatCount)
                       : _.struct(name, [subType]);

  }

  // ---------------------------------------------------------------- fixed-size byte blobs
  if ('size' in fld && !fld.type) {
    if (!Number.isFinite(+fld.size))
      throw new Error(`Non-constant size expr not yet supported (${fld.id})`);
    return _.byte(name, +fld.size);          // char array but keep as bytes
  }

  // ---------------------------------------------------------------- user-defined / nested type
  if (typeof fld.type === 'string') {
  }

  throw new Error(`Unsupported field ${fld.id}`);
}

//#endregion ------------------------------------------------------------------

//#region — field builders ----------------------------------------------------

/**
 * Build string field with given size & encoding.
 * KSY encodings → struct-fu: utf-8 / utf-16le / utf-16be
 * @param {{ id: string | number; size: string | number; encoding: any; }} fld
 */
function makeStringField(fld) {
  if (!('size' in fld)) throw new Error(`String ${fld.id} needs size`);
  const size = +fld.size;
  const enc  = (fld.encoding || '').toLowerCase();

  const name = lowerCamelCase(fld.id);
  switch (enc) {
    case 'utf-16le': return _.char16le(name, size);
    case 'utf-16be': return _.char16be(name, size);
    case 'utf-8':
    case '':
      return _.char(name, size);
    default:
      throw new Error(`Unsupported string encoding ${enc}`);
  }
}

/**
 * Build a multi-byte scalar (u2, u4, s2, f4, etc.)
 * or single-byte (u1, s1) with endianness handling.
 * @param {string} typeStr
 * @param {any} defaultEndian
 * @param {any} id
 * @param {number | null} count
 */
function makeScalarField(typeStr, defaultEndian, id, count) {
  const m = /^(u|s|f)([1248])(le|be)?$/.exec(typeStr);
  if (!m) throw new Error(`Unknown scalar ${typeStr}`);

  /**
   * @param {number} width
   */
  function getEndian(width, endian) {
    return width < 2 ? '' :
      endian === 'le'
        ? 'le' : '';
  }

  const [ , sign, width, suffix ] = m;
  const endian = suffix ?? defaultEndian;
  const key = sign + width + getEndian(Number(width), endian);
  const map = {
    u1 : _.uint8,   s1   : _.int8,
    u2 : _.uint16,  u2le : _.uint16le,  u4 : _.uint32,  u4le : _.uint32le,
    s2 : _.int16,   s2le : _.int16le,   s4 : _.int32,   s4le : _.int32le,
    f4 : _.float32, f4le : _.float32le, f8 : _.float64, f8le : _.float64le
  };
  const ctor = map[key];
  if (!ctor) throw new Error(`Width ${width} or endian ${endian} not supported`);
  return ctor(id, count);
}

//#endregion ------------------------------------------------------------------

//#region — type-path helpers --------------------------------------------------

/**
 * KSY allows relative :: paths. We keep it simple:
 *  - single identifier → look in cache
 *  - else treat as absolute user name
 * @param {{ includes: (arg0: string) => any; }} path
 * @param {any} parentNode
 * @param {any} cache
 */
function resolveTypePath(path, parentNode, cache) {
  if (path.includes('::')) return path;        // already explicit

  // search upwards: current type → parent scopes (skipped here for brevity)
  return path;
}

/**
 * @param {any} path
 */
function resolveTypeNode(path) {
  throw new Error(`External .ksy imports not supported yet (${path})`);
}

//#endregion ------------------------------------------------------------------

const ksyText = fs.readFileSync('test ksy/c_f_li_mii_data_packet.ksy', 'utf8');
const FFLStoreData = buildStructFromKsy(ksyText);
console.log(FFLStoreData.fields)
// Now you can pack / unpack buffers:
const buf = FFLStoreData.pack({"miiVersion":3,"copyable":0,"ngWord":0,"regionMove":0,"fontRegion":0,"reserved0":0,"roomIndex":0,"positionInRoom":0,"authorType":0,"birthPlatform":4,"reserved1":0,"authorId":{"data":[160,65,56,196,160,132,0,0]},"createId":{"data":[219,184,135,49,190,96,43,42,42,66]},"reserved2":[0,0],"gender":1,"birthMonth":12,"birthDay":10,"favoriteColor":11,"favorite":0,"padding0":0,"name":"Jasmine","height":28,"build":55,"localonly":0,"faceType":9,"faceColor":0,"faceTex":0,"faceMake":1,"hairType":123,"hairColor":1,"hairFlip":0,"padding1":0,"eyeType":33,"eyeColor":0,"eyeScale":7,"eyeAspect":3,"eyeRotate":3,"eyeX":2,"eyeY":14,"padding2":0,"eyebrowType":13,"eyebrowColor":0,"eyebrowScale":4,"eyebrowAspect":6,"padding3":0,"eyebrowRotate":7,"eyebrowX":6,"eyebrowY":12,"padding4":0,"noseType":0,"noseScale":0,"noseY":4,"padding5":0,"mouthType":30,"mouthColor":0,"mouthScale":1,"mouthAspect":4,"mouthY":13,"mustacheType":0,"padding6":0,"beardType":0,"beardColor":6,"beardScale":4,"beardY":16,"padding7":0,"glassType":3,"glassColor":3,"glassScale":7,"glassY":11,"moleType":0,"moleScale":1,"moleX":12,"moleY":27,"padding8":0,"creatorName":"\u0000osigonal","padding9":0,"crc":36922});
console.log('buf:', buf)
console.log('buf base64', bytesToBase64(buf))
const obj = FFLStoreData.unpack(buf);
console.log('obj:', obj)
