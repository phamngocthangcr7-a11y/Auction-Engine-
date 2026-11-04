import os
import sys
import subprocess
import re
import webbrowser
import time

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 72, flush=True)
print("  AURELIA - KÍCH HOẠT LIÊN KẾT CÔNG KHAI TOÀN CẦU (CLOUDFLARE TUNNEL)", flush=True)
print("  Sinh viên: Phạm Ngọc Thắng - MSSV: 6651071071", flush=True)
print("=" * 72, flush=True)
print("", flush=True)

base_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(base_dir)

# 1. Kiem tra may chu web cuc bo port 5500
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
is_running = False
try:
    s.connect(('127.0.0.1', 5500))
    is_running = True
    s.close()
except:
    pass

if not is_running:
    print("[1/2] Đang khởi động Web Server cục bộ tại cổng 5500...", flush=True)
    subprocess.Popen([sys.executable, "-m", "http.server", "5500", "--bind", "0.0.0.0"], cwd=parent_dir, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    print("      [OK] Máy chủ Web cục bộ đã sẵn sàng tại http://localhost:5500", flush=True)
else:
    print("[1/2] [OK] Đã phát hiện Máy chủ Live Server / Web Server đang chạy tại cổng 5500.", flush=True)

print("", flush=True)
print("[2/2] Đang kết nối đường hầm Cloudflare siêu tốc (Không mật khẩu, Không đăng nhập)...", flush=True)

cloudflared_path = os.path.join(base_dir, "cloudflared.exe")
if not os.path.exists(cloudflared_path):
    print(f"[LỖI] Không tìm thấy file {cloudflared_path}", flush=True)
    input("Nhấn Enter để thoát...")
    sys.exit(1)

# Chay cloudflared
process = subprocess.Popen(
    [cloudflared_path, "tunnel", "--url", "http://localhost:5500"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1,
    encoding='utf-8',
    errors='replace'
)

tunnel_url = None

while True:
    line = process.stdout.readline()
    if not line:
        break
    
    # Tim trycloudflare.com
    match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
    if match and not tunnel_url:
        tunnel_url = match.group(0)
        full_url = f"{tunnel_url}/auction-engine-web/index.html"
        
        # Sao chep vao clipboard
        try:
            p = subprocess.Popen(['clip'], stdin=subprocess.PIPE)
            p.communicate(full_url.encode('utf-8'))
        except:
            pass
            
        print("", flush=True)
        print("=" * 72, flush=True)
        print("  🎉 ĐÃ TẠO THÀNH CÔNG LIÊN KẾT INTERNET TOÀN CẦU (4G / 5G / WI-FI)!", flush=True)
        print("=" * 72, flush=True)
        print("", flush=True)
        print("  👉 ĐƯỜNG LINK TRANG CHỦ ĐẤU GIÁ CỦA BẠN:", flush=True)
        print(f"     {full_url}", flush=True)
        print("", flush=True)
        print("  👉 HOẶC LINK GỐC (TỰ CHUYỂN HƯỚNG VÀO TRANG CHỦ):", flush=True)
        print(f"     {tunnel_url}", flush=True)
        print("", flush=True)
        print("  ✨ ĐẶC ĐIỂM VƯỢT TRỘI SO VỚI CÁCH CŨ:", flush=True)
        print("     [x] HOÀN TOÀN KHÔNG CẦN NHẬP MẬT KHẨU (0 Passwords)", flush=True)
        print("     [x] KHÔNG CẦN ĐĂNG KÝ / ĐĂNG NHẬP GÌ CẢ", flush=True)
        print("     [x] BẤT KỲ AI BẤM LINK ĐỀU VÀO THẲNG WEB NGAY LẬP TỨC", flush=True)
        print("     [x] ĐÃ TỰ ĐỘNG COPY LINK VÀO BỘ NHỚ TẠM (BẠN CHỈ CẦN DÁN VÀO ZALO / MESSENGER)", flush=True)
        print("     [x] ĐỒNG BỘ ĐẤU GIÁ THỜI GIAN THỰC (REALTIME MQTT) GIỮA ĐIỆN THOẠI & MÁY TÍNH", flush=True)
        print("", flush=True)
        print("=" * 72, flush=True)
        print("  [HƯỚNG DẪN]: HÃY ĐỂ NGUYÊN CỬA SỔ NÀY TRONG LÚC TEST HOẶC THUYẾT TRÌNH.", flush=True)
        print("  Khi nào muốn tắt link, chỉ cần đóng cửa sổ màu đen này lại.", flush=True)
        print("=" * 72, flush=True)
        print("", flush=True)
        
        try:
            webbrowser.open(full_url)
        except:
            pass
            
    if tunnel_url and "Registered tunnel connection" in line:
        print("  [Trạng thái]: Đường hầm Cloudflare đang hoạt động ổn định toàn cầu.", flush=True)

process.wait()
