declare namespace _exports {
    export { BufferSource, Cursor, BitTransform, ByteTransform, Offset, Field, StructInstance };
}
declare namespace _exports {
    /**
     * Defines a new structure with the given fields.
     *
     * @overload
     * @param {Array} fields - The array of field definitions.
     * @param {number} [count] - The number of structures in an array.
     * @returns {StructInstance<*>} The defined structure with pack and unpack methods.
     *
     * @overload
     * @param {string} name - The name of the structure.
     * @param {Array} fields - The array of field definitions.
     * @param {number} [count] - The number of structures in an array.
     * @returns {StructInstance<*>} The defined structure with pack and unpack methods.
     */
    function struct(fields: any[], count?: number): StructInstance<any>;
    /**
     * Defines a new structure with the given fields.
     *
     * @overload
     * @param {Array} fields - The array of field definitions.
     * @param {number} [count] - The number of structures in an array.
     * @returns {StructInstance<*>} The defined structure with pack and unpack methods.
     *
     * @overload
     * @param {string} name - The name of the structure.
     * @param {Array} fields - The array of field definitions.
     * @param {number} [count] - The number of structures in an array.
     * @returns {StructInstance<*>} The defined structure with pack and unpack methods.
     */
    function struct(name: string, fields: any[], count?: number): StructInstance<any>;
    /**
     * Defines a padding field up to the specified offset.
     *
     * @param {number} off - The byte offset to pad to.
     * @returns {Object} The padding field definition.
     */
    function padTo(off: number): any;
    function bool(name: any, count: any): any;
    let ubit: any;
    let ubitLE: any;
    let sbit: any;
    let byte: any;
    let char: any;
    let char16le: any;
    let char16be: any;
    let uint8: Function;
    let uint16: Function;
    let uint32: Function;
    let uint16le: Function;
    let uint32le: Function;
    let int8: Function;
    let int16: Function;
    let int32: Function;
    let int16le: Function;
    let int32le: Function;
    let float32: Function;
    let float64: Function;
    let float32le: Function;
    let float64le: Function;
    /**
     * Derives a new field based on an existing one with custom pack and unpack functions.
     *
     * @param {Object} orig - The original field to derive from.
     * @param {Function} pack - The function to pack the derived value.
     * @param {Function} unpack - The function to unpack the derived value.
     * @returns {Function} A function to create the derived field.
     */
    function derive(orig: any, pack: Function, unpack: Function): Function;
}
export = _exports;
/**
 * A type representing either a raw ArrayBuffer or a typed view of it.
 */
type BufferSource = ArrayBuffer | Uint8Array;
/**
 * A type for the "cursor" used to track the byte and bit offsets.
 */
type Cursor = {
    /**
     * - Current byte offset.
     */
    bytes: number;
    /**
     * - Current bit offset.
     */
    bits?: number;
};
/**
 * A transform interface for bitfields, converting between raw number bits and user values.
 * (Used by `b2v` and `v2b` methods.)
 */
type BitTransform = {
    /**
     * - Called when reading bits from buffer.
     */
    b2v: (this: {
        width: number;
    }, arg1: number) => number;
    /**
     * - Called when writing bits into buffer.
     */
    v2b: (this: {
        width: number;
    }, arg1: number) => number;
    /**
     * - The width (in bits) of this bitfield.
     */
    width: number;
};
/**
 * A transform interface for byte fields, converting between raw bytes and user values.
 * (Used by `b2v` and `vTb` methods.)
 */
type ByteTransform = {
    /**
     * - Called when reading bytes from buffer.
     */
    b2v: (arg0: BufferSource) => any;
    /**
     * - Called when writing values into buffer.
     */
    vTb: (arg0: any, arg1: Uint8Array) => number;
    /**
     * - The size (in bytes) of this field.
     */
    size: number;
};
/**
 * Defines the shape of the offset object used in many function signatures.
 */
type Offset = {
    bytes: number;
    bits?: number;
};
/**
 * A single field definition, which must define how to read (unpack) and write (pack) data.
 * This is the base type that all specialized fields (bitfields, bytefields, etc.) implement.
 */
type Field = {
    /**
     * - The name of the field (if any).
     */
    name?: string;
    /**
     * - The size of the field in bytes (for non-bitfield types).
     */
    size?: number;
    /**
     * - The size of the field in bits (for bitfields).
     */
    width?: number;
    /**
     * - Byte or (byte,bits) offset.
     */
    offset?: number | Offset;
    /**
     * - Unpacks the field value from a buffer.
     */
    valueFromBytes: (arg0: BufferSource, arg1: Offset | undefined) => any;
    /**
     * - Packs a value into a buffer.
     */
    bytesFromValue: (arg0: any, arg1: BufferSource, arg2: Offset | undefined) => BufferSource;
    /**
     * - Alias for `bytesFromValue`.
     */
    pack: (arg0: any, arg1: BufferSource, arg2: Offset | undefined) => BufferSource;
    /**
     * - Alias for `valueFromBytes`.
     */
    unpack: (arg0: BufferSource, arg1: Offset | undefined) => any;
    /**
     * - If this is a nested struct, this maps sub-fields to their definitions.
     */
    _hoistFields?: Record<string, Field> | null;
    /**
     * - An object mapping field names to their definitions.
     */
    fields?: Record<string, Field>;
};
/**
 * Template for the return type of _.struct(), representing an instance of a structure with pack/unpack methods.
 * It is generic in case you want to define a typed object for the data.
 */
type StructInstance<T> = {
    /**
     * - Deserialize from a BufferSource into the structured object.
     */
    unpack: (arg0: BufferSource) => T;
    /**
     * - Serialize the structured object into a Uint8Array.
     */
    pack: (arg0: T) => Uint8Array;
    /**
     * - Reads structured data from a buffer.
     */
    valueFromBytes: (arg0: BufferSource, arg1: Offset | undefined) => T;
    /**
     * - Writes structured data into a buffer.
     */
    bytesFromValue: (arg0: T, arg1: BufferSource, arg2: Offset | undefined) => BufferSource;
    /**
     * - Field definitions keyed by field name.
     */
    fields: Record<string, Field>;
    /**
     * - The total size in bytes of the packed structure.
     */
    size: number;
    /**
     * - The name of the struct (if provided).
     */
    name: string | null;
    /**
     * - If this is a nested struct, this maps sub-fields to their definitions.
     */
    _hoistFields: Record<string, Field> | null;
};
