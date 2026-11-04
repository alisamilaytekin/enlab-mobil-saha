import http.server
import socketserver
import os
import sys
import socket
import webbrowser

PORT = 8080
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(PROJECT_DIR, 'src')

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SRC_DIR, **kwargs)

    def end_headers(self):
        # Önbelleğe almayı kapat (geliştirme sırasında kod değişiklikleri anında görünsün)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run():
    os.chdir(SRC_DIR)
    local_ip = get_local_ip()
    local_url = f"http://localhost:{PORT}"
    network_url = f"http://{local_ip}:{PORT}"

    print("=" * 65)
    print("  ENLAB MOBİL SAHA - GELİŞTİRME SUNUCUSU (DEV SERVER)")
    print("=" * 65)
    print(f"  Kaynak Dizin : {SRC_DIR}")
    print(f"  Bilgisayar   : {local_url}")
    print(f"  Telefon/Ağ   : {network_url} (Aynı Wi-Fi ağındaki telefon için)")
    print("=" * 65)
    print("  -> Tarayıcı otomatik açılıyor...")
    print("  -> Sunucuyu kapatmak için bu pencerede CTRL + C tuşlarına basın.")
    print("=" * 65)

    webbrowser.open(local_url)

    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu kapatıldı.")

if __name__ == '__main__':
    run()
