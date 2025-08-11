meta:
  id: resource_variable_icon_body_header
  endian: le

enums:
  shape_type:
    0: body
    1: pants
    2: end

  vertex_type:
    0: attribute_position
    1: attribute_normal
    2: attribute_matrix_index
    3: index_buffer
    4: end

  vriable_icon_body_bone_kind:
    0: all_root
    1: body
    2: skl_root
    3: chest
    4: arm_l1
    5: arm_l2
    6: wrist_l
    7: elbow_l
    8: shoulder_l
    9: arm_r1
    10: arm_r2
    11: wrist_r
    12: elbow_r
    13: shoulder_r
    14: head
    15: chest2
    16: hip
    17: foot_l1
    18: foot_l2
    19: ankle_l
    20: knee_l
    21: foot_r1
    22: foot_r2
    23: ankle_r
    24: knee_r
    25: end

types:
  element:
    seq:
      - id: offset
        type: u4
      - id: size
        type: u4

  float_column_major_4x3:
    seq:
      - id: m00
        type: f4
      - id: m01
        type: f4
      - id: m02
        type: f4
      - id: m10
        type: f4
      - id: m11
        type: f4
      - id: m12
        type: f4
      - id: m20
        type: f4
      - id: m21
        type: f4
      - id: m22
        type: f4
      - id: m30
        type: f4
      - id: m31
        type: f4
      - id: m32
        type: f4

  vector3f:
    seq:
      - id: x
        type: f4
      - id: y
        type: f4
      - id: z
        type: f4

  local_matrix:
    seq:
      - id: rotate_translate
        type: float_column_major_4x3
      - id: scale
        type: vector3f

  resource_variable_icon_body_header:
    seq:
      - id: signature
        type: u4
      - id: version
        type: u4
      - id: file_size
        type: u4
      - id: matrix_count
        type: s4
      - id: matrix_to_bone_table
        type: s4
        repeat: expr
        repeat-expr: 25
      - id: parent_bone_table
        type: s4
        repeat: expr
        repeat-expr: 25
      - id: mesh
        type: mesh_section
        repeat: expr
        repeat-expr: 2
      - id: local_matrix
        type: element

  mesh_section:
    seq:
      - id: sections
        type: element
        repeat: expr
        repeat-expr: 4

