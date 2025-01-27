var _ = {};

function newBuffer(size) {
    return new Uint8Array(new ArrayBuffer(size));
}

function extend(obj) {
    var args = Array.prototype.slice.call(arguments, 1);
    args.forEach(function (ext) {
        Object.keys(ext).forEach(function (key) {
            obj[key] = ext[key];
        });
    });
    return obj;
}

function addField(ctr, f) {
    if ('width' in f) {
        ctr.bits = (ctr.bits || 0) + f.width;
        while (ctr.bits > 7) {
            ctr.bytes += 1;
            ctr.bits -= 8;
        }
    } else if (!ctr.bits) {
        ctr.bytes += f.size;
    } else {
        throw Error("Improperly aligned bitfield before field: "+f.name);
    }
    return ctr;
}

function arrayizeField(f, count) {
    var f2 = (typeof count === 'number') ? extend({
        name: f.name,
        field: f,
        valueFromBytes: function (buf, off) {
            off || (off = {bytes:0, bits:0});
            var arr = new Array(count);
            for (var idx = 0, len = arr.length; idx < len; idx += 1) {
                arr[idx] = f.valueFromBytes(buf, off);
            }
            return arr;
        },
        bytesFromValue: function (arr, buf, off) {
            arr || (arr = new Array(count));
            buf || (buf = newBuffer(this.size));
            off || (off = {bytes:0, bits:0});
            for (var idx = 0, len = Math.min(arr.length, count); idx < len; idx += 1) {
                f.bytesFromValue(arr[idx], buf, off);
            }
            while (idx++ < count) addField(off, f);
            return buf;
        }
    }, ('width' in f) ? {width: f.width * count} : {size: f.size * count}) : f;
    f2.pack = f2.bytesFromValue;
    f2.unpack = f2.valueFromBytes;
    return f2;
}

_.struct = function (name, fields, count) {
    if (typeof name !== 'string') {
        count = fields;
        fields = name;
        name = null;
    }
    
    var _size = {bytes:0, bits:0},
        _padsById = Object.create(null),
        fieldsObj = fields.reduce(function (obj, f) {
            if ('_padTo' in f) {
                // HACK: we really should just make local copy of *all* fields
                f._id || (f._id = 'id' + Math.random().toFixed(20).slice(2)); // WORKAROUND: https://github.com/tessel/runtime/issues/716
                var _f = _padsById[f._id] = (_size.bits) ? {
                    width: 8*(f._padTo - _size.bytes) - _size.bits
                } : {
                    size: f._padTo - _size.bytes
                };
                if ((_f.width !== undefined && _f.width < 0) || (_f.size !== undefined && _f.size < 0)) {
                    var xtraMsg = (_size.bits) ? (" and " + _size.bits + " bits") : '';
                    throw Error("Invalid .padTo(" + f._padTo + ") field, struct is already " + _size.bytes + " byte(s)" + xtraMsg + "!");
                }
                f = _f;
            }
            else if (f._hoistFields) {
                Object.keys(f._hoistFields).forEach(function (name) {
                    var _f = Object.create(f._hoistFields[name]);
                    if ('width' in _f) {
                        _f.offset = { bytes: _f.offset.bytes + _size.bytes, bits: _f.offset.bits };
                    } else {
                        _f.offset += _size.bytes;
                    }
                    obj[name] = _f;
                });
            }
            else if (f.name) {
                f = Object.create(f);           // local overrides
                f.offset = ('width' in f) ? {bytes:_size.bytes,bits:_size.bits} : _size.bytes,
                obj[f.name] = f;
            }
            addField(_size, f);
            return obj;
        }, {});
    if (_size.bits) throw Error("Improperly aligned bitfield at end of struct: "+name);
    
    return arrayizeField({
        valueFromBytes: function (buf, off) {
            off || (off = {bytes:0, bits:0});
            var obj = new Object();
            fields.forEach(function (f) {
                if ('_padTo' in f) return addField(off, _padsById[f._id]);
                
                var value = f.valueFromBytes(buf, off);
                if (f.name) obj[f.name] = value;
                else if (typeof value === 'object') extend(obj, value);
            });
            return obj;
        },
        bytesFromValue: function (obj, buf, off) {
            obj || (obj = {});
            buf || (buf = newBuffer(this.size));
            off || (off = {bytes:0, bits:0});
            fields.forEach(function (f) {
                if ('_padTo' in f) return addField(off, _padsById[f._id]);
                
                var value = (f.name) ? obj[f.name] : obj;
                f.bytesFromValue(value, buf, off);
            });
            return buf;
        },
        _hoistFields: (!name) ? fieldsObj : null,
        fields: fieldsObj,
        size: _size.bytes,
        name: name
    }, count);
};

function truncatedReadUInt32BE(buffer, offset) {
    var bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    var availableBytes = bytes.length - offset;
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    if (availableBytes >= 4) {
        return view.getUint32(offset, false);
    } else if (availableBytes === 3) {
        var first = view.getUint16(offset, false);
        var second = view.getUint8(offset + 2);
        return ((first << 8) + second) << 8 >>> 0;
    } else if (availableBytes === 2) {
        return view.getUint16(offset, false) << 16 >>> 0;
    } else if (availableBytes === 1) {
        return view.getUint8(offset) << 24 >>> 0;
    } else {
        return 0x0;
    }
}
function truncatedWriteUInt32BE(buffer, offset, data) {
    var bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    var availableBytes = bytes.length - offset;
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    if (availableBytes >= 4) {
        view.setUint32(offset, data, false);
    } else if (availableBytes === 3) {
        view.setUint16(offset, data >>> 16, false);
        view.setUint8(offset + 2, (data >>> 8) & 0xff);
    } else if (availableBytes === 2) {
        view.setUint16(offset, data >>> 16, false);
    } else if (availableBytes === 1) {
        view.setUint8(offset, data >>> 24);
    }
}
_.padTo = function (off) {
    return {_padTo:off};
};


// NOTE: bitfields must be embedded in a struct (C/C++ share this limitation)

var FULL = 0xFFFFFFFF;
function bitfield(name, width, count) {
    width || (width = 1);
    // NOTE: width limitation is so all values will align *within* a 4-byte word
    if (width > 24) throw Error("Bitfields support a maximum width of 24 bits.");
    var impl = this,
        mask = FULL >>> (32 - width);
    return arrayizeField({
        valueFromBytes: function (buf, off) {
            off || (off = {bytes:0, bits:0});
            var end = (off.bits || 0) + width,
                word = truncatedReadUInt32BE(buf, off.bytes) || 0,
                over = word >>> (32 - end);
            addField(off, this);
            return impl.b2v.call(this, over & mask);
        },
        bytesFromValue: function (val, buf, off) {
            val = impl.v2b.call(this, val || 0);
            off || (off = {bytes:0, bits:0});
            var end = (off.bits || 0) + width,
                word = truncatedReadUInt32BE(buf, off.bytes) || 0,
                zero = mask << (32 - end),
                over = (val & mask) << (32 - end);
            word &= ~zero;
            word |= over;
            word >>>= 0;      // WORKAROUND: https://github.com/tessel/runtime/issues/644
            truncatedWriteUInt32BE(buf, off.bytes, word);
            addField(off, this);
            return buf;
        },
        width: width,
        name: name
    }, count);
}

function swapBits(n, w) {
    var o = 0;
    while (w--) {
        o <<= 1;
        o |= n & 1;
        n >>>= 1;
    }
    return o;
}


_.bool = function (name, count) {
    return bitfield.call({
        b2v: function (b) { return Boolean(b); },
        v2b: function (v) { return (v) ? FULL : 0; }
    }, name, 1, count);

};
_.ubit = bitfield.bind({
    b2v: function (b) { return b; },
    v2b: function (v) { return v; }
});
_.ubitLE = bitfield.bind({
    b2v: function (b) { return swapBits(b, this.width); },
    v2b: function (v) { return swapBits(v, this.width); }
});
_.sbit = bitfield.bind({        // TODO: handle sign bit…
    b2v: function (b) {
        var m = 1 << (this.width-1),
            s = b & m;
        return (s) ? -(b &= ~m) : b;
    },
    v2b: function (v) {
        var m = 1 << (this.width-1),
            s = (v < 0);
        return (s) ? (-v | m) : v;
    }
});


function bytefield(name, size, count) {
    if (typeof name !== 'string') {
        count = size;
        size = name;
        name = null;
    }
    size = (typeof size === 'number') ? size : 1;
    var impl = this;
    return arrayizeField({
        valueFromBytes: function (buf, off) {
            off || (off = {bytes:0, bits:0});
            var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
            var val = bytes.subarray(off.bytes, off.bytes + this.size);
            addField(off, this);
            return impl.b2v.call(this, val);
            //return impl.b2v.call(this, val.buffer.slice(val.byteOffset, val.byteOffset + val.byteLength)); // Returns ArrayBuffer usually
        },
        bytesFromValue: function (val, buf, off) {
            buf || (buf = newBuffer(this.size));
            off || (off = { bytes: 0, bits: 0 });
            var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
            var blk = bytes.subarray(off.bytes, off.bytes + this.size);
            impl.vTb.call(this, val, blk);
            addField(off, this);
            return buf;
        },
        size: size,
        name: name
    }, count);
}

// http://stackoverflow.com/a/7460958/72637
function swapBytesPairs(fromBuffer, toBuffer) {
    toBuffer = toBuffer || fromBuffer;
    var l = fromBuffer.length;
    for (var i = 1; i < l; i += 2) {
        var a = fromBuffer[i - 1];
        toBuffer[i - 1] = fromBuffer[i];
        toBuffer[i] = a;
    }
    return toBuffer;
}

_.byte = bytefield.bind({
    b2v: function (b) { return b; },
    vTb: function (v, b) { if (!v) return 0; b.set(new Uint8Array(v)); return v.byteLength; }
});

_.char = bytefield.bind({
    b2v: function (b) {
        var decoder = new (TextDecoder || function () {
            function TextDecoder(encoding) { this.encoding = encoding; }
            TextDecoder.prototype.decode = function (buffer) {
                var bytes = new Uint8Array(buffer);
                var str = '';
                for (var i = 0; i < bytes.length; i++) {
                    str += String.fromCharCode(bytes[i]);
                }
                return str;
            };
            return TextDecoder;
        })('utf-8');
        var v = decoder.decode(b);
        var z = v.indexOf('\0');
        return (~z) ? v.slice(0, z) : v;
    },
    vTb: function (v,b) {
        v || (v = '');
        var encoder = new (TextEncoder || function () {
            function TextEncoder(encoding) { this.encoding = encoding; }
            TextEncoder.prototype.encode = function (str) {
                var bytes = new Uint8Array(str.length);
                for (var i = 0; i < str.length; i++) {
                    bytes[i] = str.charCodeAt(i);
                }
                return bytes;
            };
            return TextEncoder;
        })();
        var encoded = encoder.encode(v);
        for (var i = 0; i < encoded.length && i < b.length; i++) {
            b[i] = encoded[i];
        }
        return encoded.length;
    }
});

_.char16le = bytefield.bind({
    b2v: function (b) {
        var decoder = new (TextDecoder || function () {
            function TextDecoder(encoding) { this.encoding = encoding; }
            TextDecoder.prototype.decode = function (buffer) {
                var bytes = new Uint8Array(buffer);
                var str = '';
                for (var i = 0; i < bytes.length; i += 2) {
                    var charCode = bytes[i] | (bytes[i + 1] << 8);
                    str += String.fromCharCode(charCode);
                }
                return str;
            };
            return TextDecoder;
        })('utf-16le');
        var v = decoder.decode(b);
        var z = v.indexOf('\0');
        return (~z) ? v.slice(0, z) : v;
    },
    vTb: function (v,b) {
        v || (v = '');
        var bytesWritten = 0;
        for (var i = 0; i < v.length && bytesWritten + 1 < b.length; i++) {
            var charCode = v.charCodeAt(i);
            b[bytesWritten++] = charCode & 0xFF;
            b[bytesWritten++] = (charCode >> 8) & 0xFF;
        }
        return bytesWritten;
    }
});

_.char16be = bytefield.bind({
    b2v: function (b) {
        var temp = new Uint8Array(b);
        swapBytesPairs(temp);
        var decoder = new (TextDecoder || function () {
            function TextDecoder(encoding) { this.encoding = encoding; }
            TextDecoder.prototype.decode = function (buffer) {
                var bytes = new Uint8Array(buffer);
                var str = '';
                for (var i = 0; i < bytes.length; i += 2) {
                    var charCode = bytes[i] | (bytes[i + 1] << 8);
                    str += String.fromCharCode(charCode);
                }
                return str;
            };
            return TextDecoder;
        })('utf-16le');
        var v = decoder.decode(temp.buffer);
        var z = v.indexOf('\0');
        return (~z) ? v.slice(0, z) : v;
    },
    vTb: function (v,b) {
        v || (v = '');
        var temp = new Uint8Array(b.length);
        var bytesWritten = 0;
        for (var i = 0; i < v.length && bytesWritten + 1 < temp.length; i++) {
            var charCode = v.charCodeAt(i);
            temp[bytesWritten++] = charCode & 0xFF;
            temp[bytesWritten++] = (charCode >> 8) & 0xFF;
        }
        swapBytesPairs(temp, b);
        return bytesWritten;
    }
});

function standardField(sig, size, littleEndian) {
    var read = 'get' + sig,
        dump = 'set' + sig;
    size || (size = +sig.match(/\d+/)[0] / 8);
    return function (name, count) {
        if (typeof name !== 'string') {
            count = name;
            name = null;
        }
        return arrayizeField({
            valueFromBytes: function (buf, off) {
                off || (off = {bytes:0});
                var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
                var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                var val = view[read](off.bytes, littleEndian);
                addField(off, this);
                return val;
            },
            bytesFromValue: function (val, buf, off) {
                val || (val = 0);
                buf || (buf = newBuffer(this.size));
                off || (off = {bytes:0});
                var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
                var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                view[dump](off.bytes, val, littleEndian);
                addField(off, this);
                return buf;
            },
            size: size,
            name: name
        }, count);
    };
}

_.uint8 = standardField('Uint8', 1, false);
_.uint16 = standardField('Uint16', 2, false);
_.uint32 = standardField('Uint32', 4, false);
_.uint16le = standardField('Uint16', 2, true);
_.uint32le = standardField('Uint32', 4, true);

_.int8 = standardField('Int8', 1, false);
_.int16 = standardField('Int16', 2, false);
_.int32 = standardField('Int32', 4, false);
_.int16le = standardField('Int16', 2, true);
_.int32le = standardField('Int32', 4, true);

_.float32 = standardField('Float32', 4, false);
_.float64 = standardField('Float64', 8, false);
_.float32le = standardField('Float32', 4, true);
_.float64le = standardField('Float64', 8, true);

_.derive = function (orig, pack, unpack) {
    return function (name, count) {
        if (typeof name !== 'string') {
            count = name;
            name = null;
        }
        return arrayizeField(extend({
            valueFromBytes: function (buf, off) {
                return unpack(orig.valueFromBytes(buf, off));
            },
            bytesFromValue: function (val, buf, off) {
                return orig.bytesFromValue(pack(val), buf, off);
            },
            name: name
        }, ('width' in orig) ? {width:orig.width} : {size:orig.size}), count);
    };
};

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
} else {
    // Export to global scope for browsers
    window._ = _;
}
