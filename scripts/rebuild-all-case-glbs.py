import io
import json
import struct
from pathlib import Path
from PIL import Image

def rebuild_glb(src_path, dst_path, max_dim=1024, quality=92):
    src = Path(src_path)
    dst = Path(dst_path)
    data = src.read_bytes()
    chunk_len = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20+chunk_len])
    bin_offset = 20 + chunk_len
    bin_len = struct.unpack_from('<I', data, bin_offset)[0]
    bin_bytes = bytearray(data[bin_offset+8:bin_offset+8+bin_len])

    new_bin = bytearray()
    
    img_bvs = {}
    for i, img in enumerate(gltf.get('images', [])):
        img_bvs[img['bufferView']] = i

    old_bvs = gltf['bufferViews']
    new_bvs = []
    
    for bv_idx, bv in enumerate(old_bvs):
        old_off = bv.get('byteOffset', 0)
        old_len = bv['byteLength']
        old_slice = bytes(bin_bytes[old_off:old_off+old_len])
        
        pad = (4 - (len(new_bin) % 4)) % 4
        new_bin += b'\x00' * pad
        new_off = len(new_bin)
        
        if bv_idx in img_bvs:
            img_idx = img_bvs[bv_idx]
            im = Image.open(io.BytesIO(old_slice))
            w, h = im.size
            if max(w, h) > max_dim:
                scale = max_dim / max(w, h)
                im = im.resize((max(1, int(w*scale)), max(1, int(h*scale))), Image.Resampling.LANCZOS)
            
            buf = io.BytesIO()
            has_alpha = False
            if im.mode in ('RGBA', 'LA'):
                alpha = im.getchannel('A')
                if alpha.getextrema()[0] < 254:
                    has_alpha = True
            
            if has_alpha:
                im.save(buf, format='PNG', optimize=True)
                gltf['images'][img_idx]['mimeType'] = 'image/png'
            else:
                im.convert('RGB').save(buf, format='JPEG', quality=quality, optimize=True, progressive=True)
                gltf['images'][img_idx]['mimeType'] = 'image/jpeg'
                
            out_img = buf.getvalue()
            new_bin += out_img
            new_len = len(out_img)
        else:
            new_bin += old_slice
            new_len = old_len
            
        bv_copy = dict(bv)
        bv_copy['byteOffset'] = new_off
        bv_copy['byteLength'] = new_len
        new_bvs.append(bv_copy)
        
    gltf['bufferViews'] = new_bvs
    gltf['buffers'][0]['byteLength'] = len(new_bin)
    
    json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b' ' * json_pad
    bin_pad = (4 - (len(new_bin) % 4)) % 4
    new_bin += b'\x00' * bin_pad
    
    total = 12 + 8 + len(json_bytes) + 8 + len(new_bin)
    out = bytearray()
    out += struct.pack('<4sII', b'glTF', 2, total)
    out += struct.pack('<I4s', len(json_bytes), b'JSON')
    out += json_bytes
    out += struct.pack('<I4s', len(new_bin), b'BIN\x00')
    out += new_bin
    
    dst.write_bytes(out)
    print(f'Successfully rebuilt {src.name} -> {dst}: {len(out)/1024/1024:.2f} MB')

if __name__ == '__main__':
    tasks = [
        # FitTrack
        ('tmp/glb-backup/gym_weights_-_game_asset.glb', 'assets/fittrack/gym_weights_-_game_asset.glb', 1024, 92),
        ('tmp/glb-backup/gym_props._mat_and_push-up_equipment.glb', 'assets/fittrack/gym_props._mat_and_push-up_equipment.glb', 1024, 90),
        # WeatherWise
        ('tmp/glb-backup/weathered_water_tower.glb', 'assets/weather_wise/weathered_water_tower.glb', 1024, 92),
        ('tmp/glb-backup/weather_vane.glb', 'assets/weather_wise/weather_vane.glb', 1024, 92),
        ('tmp/glb-backup/weathered_umbrella__gameready.glb', 'assets/weather_wise/weathered_umbrella__gameready.glb', 1024, 92),
        # Loader Bagel (4096x2048 texture for incredible seed and toast detail)
        ('assets/everything_bagel.glb', 'assets/everything_bagel-loader.glb', 4096, 90),
    ]
    for src, dst, max_dim, q in tasks:
        rebuild_glb(src, dst, max_dim=max_dim, quality=q)
