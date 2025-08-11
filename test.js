// @ts-check

var includePath = './lib';
var _ = require('./lib');

/**
 * Creates a new Uint8Array of a given size backed by an ArrayBuffer.
 * @param {number} size - The size of the buffer in bytes.
 * @returns {Uint8Array} A new Uint8Array instance.
 */
function newBuffer(size) {
    return new Uint8Array(new ArrayBuffer(size));
}

// Define the primary "entry" structure for testing.
var entry = _.struct([
    _.char('filename', 8),
    _.char('extension', 3),
    _.struct('flags', [
        _.bool('readonly'),
        _.bool('hidden'),
        _.bool('system'),
        _.bool('volume'),
        _.bool('directory'),
        _.bool('archive'),
        _.ubit('reserved', 2)
    ].reverse()),
    _.byte('reserved', 4, 2),
    _.struct([
        _.char('reserved1'),
        _.ubit('reserved2', 8)
    ]),
    _.struct('time', [
        _.ubit('hour', 5),
        _.ubit('minutes', 6),
        _.ubit('seconds', 5)
    ]),
    _.struct('date', [
        _.ubit('year', 7),
        _.ubit('month', 4),
        _.ubit('day', 5)
    ]),
    _.uint16le('cluster'),
    _.uint32le('filesize')
]);

/** Test suite for struct-fu, a binary structure library. */
describe('struct-fu Tests', function() {
  // // ---------------------------------------------------------------------
  // //  API Check
  // // ---------------------------------------------------------------------
  describe('API Check', function() {
      it('should have expected properties and offsets on entry', function() {
      // Verify that the structure object exposes the required properties.
          expect(entry).toHaveProperty('fields');
          expect(entry.fields).toHaveProperty('reserved');
          expect(entry.fields).toHaveProperty('reserved1');
          expect(entry.fields).toHaveProperty('reserved2');
          expect(entry.fields).toHaveProperty('time');
          // Check that the 'time' struct offset is correct.
          expect(entry.fields.time.offset).toBe(22);
          // Ensure the underlying field for reserved array is accessible.
          expect(entry.fields.reserved).toHaveProperty('field');
          // Verify that the offset for the reserved array itself is correct.
          expect(entry.fields.reserved.offset).toBe(12);
          // Validate that the hoisted field "reserved2" is at the expected byte offset.
          expect(/** @type {_.Offset} */ (entry.fields.reserved2.offset).bytes).toBe(21);
      });
  });

  // // ---------------------------------------------------------------------
  // //  Write Check
  // // ---------------------------------------------------------------------
  describe('Write Check', function() {
      it('should pack the entry object into a known correct buffer', function() {
          var obj0 = { filename: 'autoexec', extension: 'batch', flags: { reserved: 0x82, archive: true } };
          var buf = entry.pack(obj0);
          // Known correct buffer as provided by original test data.
          var _bufKnown = new Uint8Array([
              0x61, 0x75, 0x74, 0x6f, 0x65, 0x78, 0x65, 0x63,
              0x62, 0x61, 0x74, 0xa0, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
          ]);
          // Validate known buffer length and spot-check key values.
          expect(_bufKnown.length).toBe(32);
          expect(_bufKnown[0]).toBe(0x61);
          expect(_bufKnown[7]).toBe(0x63);
          expect(_bufKnown[31]).toBe(0);
          // Check that the packed buffer matches the known buffer in length and content.
          expect(buf.length).toBe(_bufKnown.length);
          for (var i = 0, len = buf.length; i < len; ++i) {
              expect(buf[i]).toBe(_bufKnown[i]);
          }
      });
  });

  // // ---------------------------------------------------------------------
  // //  Read Checks
  // // ---------------------------------------------------------------------
  describe('Read Checks', function() {
      it('should unpack the buffer back to the original object values', function() {
          var obj0 = { filename: 'autoexec', extension: 'batch', flags: { reserved: 0x82, archive: true } };
          var buf = entry.pack(obj0);
          var obj1 = entry.unpack(buf);
          // Validate that fields match the expected values (with extension truncated to 3 chars).
          expect(obj1.filename).toBe(obj0.filename);
          expect(obj1.extension).toBe(obj0.extension.slice(0, 3));
          // Verify bit-level correctness for flags.
          expect(obj1.flags.reserved).toBe(obj0.flags.reserved & 0x03);
          expect(obj1.flags.archive).toBe(true);
          expect(obj1.flags.system).toBe(false);
          // Check that reserved field is an array containing a Uint8Array.
          expect(Array.isArray(obj1.reserved)).toBe(true);
          expect(obj1.reserved[0] instanceof Uint8Array).toBe(true);
          // Ensure that the reserved array’s second element has a zeroed first byte.
          expect(obj1.reserved[1][0]).toBe(0);
          // Validate default values for time, cluster, and filesize.
          expect(obj1.time.hour).toBe(0);
          expect(obj1.cluster).toBe(0);
          expect(obj1.filesize).toBe(0);
      });
  });

  // --------------------------------------------------------------------------
  // Unicode Check
  // --------------------------------------------------------------------------
  describe('Unicode Check', function() {
      it('should correctly pack and unpack a UTF-16LE string', function() {
          var str = '\ud83c\udf91';
          var ucs = _.char16le(8);
          var b16 = ucs.pack(str);
          // Check expected byte values in the UTF-16LE representation.
          expect(b16[0]).toBe(0x3c);
          expect(b16[1]).toBe(0xd8);
          expect(b16[2]).toBe(0x91);
          expect(b16[3]).toBe(0xdf);
          expect(b16[4]).toBe(0);
          expect(b16[5]).toBe(0);
          expect(b16[6]).toBe(0);
          expect(b16[7]).toBe(0);
          // Confirm that unpacking returns the original string.
          expect(ucs.unpack(b16)).toBe(str);
      });

      it('should correctly pack and unpack a UTF-16BE string', function() {
          var str = '\ud83c\udf91';
          var ucs = _.char16be(8);
          var b16 = ucs.pack(str);
          // Check expected byte values in the UTF-16BE representation.
          expect(b16[0]).toBe(0xd8);
          expect(b16[1]).toBe(0x3c);
          expect(b16[2]).toBe(0xdf);
          expect(b16[3]).toBe(0x91);
          expect(b16[4]).toBe(0);
          expect(b16[5]).toBe(0);
          expect(b16[6]).toBe(0);
          expect(b16[7]).toBe(0);
          // Confirm that unpacking returns the original string.
          expect(ucs.unpack(b16)).toBe(str);
      });

      it('should correctly pack and unpack a UTF-8 string', function() {
          var str = '\ud83c\udf91';
          var utf = _.char(4);
          var b8 = utf.pack(str);
          // Validate each byte in the UTF-8 encoding.
          expect(b8[0]).toBe(0xF0);
          expect(b8[1]).toBe(0x9F);
          expect(b8[2]).toBe(0x8E);
          expect(b8[3]).toBe(0x91);
          // Confirm that the UTF-8 decoding returns the original string.
          expect(utf.unpack(b8)).toBe(str);
      });
  });

  // // ---------------------------------------------------------------------
  // //  Bitfield Check
  // // ---------------------------------------------------------------------
  describe('Bitfield Check', function() {
      it('should correctly pack and unpack an ubitLE field', function() {
          var bitle = _.struct([_.ubitLE('n', 8)]);
          var bufle = bitle.pack({ n: 0x02 });
          // Validate the size and content of the packed buffer.
          expect(bufle.length).toBe(1);
          expect(bufle[0]).toBe(0x02);
          expect(bitle.unpack(bufle).n).toBe(0x02);
      });

      it('should correctly pack and unpack mixed bitfields', function() {
          var bitzz = _.struct([
              _.bool('a'),
              _.ubit('b', 3),
              _.ubitLE('c', 3),
              _.sbit('d', 9)
          ]);
          var bufzz = bitzz.pack({ a: true, b: 1, c: 1, d: -2 });
          var backzz = bitzz.unpack(bufzz);
          // Verify the total buffer length.
          expect(bufzz.length).toBe(2);
          // Check that the boolean field is stored correctly.
          expect((bufzz[0] & 0x80) >>> 7).toBe(1);
          // Verify that the unsigned bitfield is stored correctly.
          expect((bufzz[0] & 0x70) >>> 4).toBe(1);
          // Due to modified ubitLE behavior, verify the full byte values.
          expect(bufzz[0]).toBe(0x91);
          expect(bufzz[1]).toBe(0x02);
          // Check individual bits for signed field.
          expect((bufzz[0] & 0x01) >>> 0).toBe(1);
          expect(bufzz[1] & 0xFF).toBe(2);
          // Confirm that unpacking returns the correct values.
          expect(backzz.a).toBe(true);
          expect(backzz.b).toBe(1);
          expect(backzz.c).toBe(1);
          expect(backzz.d).toBe(-2);
      });
  });

  // // ---------------------------------------------------------------------
  // //  Padding Check
  // // ---------------------------------------------------------------------
  describe('Padding Check', function() {
      it('should correctly apply padding in structures', function() {
          var things = _.struct([
              _.bool('thing1'),
              _.padTo(7),
              _.uint8('thing2')
          ]);
          // Verify that the overall structure size and field offset are as expected.
          expect(things.size).toBe(8);
          expect(things.fields.thing2.offset).toBe(7);
          var initialArray = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8]);
          var thingOut = things.pack({ thing2: 0x99 }, initialArray, { bytes: 1 });
          // Check that original values are preserved in the padded area.
          for (var i = 0; i < 8; ++i) {
              expect(thingOut[i]).toBe(i);
          }
          // Validate that the value for "thing2" is set correctly (from the original buffer).
          expect(thingOut[8]).toBe(0x99);
      });

      it('should throw an error for invalid padding configurations', function() {
      // Attempt to define a structure with invalid padding.
          expect(function() {
              _.struct([
                  _.int32('thing1'),
                  _.int32('thing2'),
                  _.padTo(7)
              ]);
          }).toThrow();
      });
  });

  // // ---------------------------------------------------------------------
  // //  Repetition Checks
  // // ---------------------------------------------------------------------
  describe('Repetition Checks', function() {
      it('should return zero size for zero-length or zero-count fields', function() {
          expect(_.byte(0, 0).size).toBe(0);
          expect(_.byte(0, 9).size).toBe(0);
          expect(_.byte(9, 0).size).toBe(0);
      });

      it('should correctly pack and unpack repeated structures', function() {
          var multiStruct = _.struct([_.uint8('n')], 2);
          var msBuf = newBuffer(multiStruct.size);
          var msArr = [];
          msBuf.fill(0xFF);
          msArr.push({ n: 0x42 });
          multiStruct.pack(msArr, msBuf);
          expect(msBuf[0]).toBe(0x42);
          expect(msBuf[1]).toBe(0xFF);
          // Set the length to 2 to trigger clearing of the second value.
          msArr.length = 2;
          multiStruct.pack(msArr, msBuf);
          expect(msBuf[0]).toBe(0x42);
          expect(msBuf[1]).toBe(0x00);
          // Now pack with both array elements set.
          msArr[1] = msArr[0];
          multiStruct.pack(msArr, msBuf);
          expect(msBuf[1]).toBe(msArr[0].n);
      });

      it('should pack arrays correctly in structures', function() {
          var afterMulti = _.struct([_.uint8('nn', 2), _.uint8('n')]);
          var amBuf = newBuffer(afterMulti.size);
          amBuf.fill(0x01);
          afterMulti.pack({ nn: [0x00], n: 0x02 }, amBuf);
          expect(amBuf[0]).toBe(0);
          expect(amBuf[2]).toBe(2);
          expect(amBuf[1]).toBe(1);
      });

      it('should handle overlong arrays gracefully', function() {
          var halfArray = _.struct([_.bool('nibble', 4), _.padTo(2)]);
          var halfBuf = new Uint8Array([0, 0]);
          halfArray.pack({ nibble: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }, halfBuf);
          expect(halfBuf[0]).toBe(0xF0);
          expect(halfBuf[1]).toBe(0x00);
      });
  });

  // // ---------------------------------------------------------------------
  // //  New Pack/Unpack API Check
  // // ---------------------------------------------------------------------
  describe('New Pack/Unpack API', function() {
      it('should return a Uint8Array and correctly unpack into an array of objects', function() {
          var newAPI = _.struct([_.uint8('nn', 2), _.uint8('n')], 2);
          var newBuf = newAPI.pack([{ nn: [0xF0], n: 0xF2 }, { nn: [0xF1], n: 0xF3 }]);
          var newArr = newAPI.unpack(newBuf);
          expect(newBuf instanceof Uint8Array).toBe(true);
          expect(newBuf.length).toBe(6);
          expect(Array.isArray(newArr)).toBe(true);
          expect(newArr.length).toBe(2);
          expect(newArr[1].nn[0]).toBe(0xF1);
      });
  });

  // // ---------------------------------------------------------------------
  // //  Derived Type Check
  // // ---------------------------------------------------------------------
  describe('Derived Type', function() {
      it('should correctly handle a derived type with custom pack/unpack logic', function() {
          var hexType = _.derive(
              _.uint32(2),
              function pack(hex) {
                  return [
                      parseInt(hex.slice(0, 8), 16),
                      parseInt(hex.slice(8, 16), 16)
                  ];
              },
              function unpack(arr) {
                  /**
                   * Convert a number to its hexadecimal representation.
                   * @param {number} n - The number to encode.
                   * @param {number} ff - Expected value (e.g. 0xFFFFFFFF).
                   * @returns {string} The uppercase hexadecimal string.
                   */
                  function _hex(n, ff) {
                      return (n + ff + 1).toString(16).slice(1).toUpperCase();
                  }
                  return _hex(arr[0], 0xFFFFFFFF) + _hex(arr[1], 0xFFFFFFFF);
              }
          );
          var bignums = ['01234567ABCDEF90', '8BADF00DC00010FF'];
          var dervStruct = _.struct([
              _.char('header', 8),
              hexType('bignums', 2),
              _.bool('footer'),
              _.bool('pad', 7)
          ]);
          var dervBuf = dervStruct.pack({ header: 'Hello.', bignums: bignums, footer: true });
          var dervObj = dervStruct.unpack(dervBuf);
          // Verify field offsets and spot-check bytes in the packed buffer.
          expect(dervStruct.fields.bignums.offset).toBe(8);
          expect(/** @type {_.Offset} */ (dervStruct.fields.footer.offset).bytes).toBe(24);
          expect(/** @type {_.Offset} */ (dervStruct.fields.footer.offset).bits).toBe(0);
          expect(dervBuf[8]).toBe(0x01);
          expect(dervBuf[15]).toBe(0x90);
          expect(dervBuf[17]).toBe(0xAD);
          expect(dervBuf[22]).toBe(0x10);
          expect(dervBuf[24]).toBe(0x80);
          // Check that the unpacked object returns the correct values.
          expect(dervObj.header).toBe('Hello.');
          expect(dervObj.bignums[0]).toBe(bignums[0]);
          expect(dervObj.bignums[1]).toBe(bignums[1]);
          expect(dervObj.footer).toBe(true);
      });

      it('should correctly handle doubly-derived fields', function() {
          var derInvert = _.derive(
              _.bool(),
              function (v) {
                  return !v;
              },
              function (v) {
                  return !v;
              }
          );
          var derString = _.derive(
              derInvert(),
              function (s) {
                  return s === 'true';
              },
              function (x) {
                  return '' + x;
              }
          );
          var derBoolArray = _.struct([
              derString('vals', 3),
              _.padTo(2)
          ]);
          // Initialize a buffer with zeros.
          var derBuf = new Uint8Array([0, 0]);
          // Pack an array of boolean string values (with an extra value that should be ignored).
          derBoolArray.pack({ vals: ['true', 'false', 'true', 'extra'] }, derBuf);
          var derObj = derBoolArray.unpack(derBuf);
          // Validate that the size is correct and the bit-level output is as expected.
          expect(derBoolArray.size).toBe(2);
          expect(derBuf[0] & 0x80).toBe(0x00); // First bit should be 0.
          expect(derBuf[0] & 0x40).toBe(0x40); // Second bit should be set.
          expect(derBuf[0] & 0x20).toBe(0x00); // Third bit should be 0.
          expect(derBuf[0]).toBe(0x40);
          expect(derBuf[1]).toBe(0x00);
          // Verify that the unpacked array has the correct values.
          expect(derObj.vals.length).toBe(3);
          expect(derObj.vals[0]).toBe('true');
          expect(derObj.vals[1]).toBe('false');
          expect(derObj.vals[2]).toBe('true');
      });
  });

  // // ---------------------------------------------------------------------
  // //  TextEncoder/Decoder Polyfill Check
  // // ---------------------------------------------------------------------
  var originalTextEncoder = globalThis.TextEncoder;
  var originalTextDecoder = globalThis.TextDecoder;

  describe('Fallback Polyfill Tests for String Encoding/Decoding', function() {
      /** @type {import('./lib')} */ var _;

      beforeAll(function() {
      // Remove TextEncoder and TextDecoder to force fallback behavior.
      // @ts-expect-error -- Operand must be optional
          delete global.TextEncoder;
          // @ts-expect-error -- Operand must be optional
          delete global.TextDecoder;
          // Clear the module cache so that the library picks up the absence of these globals.
          jest.resetModules();
          _ = require(includePath); // adjust the path as needed
      });

      afterAll(function() {
      // Restore the original globals.
          globalThis.TextEncoder = originalTextEncoder;
          globalThis.TextDecoder = originalTextDecoder;
          jest.resetModules();
      });

      describe('_.char (UTF-8)', function() {
          it('should correctly encode and decode using the fallback polyfill', function() {
              var testStr = 'Hello, World!';
              // Create a field with a buffer length longer than the string plus null terminator.
              var field = _.char(testStr.length + 2);
              // Create a buffer for encoding.
              var buffer = new Uint8Array(testStr.length + 2);
              // Use the field's pack method to encode the string into the buffer.
              var packed = field.pack(testStr, buffer);
              expect(packed.length).toBeGreaterThan(0);
              // Decode the buffer back into a string.
              var decoded = field.unpack(buffer);
              expect(decoded).toBe(testStr);
          });
      });

      describe('_.char16le (UTF-16LE)', function() {
          it('should correctly encode and decode using the fallback polyfill', function() {
              /** Mixed ASCII with non-ASCII to check UTF-16LE. */
              var testStr = 'Hello, 世界';
              var field = _.char16le((testStr.length * 2) + 2);
              var buffer = new Uint8Array((testStr.length * 2) + 2);
              var packed = field.pack(testStr, buffer);
              expect(packed.length).toBeGreaterThan(0);
              var decoded = field.unpack(buffer);
              expect(decoded).toBe(testStr);
          });
      });

      describe('_.char16be (UTF-16BE)', function() {
          it('should correctly encode and decode using the fallback polyfill', function() {
              /** Japanese greeting. */
              var testStr = 'こんにちは';
              var field = _.char16be((testStr.length * 2) + 2);
              var buffer = new Uint8Array((testStr.length * 2) + 2);
              var packed = field.pack(testStr, buffer);
              expect(packed.length).toBeGreaterThan(0);
              var decoded = field.unpack(buffer);
              expect(decoded).toBe(testStr);
          });
      });
  });

  // // ---------------------------------------------------------------------
  // //  Out of Bounds Check
  // // ---------------------------------------------------------------------
  describe('Out of Bounds Check', function() {
      it('should pack and unpack structures smaller than 32 bits correctly', function() {
          var shortStruct = _.struct([
              _.ubit('a', 2),
              _.padTo(1),
              _.ubit('b', 2),
              _.padTo(2),
              _.ubit('c', 2),
              _.padTo(3)
          ]);
          var packedShortStruct = shortStruct.pack({ a: 1, b: 2, c: 3 });
          expect(packedShortStruct.length).toBe(3);
          var unpackedShortStruct = shortStruct.unpack(packedShortStruct);
          expect(unpackedShortStruct.a).toBe(1);
          expect(unpackedShortStruct.b).toBe(2);
          expect(unpackedShortStruct.c).toBe(3);
      });
  });

  // // ---------------------------------------------------------------------
  // //  _.struct Alignment Checks
  // // ---------------------------------------------------------------------
  describe('_.struct alignment Checks', function() {
      it('should throw on misaligned bitfield at end of struct', function() {
          expect(function() {
              _.struct('BrokenBitfield', [
                  _.ubit('partial', 5)
              ]);
          }).toThrow(/Improperly aligned bitfield at end of struct/);
      });
      it('should throw on misaligned bitfield before field', function() {
          expect(function() {
              _.struct([
                  _.ubit('badBits', 3),
                  _.byte('shouldFail') // triggers the alignment check
              ]);
          }).toThrow(/Improperly aligned bitfield before field/);
      });
  });

  // // ---------------------------------------------------------------------
  // //  _.padTo Checks
  // // ---------------------------------------------------------------------
  describe('_.padTo Checks', function() {
      it('should throw if .padTo targets a past byte position', function() {
          expect(function() {
              _.struct([
                  _.uint32('a'),
                  _.padTo(3) // already at 4 bytes
              ]);
          }).toThrow(/Invalid \.padTo\(3\).*struct is already 4 bytes/);
      });

      it('should throw if .padTo fails due to bits already present', function() {
          expect(function() {
              _.struct([
                  _.ubit('a', 3),
                  _.padTo(0)
              ]);
          }).toThrow(/Invalid \.padTo\(0\).*and 3 bits/);
      });
  });

  // // ---------------------------------------------------------------------
  // //  Bitfield Width Checks
  // // ---------------------------------------------------------------------
  describe('Bitfield Width Checks', function() {
      it('should throw if bitfield width > 24 is requested', function() {
          expect(function() {
              _.ubit('tooBig', 25);
          }).toThrow('Bitfields support a maximum width of 24 bits.');
      });
      it('should default to width = 1 when not provided', function() {
      /** ubit with no width. */
          var def = _.ubit('flag');
          expect(def.width).toBe(1);
      });
  });

  // // ---------------------------------------------------------------------
  // //  FFLStoreData Decode and Re-Encode
  // // ---------------------------------------------------------------------
  describe('FFLStoreData Decode and Re-Encode', function() {
      /** Define the FFLStoreData structure which decodes a complex data record. */
      var FFLStoreData = _.struct([
          _.ubitLE('miiVersion', 8), _.ubitLE('copyable', 1), _.ubitLE('ngWord', 1), _.ubitLE('regionMove', 2),
          _.ubitLE('fontRegion', 2), _.ubitLE('reserved_0', 2), _.ubitLE('roomIndex', 4), _.ubitLE('positionInRoom', 4),
          _.ubitLE('authorType', 4), _.ubitLE('birthPlatform', 3), _.ubitLE('reserved_1', 1),
          _.struct('authorID', [_.uint8('data', 8)]),
          _.struct('createID', [_.uint8('data', 10)]),
          _.uint8('reserved_2', 2),
          _.ubitLE('gender', 1), _.ubitLE('birthMonth', 4), _.ubitLE('birthDay', 5), _.ubitLE('favoriteColor', 4),
          _.ubitLE('favorite', 1), _.ubitLE('padding_0', 1), _.char16le('name', 20), _.uint8('height'), _.uint8('build'),
          _.ubitLE('localonly', 1), _.ubitLE('faceType', 4), _.ubitLE('faceColor', 3), _.ubitLE('faceTex', 4),
          _.ubitLE('faceMake', 4), _.ubitLE('hairType', 8), _.ubitLE('hairColor', 3), _.ubitLE('hairFlip', 1), _.ubitLE('padding_1', 4),
          _.ubitLE('eyeType', 6), _.ubitLE('eyeColor', 3), _.ubitLE('eyeScale', 4), _.ubitLE('eyeAspect', 3),
          _.ubitLE('eyeRotate', 5), _.ubitLE('eyeX', 4), _.ubitLE('eyeY', 5), _.ubitLE('padding_2', 2),
          _.ubitLE('eyebrowType', 5), _.ubitLE('eyebrowColor', 3), _.ubitLE('eyebrowScale', 4), _.ubitLE('eyebrowAspect', 3),
          _.ubitLE('padding_3', 1), _.ubitLE('eyebrowRotate', 5), _.ubitLE('eyebrowX', 4), _.ubitLE('eyebrowY', 5), _.ubitLE('padding_4', 2),
          _.ubitLE('noseType', 5), _.ubitLE('noseScale', 4), _.ubitLE('noseY', 5), _.ubitLE('padding_5', 2),
          _.ubitLE('mouthType', 6), _.ubitLE('mouthColor', 3), _.ubitLE('mouthScale', 4), _.ubitLE('mouthAspect', 3), _.ubitLE('mouthY', 5),
          _.ubitLE('mustacheType', 3), _.ubitLE('padding_6', 8), _.ubitLE('beardType', 3), _.ubitLE('beardColor', 3),
          _.ubitLE('beardScale', 4), _.ubitLE('beardY', 5), _.ubitLE('padding_7', 1),
          _.ubitLE('glassType', 4), _.ubitLE('glassColor', 3), _.ubitLE('glassScale', 4), _.ubitLE('glassY', 5),
          _.ubitLE('moleType', 1), _.ubitLE('moleScale', 4), _.ubitLE('moleX', 5), _.ubitLE('moleY', 5), _.ubitLE('padding_8', 1),
          _.char16le('creatorName', 20), _.uint16le('padding_9'), _.uint16('crc')
      ]);

      // Expected to have non-ASCII names and a corresponding storeDataObj member.
      /* eslint-disable max-len -- ignore max length for data */
      var _storeDataBuffer = [
          // JasmineChlora
          new Uint8Array([0x03, 0x00, 0x00, 0x40, 0xa0, 0x41, 0x38, 0xc4, 0xa0, 0x84, 0x00, 0x00, 0xdb, 0xb8, 0x87, 0x31, 0xbe, 0x60, 0x2b, 0x2a, 0x2a, 0x42, 0x00, 0x00, 0x59, 0x2d, 0x4a, 0x00, 0x61, 0x00, 0x73, 0x00, 0x6d, 0x00, 0x69, 0x00, 0x6e, 0x00, 0x65, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1c, 0x37, 0x12, 0x10, 0x7b, 0x01, 0x21, 0x6e, 0x43, 0x1c, 0x0d, 0x64, 0xc7, 0x18, 0x00, 0x08, 0x1e, 0x82, 0x0d, 0x00, 0x30, 0x41, 0xb3, 0x5b, 0x82, 0x6d, 0x00, 0x00, 0x6f, 0x00, 0x73, 0x00, 0x69, 0x00, 0x67, 0x00, 0x6f, 0x00, 0x6e, 0x00, 0x61, 0x00, 0x6c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x90, 0x3a]),
          // chacha12_1101
          new Uint8Array([0x03, 0x00, 0x05, 0x30, 0x6d, 0x2b, 0x02, 0x22, 0x89, 0x44, 0xb7, 0xb5, 0x9c, 0x35, 0xb0, 0x37, 0x98, 0xb6, 0xe9, 0x7e, 0x6e, 0xb8, 0x00, 0x00, 0x63, 0x41, 0x63, 0x00, 0x68, 0x00, 0x61, 0x00, 0x72, 0x00, 0x6c, 0x00, 0x69, 0x00, 0x6e, 0x00, 0x65, 0x00, 0x00, 0x00, 0x00, 0x00, 0x4c, 0x26, 0x02, 0x90, 0x65, 0x06, 0xdb, 0x68, 0x44, 0x18, 0x20, 0x34, 0x46, 0x14, 0x81, 0x12, 0x13, 0x62, 0x0d, 0x00, 0x00, 0x29, 0x00, 0x52, 0x48, 0x50, 0x63, 0x00, 0x68, 0x00, 0x61, 0x00, 0x72, 0x00, 0x6c, 0x00, 0x69, 0x00, 0x6e, 0x00, 0x65, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x72, 0xdb])
      ];
      var _storeDataObj = [
          // eslint-disable-next-line
        {"miiVersion":3,"copyable":0,"ngWord":0,"regionMove":0,"fontRegion":0,"reserved_0":0,"roomIndex":0,"positionInRoom":0,"authorType":0,"birthPlatform":4,"reserved_1":0,"authorID":{"data":[160,65,56,196,160,132,0,0]},"createID":{"data":[219,184,135,49,190,96,43,42,42,66]},"reserved_2":[0,0],"gender":1,"birthMonth":12,"birthDay":10,"favoriteColor":11,"favorite":0,"padding_0":0,"name":"Jasmine","height":28,"build":55,"localonly":0,"faceType":9,"faceColor":0,"faceTex":0,"faceMake":1,"hairType":123,"hairColor":1,"hairFlip":0,"padding_1":0,"eyeType":33,"eyeColor":0,"eyeScale":7,"eyeAspect":3,"eyeRotate":3,"eyeX":2,"eyeY":14,"padding_2":0,"eyebrowType":13,"eyebrowColor":0,"eyebrowScale":4,"eyebrowAspect":6,"padding_3":0,"eyebrowRotate":7,"eyebrowX":6,"eyebrowY":12,"padding_4":0,"noseType":0,"noseScale":0,"noseY":4,"padding_5":0,"mouthType":30,"mouthColor":0,"mouthScale":1,"mouthAspect":4,"mouthY":13,"mustacheType":0,"padding_6":0,"beardType":0,"beardColor":6,"beardScale":4,"beardY":16,"padding_7":0,"glassType":3,"glassColor":3,"glassScale":7,"glassY":11,"moleType":0,"moleScale":1,"moleX":12,"moleY":27,"padding_8":0,"creatorName":"\u0000osigonal","padding_9":0,"crc":36922}, // Creator name is not null terminated.
          // eslint-disable-next-line
        {"miiVersion":3,"copyable":0,"ngWord":0,"regionMove":0,"fontRegion":0,"reserved_0":0,"roomIndex":5,"positionInRoom":0,"authorType":0,"birthPlatform":3,"reserved_1":0,"authorID":{"data":[109,43,2,34,137,68,183,181]},"createID":{"data":[156,53,176,55,152,182,233,126,110,184]},"reserved_2":[0,0],"gender":1,"birthMonth":1,"birthDay":11,"favoriteColor":0,"favorite":1,"padding_0":0,"name":"charline","height":76,"build":38,"localonly":0,"faceType":1,"faceColor":0,"faceTex":0,"faceMake":9,"hairType":101,"hairColor":6,"hairFlip":0,"padding_1":0,"eyeType":27,"eyeColor":3,"eyeScale":4,"eyeAspect":3,"eyeRotate":4,"eyeX":2,"eyeY":12,"padding_2":0,"eyebrowType":0,"eyebrowColor":1,"eyebrowScale":4,"eyebrowAspect":3,"padding_3":0,"eyebrowRotate":6,"eyebrowX":2,"eyebrowY":10,"padding_4":0,"noseType":1,"noseScale":4,"noseY":9,"padding_5":0,"mouthType":19,"mouthColor":0,"mouthScale":1,"mouthAspect":3,"mouthY":13,"mustacheType":0,"padding_6":0,"beardType":0,"beardColor":0,"beardScale":4,"beardY":10,"padding_7":0,"glassType":0,"glassColor":0,"glassScale":4,"glassY":10,"moleType":0,"moleScale":4,"moleX":2,"moleY":20,"padding_8":0,"creatorName":"charline","padding_9":0,"crc":29403}
      ];
      /* eslint-enable max-len -- ignore max length for data */

      /**
       * Utility function to check if a string consists entirely of ASCII characters.
       * @param {string} str - The string to check.
       * @returns {boolean} True if all characters are ASCII.
       */
      function isAscii(str) {
          return /^[\x00-\x7F]*$/.test(str);
      }

      // Only run tests if test data is provided.
      if (_storeDataBuffer.length > 0 && _storeDataObj.length > 0) {
          _storeDataBuffer.forEach(function (buf, i) {
              it('should correctly decode and re-encode FFLStoreData for test index ' + i, function() {
                  var decoded = FFLStoreData.unpack(buf);
                  var expected = _storeDataObj[i];
                  // Clone expected data for comparison and ignore string termination.

                  // @ts-expect-error -- ES2015 function. Don't know how to
                  // make specifically this use ES2015 and lib.js not, for now.
                  var expectedWithoutStrings = Object.assign({}, expected);
                  ['name', 'creatorName'].forEach(function (field) {
                      // Ensure that the decoded field only contains ASCII characters.
                      expect(isAscii(decoded[field])).toBe(true);
                      // Clear the fields for comparison purposes.
                      decoded[field] = '';
                      expectedWithoutStrings[field] = '';
                  });
                  // Compare the JSON representations.
                  expect(JSON.stringify(decoded)).toBe(JSON.stringify(expectedWithoutStrings));
                  // Repack and compare the buffers.
                  var rePacked = FFLStoreData.pack(expected);
                  expect(new Uint8Array(rePacked).toString()).toBe(new Uint8Array(buf).toString());
              });
          });
      } else {
          it('should skip FFLStoreData tests because test data is not provided', function() {
              console.warn('Skipping FFLStoreData tests because _storeDataBuffer and _storeDataObj are empty.');
          });
      }
  });
});
