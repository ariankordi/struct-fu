meta:
  id: fcsd
  file-extension: fcsd
  title: | 
    Mysterious FCL (FFL clothing support library?) texture file.
    Contains 256x256 BC1 (swizzled) texture, one mip level.
  endian: be

# SampleDataType enum:
# 0: Idol
# 1: Baseball
# 2: BlackBlueCheck
# 3: BlackPinkCheck
# 4: Soccer
# 5: Overall
# 6: Dot

seq:
  - id: identifier
    type: u4
    doc: Magic "FCSA".
  - id: unk_4_image_size
    type: u4
    doc: It's 32768 but also if it were uint16 it'd be too small to be a proper image size field.
  - id: clothes_id
    type: u4
    doc: |
      Unique per file, values seen:
      * Baseball.fcsd: 0x10
      * Idol.fcsd: 0x12
      * BlackBlueCheck.fcsd: 0x13
      * BlackPinkCheck.fcsd: 0x14
      * Overall.fcsd: 0x15
      * Dot.fcsd: 0x16
  - id: unk_c
    size: 1
    doc: Same in all files, value = 0xDA/218
  - id: unk_d
    size: 1
    doc: Same in all files, value = 0
  - id: unk_e
    size: 1
    doc: Same in all files, value = 0
  - id: unk_f
    size: 1
    doc: Value = 0x0c in all files except for Baseball.fcsd = 0x0b
  - id: unk_10_15
    size: 6
    doc: Same in all files, value = A4C0E1F81BFF
  - id: padding_16_3ef
    size: 986
    doc: Apparently all padding. Potentially for texture alignment?
  - id: unk_3f0
    type: u4
    doc: Image header begins here. Not sure if this is 2x u16 or 1x u32.
  - id: width
    type: u2
    doc: Image width. Same in all files, value = 256
  - id: height
    type: u2
    doc: Image height. Same in all files, value = 256
  - id: format
    type: u1
    enum: image_format
    doc: Same in all files, value = 1 (BC1 sRGB)
  - id: use_skin_color
    type: u1
    doc: Whether the texture should use skin color as alpha channel.
  - id: unk_4fa
    type: u4
    doc: Same in all files, value = 0
  - id: crc
    type: u2
    doc: | 
      CRC16 over last 0x0000-0x03FD. Not certain how this is calculated.
      It is definitely using CRC16 XMODEM but it's calculated a bit differently,
      if you just use that range it won't result in the same one, it looks like
      they maaayyy be using 0xffff for base value (https://github.com/aboood40091/ffl/blob/73fe9fc70c0f96ebea373122e50f6d3acc443180/src/detail/FFLiCrc.cpp#L3)
  - id: image_data
    size: 0
    doc: Image data begins here. No footer data at the end.

enums:
  image_format:
    -1: invalid # format != 0 && format != 1
    0: bc1_unorm
    1: bc1_srgb # Deceptively, this means it is in linear gamma.