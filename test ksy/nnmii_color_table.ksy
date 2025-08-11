meta:
  id: nnmii_color_table
  application: |
    mii_ColorTable.obj (Windows x64) section: .rdata
    Follows the layout of the binary built on 11/21/2022.
    obj can be dumped from from libnn_mii_draw.lib
    .rdata section can be dumped like so: `llvm-objcopy-19 --dump-section=.rdata=/dev/shm/mii_ColorTable.bin ~/Downloads/libnnSdk\ win/D:\\home\\teamcity\\work\\sdk\\Programs\\Eris\\Intermediates\\x64-v142\\Libraries\\libnn_mii_core\\Debug\\mii_ColorTable.obj`
    Uses DWARF debug info (from libnn_mii_draw.a / NX Develop) for struct layouts.
    libcocos2dcpp.so has same structs but different layout
  endian: le

seq:
  - id: common_color_table
    type: common_color_element
    repeat: expr
    repeat-expr: 100
    doc: "struct nn::mii::detail::CommonColorElement const *const nn::mii::detail::CommonColorTable"

  - id: upper_lip_color_table
    type: color_element
    repeat: expr
    repeat-expr: 100
    doc: "struct nn::mii::detail::ColorElement const *const nn::mii::detail::UpperLipColorTable"

  - id: common_color_order_index_to_color_index
    type: color_index_element
    repeat: expr
    repeat-expr: 100
    doc: "struct nn::mii::detail::ColorIndexElement const *const nn::mii::detail::CommonColorOrderIndexToColorIndex"

  - id: ver3_eye_color_table
    type: color_index_element
    repeat: expr
    repeat-expr: 6
    doc: "struct nn::mii::detail::ColorIndexElement const *const nn::mii::detail::Ver3EyeColorTable"

  - id: padding_0
    size: 6

  - id: favorite_color_table
    type: color_element
    repeat: expr
    repeat-expr: 12
    doc: "struct nn::mii::detail::ColorElement const *const nn::mii::detail::FavoriteColorTable"

  - id: faceline_color_table
    type: faceline_color_element
    repeat: expr
    repeat-expr: 10
    doc: "struct nn::mii::detail::FacelineColorElement const *const nn::mii::detail::FacelineColorTable"

  - id: faceline_color_order_index_to_color_index
    type: color_index_element
    repeat: expr
    repeat-expr: 10
    doc: "struct nn::mii::detail::ColorIndexElement const *const nn::mii::detail::FacelineColorOrderIndexToColorIndex"

  - id: padding_1
    size: 6

  - id: ver3_hair_color_table
    type: color_index_element
    repeat: expr
    repeat-expr: 8
    doc: "struct nn::mii::detail::ColorIndexElement const *const nn::mii::detail::Ver3HairColorTable"

  - id: ver3_mouth_color_table
    type: color_index_element
    repeat: expr
    repeat-expr: 5
    doc: "struct nn::mii::detail::ColorIndexElement const *const nn::mii::detail::Ver3MouthColorTable"

  - id: padding_2
    size: 3

  - id: ver3_glass_color_table
    type: color_index_element
    repeat: expr
    repeat-expr: 6
    doc: "struct nn::mii::detail::ColorIndexElement const *const nn::mii::detail::Ver3GlassColorTable"

  - id: padding_3
    size: 2

  - id: ver3_faceline_color_table
    type: color_index_element
    repeat: expr
    repeat-expr: 6
    doc: "struct nn::mii::detail::ColorIndexElement const *const nn::mii::detail::Ver3FacelineColorTable"

  - id: padding_4
    size: 2

  - id: mole_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::MoleColor"

  - id: noseline_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::NoselineColor"

  - id: wrinkle_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::WrinkleColor"

  - id: eye_white_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::EyeWhiteColor"

  - id: eye_shadow_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::EyeShadowColor"

  - id: teeth_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::TeethColor"

  - id: pants_normal_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::PantsNormalColor"

  - id: pants_present_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::PantsPresentColor"

  - id: pants_regular_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::PantsRegularColor"

  - id: pants_special_color
    type: color_element
    doc: "struct nn::mii::detail::ColorElement const nn::mii::detail::PantsSpecialColor"

types:
  color3:
    doc: "struct nn::mii::Color3 (mii_Common.h)"
    # All colors are normalized to [0, 1] range.
    seq:
      - id: r
        type: f4
        valid:
          min: 0
          max: 1
      - id: g
        type: f4
        valid:
          min: 0
          max: 1
      - id: b
        type: f4
        valid:
          min: 0
          max: 1

  color_element:
    doc: "struct nn::mii::detail::ColorElement (mii_ColorTable.h)"
    seq:
      - id: linear
        type: color3
      - id: srgb
        type: color3
  common_color_element:
    doc: "struct nn::mii::detail::CommonColorElement (guessed)"
    seq:
      - id: linear
        type: color3
      - id: srgb
        type: color3
      - id: ver3_hair_color
        type: u1
      - id: ver3_eye_color
        type: u1
      - id: ver3_mouth_color
        type: u1
      - id: ver3_glass_color
        type: u1
      - id: order_index
        type: s4

  color_index_element:
    doc: "struct nn::mii::detail::ColorIndexElement (guessed)"
    seq:
      - id: index
        type: u1

  faceline_color_element:
    doc: "struct nn::mii::detail::FacelineColorElement (guessed)"
    seq:
      - id: linear
        type: color3
      - id: srgb
        type: color3
      - id: ver3_faceline_color
        type: s4
      - id: order_index
        type: s4