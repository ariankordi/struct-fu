// @ts-check
// not eslinted

var _ = require("./lib");

// new Buffer() is deprecated in recent node. This ensures
// we always use the correct method for the current node.
/**
 * @param {number} size
 * @returns {Buffer}
 */
function newBuffer(size) {
    if (Buffer.alloc) {
        return Buffer.alloc(size);
    } else {
        return new Buffer(size);
    }
}

/**
 * @param {*} content - NOTE don't know type for this
 * @param {BufferEncoding} [encoding]
 * @returns {Buffer}
 */
function bufferFrom(content, encoding) {
    if (Buffer.from) {
        return Buffer.from(content, encoding);
    } else {
        return new Buffer(content, encoding);
    }
}

var entry = _.struct([
    _.char('filename',8),
    _.char('extension',3),
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
        _.ubit('hour',5),
        _.ubit('minutes',6),
        _.ubit('seconds',5)
    ]),
    _.struct('date', [
        _.ubit('year',7),
        _.ubit('month',4),
        _.ubit('day',5)
    ]),
    _.uint16le('cluster'),
    _.uint32le('filesize')
]);

var obj0 = {filename:"autoexec", extension:"batch", flags:{reserved:0x82,archive:true}},
    _buf = entry.pack(obj0),
    obj1 = entry.unpack(_buf);
console.log('',obj0, "\n==>\n", obj1);
//console.log(_buf);

console.log("\nRunning tests.");

// NEW addition: Batch assertion failures, highlight them in red.
var failedMsg = [];
/**
 * @param {boolean} b - condition
 * @param {string} msg
 */
function assert(b, msg) {
    if (!b) {
        debugger
        //throw Error("Assertion failure. "+msg);
        failedMsg.push(msg);
        console.warn("\u001b[1m\u001b[31mASSERTION FAILURE: \u001b[0m"+msg);
    } else {
        console.log(msg);
    }
}

console.log("  = API check =  ");
assert('fields' in entry, "Entry has fields property.");
assert('reserved' in entry.fields, "Entry fields contain 'reserved' bytefield.");
assert('reserved1' in entry.fields, "Entry fields contain hoisted 'reserved1' bytefield.");
assert('reserved2' in entry.fields, "Entry fields contain hoisted 'reserved2' bytefield.");
assert('time' in entry.fields, "Entry fields contain 'time' struct.");
assert(entry.fields.time.offset === 22, "Offset is correct for 'time' struct.");
assert('field' in entry.fields.reserved, "Reserved array allows access to underlying field");
// Originally misspelled, don't know what this was testing:
//assert(!('offset' in entry.fields.reserved.field), "Reserved array's underlying field does not have an offset…");
assert(entry.fields.reserved.offset === 12, "...but reserved array field itself does, and said offset is correct.");
assert(/** @type {_.Offset} */ (entry.fields.reserved2.offset).bytes === 21, "Hoisted field 'reserved2' has correct offset.");

console.log("  = Write check =  ");
var _bufKnown = bufferFrom("6175746f65786563626174a00000000000000000000000000000000000000000", 'hex');
assert(_bufKnown.length === 32, "Runtime parsed known buffer as 'hex'.");
assert(_bufKnown[0] === 0x61 && _bufKnown[7] === 0x63 && _bufKnown[31] === 0, "Known buffer parse passes spot check.");
assert(_buf.length === _bufKnown.length, "Buffer size matches");
for (var i = 0, len = _buf.length; i < len; ++i) assert(_buf[i] === _bufKnown[i], "Buffer contents match at "+i);

console.log("  = Read checks =  ");
assert(obj1.filename === obj0.filename, "Filename field matches");
assert(obj1.extension === obj0.extension.slice(0,3), "(Truncated) extension matches");
assert(obj1.flags.reserved === (obj0.flags.reserved & 0x03), "(Expected bits) of reserved flags match");
assert(obj1.flags.archive === true, "Archive bit set");
assert(obj1.flags.system === false, "System bit not set");
assert(Array.isArray(obj1.reserved), "Reserved array is an array");
//assert(Buffer.isBuffer(obj1.reserved[0]), "Reserved array contains a buffer");
// NEW: API is now returning Uint8Array within structs.
assert(obj1.reserved[0] instanceof Uint8Array, "Reserved array contains a Uint8Array");
assert(obj1.reserved[1][0] === 0, "Reserved array buffer passes content sniff test");
assert(obj1.time.hour === 0, "Hour value as expected");
assert(obj1.cluster === 0, "Cluster value as expected");
assert(obj1.filesize === 0, "Filesize value as expected");

console.log("  = Unicode check = ");
var str = "\ud83c\udf91",
    ucs = _.char16le(8),
    b16 = ucs.pack(str);
assert(b16[0] === 0x3c, "UTF-16 byte 0 as expected");
assert(b16[1] === 0xd8, "UTF-16 byte 1 as expected");
assert(b16[2] === 0x91, "UTF-16 byte 2 as expected");
assert(b16[3] === 0xdf, "UTF-16 byte 3 as expected");
assert(b16[4] === 0, "UTF-16 byte 4 as expected");
assert(b16[5] === 0, "UTF-16 byte 5 as expected");
assert(b16[6] === 0, "UTF-16 byte 6 as expected");
assert(b16[7] === 0, "UTF-16 byte 7 as expected");
assert(ucs.unpack(b16) === str, "UTF-16LE converted back correctly.");
var str = "\ud83c\udf91",
    ucs = _.char16be(8),
    b16 = ucs.pack(str);
assert(b16[0] === 0xd8, "UTF-16BE byte 0 as expected");
assert(b16[1] === 0x3c, "UTF-16BE byte 1 as expected");
assert(b16[2] === 0xdf, "UTF-16BE byte 2 as expected");
assert(b16[3] === 0x91, "UTF-16BE byte 3 as expected");
assert(b16[4] === 0, "UTF-16BE byte 4 as expected");
assert(b16[5] === 0, "UTF-16BE byte 5 as expected");
assert(b16[6] === 0, "UTF-16BE byte 6 as expected");
assert(b16[7] === 0, "UTF-16BE byte 7 as expected");
assert(ucs.unpack(b16) === str, "UTF-16BE converted back correctly.");
var utf = _.char(4),
    b_8 = utf.pack(str);
//console.log(b_8);
assert(b_8[0] === 0xF0, "UTF-8 byte 0 as expected");
assert(b_8[1] === 0x9F, "UTF-8 byte 1 as expected");
assert(b_8[2] === 0x8E, "UTF-8 byte 2 as expected");
assert(b_8[3] === 0x91, "UTF-8 byte 3 as expected");
assert(utf.unpack(b_8) === str, "UTF-8 converted back correctly.");


console.log("  = Bitfield check = ");
var bitle = _.struct([
    _.ubitLE('n', 8)
]), bufle = bitle.pack({n:0x02});
assert(bufle.length === 1, "ubitLE buffer has correct size.");
//assert(bufle[0] === 0x40, "ubitLE buffer has correct value.");
// NEW: ubitLE behavior is different to match GCC.
assert(bufle[0] === 0x02, "ubitLE buffer has correct value.");
assert(bitle.unpack(bufle).n === 0x02, "ubitLE conversion back has original value.");

var bitzz = _.struct([
    _.bool('a'),
    _.ubit('b', 3),
    _.ubitLE('c', 3),
    _.sbit('d', 9)
]), bufzz = bitzz.pack({a:true, b:1, c:1, d:-2}), backzz = bitzz.unpack(bufzz);
assert(bufzz.length === 2, "Bitfield buffer has correct size.");
//console.log((0x100+bufzz[0]).toString(2).slice(1), (0x100+bufzz[1]).toString(2).slice(1));
assert((bufzz[0] & 0x80) >>> 7 === 1, "Bitfield bool stored correctly.");
assert((bufzz[0] & 0x70) >>> 4 === 1, "Bitfield ubit stored correctly.");
//assert((bufzz[0] & 0x0E) >>> 1 === 4, "Bitfield ubitLE stored correctly.");
// NEW: ubitLE behavior modified here.
//assert((truncatedReadUInt32(bufzz, 0, true) >>> 4) & 0x07 === 4, "Bitfield ubitLE stored correctly.");
// TODO?
assert(bufzz[0] === 0x91 && bufzz[1] === 0x02, "Bitfield ubitLE stored correctly, probably, from comparison of entire test buffer");

assert((bufzz[0] & 0x01) >>> 0 === 1, "Bitfield sbit sign stored correctly.");
assert((bufzz[1] & 0xFF) >>> 0 === 2, "Bitfield sbit value stored correctly.");
assert(backzz.a === true, "Bitfield bool read back correctly.");
assert(backzz.b === 1, "Bitfield ubit read back correctly.");
assert(backzz.c === 1, "Bitfield ubitLE read back correctly.");
assert(backzz.d === -2, "Bitfield sbit read back correctly.");

console.log (" = Padding check = ");

var things = _.struct([
    _.bool('thing1'),
    _.padTo(7),
    _.uint8('thing2')
]);
assert(things.size === 8, "Padded structure has correct size.");
assert(things.fields.thing2.offset === 7, "Field after padding is at correct offset.");
var thingOut = things.pack({thing2:0x99}, bufferFrom([0,1,2,3,4,5,6,7,8]), {bytes:1});
for (var i = 0; i < 8; ++i) assert(thingOut[i] === i, "Padded output has original value at index "+i);
assert(thingOut[i] === 0x99, "Padded output has correct value at index "+i);

var threw = false;
try {
    _.struct([
        _.int32('thing1'),
        _.int32('thing2'),
        _.padTo(7)
    ]);
} catch (e) {
  threw = e;
} finally {
    console.log("THREW", threw);
    assert(threw, "Invalid padding detected.");
}

console.log (" = Repetition checks = ");

assert(_.byte(0,0).size === 0, "Size of zero-length and zero-count field is zero.");
assert(_.byte(0,9).size === 0, "Size of zero-length and multi-count field is still zero.");
assert(_.byte(9,0).size === 0, "Size of zero-count of a field with length is still zero.");

var multiStruct = _.struct([_.uint8('n')], 2),
    msBuf = newBuffer(multiStruct.size),
    msArr = [];
msBuf.fill(0xFF);
msArr.push({n:0x42});
multiStruct.pack(msArr, msBuf);
assert(msBuf[0] === 0x42, "First value set.");
assert(msBuf[1] === 0xFF, "Next value left.");
msArr.length = 2;
multiStruct.pack(msArr, msBuf);
assert(msBuf[0] === 0x42, "First value still set.");
assert(msBuf[1] === 0x00, "Next value is cleared.");
msArr[1] = msArr[0];
multiStruct.pack(msArr, msBuf);
assert(msBuf[1] === msArr[0].n, "Values as expected.");

var afterMulti = _.struct([_.uint8('nn', 2), _.uint8('n')]),
    amBuf = newBuffer(afterMulti.size);
amBuf.fill(0x01);
afterMulti.pack({nn:[0x00], n:0x02}, amBuf);
assert(amBuf[0] === 0, "Array value correct.");
assert(amBuf[2] === 2, "After array in expected position.");
assert(amBuf[1] === 1, "Array missing correctly.");

var halfArray = _.struct([_.bool('nibble', 4), _.padTo(2)]),
    halfBuf = bufferFrom([0,0]);
halfArray.pack({nibble:[1,1,1,1, 1,1,1,1, 1,1,1,1]}, halfBuf);
assert(halfBuf[0] === 0xF0, "First byte set as expected when providing overlong array");
assert(halfBuf[1] === 0x00, "Second byte set as expected when providing overlong array");

console.log (" = New pack/unpack API = ");

var newAPI = _.struct([_.uint8('nn', 2), _.uint8('n')], 2),
    newBuf = newAPI.pack([{nn:[0xF0], n:0xF2}, {nn:[0xF1], n:0xF3}]),
    newArr = newAPI.unpack(newBuf);
//assert(Buffer.isBuffer(newBuf), "New API still returns buffer");
assert(newBuf instanceof Uint8Array, "New (NEW) API returns Uint8Array");
assert(newBuf.length === 6, "New API buffer is correct length");
assert(Array.isArray(newArr), "New API unpacks expected object type");
assert(newArr.length === 2, "New API unpacked array is correct length");
assert(newArr[1].nn[0] === 0xF1, "...and contains expected value.");

console.log (" = Derived type = ");

var hexType = _.derive(_.uint32(2), function pack(hex) {
    return [ parseInt(hex.slice(0,8), 16), parseInt(hex.slice(8,16), 16) ]
}, function unpack(arr) {
    /**
     * @param {number} n - Number to hex encode.
     * @param {number} ff - Expected value: 0xFFFFFFFF
     * @returns {string} The value encoded in hexadecimal in uppercase.
     */
    function _hex(n,ff) {
        return (n+ff+1).toString(16).slice(1).toUpperCase();
    }
    return _hex(arr[0], 0xFFFFFFFF) + _hex(arr[1], 0xFFFFFFFF)
});

var bignums = ["01234567ABCDEF90", "8BADF00DC00010FF"],
    dervStruct = _.struct([_.char('header',8), hexType('bignums',2), _.bool('footer'), _.bool('pad',7)]),
    dervBuf = dervStruct.pack({header:"Hello.", bignums:bignums, footer:true}),
    dervObj = dervStruct.unpack(dervBuf);

assert(dervStruct.fields.bignums.offset === 8, "Derived field is at correct offset.");
assert(/** @type {_.Offset} */ (dervStruct.fields.footer.offset).bytes === 24, "Field following derived field is at correct byte offset.");
assert(/** @type {_.Offset} */ (dervStruct.fields.footer.offset).bits === 0, "Field following derived field is at correct bit offset.");
assert(dervBuf[8] === 0x01 && dervBuf[15] === 0x90, "Spot check of first packed value looks alright.");
assert(dervBuf[17] === 0xAD && dervBuf[22] === 0x10, "Spot check of second packed value looks alright.");
assert(dervBuf[24] === 0x80, "Following field packed as expected.");
assert(dervObj.header === "Hello.", "Preceding field is correct, yawn...");
assert(dervObj.bignums[0] === bignums[0], "First array item unpacked via derived field is correct.");
assert(dervObj.bignums[1] === bignums[1], "Second array item unpacked via derived field is correct.");
assert(dervObj.footer, "Following field value correct.");

var derInvert = _.derive(_.bool(), function (v) { return !v }, function (v) { return !v }),
    derString = _.derive(derInvert(), function (s) { return s === 'true' }, function (x) { return ''+x }),
    derBoolArray = _.struct([
      derString('vals', 3),
      _.padTo(2)
    ]),
    derBuf = bufferFrom("0000", 'hex'),
    __ = derBoolArray.pack({vals:['true', 'false', 'true', "extra"]}, derBuf),
    derObj = derBoolArray.unpack(derBuf);

assert(derBoolArray.size === 2, "Struct with doubly-derived field is correct size.");
assert((derBuf[0] & 0b10000000) === 0b00000000, "First bit in doubly-derived output is correct.");
assert((derBuf[0] & 0b01000000) === 0b01000000, "Second bit in doubly-derived output is correct.");
assert((derBuf[0] & 0b00100000) === 0b00000000, "Third bit in doubly-derived output is correct.");
assert(derBuf[0] === 0x40, "First byte packed fully as expected.");
assert(derBuf[1] === 0x00, "Padding after derived field packed as expected.");
assert(derObj.vals.length === 3, "Doubly-derived rountripped array has correct length.");
assert(derObj.vals[0] === 'true', "Doubly-derived first value round-tripped correctly.");
assert(derObj.vals[1] === 'false', "Doubly-derived second value round-tripped correctly.");
assert(derObj.vals[0] === 'true', "Doubly-derived third value round-tripped correctly.");

console.log (" = Out of bounds check = ");

var shortStruct = _.struct([
    _.ubit('a', 2),
    _.padTo(1),
    _.ubit('b', 2),
    _.padTo(2),
    _.ubit('c', 2),
    _.padTo(3)
]);

var packedShortStruct = shortStruct.pack({ a: 1, b: 2, c: 3 });
assert(packedShortStruct.length === 3, "Struct less than 32 bits packs successfully");

var unpackedShortStruct = shortStruct.unpack(packedShortStruct);
assert(unpackedShortStruct.a === 1, "First bit in unpacked < 32 bit structs is unpacked correctly");
assert(unpackedShortStruct.b === 2, "Second bit in unpacked < 32 bit structs is unpacked correctly");
assert(unpackedShortStruct.c === 3, "Third bit in unpacked < 32 bit structs is unpacked correctly");

// -------------- FFLStoreData decode and re-encode sanity check --------------

var FFLStoreData = _.struct([
    _.ubitLE('miiVersion', 8), _.ubitLE('copyable', 1), _.ubitLE('ngWord', 1), _.ubitLE('regionMove', 2),
    _.ubitLE('fontRegion', 2), _.ubitLE('reserved_0', 2), _.ubitLE('roomIndex', 4), _.ubitLE('positionInRoom', 4),
    _.ubitLE('authorType', 4), _.ubitLE('birthPlatform', 3), _.ubitLE('reserved_1', 1),

    _.struct('authorID', [ _.uint8('data', 8) ]),
    _.struct('createID', [ _.uint8('data', 10) ]), _.uint8('reserved_2', 2),

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

// NOTE: if you use _.byte it'll decode to Buffer??

// Expected to have non-ASCII names and a corresponding storeDataObj member.
var _storeDataBuffer = [
    // JasmineChlora
    bufferFrom('AwAAQKBBOMSghAAA27iHMb5gKyoqQgAAWS1KAGEAcwBtAGkAbgBlAAAAAAAAABw3EhB7ASFuQxwNZMcYAAgegg0AMEGzW4JtAABvAHMAaQBnAG8AbgBhAGwAAAAAAJA6', 'base64'),
    // chacha12_1101
    bufferFrom('AwAFMG0rAiKJRLe1nDWwN5i26X5uuAAAY0FjAGgAYQByAGwAaQBuAGUAAAAAAEwmApBlBttoRBggNEYUgRITYg0AACkAUkhQYwBoAGEAcgBsAGkAbgBlAAAAAAAAAHLb', 'base64')
];
var _storeDataObj = [
    {"miiVersion":3,"copyable":0,"ngWord":0,"regionMove":0,"fontRegion":0,"reserved_0":0,"roomIndex":0,"positionInRoom":0,"authorType":0,"birthPlatform":4,"reserved_1":0,"authorID":{"data":[160,65,56,196,160,132,0,0]},"createID":{"data":[219,184,135,49,190,96,43,42,42,66]},"reserved_2":[0,0],"gender":1,"birthMonth":12,"birthDay":10,"favoriteColor":11,"favorite":0,"padding_0":0,"name":"Jasmine","height":28,"build":55,"localonly":0,"faceType":9,"faceColor":0,"faceTex":0,"faceMake":1,"hairType":123,"hairColor":1,"hairFlip":0,"padding_1":0,"eyeType":33,"eyeColor":0,"eyeScale":7,"eyeAspect":3,"eyeRotate":3,"eyeX":2,"eyeY":14,"padding_2":0,"eyebrowType":13,"eyebrowColor":0,"eyebrowScale":4,"eyebrowAspect":6,"padding_3":0,"eyebrowRotate":7,"eyebrowX":6,"eyebrowY":12,"padding_4":0,"noseType":0,"noseScale":0,"noseY":4,"padding_5":0,"mouthType":30,"mouthColor":0,"mouthScale":1,"mouthAspect":4,"mouthY":13,"mustacheType":0,"padding_6":0,"beardType":0,"beardColor":6,"beardScale":4,"beardY":16,"padding_7":0,"glassType":3,"glassColor":3,"glassScale":7,"glassY":11,"moleType":0,"moleScale":1,"moleX":12,"moleY":27,"padding_8":0,"creatorName":"\u0000osigonal","padding_9":0,"crc":36922}, // Creator name is not null terminated.
    {"miiVersion":3,"copyable":0,"ngWord":0,"regionMove":0,"fontRegion":0,"reserved_0":0,"roomIndex":5,"positionInRoom":0,"authorType":0,"birthPlatform":3,"reserved_1":0,"authorID":{"data":[109,43,2,34,137,68,183,181]},"createID":{"data":[156,53,176,55,152,182,233,126,110,184]},"reserved_2":[0,0],"gender":1,"birthMonth":1,"birthDay":11,"favoriteColor":0,"favorite":1,"padding_0":0,"name":"charline","height":76,"build":38,"localonly":0,"faceType":1,"faceColor":0,"faceTex":0,"faceMake":9,"hairType":101,"hairColor":6,"hairFlip":0,"padding_1":0,"eyeType":27,"eyeColor":3,"eyeScale":4,"eyeAspect":3,"eyeRotate":4,"eyeX":2,"eyeY":12,"padding_2":0,"eyebrowType":0,"eyebrowColor":1,"eyebrowScale":4,"eyebrowAspect":3,"padding_3":0,"eyebrowRotate":6,"eyebrowX":2,"eyebrowY":10,"padding_4":0,"noseType":1,"noseScale":4,"noseY":9,"padding_5":0,"mouthType":19,"mouthColor":0,"mouthScale":1,"mouthAspect":3,"mouthY":13,"mustacheType":0,"padding_6":0,"beardType":0,"beardColor":0,"beardScale":4,"beardY":10,"padding_7":0,"glassType":0,"glassColor":0,"glassScale":4,"glassY":10,"moleType":0,"moleScale":4,"moleX":2,"moleY":20,"padding_8":0,"creatorName":"charline","padding_9":0,"crc":29403}
];

/**
 * Check if all characters are ASCII.
 * @param {string} str
 * @returns {boolean}
 */
function isAscii(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

_storeDataBuffer.forEach((buf, i) => {
    var decoded = FFLStoreData.unpack(buf);
    var expected = _storeDataObj[i];

    // Make a clone of expected.
    var expectedWithoutStrings = Object.assign({}, expected);
    // Special case for string fields.
    ['name', 'creatorName'].forEach(/** @param {string} field */ (field) => {
        // Validate that there are no strange non-ASCII characters.
        // The test data only has ASCII names, this is just a sanity test
        assert(isAscii(decoded[field]), 'Field ' + field + ' in FFLStoreData only has ASCII characters');
        // Clear from comparison, they are not null terminated usually
        decoded[field] = ''; // Clear field.
        expectedWithoutStrings[field] = '';
    });

    var match = JSON.stringify(decoded) === JSON.stringify(expectedWithoutStrings);
    assert(match, 'FFLStoreData index ' + i + ' unpacked to object matches');

    var rePacked = FFLStoreData.pack(expected); // Pack expected since we know it's equal
    var reMatch = new Uint8Array(rePacked).toString() === new Uint8Array(buf).toString();
    assert(reMatch, 'FFLStoreData index ' + i + ' repacked matches');
});

// ------------------ Show results and print from failedMsg ------------------

if (failedMsg.length > 0) {
    console.log("\n\u001b[1m\u001b[31mSome tests failed!!!\u001b[1m\u001b[0m");
    console.log(failedMsg);
} else {
    console.log("\nAll tests passed!");
}
