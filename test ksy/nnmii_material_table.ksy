meta:
  id: nnmii_material_table
  application: |
    mii_MaterialTable.obj (Windows x64) section: .rdata
    obj can be dumped from from libnn_mii_draw.lib
    .rdata section can be dumped like so: `llvm-objcopy-19 --dump-section=.rdata=/dev/shm/mii_MaterialTable.bin ~/Downloads/libnn_mii_draw\ win/D:\\home\\teamcity\\work\\sdk\\Programs\\Iris\\Intermediates\\x64-v142\\Libraries\\libnn_mii_draw\\Debug\\mii_MaterialTable.obj`
    Uses DWARF debug info (from libnn_mii_draw.a / NX Develop) for struct layouts.
  endian: le

seq:
  - id: mask_noseline_material_table
    type: material_parameter
    doc: "struct nn::mii::detail::MaterialParameter const *const nn::mii::detail::MaskNoselineMaterialTable"

  - id: padding_0
    size: 12

  - id: glass_material_table
    type: material_parameter
    doc: "struct nn::mii::detail::MaterialParameter const *const nn::mii::detail::GlassMaterialTable"

  - id: padding_1
    size: 28

  - id: pants_material_table
    type: material_parameter
    repeat: expr
    repeat-expr: 2
    doc: "struct nn::mii::detail::MaterialParameter const *const nn::mii::detail::PantsMaterialTable"

  - id: padding_2
    size: 40

  - id: faceline_forehead_material_table
    type: material_parameter
    repeat: expr
    repeat-expr: 10
    doc: "struct nn::mii::detail::MaterialParameter const *const nn::mii::detail::FacelineForeheadMaterialTable"

  - id: padding_3
    size: 8

  - id: nose_material_table
    type: material_parameter
    repeat: expr
    repeat-expr: 10
    doc: "struct nn::mii::detail::MaterialParameter const *const nn::mii::detail::NoseMaterialTable"

  - id: padding_4
    size: 8

  - id: body_material_table
    type: material_parameter
    repeat: expr
    repeat-expr: 12
    doc: "struct nn::mii::detail::MaterialParameter const *const nn::mii::detail::BodyMaterialTable"

  - id: hat_material_table
    type: material_parameter
    repeat: expr
    repeat-expr: 12
    doc: "struct nn::mii::detail::MaterialParameter const *const nn::mii::detail::HatMaterialTable"

  - id: hair_material_table
    type: material_parameter
    repeat: expr
    repeat-expr: 100
    doc: "struct nn::mii::detail::MaterialParameter const *const nn::mii::detail::HairMaterialTable"

  - id: beard_material_table
    type: material_parameter
    repeat: expr
    repeat-expr: 100
    doc: "struct nn::mii::detail::MaterialParameter const *const nn::mii::detail::BeardMaterialTable"

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

  material_parameter:
    doc: "struct nn::mii::detail::MaterialParameter (mii_MaterialTable.h)"
    seq:
      - id: half_lambert_factor
        type: f4
      - id: sss_specular_blend_factor
        type: f4
      - id: sss_color
        type: color_element
      - id: specular_color
        type: color_element
      - id: specular_factor_a
        type: f4
      - id: specular_factor_b
        type: f4
      - id: specular_shinness
        type: f4
      - id: rim_color
        type: color_element
      - id: rim_power
        type: f4
      - id: rim_width
        type: f4
