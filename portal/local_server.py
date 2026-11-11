# -*- coding: utf-8 -*-
"""
Hizli Rapor - Yerel Müşteri Rapor Portalı Sunucusu (Python Stdlib + SQLite)
Vercel + Supabase canlı kurulumu öncesinde veya yerel ağda (Wi-Fi) anında
test ve kullanım için portal/api/*.js ile birebir uyumlu API sağlar.
"""

import argparse
import base64
import datetime
import hashlib
import hmac
import json
import os
import re
import secrets
import socket
import sqlite3
import sys
import time
import urllib.parse
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORTAL_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("PORTAL_DATA_DIR", "").strip() or os.path.join(PORTAL_DIR, ".local_data")
FILES_DIR = os.path.join(DATA_DIR, "files")
DB_PATH = os.path.join(DATA_DIR, "portal.db")
ENV_PATH = os.path.join(PORTAL_DIR, ".env")
MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB


def load_env_file():
    if not os.path.exists(ENV_PATH):
        return
    try:
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                s = line.strip()
                if not s or s.startswith("#") or "=" not in s:
                    continue
                k, v = s.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass


load_env_file()

DEFAULT_ADMIN_KEY = os.environ.get("PORTAL_ADMIN_KEY", "").strip() or "HIZLI-RAPOR-YEREL-2026"
TOKEN_SECRET = (
    os.environ.get("PORTAL_TOKEN_SECRET", "").strip()
    or f"hrp:{DEFAULT_ADMIN_KEY}"
)


def utc_now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")


def b64url_encode(data_bytes: bytes) -> str:
    return base64.urlsafe_b64encode(data_bytes).rstrip(b"=").decode("ascii")


def b64url_decode(text: str) -> bytes:
    pad = "=" * ((4 - (len(text) % 4)) % 4)
    return base64.urlsafe_b64decode(text + pad)


def init_db():
    os.makedirs(FILES_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS portal_folders (
            id TEXT PRIMARY KEY,
            share_slug TEXT NOT NULL UNIQUE,
            work_order_code TEXT DEFAULT '',
            local_wo_id TEXT DEFAULT '',
            company_name TEXT NOT NULL,
            company_branch TEXT DEFAULT '',
            company_address TEXT DEFAULT '',
            contact_email TEXT DEFAULT '',
            pin_hash TEXT,
            has_pin INTEGER NOT NULL DEFAULT 0,
            branding_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_folders_slug ON portal_folders (share_slug);
        CREATE INDEX IF NOT EXISTS idx_folders_local_wo ON portal_folders (local_wo_id);

        CREATE TABLE IF NOT EXISTS portal_reports (
            id TEXT PRIMARY KEY,
            folder_id TEXT NOT NULL REFERENCES portal_folders(id) ON DELETE CASCADE,
            share_slug TEXT NOT NULL UNIQUE,
            verify_code TEXT NOT NULL,
            local_inspection_id TEXT DEFAULT '',
            report_no TEXT NOT NULL,
            equipment_name TEXT NOT NULL,
            template_code TEXT DEFAULT '',
            inspection_date TEXT DEFAULT '',
            next_inspection_date TEXT DEFAULT '',
            inspector_name TEXT DEFAULT '',
            result_status TEXT DEFAULT 'UYGUN',
            source_type TEXT NOT NULL DEFAULT 'app_html',
            storage_path TEXT NOT NULL,
            mime_type TEXT NOT NULL DEFAULT 'text/html',
            file_size_bytes INTEGER NOT NULL DEFAULT 0,
            upload_ready INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_reports_slug ON portal_reports (share_slug);
        CREATE INDEX IF NOT EXISTS idx_reports_folder ON portal_reports (folder_id);
        CREATE INDEX IF NOT EXISTS idx_reports_verify ON portal_reports (report_no, verify_code);
        """
    )
    conn.commit()
    conn.close()


def get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def random_slug(length=8):
    alphabet = "abcdefghjkmnpqrstuvwxyz23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def random_verify_code():
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(6))


def hash_pin(pin: str):
    clean = str(pin or "").strip()
    if not clean:
        return None
    salt = secrets.token_hex(16)
    derived = hashlib.scrypt(clean.encode("utf-8"), salt=salt.encode("utf-8"), n=16384, r=8, p=1, dklen=32).hex()
    return f"{salt}:{derived}"


def verify_pin(pin: str, stored_hash: str) -> bool:
    if not stored_hash or not pin:
        return False
    parts = str(stored_hash).split(":")
    if len(parts) != 2:
        return False
    salt, expected_hex = parts
    try:
        derived = hashlib.scrypt(
            str(pin).strip().encode("utf-8"),
            salt=salt.encode("utf-8"),
            n=16384,
            r=8,
            p=1,
            dklen=32,
        )
        expected = bytes.fromhex(expected_hex)
        if len(derived) != len(expected):
            return False
        return hmac.compare_digest(derived, expected)
    except Exception:
        return False


def sign_folder_token(folder_id: str, slug: str) -> str:
    payload = {
        "f": str(folder_id),
        "s": str(slug),
        "exp": int(time.time() * 1000) + 12 * 60 * 60 * 1000,
    }
    payload_b64 = b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = b64url_encode(
        hmac.new(TOKEN_SECRET.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    )
    return f"{payload_b64}.{sig}"


def verify_folder_token(token: str, expected_slug: str = ""):
    if not token or not isinstance(token, str) or "." not in token:
        return None
    try:
        payload_b64, sig = token.split(".", 1)
        expected_sig = b64url_encode(
            hmac.new(TOKEN_SECRET.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(sig.encode("utf-8"), expected_sig.encode("utf-8")):
            return None
        parsed = json.loads(b64url_decode(payload_b64).decode("utf-8"))
        if not parsed or int(parsed.get("exp", 0)) < int(time.time() * 1000):
            return None
        if expected_slug and parsed.get("s") != expected_slug:
            return None
        return parsed
    except Exception:
        return None


def sign_local_upload(report_id: str, storage_path: str, exp_ts: int) -> str:
    msg = f"upload:{report_id}:{storage_path}:{exp_ts}".encode("utf-8")
    return b64url_encode(hmac.new(TOKEN_SECRET.encode("utf-8"), msg, hashlib.sha256).digest())


def sanitize_report_html(html: str) -> str:
    if not html or not isinstance(html, str):
        return ""
    out = re.sub(r"<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>", "", html, flags=re.IGNORECASE)
    out = re.sub(r"<iframe\b[^<]*(?:(?!</iframe\b)<[^<]*)*</iframe>", "", out, flags=re.IGNORECASE)
    out = re.sub(r"<(object|embed|applet|base)\b[^>]*>", "", out, flags=re.IGNORECASE)
    out = re.sub(r"</(object|embed|applet|base)>", "", out, flags=re.IGNORECASE)
    out = re.sub(r"<meta[^>]*http-equiv\s*=\s*[\"']?refresh[\"']?[^>]*>", "", out, flags=re.IGNORECASE)
    out = re.sub(r"\son[a-z]+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)", "", out, flags=re.IGNORECASE)
    out = re.sub(r"(href|src)\s*=\s*([\"'])\s*javascript:[^\"']*\2", r"\1=\2#\2", out, flags=re.IGNORECASE)
    return out


def safe_file_path(storage_path: str) -> str:
    clean = storage_path.replace("\\", "/").lstrip("/")
    target = os.path.realpath(os.path.join(FILES_DIR, clean))
    base = os.path.realpath(FILES_DIR)
    if not (target == base or target.startswith(base + os.sep)):
        raise ValueError("Gecersiz dosya yolu")
    return target


def row_to_folder(row):
    d = dict(row)
    d["has_pin"] = bool(d.get("has_pin"))
    try:
        d["branding_json"] = json.loads(d.get("branding_json") or "{}")
    except Exception:
        d["branding_json"] = {}
    d.pop("pin_hash", None)
    return d


def row_to_report(row):
    d = dict(row)
    d["upload_ready"] = bool(d.get("upload_ready"))
    return d


class PortalHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        sys.stderr.write(f"[PORTAL] {self.address_string()} - {format % args}\n")

    def add_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key, X-Folder-Token")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")

    def send_json(self, status_code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.add_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_file_response(self, full_path: str, content_type: str):
        with open(full_path, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.add_cors_headers()
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def get_origin(self) -> str:
        proto = self.headers.get("X-Forwarded-Proto", "http").split(",")[0].strip()
        host = (self.headers.get("X-Forwarded-Host") or self.headers.get("Host") or "localhost:8090").split(",")[0].strip()
        return f"{proto}://{host}"

    def extract_admin_key(self) -> str:
        x_key = (self.headers.get("X-Admin-Key") or "").strip()
        if x_key:
            return x_key
        auth = self.headers.get("Authorization") or ""
        if auth.lower().startswith("bearer "):
            return auth[7:].strip()
        return ""

    def verify_admin_key(self) -> bool:
        provided = self.extract_admin_key()
        if not provided or not DEFAULT_ADMIN_KEY:
            return False
        a = hashlib.sha256(provided.encode("utf-8")).digest()
        b = hashlib.sha256(DEFAULT_ADMIN_KEY.encode("utf-8")).digest()
        return hmac.compare_digest(a, b)

    def extract_folder_token(self, query_params: dict) -> str:
        hdr = (self.headers.get("X-Folder-Token") or "").strip()
        if hdr:
            return hdr
        vals = query_params.get("token") or []
        return vals[0].strip() if vals else ""

    def read_raw_body(self, max_bytes: int):
        cl_hdr = self.headers.get("Content-Length")
        if cl_hdr is not None:
            length = int(cl_hdr)
            if length > max_bytes:
                raise ValueError("Istek boyutu siniri asildi")
            if length <= 0:
                return b""
            return self.rfile.read(length)
        if (self.headers.get("Transfer-Encoding") or "").lower() == "chunked":
            chunks = []
            total = 0
            while True:
                size_line = self.rfile.readline()
                if not size_line:
                    break
                chunk_size = int(size_line.strip().split(b";", 1)[0], 16)
                if chunk_size == 0:
                    self.rfile.readline()
                    break
                total += chunk_size
                if total > max_bytes:
                    raise ValueError("Istek boyutu siniri asildi")
                chunks.append(self.rfile.read(chunk_size))
                self.rfile.readline()
            return b"".join(chunks)
        return b""

    def read_json_body(self, max_bytes=1024 * 1024) -> dict:
        raw = self.read_raw_body(max_bytes).decode("utf-8").strip()
        if not raw:
            return {}
        return json.loads(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.add_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)

        if path == "/api/health":
            return self.handle_health()
        if path == "/api/folder":
            return self.handle_get_folder(qs)
        if path == "/api/report":
            return self.handle_get_report(qs)
        if path == "/api/report-file":
            return self.handle_get_report_file(qs)
        if path == "/api/admin":
            return self.handle_admin_get(qs)

        # Static portal pages & rewrite paths (/p/:slug, /r/:slug, /admin)
        if path in ("/", "/index.html"):
            return self.send_file_response(os.path.join(PORTAL_DIR, "index.html"), "text/html; charset=utf-8")
        if path in ("/admin", "/admin.html"):
            return self.send_file_response(os.path.join(PORTAL_DIR, "admin.html"), "text/html; charset=utf-8")
        if path == "/folder.html" or path.startswith("/p/"):
            return self.send_file_response(os.path.join(PORTAL_DIR, "folder.html"), "text/html; charset=utf-8")
        if path == "/report.html" or path.startswith("/r/"):
            return self.send_file_response(os.path.join(PORTAL_DIR, "report.html"), "text/html; charset=utf-8")
        if path == "/styles.css":
            return self.send_file_response(os.path.join(PORTAL_DIR, "styles.css"), "text/css; charset=utf-8")
        if path == "/portal.js":
            return self.send_file_response(os.path.join(PORTAL_DIR, "portal.js"), "application/javascript; charset=utf-8")

        return self.send_json(404, {"ok": False, "error": "Sayfa veya endpoint bulunamadi"})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/upload-init":
            return self.handle_upload_init()
        if path == "/api/upload-complete":
            return self.handle_upload_complete()
        if path == "/api/folder-unlock":
            return self.handle_folder_unlock()
        if path == "/api/admin":
            return self.handle_admin_post()

        return self.send_json(404, {"ok": False, "error": "Bilinmeyen POST endpoint"})

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/local-upload":
            return self.handle_local_upload(urllib.parse.parse_qs(parsed.query))
        return self.send_json(404, {"ok": False, "error": "Bilinmeyen PUT endpoint"})

    def handle_health(self):
        has_header = bool(self.extract_admin_key())
        auth_valid = self.verify_admin_key() if has_header else None
        db_ok = True
        db_err = None
        try:
            conn = get_conn()
            conn.execute("SELECT 1").fetchone()
            conn.close()
        except Exception as e:
            db_ok = False
            db_err = str(e)
        return self.send_json(
            200,
            {
                "ok": True,
                "service": "hizli-rapor-portal",
                "mode": "local-sqlite",
                "configured": True,
                "dbConnected": db_ok,
                "dbError": db_err,
                "authValid": auth_valid,
                "timestamp": utc_now_iso(),
            },
        )

    def handle_upload_init(self):
        if not self.verify_admin_key():
            return self.send_json(401, {"ok": False, "error": "Geçersiz yönetici anahtarı"})

        conn = None
        try:
            body = self.read_json_body(512 * 1024)
            f_in = body.get("folder") or {}
            r_in = body.get("report") or {}

            company_name = str(f_in.get("company_name") or "Müşteri Firma").strip()[:200]
            local_wo_id = str(f_in.get("local_wo_id") or "").strip()[:120]
            req_slug = str(f_in.get("slug") or "").strip()
            now = utc_now_iso()

            conn = get_conn()
            folder_row = None
            if req_slug:
                folder_row = conn.execute("SELECT * FROM portal_folders WHERE share_slug = ? LIMIT 1", (req_slug,)).fetchone()
            elif local_wo_id:
                folder_row = conn.execute("SELECT * FROM portal_folders WHERE local_wo_id = ? LIMIT 1", (local_wo_id,)).fetchone()

            pin_mode = f_in.get("pin_mode") or ("set" if f_in.get("pin") else "keep")
            clean_pin = str(f_in.get("pin") or "").strip()

            if folder_row:
                folder_id = folder_row["id"]
                share_slug = folder_row["share_slug"]
                new_branch = str(f_in["company_branch"]) if f_in.get("company_branch") is not None else folder_row["company_branch"]
                new_addr = str(f_in["company_address"]) if f_in.get("company_address") is not None else folder_row["company_address"]
                new_email = str(f_in["contact_email"]) if f_in.get("contact_email") is not None else folder_row["contact_email"]
                new_wocode = str(f_in["work_order_code"]) if f_in.get("work_order_code") is not None else folder_row["work_order_code"]
                new_brand = json.dumps(f_in.get("branding_json"), ensure_ascii=False) if f_in.get("branding_json") is not None else folder_row["branding_json"]

                pin_hash = folder_row["pin_hash"]
                has_pin = folder_row["has_pin"]
                if pin_mode == "set" and clean_pin:
                    pin_hash = hash_pin(clean_pin)
                    has_pin = 1
                elif pin_mode == "clear":
                    pin_hash = None
                    has_pin = 0

                conn.execute(
                    """
                    UPDATE portal_folders
                    SET company_name = ?, company_branch = ?, company_address = ?,
                        contact_email = ?, work_order_code = ?, branding_json = ?,
                        pin_hash = ?, has_pin = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        company_name or folder_row["company_name"],
                        new_branch,
                        new_addr,
                        new_email,
                        new_wocode,
                        new_brand,
                        pin_hash,
                        has_pin,
                        now,
                        folder_id,
                    ),
                )
            else:
                folder_id = str(uuid.uuid4())
                share_slug = random_slug(8)
                has_pin = 1 if (pin_mode == "set" and clean_pin) else 0
                pin_hash = hash_pin(clean_pin) if has_pin else None
                conn.execute(
                    """
                    INSERT INTO portal_folders
                    (id, share_slug, work_order_code, local_wo_id, company_name, company_branch,
                     company_address, contact_email, pin_hash, has_pin, branding_json, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        folder_id,
                        share_slug,
                        str(f_in.get("work_order_code") or ""),
                        local_wo_id,
                        company_name,
                        str(f_in.get("company_branch") or ""),
                        str(f_in.get("company_address") or ""),
                        str(f_in.get("contact_email") or ""),
                        pin_hash,
                        has_pin,
                        json.dumps(f_in.get("branding_json") or {}, ensure_ascii=False),
                        now,
                        now,
                    ),
                )

            folder_row = conn.execute("SELECT * FROM portal_folders WHERE id = ?", (folder_id,)).fetchone()

            source_type = "uploaded_pdf" if r_in.get("source_type") == "uploaded_pdf" else "app_html"
            ext = "pdf" if source_type == "uploaded_pdf" else "html"
            mime_type = "application/pdf" if source_type == "uploaded_pdf" else "text/html"
            local_insp_id = str(r_in.get("local_inspection_id") or "").strip()[:120]

            report_row = None
            if local_insp_id and source_type == "app_html":
                report_row = conn.execute(
                    "SELECT * FROM portal_reports WHERE folder_id = ? AND local_inspection_id = ? LIMIT 1",
                    (folder_id, local_insp_id),
                ).fetchone()

            if report_row:
                report_id = report_row["id"]
                storage_path = report_row["storage_path"] or f"folders/{folder_id}/{report_id}.{ext}"
                conn.execute(
                    """
                    UPDATE portal_reports
                    SET report_no = ?, equipment_name = ?, template_code = ?,
                        inspection_date = ?, next_inspection_date = ?, inspector_name = ?,
                        result_status = ?, source_type = ?, mime_type = ?, storage_path = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        str(r_in.get("report_no") or report_row["report_no"] or "RAPOR")[:120],
                        str(r_in.get("equipment_name") or report_row["equipment_name"] or "Ekipman")[:200],
                        str(r_in.get("template_code") or report_row["template_code"] or "")[:80],
                        str(r_in.get("inspection_date") or report_row["inspection_date"] or "")[:40],
                        str(r_in.get("next_inspection_date") or report_row["next_inspection_date"] or "")[:40],
                        str(r_in.get("inspector_name") or report_row["inspector_name"] or "")[:120],
                        str(r_in.get("result_status") or report_row["result_status"] or "UYGUN")[:60],
                        source_type,
                        mime_type,
                        storage_path,
                        now,
                        report_id,
                    ),
                )
            else:
                report_id = str(uuid.uuid4())
                report_slug = random_slug(8)
                verify_code = random_verify_code()
                storage_path = f"folders/{folder_id}/{report_id}.{ext}"
                default_rno = f"RPR-{int(time.time()) % 1000000}"
                conn.execute(
                    """
                    INSERT INTO portal_reports
                    (id, folder_id, share_slug, verify_code, local_inspection_id, report_no,
                     equipment_name, template_code, inspection_date, next_inspection_date,
                     inspector_name, result_status, source_type, storage_path, mime_type,
                     file_size_bytes, upload_ready, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
                    """,
                    (
                        report_id,
                        folder_id,
                        report_slug,
                        verify_code,
                        local_insp_id,
                        str(r_in.get("report_no") or default_rno)[:120],
                        str(r_in.get("equipment_name") or "Periyodik Kontrol Raporu")[:200],
                        str(r_in.get("template_code") or "")[:80],
                        str(r_in.get("inspection_date") or "")[:40],
                        str(r_in.get("next_inspection_date") or "")[:40],
                        str(r_in.get("inspector_name") or "")[:120],
                        str(r_in.get("result_status") or "UYGUN")[:60],
                        source_type,
                        storage_path,
                        mime_type,
                        now,
                        now,
                    ),
                )

            report_row = conn.execute("SELECT * FROM portal_reports WHERE id = ?", (report_id,)).fetchone()
            conn.commit()

            exp_ts = int(time.time()) + 300
            sig = sign_local_upload(report_row["id"], report_row["storage_path"], exp_ts)
            origin = self.get_origin()
            upload_url = f"{origin}/api/local-upload?report_id={urllib.parse.quote(report_row['id'])}&exp={exp_ts}&sig={urllib.parse.quote(sig)}"

            return self.send_json(
                200,
                {
                    "ok": True,
                    "folder": {
                        "id": folder_row["id"],
                        "share_slug": folder_row["share_slug"],
                        "has_pin": bool(folder_row["has_pin"]),
                        "url": f"{origin}/p/{folder_row['share_slug']}",
                    },
                    "report": {
                        "id": report_row["id"],
                        "share_slug": report_row["share_slug"],
                        "verify_code": report_row["verify_code"],
                        "url": f"{origin}/r/{report_row['share_slug']}",
                    },
                    "uploadUrl": upload_url,
                    "uploadMethod": "PUT",
                    "contentType": mime_type,
                    "storagePath": report_row["storage_path"],
                },
            )
        except Exception as e:
            return self.send_json(500, {"ok": False, "error": str(e)})
        finally:
            if conn:
                conn.close()

    def handle_local_upload(self, qs: dict):
        conn = None
        try:
            report_id = (qs.get("report_id") or [""])[0].strip()
            exp_str = (qs.get("exp") or ["0"])[0].strip()
            sig = (qs.get("sig") or [""])[0].strip()
            if not report_id or not exp_str or not sig:
                return self.send_json(400, {"ok": False, "error": "Eksik yukleme imzasi"})

            exp_ts = int(exp_str)
            if exp_ts < int(time.time()):
                return self.send_json(403, {"ok": False, "error": "Yukleme linkinin suresi dolmus"})

            conn = get_conn()
            report = conn.execute("SELECT id, storage_path FROM portal_reports WHERE id = ? LIMIT 1", (report_id,)).fetchone()
            if not report:
                return self.send_json(404, {"ok": False, "error": "Rapor bulunamadi"})

            expected_sig = sign_local_upload(report["id"], report["storage_path"], exp_ts)
            if not hmac.compare_digest(sig.encode("utf-8"), expected_sig.encode("utf-8")):
                return self.send_json(403, {"ok": False, "error": "Gecersiz yukleme imzasi"})

            raw_bytes = self.read_raw_body(MAX_UPLOAD_BYTES)
            dest = safe_file_path(report["storage_path"])
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "wb") as f:
                f.write(raw_bytes)

            conn.execute(
                "UPDATE portal_reports SET file_size_bytes = ?, updated_at = ? WHERE id = ?",
                (len(raw_bytes), utc_now_iso(), report_id),
            )
            conn.commit()
            return self.send_json(200, {"ok": True, "bytes": len(raw_bytes)})
        except Exception as e:
            return self.send_json(500, {"ok": False, "error": str(e)})
        finally:
            if conn:
                conn.close()

    def handle_upload_complete(self):
        if not self.verify_admin_key():
            return self.send_json(401, {"ok": False, "error": "Geçersiz yönetici anahtarı"})

        conn = None
        try:
            body = self.read_json_body(64 * 1024)
            report_id = str(body.get("report_id") or "").strip()
            if not report_id:
                return self.send_json(400, {"ok": False, "error": "report_id gerekli"})

            conn = get_conn()
            report = conn.execute("SELECT * FROM portal_reports WHERE id = ? LIMIT 1", (report_id,)).fetchone()
            if not report:
                return self.send_json(404, {"ok": False, "error": "Rapor kaydı bulunamadı"})

            folder = conn.execute("SELECT * FROM portal_folders WHERE id = ? LIMIT 1", (report["folder_id"],)).fetchone()
            fsize = int(body.get("file_size_bytes") or report["file_size_bytes"] or 0)
            now = utc_now_iso()
            conn.execute(
                "UPDATE portal_reports SET upload_ready = 1, file_size_bytes = ?, updated_at = ? WHERE id = ?",
                (fsize, now, report_id),
            )
            if folder:
                conn.execute("UPDATE portal_folders SET updated_at = ? WHERE id = ?", (now, folder["id"]))
            conn.commit()

            origin = self.get_origin()
            return self.send_json(
                200,
                {
                    "ok": True,
                    "folderUrl": f"{origin}/p/{folder['share_slug']}" if folder else "",
                    "folderSlug": folder["share_slug"] if folder else "",
                    "reportUrl": f"{origin}/r/{report['share_slug']}",
                    "reportSlug": report["share_slug"],
                    "verifyCode": report["verify_code"],
                },
            )
        except Exception as e:
            return self.send_json(500, {"ok": False, "error": str(e)})
        finally:
            if conn:
                conn.close()

    def handle_get_folder(self, qs: dict):
        slug = (qs.get("slug") or [""])[0].strip()
        if not slug:
            return self.send_json(400, {"ok": False, "error": "Klasör kodu (slug) gerekli"})

        conn = None
        try:
            conn = get_conn()
            folder_row = conn.execute("SELECT * FROM portal_folders WHERE share_slug = ? LIMIT 1", (slug,)).fetchone()
            if not folder_row:
                return self.send_json(404, {"ok": False, "error": "Müşteri rapor klasörü bulunamadı"})

            folder = row_to_folder(folder_row)
            if folder["has_pin"]:
                token = self.extract_folder_token(qs)
                if not verify_folder_token(token, folder["share_slug"]):
                    return self.send_json(
                        200,
                        {
                            "ok": True,
                            "requiresPin": True,
                            "folder": {
                                "share_slug": folder["share_slug"],
                                "company_name": folder["company_name"],
                                "company_branch": folder["company_branch"],
                                "has_pin": True,
                                "branding_json": folder["branding_json"],
                            },
                            "reports": [],
                        },
                    )

            rows = conn.execute(
                """
                SELECT id, share_slug, verify_code, report_no, equipment_name, template_code,
                       inspection_date, next_inspection_date, inspector_name, result_status,
                       source_type, mime_type, file_size_bytes, created_at, updated_at
                FROM portal_reports
                WHERE folder_id = ? AND upload_ready = 1
                ORDER BY created_at DESC
                """,
                (folder["id"],),
            ).fetchall()

            return self.send_json(
                200,
                {
                    "ok": True,
                    "requiresPin": False,
                    "folder": folder,
                    "reports": [dict(r) for r in rows],
                },
            )
        except Exception as e:
            return self.send_json(500, {"ok": False, "error": str(e)})
        finally:
            if conn:
                conn.close()

    def handle_folder_unlock(self):
        conn = None
        try:
            body = self.read_json_body(16 * 1024)
            slug = str(body.get("slug") or "").strip()
            pin = str(body.get("pin") or "").strip()
            if not slug or not pin:
                return self.send_json(400, {"ok": False, "error": "Klasör kodu ve erişim şifresi gerekli"})

            conn = get_conn()
            folder = conn.execute(
                "SELECT id, share_slug, pin_hash, has_pin FROM portal_folders WHERE share_slug = ? LIMIT 1",
                (slug,),
            ).fetchone()
            if not folder:
                return self.send_json(404, {"ok": False, "error": "Klasör bulunamadı"})

            if not folder["has_pin"]:
                return self.send_json(200, {"ok": True, "token": sign_folder_token(folder["id"], folder["share_slug"])})

            if not verify_pin(pin, folder["pin_hash"]):
                return self.send_json(403, {"ok": False, "error": "Erişim kodu (PIN) hatalı!"})

            return self.send_json(200, {"ok": True, "token": sign_folder_token(folder["id"], folder["share_slug"])})
        except Exception as e:
            return self.send_json(500, {"ok": False, "error": str(e)})
        finally:
            if conn:
                conn.close()

    def handle_get_report(self, qs: dict):
        slug = (qs.get("slug") or [""])[0].strip()
        report_no = (qs.get("report_no") or [""])[0].strip()
        verify_code = (qs.get("verify_code") or [""])[0].strip().upper()

        conn = None
        try:
            conn = get_conn()
            if slug:
                report = conn.execute(
                    "SELECT * FROM portal_reports WHERE share_slug = ? AND upload_ready = 1 LIMIT 1",
                    (slug,),
                ).fetchone()
            elif report_no and verify_code:
                report = conn.execute(
                    """
                    SELECT * FROM portal_reports
                    WHERE LOWER(report_no) = LOWER(?) AND verify_code = ? AND upload_ready = 1
                    LIMIT 1
                    """,
                    (report_no, verify_code),
                ).fetchone()
            else:
                return self.send_json(
                    400, {"ok": False, "error": "Rapor kodu (slug) veya Rapor No + Doğrulama Kodu gerekli"}
                )

            if not report:
                return self.send_json(404, {"ok": False, "error": "Rapor bulunamadı veya doğrulanamadı"})

            folder_row = conn.execute(
                "SELECT * FROM portal_folders WHERE id = ? LIMIT 1", (report["folder_id"],)
            ).fetchone()
            if not folder_row:
                return self.send_json(404, {"ok": False, "error": "İlişkili firma klasörü bulunamadı"})

            folder = row_to_folder(folder_row)
            token = self.extract_folder_token(qs)
            unlocked = (not folder["has_pin"]) or bool(verify_folder_token(token, folder["share_slug"]))

            return self.send_json(
                200,
                {
                    "ok": True,
                    "verified": True,
                    "requiresPin": not unlocked,
                    "folder": {
                        "share_slug": folder["share_slug"],
                        "work_order_code": folder["work_order_code"],
                        "company_name": folder["company_name"],
                        "company_branch": folder["company_branch"],
                        "company_address": folder["company_address"] if unlocked else "",
                        "has_pin": folder["has_pin"],
                        "branding_json": folder["branding_json"],
                    },
                    "report": {
                        "id": report["id"],
                        "share_slug": report["share_slug"],
                        "verify_code": report["verify_code"],
                        "report_no": report["report_no"],
                        "equipment_name": report["equipment_name"],
                        "template_code": report["template_code"],
                        "inspection_date": report["inspection_date"],
                        "next_inspection_date": report["next_inspection_date"],
                        "inspector_name": report["inspector_name"],
                        "result_status": report["result_status"],
                        "source_type": report["source_type"],
                        "mime_type": report["mime_type"],
                        "file_size_bytes": report["file_size_bytes"],
                        "created_at": report["created_at"],
                        "updated_at": report["updated_at"],
                    },
                },
            )
        except Exception as e:
            return self.send_json(500, {"ok": False, "error": str(e)})
        finally:
            if conn:
                conn.close()

    def handle_get_report_file(self, qs: dict):
        slug = (qs.get("slug") or [""])[0].strip()
        download = (qs.get("download") or ["0"])[0] == "1"
        fmt = (qs.get("format") or [""])[0].strip()
        if not slug:
            return self.send_json(400, {"ok": False, "error": "Rapor kodu (slug) gerekli"})

        conn = None
        try:
            conn = get_conn()
            report = conn.execute(
                "SELECT * FROM portal_reports WHERE share_slug = ? AND upload_ready = 1 LIMIT 1",
                (slug,),
            ).fetchone()
            if not report:
                return self.send_json(404, {"ok": False, "error": "Rapor bulunamadı"})

            folder = conn.execute(
                "SELECT id, share_slug, has_pin FROM portal_folders WHERE id = ? LIMIT 1",
                (report["folder_id"],),
            ).fetchone()
            if not folder:
                return self.send_json(404, {"ok": False, "error": "Klasör bulunamadı"})

            if folder["has_pin"]:
                token = self.extract_folder_token(qs)
                if not verify_folder_token(token, folder["share_slug"]):
                    return self.send_json(
                        403, {"ok": False, "error": "Bu raporu görüntülemek için erişim şifresi (PIN) gereklidir"}
                    )

            target_path = safe_file_path(report["storage_path"])
            if not os.path.exists(target_path):
                return self.send_json(404, {"ok": False, "error": "Rapor dosyası depolama alanında bulunamadı"})

            with open(target_path, "rb") as f:
                raw_bytes = f.read()

            if report["source_type"] == "uploaded_pdf" or report["mime_type"] == "application/pdf":
                safe_name = re.sub(
                    r"[^a-zA-Z0-9._-]", "_", str(report["report_no"] or report["equipment_name"] or "Rapor")
                )[:60]
                disp = "attachment" if download else "inline"
                self.send_response(200)
                self.add_cors_headers()
                self.send_header("Content-Type", "application/pdf")
                self.send_header("Content-Disposition", f'{disp}; filename="{safe_name}.pdf"')
                self.send_header("Content-Length", str(len(raw_bytes)))
                self.end_headers()
                self.wfile.write(raw_bytes)
                return

            safe_html = sanitize_report_html(raw_bytes.decode("utf-8", errors="replace"))
            if fmt == "json":
                return self.send_json(200, {"ok": True, "html": safe_html})

            html_bytes = safe_html.encode("utf-8")
            self.send_response(200)
            self.add_cors_headers()
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header(
                "Content-Security-Policy",
                "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:;",
            )
            self.send_header("Content-Length", str(len(html_bytes)))
            self.end_headers()
            self.wfile.write(html_bytes)
        except Exception as e:
            return self.send_json(500, {"ok": False, "error": str(e)})
        finally:
            if conn:
                conn.close()

    def handle_admin_get(self, qs: dict):
        if not self.verify_admin_key():
            return self.send_json(401, {"ok": False, "error": "Geçersiz yönetici anahtarı"})

        conn = None
        try:
            q = (qs.get("q") or [""])[0].strip().lower()
            origin = self.get_origin()
            conn = get_conn()
            folder_rows = conn.execute(
                "SELECT * FROM portal_folders ORDER BY updated_at DESC"
            ).fetchall()
            report_rows = conn.execute(
                """
                SELECT id, folder_id, share_slug, verify_code, report_no, equipment_name,
                       template_code, inspection_date, inspector_name, result_status,
                       source_type, file_size_bytes, created_at, updated_at
                FROM portal_reports
                WHERE upload_ready = 1
                ORDER BY created_at DESC
                """
            ).fetchall()

            by_folder = {}
            for r in report_rows:
                rd = dict(r)
                rd["url"] = f"{origin}/r/{rd['share_slug']}"
                by_folder.setdefault(rd["folder_id"], []).append(rd)

            items = []
            for f in folder_rows:
                fd = row_to_folder(f)
                fd["url"] = f"{origin}/p/{fd['share_slug']}"
                fd["reports"] = by_folder.get(fd["id"], [])
                items.append(fd)

            if q:
                items = [
                    f
                    for f in items
                    if q in (f.get("company_name") or "").lower()
                    or q in (f.get("company_branch") or "").lower()
                    or q in (f.get("work_order_code") or "").lower()
                    or any(
                        q in (r.get("equipment_name") or "").lower()
                        or q in (r.get("report_no") or "").lower()
                        or q in (r.get("verify_code") or "").lower()
                        for r in f["reports"]
                    )
                ]

            return self.send_json(
                200,
                {
                    "ok": True,
                    "totals": {"folders": len(folder_rows), "reports": len(report_rows)},
                    "folders": items,
                },
            )
        except Exception as e:
            return self.send_json(500, {"ok": False, "error": str(e)})
        finally:
            if conn:
                conn.close()

    def handle_admin_post(self):
        if not self.verify_admin_key():
            return self.send_json(401, {"ok": False, "error": "Geçersiz yönetici anahtarı"})

        conn = None
        try:
            body = self.read_json_body(64 * 1024)
            action = str(body.get("action") or "").strip()
            conn = get_conn()

            if action == "update-folder":
                folder_id = str(body.get("folder_id") or "").strip()
                if not folder_id:
                    return self.send_json(400, {"ok": False, "error": "folder_id gerekli"})
                row = conn.execute("SELECT * FROM portal_folders WHERE id = ? LIMIT 1", (folder_id,)).fetchone()
                if not row:
                    return self.send_json(404, {"ok": False, "error": "Klasör bulunamadı"})

                company_name = str(body["company_name"]).strip() if body.get("company_name") is not None else row["company_name"]
                company_branch = str(body["company_branch"]).strip() if body.get("company_branch") is not None else row["company_branch"]
                company_address = str(body["company_address"]).strip() if body.get("company_address") is not None else row["company_address"]
                contact_email = str(body["contact_email"]).strip() if body.get("contact_email") is not None else row["contact_email"]

                pin_hash = row["pin_hash"]
                has_pin = row["has_pin"]
                if body.get("clear_pin"):
                    pin_hash = None
                    has_pin = 0
                elif body.get("pin") and str(body.get("pin")).strip():
                    pin_hash = hash_pin(str(body.get("pin")))
                    has_pin = 1

                conn.execute(
                    """
                    UPDATE portal_folders
                    SET company_name = ?, company_branch = ?, company_address = ?,
                        contact_email = ?, pin_hash = ?, has_pin = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (company_name, company_branch, company_address, contact_email, pin_hash, has_pin, utc_now_iso(), folder_id),
                )
                conn.commit()
                return self.send_json(200, {"ok": True})

            if action == "delete-report":
                report_id = str(body.get("report_id") or "").strip()
                if not report_id:
                    return self.send_json(400, {"ok": False, "error": "report_id gerekli"})
                row = conn.execute("SELECT storage_path FROM portal_reports WHERE id = ? LIMIT 1", (report_id,)).fetchone()
                if row and row["storage_path"]:
                    try:
                        p = safe_file_path(row["storage_path"])
                        if os.path.exists(p):
                            os.remove(p)
                    except Exception:
                        pass
                conn.execute("DELETE FROM portal_reports WHERE id = ?", (report_id,))
                conn.commit()
                return self.send_json(200, {"ok": True})

            if action == "delete-folder":
                folder_id = str(body.get("folder_id") or "").strip()
                if not folder_id:
                    return self.send_json(400, {"ok": False, "error": "folder_id gerekli"})
                rows = conn.execute("SELECT storage_path FROM portal_reports WHERE folder_id = ?", (folder_id,)).fetchall()
                for r in rows:
                    try:
                        p = safe_file_path(r["storage_path"])
                        if os.path.exists(p):
                            os.remove(p)
                    except Exception:
                        pass
                conn.execute("DELETE FROM portal_folders WHERE id = ?", (folder_id,))
                conn.commit()
                return self.send_json(200, {"ok": True})

            return self.send_json(400, {"ok": False, "error": "Bilinmeyen işlem"})
        except Exception as e:
            return self.send_json(500, {"ok": False, "error": str(e)})
        finally:
            if conn:
                conn.close()


def detect_lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def create_server(host="0.0.0.0", port=8090):
    init_db()
    return ThreadingHTTPServer((host, port), PortalHandler)


def main():
    parser = argparse.ArgumentParser(description="Hizli Rapor Yerel Musteri Portali Sunucusu")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8090")))
    args = parser.parse_args()

    init_db()
    server = ThreadingHTTPServer((args.host, args.port), PortalHandler)
    lan_ip = detect_lan_ip()

    print("=" * 68)
    print("HIZLI RAPOR - MUSTERI RAPOR PORTALI (YEREL / WI-FI TEST SUNUCUSU)")
    print("=" * 68)
    print(f"  Tarayici Adresi (Bu PC) : http://localhost:{args.port}")
    print(f"  Telefon / Wi-Fi Adresi  : http://{lan_ip}:{args.port}")
    print(f"  Yonetici Paneli         : http://localhost:{args.port}/admin")
    print(f"  Yonetici Anahtari       : {DEFAULT_ADMIN_KEY}")
    print(f"  Yerel Veritabani        : {DB_PATH}")
    print("-" * 68)
    print("  Durdurmak icin Ctrl+C tuslarina basin.")
    print("=" * 68)
    sys.stdout.flush()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu kapatiliyor...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
