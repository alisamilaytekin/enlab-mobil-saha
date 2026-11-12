# -*- coding: utf-8 -*-
"""
Safely patches binary AndroidManifest.xml (AXML) to ensure:
1. <uses-permission android:name="android.permission.INTERNET" />
2. <application ... android:usesCleartextTraffic="true"> (so local Wi-Fi http:// tests work on Android 9+)
3. <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="35" /> (modern Android privacy compliance)
4. <manifest android:versionCode >= 4>
"""
import os
import struct

MANIFEST_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'android',
    'AndroidManifest.xml',
)
PERM_INTERNET = 'android.permission.INTERNET'
ATTR_CLEARTEXT = 'usesCleartextTraffic'
ATTR_CLEARTEXT_RES_ID = 0x010104EC
ATTR_TARGET_SDK_RES_ID = 0x01010270
ATTR_VERSION_CODE_RES_ID = 0x0101021B
TARGET_SDK_VERSION = 35
MIN_VERSION_CODE = 4


def decode_utf16_str(buf, offset):
    char_len = struct.unpack_from('<H', buf, offset)[0]
    raw = buf[offset + 2 : offset + 2 + char_len * 2]
    return raw.decode('utf-16le'), 2 + char_len * 2 + 2


def encode_utf16_str(s):
    encoded = s.encode('utf-16le')
    return struct.pack('<H', len(s)) + encoded + b'\x00\x00'


def parse_strings(buf):
    pos = 8
    ctype, chdr, csize = struct.unpack_from('<HHI', buf, pos)
    assert ctype == 0x0001, f'Expected StringPool chunk, got {hex(ctype)}'
    str_count, style_count, flags, str_start, style_start = struct.unpack_from('<IIIII', buf, pos + 8)
    assert (flags & (1 << 8)) == 0, 'Expected UTF-16 StringPool'
    assert style_count == 0, 'Expected 0 styles'
    offsets = list(struct.unpack_from(f'<{str_count}I', buf, pos + 28))
    strings_base = pos + str_start
    strings = []
    for off in offsets:
        s, _ = decode_utf16_str(buf, strings_base + off)
        strings.append(s)
    return pos, csize, flags, strings


def build_string_pool(strings, sp_flags):
    str_blobs = bytearray()
    offsets = []
    for s in strings:
        offsets.append(len(str_blobs))
        str_blobs.extend(encode_utf16_str(s))

    sp_hdr_size = 28
    strings_start = sp_hdr_size + 4 * len(strings)
    unaligned_sp_size = strings_start + len(str_blobs)
    pad_len = (4 - (unaligned_sp_size % 4)) % 4
    str_blobs.extend(b'\x00' * pad_len)
    sp_size = unaligned_sp_size + pad_len

    chunk = bytearray()
    chunk.extend(struct.pack('<HHI', 0x0001, sp_hdr_size, sp_size))
    chunk.extend(struct.pack('<IIIII', len(strings), 0, sp_flags, strings_start, 0))
    for off in offsets:
        chunk.extend(struct.pack('<I', off))
    chunk.extend(str_blobs)
    assert len(chunk) == sp_size
    return bytes(chunk)


def shift_idx(val, insert_at):
    if val != 0xFFFFFFFF and val >= insert_at:
        return val + 1
    return val


def ensure_internet_permission(data):
    magic, hdr_size, file_size = struct.unpack_from('<HHI', data, 0)
    assert magic == 0x0003 and hdr_size == 8 and file_size == len(data), 'Invalid AXML header'

    sp_pos, sp_size, sp_flags, strings = parse_strings(data)
    if PERM_INTERNET in strings:
        print(f'[OK] {PERM_INTERNET} already exists in AndroidManifest.xml')
        return data

    # Append PERM_INTERNET at the end of StringPool (index = len(strings))
    new_perm_idx = len(strings)
    new_strings = strings + [PERM_INTERNET]
    new_sp_chunk = build_string_pool(new_strings, sp_flags)

    # Locate first <uses-permission> StartTag+EndTag in the remaining chunks
    rest = data[sp_pos + sp_size :]
    rpos = 0
    insert_at = None
    template_block = None

    uses_perm_str_idx = strings.index('uses-permission')
    name_str_idx = strings.index('name')

    while rpos < len(rest):
        ctype, chdr, csize = struct.unpack_from('<HHI', rest, rpos)
        if ctype == 0x0102:
            line, comment, ns, name, astart, asize, acnt, *_ = struct.unpack_from('<IiIIHHHHHH', rest, rpos + 8)
            if name == uses_perm_str_idx and acnt == 1:
                end_type, _, end_size = struct.unpack_from('<HHI', rest, rpos + csize)
                if end_type == 0x0103:
                    block = bytearray(rest[rpos : rpos + csize + end_size])
                    attr_off = 36
                    ans, aname, araw, tsz, r0, atype, adata = struct.unpack_from('<IIiHBBI', block, attr_off)
                    assert aname == name_str_idx and atype == 3
                    struct.pack_into('<i', block, attr_off + 8, new_perm_idx)
                    struct.pack_into('<I', block, attr_off + 16, new_perm_idx)
                    template_block = bytes(block)
                    insert_at = rpos + csize + end_size
                    break
        rpos += csize

    assert template_block is not None and insert_at is not None, 'Could not find single-attr uses-permission block'

    new_rest = rest[:insert_at] + template_block + rest[insert_at:]
    total_size = 8 + len(new_sp_chunk) + len(new_rest)
    new_data = struct.pack('<HHI', magic, hdr_size, total_size) + new_sp_chunk + new_rest
    print(f'[OK] Added {PERM_INTERNET} (string index {new_perm_idx}) to AndroidManifest.xml')
    return new_data


def ensure_cleartext_traffic(data):
    magic, hdr_size, file_size = struct.unpack_from('<HHI', data, 0)
    assert magic == 0x0003 and hdr_size == 8 and file_size == len(data), 'Invalid AXML header'

    sp_pos, sp_size, sp_flags, strings = parse_strings(data)
    if ATTR_CLEARTEXT in strings:
        print(f'[OK] {ATTR_CLEARTEXT} already exists in AndroidManifest.xml')
        return data

    rest = data[sp_pos + sp_size :]
    rtype, rhdr, rsize = struct.unpack_from('<HHI', rest, 0)
    assert rtype == 0x0180 and rhdr == 8, f'Expected ResourceMap chunk after StringPool, got {hex(rtype)}'
    res_count = (rsize - rhdr) // 4
    res_ids = list(struct.unpack_from(f'<{res_count}I', rest, rhdr))

    # Insert attribute name into sorted ResourceMap + StringPool so ResourceMap[i] matches strings[i]
    insert_idx = 0
    while insert_idx < len(res_ids) and res_ids[insert_idx] < ATTR_CLEARTEXT_RES_ID:
        insert_idx += 1

    new_strings = strings[:insert_idx] + [ATTR_CLEARTEXT] + strings[insert_idx:]
    new_res_ids = res_ids[:insert_idx] + [ATTR_CLEARTEXT_RES_ID] + res_ids[insert_idx:]

    new_sp_chunk = build_string_pool(new_strings, sp_flags)
    new_rm_chunk = struct.pack('<HHI', 0x0180, 8, 8 + 4 * len(new_res_ids)) + struct.pack(
        f'<{len(new_res_ids)}I', *new_res_ids
    )

    app_old_idx = strings.index('application')
    android_ns_old_idx = strings.index('http://schemas.android.com/apk/res/android')
    android_ns_new_idx = shift_idx(android_ns_old_idx, insert_idx)

    # Walk XML tree chunks after ResourceMap and shift string indices >= insert_idx
    xml_bytes = rest[rsize:]
    out_xml = bytearray()
    pos = 0
    patched_app = False

    while pos < len(xml_bytes):
        ctype, chdr, csize = struct.unpack_from('<HHI', xml_bytes, pos)
        chunk = bytearray(xml_bytes[pos : pos + csize])

        if ctype in (0x0100, 0x0101):  # StartNamespace / EndNamespace
            line, comment, prefix, uri = struct.unpack_from('<IiII', chunk, 8)
            struct.pack_into(
                '<IiII',
                chunk,
                8,
                line,
                comment,
                shift_idx(prefix, insert_idx),
                shift_idx(uri, insert_idx),
            )
            out_xml.extend(chunk)
        elif ctype == 0x0103:  # EndTag
            line, comment, ns, name = struct.unpack_from('<IiII', chunk, 8)
            struct.pack_into(
                '<IiII',
                chunk,
                8,
                line,
                comment,
                shift_idx(ns, insert_idx),
                shift_idx(name, insert_idx),
            )
            out_xml.extend(chunk)
        elif ctype == 0x0102:  # StartTag
            line, comment, ns, name, astart, asize, acnt, ididx, clsidx, stidx = struct.unpack_from(
                '<IiIIHHHHHH', chunk, 8
            )
            is_application = (name == app_old_idx)
            new_ns = shift_idx(ns, insert_idx)
            new_name = shift_idx(name, insert_idx)

            attrs = []
            for i in range(acnt):
                aoff = chdr + astart + i * asize
                ans, aname, araw, tsz, r0, atype, adata = struct.unpack_from('<IIiHBBI', chunk, aoff)
                new_ans = shift_idx(ans, insert_idx)
                new_aname = shift_idx(aname, insert_idx)
                new_araw = (araw + 1) if (araw >= insert_idx) else araw
                new_adata = (adata + 1) if (atype == 3 and adata >= insert_idx) else adata
                attrs.append((new_ans, new_aname, new_araw, tsz, r0, atype, new_adata))

            if is_application:
                # Insert android:usesCleartextTraffic="true" sorted by Resource ID
                new_attr = (android_ns_new_idx, insert_idx, -1, 8, 0, 0x12, 0xFFFFFFFF)
                inserted = False
                ordered_attrs = []
                for attr in attrs:
                    attr_name_idx = attr[1]
                    attr_res = new_res_ids[attr_name_idx] if attr_name_idx < len(new_res_ids) else 0xFFFFFFFF
                    if not inserted and ATTR_CLEARTEXT_RES_ID < attr_res:
                        ordered_attrs.append(new_attr)
                        inserted = True
                    ordered_attrs.append(attr)
                if not inserted:
                    ordered_attrs.append(new_attr)
                attrs = ordered_attrs
                patched_app = True

            new_acnt = len(attrs)
            new_csize = chdr + astart + new_acnt * asize
            new_chunk = bytearray(new_csize)
            new_chunk[: chdr + astart] = chunk[: chdr + astart]
            struct.pack_into('<HHI', new_chunk, 0, ctype, chdr, new_csize)
            struct.pack_into(
                '<IiIIHHHHHH',
                new_chunk,
                8,
                line,
                comment,
                new_ns,
                new_name,
                astart,
                asize,
                new_acnt,
                ididx,
                clsidx,
                stidx,
            )
            for i, attr in enumerate(attrs):
                aoff = chdr + astart + i * asize
                struct.pack_into('<IIiHBBI', new_chunk, aoff, *attr)
            out_xml.extend(new_chunk)
        else:
            raise RuntimeError(f'Unsupported AXML chunk type: {hex(ctype)}')

        pos += csize

    assert patched_app, 'Could not find <application> StartTag'

    total_size = 8 + len(new_sp_chunk) + len(new_rm_chunk) + len(out_xml)
    new_data = struct.pack('<HHI', magic, hdr_size, total_size) + new_sp_chunk + new_rm_chunk + bytes(out_xml)
    print(f'[OK] Added android:{ATTR_CLEARTEXT}="true" (resId {hex(ATTR_CLEARTEXT_RES_ID)}, idx {insert_idx})')
    return new_data


def ensure_modern_sdk_and_version(data, target_sdk=TARGET_SDK_VERSION, min_version_code=MIN_VERSION_CODE):
    magic, hdr_size, file_size = struct.unpack_from('<HHI', data, 0)
    assert magic == 0x0003 and hdr_size == 8 and file_size == len(data), 'Invalid AXML header'

    sp_pos, sp_size, _, strings = parse_strings(data)
    rest_start = sp_pos + sp_size
    rtype, rhdr, rsize = struct.unpack_from('<HHI', data, rest_start)
    assert rtype == 0x0180 and rhdr == 8, f'Expected ResourceMap chunk after StringPool, got {hex(rtype)}'
    res_count = (rsize - rhdr) // 4
    res_ids = list(struct.unpack_from(f'<{res_count}I', data, rest_start + rhdr))

    out = bytearray(data)
    pos = rest_start + rsize
    updated_sdk = False

    manifest_idx = strings.index('manifest')
    uses_sdk_idx = strings.index('uses-sdk')

    while pos < len(out):
        ctype, chdr, csize = struct.unpack_from('<HHI', out, pos)
        if ctype == 0x0102:
            line, comment, ns, name, astart, asize, acnt, *_ = struct.unpack_from('<IiIIHHHHHH', out, pos + 8)
            for i in range(acnt):
                aoff = pos + chdr + astart + i * asize
                ans, aname, araw, tsz, r0, atype, adata = struct.unpack_from('<IIiHBBI', out, aoff)
                res_id = res_ids[aname] if aname < len(res_ids) else None
                if name == uses_sdk_idx and res_id == ATTR_TARGET_SDK_RES_ID:
                    assert atype == 0x10, f'Expected integer attribute for targetSdkVersion, got {hex(atype)}'
                    if adata < target_sdk:
                        struct.pack_into('<i', out, aoff + 8, -1)
                        struct.pack_into('<I', out, aoff + 16, target_sdk)
                        print(f'[OK] Updated targetSdkVersion: {adata} -> {target_sdk}')
                    else:
                        print(f'[OK] targetSdkVersion already >= {target_sdk} ({adata})')
                    updated_sdk = True
                elif name == manifest_idx and res_id == ATTR_VERSION_CODE_RES_ID:
                    assert atype == 0x10, f'Expected integer attribute for versionCode, got {hex(atype)}'
                    if adata < min_version_code:
                        struct.pack_into('<i', out, aoff + 8, -1)
                        struct.pack_into('<I', out, aoff + 16, min_version_code)
                        print(f'[OK] Updated versionCode: {adata} -> {min_version_code}')
                    else:
                        print(f'[OK] versionCode already >= {min_version_code} ({adata})')
        pos += csize

    assert updated_sdk, 'Could not find targetSdkVersion attribute in <uses-sdk>'
    return bytes(out)


def patch_manifest():
    orig = open(MANIFEST_PATH, 'rb').read()
    patched = ensure_internet_permission(orig)
    patched = ensure_cleartext_traffic(patched)
    patched = ensure_modern_sdk_and_version(patched)
    if patched != orig:
        with open(MANIFEST_PATH, 'wb') as f:
            f.write(patched)
        print(f'[OK] Saved AndroidManifest.xml ({len(orig)} -> {len(patched)} bytes)')
    return True


if __name__ == '__main__':
    patch_manifest()
