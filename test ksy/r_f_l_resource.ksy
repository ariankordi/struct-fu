meta:
  id: r_f_l_resource
  #id: c_f_li_archive
  title: Resource archive image format for RFL, NFL, CFL.
  endian: be # Set to BE for RFL.
  #bit-endian: le  # No bitfields.

seq:
  - id: total_archive_count
    type: u2
    doc: |
      Amount of total archives within the file.
      RFL = 18 (RFLiArcID_Max), NFL = 20 (?), CFL = 20 (CFLi_PARTS_ID_COUNT)
  - id: version
    type: u2
    doc: |
      Resource version. Set in RFL and CFL, only seen used in CFL debug mode.
      CFL bootloadDB2Res_: nn::dbg::detail::Printf("CFL: Cached Resource Version = 0x%04x\n");
      / Debug assert; "cfl_resource.cpp",0x19d,"%s", "loader->mVersion >= 0x509"
  #- id: archives
  #  type: archive
  #  repeat: expr
  #  repeat-expr: 20
  - id: offsets
    doc: |
      Offsets for each part type.
    type: u4
    repeat: expr
    repeat-expr: total_archive_count

instances:
  archives:
    pos: offsets[_index]  # Reads from each offset in the list.
    type: r_f_li_archive
    repeat: expr
    repeat-expr: total_archive_count  # Should match offsets' length.

  archive0:
    pos: offsets[0]
    type: r_f_li_archive
  archive1:
    pos: offsets[1]
    type: r_f_li_archive
  archive2:
    pos: offsets[2]
    type: r_f_li_archive
  archive3:
    pos: offsets[3]
    type: r_f_li_archive
  archive4:
    pos: offsets[4]
    type: r_f_li_archive
  archive5:
    pos: offsets[5]
    type: r_f_li_archive
  archive6:
    pos: offsets[6]
    type: r_f_li_archive
  archive7:
    pos: offsets[7]
    type: r_f_li_archive
  archive8:
    pos: offsets[8]
    type: r_f_li_archive
  archive9:
    pos: offsets[9]
    type: r_f_li_archive
  archive10:
    pos: offsets[10]
    type: r_f_li_archive
  archive11:
    pos: offsets[11]
    type: r_f_li_archive
  archive12:
    pos: offsets[12]
    type: r_f_li_archive
  archive13:
    pos: offsets[13]
    type: r_f_li_archive
  archive14:
    pos: offsets[14]
    type: r_f_li_archive
  archive15:
    pos: offsets[15]
    type: r_f_li_archive
  archive16:
    pos: offsets[16]
    type: r_f_li_archive
  archive17:
    pos: offsets[17]
    type: r_f_li_archive
  archive18:
    pos: offsets[18]
    type: r_f_li_archive
  archive19:
    pos: offsets[19]
    type: r_f_li_archive
  archive1texture0:
    # Read texture header for archive 1 (eye) index 0.
    # Seek to offsets (8). Go to offset of archive 1.
    # Then estimate file count * sizeof(u32)
    pos: |
          8
          + offsets[1]
          + (archive1.num * 4)
    #type: r_f_li_texture
    type: c_f_li_tex_header
  archive3shape1:
    # Read header for archive 3 (faceline) index 1.
    pos: 8 + offsets[3] + (archive3.num * sizeof<u4>) + 0x653
    type: r_f_li_shape
  archive1shape1:
    # Read header for archive 1 (beard) index 1.
    pos: 8 + offsets[0] + (archive0.num * sizeof<u4>) + 0x9
    type: r_f_li_shape
  # Default M hair.
  archive8shape33:
    # Read header for archive 8 (hair) index 33.
    pos: 8 + offsets[8] + (archive8.num * sizeof<u4>) + 0x11F27
    type: r_f_li_shape

types:
  r_f_li_archive:
    seq:
      - id: num
        type: u2
        doc: Number of files in the archive.
      - id: maxsize
        type: u2
        doc: Size of the biggest entry in the archive.
      - id: offset
        type: u4
        doc: Offsets of each part in the archive.
        repeat: expr
        repeat-expr: num + 1
    #instances:
    #  texture0:
    #    pos: _io.pos + offset[0]  # Read each part entry at the offset
    #    type: r_f_li_texture

  c_f_li_tex_header:
    doc: |
      Image width and height are calculated by
      getting the next power of two. In JS:
      const nextPow2 = x => x <= 1 ? 1 : 1 << (32 - Math.clz32(x - 1));
    seq:
      - id: image_w
        type: u2
      - id: image_h
        type: u2
      - id: m_mipmap_size
        type: u1
      - id: m_format
        type: u1
      - id: m_wrap_s
        type: u1
      - id: m_wrap_t
        type: u1
      
  r_f_li_texture:
    seq:
      - id: format
        type: u1
        doc: GXTexFmt
      - id: alpha
        type: u1
        doc: Unused
      - id: width
        type: u2
      - id: height
        type: u2
      - id: wrap_s
        type: u1
        doc: Only used in RFLiInitTexRes (RFL_Model.c).
      - id: wrap_t
        type: u1
        doc: Only used in RFLiInitTexRes (RFL_Model.c).
      - id: index_texture
        type: u1
        doc: Unused
      - id: color_format
        type: u1
        doc: Unused
      - id: num_colors
        type: u2
        doc: Unused
      - id: palette_ofs
        type: u4
        doc: Unused
      - id: enable_lod
        type: u1
        doc: Unused
      - id: enable_edge_lod
        type: u1
        doc: Only used in RFLiInitRFLTexture (Mask)
      - id: enable_bias_clamp
        type: u1
        doc: Only used in RFLiInitRFLTexture (Mask)
      - id: enable_max_aniso
        type: u1
        doc: Only used in RFLiInitRFLTexture (Mask)
      - id: min_filt
        type: u1
        doc: Only used in RFLiInitRFLTexture (Mask)
      - id: mag_filt
        type: u1
        doc: Only used in RFLiInitRFLTexture (Mask)
      - id: min_lod
        type: s1
        doc: Only used in RFLiInitRFLTexture (Mask)
      - id: max_lod
        type: s1
        doc: Only used in RFLiInitRFLTexture (Mask)
      - id: mipmap_level
        type: u1
        doc: Unused
      - id: reserved
        type: s1
        doc: Unused
      - id: lod_bias
        type: s2
        doc: Only used in RFLiInitRFLTexture (Mask)
      - id: image_ofs
        type: u4

  r_f_li_shape:
    doc: |
      NOTE: Untyped. Custom type.
      Real data is loaded from "res" in RFLiInitShapeRes
    seq:
      - id: identifier
        type: str
        size: 4
        encoding: ascii
        doc: |
          4-byte identifier, unused by RFL.
          'nose', 'frhd', 'face', 'hair', 'cap_', 'berd', 'nsln', 'mask', 'glas'
          https://github.com/SMGCommunity/Petari/blob/6b6a7635d3ab985a5866be9ae4db09d52d678f6c/src/RVLFaceLib/RFL_Model.c#L835

      # Faceline transform fields.
      - id: nose_trans
        type: f4
        repeat: expr
        repeat-expr: 3
        if: is_faceline
      - id: beard_trans
        type: f4
        repeat: expr
        repeat-expr: 3
        if: is_faceline
      - id: hair_trans
        type: f4
        repeat: expr
        repeat-expr: 3
        if: is_faceline
      # Position attribute.
      - id: num_vtx_pos
        type: u2
      - id: vtx_pos
        #type: vec3_s16
        type: u2
        repeat: expr
        #repeat-expr: num_vtx_pos
        repeat-expr: num_vtx_pos * 3
      # Normal attribute.
      - id: num_vtx_nrm
        type: u2
      - id: vtx_nrm
        type: u2
        repeat: expr
        repeat-expr: num_vtx_nrm * 3
      # Texcoord attribute (unless skip_txc)
      - id: num_vtx_txc
        type: u2
        if: not skip_txc
      - id: vtx_txc
        type: u2
        repeat: expr
        repeat-expr: num_vtx_txc * 2
        if: not skip_txc
      # Primitives
      - id: prim_count
        type: u1
      - id: primitives
        type: primitive
        repeat: expr
        repeat-expr: prim_count

    instances:
      # NOTE: RFL does not use the identifier.
      # Should use RFLArcID instead.
      skip_txc:
        value: |
          identifier == "frhd" or
          identifier == "hair" or 
          identifier == "berd" or
          identifier == "nose"
      is_faceline:
        value: identifier == "face"

  # one primitive entry in the DL
  primitive:
    seq:
      - id: vtx_count
        type: u1
      - id: prim_type
        type: u1
        enum: g_x_primitive
      - id: vertices
        type: vertex
        repeat: expr
        repeat-expr: vtx_count

  # one vertex‐index tuple
  vertex:
    seq:
      - id: pos_idx
        type: u1
      - id: nrm_idx
        type: u1
      - id: tex_idx
        type: u1
        if: not _parent._parent.skip_txc  # match the r_f_li_shape skip_txc

enums:
  g_x_primitive:
    0xB8: points
    0xA8: lines
    0xB0: linestrip
    0x90: triangles
    0x98: trianglestrip
    0xA0: trianglefan
    0x80: quads

  rfl_i_arc_id:
    0:  beard
    1:  eye
    2:  eyebrow
    3:  faceline
    4:  face_tex
    5:  fore_head
    6:  glass
    7:  glass_tex
    8:  hair
    9:  mask
    10: mole
    11: mouth
    12: mustache
    13: nose
    14: nline
    15: nline_tex
    16: cap
    17: cap_tex
    18: max