declare namespace _exports {
    export { BufferSource, Cursor, BitTransform, ByteTransform, Offset, PaddingField, Field, StructInstance };
}
declare namespace _exports {
    /**
     * Defines a new structure with the given fields.
     *
     * Overloads:
     *    _.struct(fields, count?)
     *    _.struct(name, fields, count?)
     *
     * @param {string|Array<Field>} name - The structure name or the array of fields if no name.
     * @param {Array<Field|StructInstance<*>>|number} [fields] - The array of fields OR the count if the first param was fields.
     * @param {number} [count] - The number of array elements if making an array of structs.
     * @returns {StructInstance<*>} The resulting struct definition (and array, if count was provided).
     */
    function struct(name: string | Array<Field>, fields?: Array<Field | StructInstance<any>> | number, count?: number): StructInstance<any>;
    /**
     * Defines a padding field up to the specified offset.
     *
     * @param {number} off - The byte offset to pad to.
     * @returns {Field & {_padTo: number, _id?: string}} The padding field definition.
     */
    function padTo(off: number): Field & {
        _padTo: number;
        _id?: string;
    };
    /**
     * Boolean field: 1-bit big-endian bitfield that interprets 1/0 as true/false.
     *
     * @param {string} [name]
     * @param {number} [count]
     */
    function bool(name?: string, count?: number): Field;
    let ubit: (name?: string | undefined, width?: number | undefined, count?: number | undefined) => Field;
    let ubitLE: (name?: string | undefined, width?: number | undefined, count?: number | undefined) => Field;
    let sbit: (name?: string | undefined, width?: number | undefined, count?: number | undefined) => Field;
    let byte: (name: string | number, size?: number | undefined, count?: number | undefined) => Field & ByteTransform;
    let char: (name: string | number, size?: number | undefined, count?: number | undefined) => Field & ByteTransform;
    let char16le: (name: string | number, size?: number | undefined, count?: number | undefined) => Field & ByteTransform;
    let char16be: (name: string | number, size?: number | undefined, count?: number | undefined) => Field & ByteTransform;
    let uint8: (name: string | number, count?: number) => Field;
    let uint16: (name: string | number, count?: number) => Field;
    let uint32: (name: string | number, count?: number) => Field;
    let uint16le: (name: string | number, count?: number) => Field;
    let uint32le: (name: string | number, count?: number) => Field;
    let int8: (name: string | number, count?: number) => Field;
    let int16: (name: string | number, count?: number) => Field;
    let int32: (name: string | number, count?: number) => Field;
    let int16le: (name: string | number, count?: number) => Field;
    let int32le: (name: string | number, count?: number) => Field;
    let float32: (name: string | number, count?: number) => Field;
    let float64: (name: string | number, count?: number) => Field;
    let float32le: (name: string | number, count?: number) => Field;
    let float64le: (name: string | number, count?: number) => Field;
    /**
     * Derives a new field based on an existing one with custom pack and unpack functions.
     * The types are intentionally any.
     *
     * @param {Field} orig - The original field to derive from.
     * @param {function(*): *} pack - The function to pack the derived value.
     * @param {function(*): *} unpack - The function to unpack the derived value.
     * @returns {(name?: string|number, count?: number) => Field} A function to create the derived field.
     */
    function derive(orig: Field, pack: (arg0: any) => any, unpack: (arg0: any) => any): (name?: string | number, count?: number) => Field;
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
    bits?: number | undefined;
};
/**
 * A transform interface for bitfields, converting between raw number bits and user values.
 * Notably, the input/output can be number or boolean. (Used by `b2v` and `v2b` methods.)
 */
type BitTransform = {
    /**
     * - Called when reading bits from buffer.
     */
    b2v: (this: {
        width: number;
    }, arg1: number) => number | boolean;
    /**
     * - Called when writing bits into buffer.
     */
    v2b: (this: {
        width: number;
    }, arg1: number | boolean) => number;
    /**
     * - The width (in bits) of this bitfield.
     */
    width?: number | undefined;
    /**
     * - Whether or not the bitfield is little-endian.
     */
    littleEndian?: boolean | null | undefined;
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
    size?: number | undefined;
};
/**
 * Defines the shape of the offset object used in many function signatures.
 */
type Offset = {
    bytes: number;
    bits?: number | undefined;
};
/**
 * Represents a padding field that ensures proper byte alignment in a struct.
 * It does not hold a value but affects struct layout.
 */
type PaddingField = {
    /**
     * - The byte offset to pad to.
     */
    _padTo: number;
    /**
     * - Internal unique ID.
     */
    _id?: string | undefined;
};
/**
 * A single field definition, which must define how to read (unpack) and write (pack) data.
 * This is the base type that all specialized fields (bitfields, bytefields, etc.) implement.
 */
type Field = {
    /**
     * - The name of the field (if any).
     */
    name?: string | undefined;
    /**
     * - The size of the field in bytes (for non-bitfield types).
     */
    size: number;
    /**
     * - The size of the field in bits (for bitfields).
     */
    width?: number | undefined;
    /**
     * - Byte or (byte,bits) offset.
     */
    offset?: number | Offset | undefined;
    /**
     * - Unpacks the field value from a buffer.
     */
    valueFromBytes: (arg0: BufferSource, arg1: Offset | undefined) => any;
    /**
     * - Packs a value into a buffer.
     */
    bytesFromValue: (arg0: any, arg1: BufferSource, arg2: Offset | undefined) => BufferSource;
    /**
     * - If this is a nested struct, this maps sub-fields to their definitions.
     */
    _hoistFields?: Record<string, Field> | null | undefined;
    /**
     * - An object mapping field names to their definitions.
     */
    fields?: Record<string, Field> | undefined;
    /**
     * - Alias for `bytesFromValue`. This is only defined in arrayizeField().
     */
    pack?: ((arg0: any, arg1: BufferSource, arg2?: Offset | undefined) => BufferSource) | undefined;
    /**
     * - Alias for `valueFromBytes`. This is only defined in arrayizeField().
     */
    unpack?: ((arg0: BufferSource, arg1?: Offset | undefined) => any) | undefined;
};
/**
 * Template for the return type of _.struct(), representing an instance of a structure with pack/unpack methods.
 * It is generic in case you want to define a typed object for the data.
 */
type StructInstance<T> = Field & Object;
