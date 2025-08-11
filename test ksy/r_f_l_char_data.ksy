meta:
  id: r_f_l_char_data
  application: |
    Mii data format used on 3DS, Wii U, Miitomo
    versions < 2.3.0, and on Switch inside amiibo data.
    Fields marked as "padding" and "reserved" are always zero.
  file-extension:
    - cfsd
    - ffsd
    # Unofficial:
    - 3dsmii
    - cfcd
    - ffcd
  xref:
    struct_names: |
      RFLStoreData
  endian: be
  bit-endian: be

seq:
  - id: mii_version
    doc: |
      Set to constant 0x03, but can also be set to 0x00
      when created using the Wii U Mii Maker camera feature.
      (bug? happens somewhere in mwmpfGetFFLCharInfo)
    #valid:
    #  any-of: [0, 3]
    type: b8
  - id: copyable
    type: b1
  - id: ng_word
    type: b1
  - id: region_move
    type: b2 # 0-3
    enum: region_move
  - id: font_region
    type: b2 # 0-3
    enum: font_region
  - id: reserved_0
    type: b2
  - id: room_index
    doc: |
      This and positionInRoom are used only by 3DS,
      but CharInfo verification will fail in CFL/FFL
      if roomIndex/positionInRoom exceed 9.
    type: b4 # 0-15
  - id: position_in_room # ^^
    type: b4 # 0-15
  - id: author_type
    doc: |
      Never used, no enum in CFL, set in CFL/FFL (and CharInfo types) to zero.
      Also note that nn::mii::detail::Ver3StoreDataRaw::Verify() enforces this
      to be zero (along with all other fields that are reserved/padding)
    type: b4
  - id: birth_platform
    type: b3
    enum: birth_platform
    #valid:
    #  any-of: [ birth_platform ]
  - id: reserved_1
    type: b1
  - id: author_id  # CFLiAuthorID (private type)
    type: u1
    repeat: expr
    repeat-expr: 8
  - id: create_id  # CFLCreateID (private type)
    type: create_id
  - id: reserved_2
    type: u1
    repeat: expr
    repeat-expr: 2
  - id: gender
    type: b1
    enum: gender
  - id: birth_month
    type: b4  # 0-16
    doc: 0 = not set. Counts from 1-12.
  - id: birth_day
    type: b5  # 0-31
    doc: |
      0 = not set. Counts from 1-31.
      Consoles only let you set both fields, not just one.
      Note that the maximum day per month is validated in
      CFL (CFLi_GetMonthOfDay::monthOfDay) and
      FFL (MONTH_OF_DAY, https://github.com/aboood40091/ffl/blob/master/src/FFLiDateTime.cpp#L47)
  - id: favorite_color
    type: b4
    enum: favorite_color
  - id: favorite
    type: b1
  - id: padding_0
    type: b1
  - id: name
    type: str
    size: 20
    encoding: utf-16le
    doc: |
      Does not have a null terminator at the end unlike CharInfo.
      Note that 3DS/Wii U often don't overwrite the old name
      with zeroes when changing the name, so you must properly
      terminate this string with the first two zero bytes.
  - id: height
    type: u1
  - id: build
    type: u1
  - id: localonly
    type: b1
  - id: face_type
    type: b4
  - id: face_color
    type: b3
  - id: face_tex
    type: b4
  - id: face_make
    type: b4
  - id: hair_type
    type: b8
  - id: hair_color
    type: b3
  - id: hair_flip
    type: b1
  - id: padding_1
    type: b4
  - id: eye_type
    type: b6
  - id: eye_color
    type: b3
  - id: eye_scale
    type: b4
  - id: eye_aspect
    type: b3
  - id: eye_rotate
    type: b5
  - id: eye_x
    type: b4
  - id: eye_y
    type: b5
  - id: padding_2
    type: b2
  - id: eyebrow_type
    type: b5
  - id: eyebrow_color
    type: b3
  - id: eyebrow_scale
    type: b4
  - id: eyebrow_aspect
    type: b3
  - id: padding_3
    type: b1
  - id: eyebrow_rotate
    type: b5
  - id: eyebrow_x
    type: b4
  - id: eyebrow_y
    type: b5
    doc: |
      Unlike most other minimum values, eyebrowY begins at 3.
  - id: padding_4
    type: b2
  - id: nose_type
    type: b5
  - id: nose_scale
    type: b4
  - id: nose_y
    type: b5
  - id: padding_5
    type: b2
  - id: mouth_type
    type: b6
  - id: mouth_color
    type: b3
  - id: mouth_scale
    type: b4
  - id: mouth_aspect
    type: b3
  - id: mouth_y
    type: b5
  - id: mustache_type
    type: b3
  - id: padding_6
    type: b8
  - id: beard_type
    type: b3
  - id: beard_color
    type: b3
  - id: beard_scale
    type: b4
  - id: beard_y
    type: b5
  - id: padding_7
    type: b1
  - id: glass_type
    type: b4
  - id: glass_color
    type: b3
  - id: glass_scale
    type: b4
  - id: glass_y
    type: b5
  - id: mole_type
    type: b1
  - id: mole_scale
    type: b4
  - id: mole_x
    type: b5
  - id: mole_y
    type: b5
  - id: padding_8
    type: b1
  # End of fields for CFLiPackedMiiDataCore/FFLiMiiDataCore.
  - id: creator_name
    doc: |
      Additional in FFLiPackedMiiDataOfficial.
      See name field for quirks.
    type: str
    size: 20
    encoding: utf-16le
    if: not _io.eof
  # CFLiPackedMiiDataPacket/FFLStoreData fields:
  - id: padding_9
    doc: Additional in CFLiPackedMiiDataPacket.
    type: u2
    if: not _io.eof
  - id: crc
    doc: Additional in CFLiPackedMiiDataPacket.
    type: u2
    if: not _io.eof

# Mirror fields based on naming
# used in other structures.
instances:
  # nn::mii naming:
  faceline_color:
    value: face_color
  faceline_type:
    value: face_type
  faceline_wrinkle:
    value: face_tex
  mustache_scale:
    value: beard_scale
  mustache_y:
    value: beard_y
  nickname:
    value: name
  # RFL naming:
  #sex:  # actual field name of RFLiCharData from DWARF:
         # https://github.com/SMGCommunity/Petari/blob/d34c595ba7dfcd92ef776964ecf668f37cbb7123/libs/RVLFaceLib/include/RFLi_Types.h#L263
  #  value: gender

# Expand CreateID type.
types:
  create_id:
    seq:
      - id: flags
        type: create_id_flags
      - id: create_date_offset
        type: b28be
      - id: base
        doc: |
          Different result on each platform.
          Wii, 3DS, (DS?? unchecked) = MAC address
          Wii U = nn::act::GetDeviceHash()
          Miitomo = SHA-1 of afl-cbin (AFLiGetCreateIDBaseBySystem)
          Switch = random (nn::os::GenerateRandomBytes())
        type: u1
        repeat: expr
        repeat-expr: 6
    instances:
      create_date_timestamp:
        # Time is divided by two when writing.
        # Not sure if this is ever read by consoles.
        value: |
          (create_date_offset * 2)
            + 1262304000
        #     ^^^^^^^^^^ Timestamp of first day of 2010.
        # Dates wrap around on: Jan. 5, 2027, 18:48:32
        doc: |
          Creation date as a Unix timestamp.
          Only written if created on Wii U, 3DS or
          Miitomo - nothing else, e.g. on Switch
          this is completely random (nn::os::GenerateRandomBytes())
      data:
        pos: 12          # << Offset of createID field.
        type: u1
        repeat: expr
        repeat-expr: 10

  create_id_flags:
    seq:
      - id: normal
        doc: Cleared = Special, Set = Normal
        type: b1be
      - id: field_1
        doc: Cleared on Wii and 3DS, set on DS and Wii U.
        type: b1be
      - id: temporary
        doc: |
          Given to random Miis (in FFL) and seen in games' CPU Miis.
          FFLiIsValidMiiID(), CFLi_IsValidMiiID(),
          nn::mii::detail::Ver3CreateId::IsValid()
          all check against this bit - e.g. makes data INVALID.
        type: b1be
      - id: field_3
        doc: Cleared on Wii and DS, set on 3DS and Wii U.
        type: b1be
    instances:
      platform:
        doc: Second and fourth bit of flags.
        value: (field_1.to_i << 1) | field_3.to_i
        enum: create_id_platform

    enums:
      create_id_platform:
        0: wii  # 00 - Bit 2 clear, 4 clear
        1: ctr  # 01 - Bit 2 clear, 4 set
        2: ntr  # 10 - Bit 2 set,   4 clear
        3: wiiu # 11 - Bit 2 set,   4 set
        #  ^^^^ Also Miitomo, Switch (nn::mii::detail::ModifyVer3CreateIdWiiUAndNormal)
enums:
  region_move:    # CFLiRegionMove
    0: all
    1: jp_only
    2: us_only
    3: eu_only
  font_region:    # CFLFontRegion/FFLFontRegion/nn::mii::FontRegion
    0: jp_us_eu
    1: china
    2: korea
    3: taiwan
  birth_platform: # FFLBirthPlatform/CFLiBirthPlatform
    1: wii   # CFLi_BIRTH_PLATFORM_WII
    2: ds    # CFLi_BIRTH_PLATFORM_DS  << Specifically called "DS" here
             #                            but "CFLi_IsNTRMiiID" checks CreateID
    3: ctr   # CFLi_BIRTH_PLATFORM_CTR
    4: wiiu  # Also Miitomo, Switch
  gender:         # CFLGender/FFLGender/nn::mii::Gender
    0: male
    1: female
    2: all
  favorite_color: # CFLFavoriteColor/FFLFavoriteColor/nn::mii::FavoriteColor
    0: red
    1: orange
    2: yellow
    3: yellowgreen
    4: green
    5: blue
    6: skyblue
    7: pink
    8: purple
    9: brown
    10: white
    11: black
  # month? day? month_of_day?