# struct-fu

Convert between JSON and binary according to a given field layout/structure declaration. `struct-fu` is [yet another] buffer reading/writing helper; sort of like `typedef struct foo` for JavaScript.


## Installation

`npm install struct-fu`

## Example


```
var _ = require('struct-fu');

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
    _.byte('reserved', 10),
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

var obj0 = {filename:"autoexec", extension:"batch", flags:{reserved:2,archive:true}},
    _buf = entry.bytesFromValue(obj0),
    obj1 = entry.valueFromBytes(_buf);
console.log('',obj0, "\n==>\n", obj1);
```

## Concepts

- No hidden/implicit padding or alignment (WYSIWYG)
- If `count` is provided, the field represents an array of that type.
- Defaults to network byte order (Big Endian); or use `le` suffix (Little Endian)
- Bit fields are declared in Most Significant to Least Significant bit order (tip: `[/*…fields…*/].reverse()` to swap)
- When writing, default values are provided.

## API

### Normal field types

Here are the available "normal" field types. Note that for standalone fields the `name` and `count` parameters are always optional. For fields nested within a struct field, you must provide a `name`.

- `_.struct(name, fields, count)` — `fields` is an array of nested fields, which will be packed directly one after another with no concern for any particular compiler's alignment preferences. The first field in the array will start at the first byte in the buffer. (For bitfields you may wish to provide a `fields.reverse()` value to match little endian compilers.) Anonymous (i.e. un-named) structs will read/write fields directly within their parent struct; this is useful for reusing common fields or inlining bitfields.
- `_.char(name, size, count)` — UTF-8 string. Writes NUL-terminated only if too short, not if string fits exact size or gets truncated. Reads to NUL or full size, whichever comes first. Note that node.js will not write incomplete characters from the BMP (i.e. Unicode code points that can be represented by a single `.charCodeAt()`), but does seem to split some UTF-8ish semblance of surrogate pairs.
- `_.char16(name, size, count)` — UTF-16BE string. This has the same behavior as `_.char`. Node.js may truncate between surrogate pairs rather than Unicode code points, but if given an odd-length buffer will terminate with `\0` rather than half of a `.charCodeAt()` value.
- `_.byte(name, size, count)` — Binary buffer. Writes truncated or zero padded as necessary. Always reads field to full size.
- `_.<numeric type>(name, count)` — Floats and integers, defaulting to network byte order (i.e. Big Endian) or you can use the `…le` versions. Numeric type fields pretty much correspond directly to the equivalent node.js `Buffer` read/write methods you would expect. (There are no 64-bit integers because JavaScript does not properly support the full range of such values.)
    - `_.float32`
    - `_.float64`
    - `_.uint8`
    - `_.uint16`
    - `_.uint32`
    - `_.int8`
    - `_.int16`
    - `_.int32`
    - `_.float32le`
    - `_.float64le`
    - `_.uint16le`
    - `_.uint32le`
    - `_.int16le`
    - `_.int32le`

All the field above implement the same interface once created:

- `field.name` — The name of this field instance or `null` if none was provided.
- `field.size` — The total size of buffer this field (including any nested/repeated fields) will read/write.
- `field.bytesFromValue(val, buf)` — The type of `val` provided will depend on the field (e.g. number for numerics, object for structs, array for any counted field), but this method always returns a buffer. `buf` is optional — if you do not provide a slice of an existing buffer to fill, a new buffer of length `field.size` will be returned.
- `field.valueFromBytes(buf)` — Returns a JavaScript value extracted from the provided buffer.

You can use each of these fields nested inside a structure, or on their own. For example, `_.uint32(2).valueFromBytes(Buffer(8))` uses an anonymous field to convert the unitialized buffer into an array of two somewhat-random numbers.


### Bitfield types

These fields are intended for use *only* within a parent `_.struct` field (and therefore `name` is not optional):

- `_.bool(name, count)` — A single bit, read back as a boolean.
- `_.ubit(name, width, count)` — An unsigned integer; most significant bit first.
- `_.sbit(name, width, count)` — A signed integer; if the most sigificant bit is set the value is negative.

Except for the `bitfield.name` and `bitfield.width` properties, the bitfield interface (used internally by `_.struct`) is undocumented and subject to change.

## License

© 2014 Nathan Vander Wilt
Funding for this work was provided in part by Technical Machine, Inc.

Reuse under your choice of:

* [BSD-2-Clause](http://opensource.org/licenses/BSD-2-Clause)
* [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)
