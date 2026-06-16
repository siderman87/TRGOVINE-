from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import csv
import io
import json
import mimetypes
import sqlite3
import sys
import uuid
from datetime import datetime, date
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
DB_PATH = ROOT / "blagajne.sqlite3"


def now_iso():
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS stores (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              city TEXT NOT NULL,
              manager TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              role TEXT NOT NULL,
              pin TEXT NOT NULL,
              store_id TEXT,
              active INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL,
              FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS closings (
              id TEXT PRIMARY KEY,
              store_id TEXT NOT NULL,
              seller_id TEXT NOT NULL,
              closing_date TEXT NOT NULL,
              opening_cash REAL NOT NULL,
              cash_sales REAL NOT NULL,
              card_sales REAL NOT NULL,
              other_sales REAL NOT NULL,
              refunds REAL NOT NULL,
              deposit REAL NOT NULL,
              counted_cash REAL NOT NULL,
              card_statement REAL NOT NULL,
              expected_cash REAL NOT NULL,
              cash_variance REAL NOT NULL,
              card_variance REAL NOT NULL,
              notes TEXT NOT NULL DEFAULT '',
              status TEXT NOT NULL DEFAULT 'draft',
              approved_by TEXT,
              approved_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              UNIQUE(store_id, closing_date),
              FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
              FOREIGN KEY (seller_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS attachments (
              id TEXT PRIMARY KEY,
              closing_id TEXT NOT NULL,
              name TEXT NOT NULL,
              mime TEXT NOT NULL,
              data_url TEXT NOT NULL,
              created_at TEXT NOT NULL,
              FOREIGN KEY (closing_id) REFERENCES closings(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS audit (
              id TEXT PRIMARY KEY,
              action TEXT NOT NULL,
              entity_id TEXT NOT NULL,
              user_id TEXT,
              user_name TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )
        store_count = conn.execute("SELECT COUNT(*) FROM stores").fetchone()[0]
        if store_count == 0:
            lj = "s-lj"
            mb = "s-mb"
            conn.executemany(
                "INSERT INTO stores (id, name, city, manager, created_at) VALUES (?, ?, ?, ?, ?)",
                [
                    (lj, "Trgovina Center", "Ljubljana", "Nina Ljubljana", now_iso()),
                    (mb, "Trgovina Lent", "Maribor", "Tomaž Maribor", now_iso()),
                ],
            )
            conn.executemany(
                "INSERT INTO users (id, name, role, pin, store_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    ("u-admin", "Gregor Lastnik", "administrator", "1234", None, now_iso()),
                    ("u-rac", "Maja Računovodstvo", "računovodstvo", "2222", None, now_iso()),
                    ("u-nina", "Nina Ljubljana", "poslovodja", "1111", lj, now_iso()),
                    ("u-tomaz", "Tomaž Maribor", "blagajnik", "3333", mb, now_iso()),
                ],
            )


def rowdict(row):
    return dict(row) if row else None


def audit(conn, action, entity_id, user):
    conn.execute(
        "INSERT INTO audit (id, action, entity_id, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), action, entity_id, user.get("id"), user.get("name", "sistem"), now_iso()),
    )


def calc(payload):
    opening = float(payload.get("opening_cash", 0))
    cash = float(payload.get("cash_sales", 0))
    refunds = float(payload.get("refunds", 0))
    deposit = float(payload.get("deposit", 0))
    counted = float(payload.get("counted_cash", 0))
    cards = float(payload.get("card_sales", 0))
    statement = float(payload.get("card_statement", 0))
    expected = opening + cash - refunds - deposit
    return expected, counted - expected, statement - cards


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def body_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if not length:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        request_path = urlparse(self.path).path
        if request_path.startswith("/api/"):
            return self.route_get()
        path = request_path.lstrip("/") or "index.html"
        file_path = (PUBLIC / path).resolve()
        if not str(file_path).startswith(str(PUBLIC.resolve())) or not file_path.exists():
            self.send_error(404)
            return
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(file_path.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        try:
            self.route_post()
        except sqlite3.IntegrityError as exc:
            self.send_json({"error": "Podatek že obstaja ali manjka povezava.", "detail": str(exc)}, 409)
        except Exception as exc:
            self.send_json({"error": "Napaka strežnika", "detail": str(exc)}, 500)

    def route_get(self):
        request_path = urlparse(self.path).path
        with db() as conn:
            if request_path == "/api/state":
                self.send_json({
                    "stores": [rowdict(r) for r in conn.execute("SELECT * FROM stores ORDER BY name")],
                    "users": [rowdict(r) for r in conn.execute("SELECT id, name, role, store_id, active, created_at FROM users ORDER BY name")],
                    "closings": [rowdict(r) for r in conn.execute("SELECT * FROM closings ORDER BY closing_date DESC, created_at DESC")],
                    "attachments": [rowdict(r) for r in conn.execute("SELECT * FROM attachments ORDER BY created_at DESC")],
                    "audit": [rowdict(r) for r in conn.execute("SELECT * FROM audit ORDER BY created_at DESC LIMIT 30")],
                })
                return
            self.send_error(404)

    def route_post(self):
        request_path = urlparse(self.path).path
        payload = self.body_json()
        with db() as conn:
            if request_path == "/api/login":
                user = rowdict(conn.execute("SELECT id, name, role, store_id, active FROM users WHERE pin = ? AND active = 1", (payload.get("pin", ""),)).fetchone())
                if not user:
                    self.send_json({"error": "Napačen PIN"}, 401)
                    return
                self.send_json({"user": user})
                return

            user = payload.get("user") or {"name": "sistem"}

            if request_path == "/api/stores":
                item_id = payload.get("id") or str(uuid.uuid4())
                conn.execute(
                    """
                    INSERT INTO stores (id, name, city, manager, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET name=excluded.name, city=excluded.city, manager=excluded.manager
                    """,
                    (item_id, payload["name"], payload["city"], payload["manager"], now_iso()),
                )
                audit(conn, "store_saved", item_id, user)
                self.send_json({"ok": True, "id": item_id})
                return

            if request_path == "/api/users":
                item_id = payload.get("id") or str(uuid.uuid4())
                existing = rowdict(conn.execute("SELECT pin FROM users WHERE id = ?", (item_id,)).fetchone())
                pin = payload.get("pin") or (existing["pin"] if existing else "0000")
                conn.execute(
                    """
                    INSERT INTO users (id, name, role, pin, store_id, active, created_at)
                    VALUES (?, ?, ?, ?, ?, 1, ?)
                    ON CONFLICT(id) DO UPDATE SET name=excluded.name, role=excluded.role, pin=excluded.pin, store_id=excluded.store_id, active=1
                    """,
                    (item_id, payload["name"], payload["role"], pin, payload.get("store_id") or None, now_iso()),
                )
                audit(conn, "user_saved", item_id, user)
                self.send_json({"ok": True, "id": item_id})
                return

            if request_path == "/api/closings":
                expected, cash_var, card_var = calc(payload)
                item_id = payload.get("id") or str(uuid.uuid4())
                existing = rowdict(conn.execute("SELECT status FROM closings WHERE id = ?", (item_id,)).fetchone())
                if existing and existing["status"] == "approved":
                    self.send_json({"error": "Potrjenega zaključka ni mogoče spreminjati."}, 409)
                    return
                conn.execute(
                    """
                    INSERT INTO closings (
                      id, store_id, seller_id, closing_date, opening_cash, cash_sales, card_sales, other_sales,
                      refunds, deposit, counted_cash, card_statement, expected_cash, cash_variance, card_variance,
                      notes, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      store_id=excluded.store_id, seller_id=excluded.seller_id, closing_date=excluded.closing_date,
                      opening_cash=excluded.opening_cash, cash_sales=excluded.cash_sales, card_sales=excluded.card_sales,
                      other_sales=excluded.other_sales, refunds=excluded.refunds, deposit=excluded.deposit,
                      counted_cash=excluded.counted_cash, card_statement=excluded.card_statement,
                      expected_cash=excluded.expected_cash, cash_variance=excluded.cash_variance,
                      card_variance=excluded.card_variance, notes=excluded.notes, updated_at=excluded.updated_at
                    """,
                    (
                        item_id, payload["store_id"], payload["seller_id"], payload["closing_date"],
                        float(payload.get("opening_cash", 0)), float(payload.get("cash_sales", 0)),
                        float(payload.get("card_sales", 0)), float(payload.get("other_sales", 0)),
                        float(payload.get("refunds", 0)), float(payload.get("deposit", 0)),
                        float(payload.get("counted_cash", 0)), float(payload.get("card_statement", 0)),
                        expected, cash_var, card_var, payload.get("notes", ""), now_iso(), now_iso()
                    ),
                )
                for att in payload.get("attachments", []):
                    conn.execute(
                        "INSERT INTO attachments (id, closing_id, name, mime, data_url, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                        (str(uuid.uuid4()), item_id, att["name"], att.get("mime", ""), att.get("data_url", ""), now_iso()),
                    )
                audit(conn, "closing_saved", item_id, user)
                self.send_json({"ok": True, "id": item_id})
                return

            if request_path == "/api/approve":
                conn.execute(
                    "UPDATE closings SET status='approved', approved_by=?, approved_at=?, updated_at=? WHERE id=? AND status!='approved'",
                    (user.get("name", "neznano"), now_iso(), now_iso(), payload["id"]),
                )
                audit(conn, "closing_approved", payload["id"], user)
                self.send_json({"ok": True})
                return

            if request_path == "/api/delete-closing":
                conn.execute("DELETE FROM closings WHERE id=? AND status!='approved'", (payload["id"],))
                audit(conn, "closing_deleted", payload["id"], user)
                self.send_json({"ok": True})
                return

            if request_path == "/api/delete-store":
                closing_count = conn.execute("SELECT COUNT(*) FROM closings WHERE store_id=?", (payload["id"],)).fetchone()[0]
                if closing_count:
                    self.send_json({"error": "Trgovine z zaključki ni mogoče izbrisati. Naj ostane v zgodovini."}, 409)
                    return
                conn.execute("UPDATE users SET store_id=NULL WHERE store_id=?", (payload["id"],))
                conn.execute("DELETE FROM stores WHERE id=?", (payload["id"],))
                audit(conn, "store_deleted", payload["id"], user)
                self.send_json({"ok": True})
                return

            if request_path == "/api/delete-user":
                if payload["id"] == user.get("id"):
                    self.send_json({"error": "Ne moreš izbrisati trenutno prijavljenega uporabnika."}, 409)
                    return
                closing_count = conn.execute("SELECT COUNT(*) FROM closings WHERE seller_id=?", (payload["id"],)).fetchone()[0]
                if closing_count:
                    conn.execute("UPDATE users SET active=0 WHERE id=?", (payload["id"],))
                else:
                    conn.execute("DELETE FROM users WHERE id=?", (payload["id"],))
                audit(conn, "user_deleted", payload["id"], user)
                self.send_json({"ok": True})
                return

            if request_path == "/api/import-tris":
                result = import_tris(conn, payload.get("csv", ""), user)
                self.send_json(result)
                return

        self.send_error(404)


def import_tris(conn, text, user):
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    imported = 0
    skipped = []
    users = {r["name"].lower(): r["id"] for r in conn.execute("SELECT id, name FROM users")}
    stores = {r["name"].lower(): r["id"] for r in conn.execute("SELECT id, name FROM stores")}
    for idx, row in enumerate(reader, start=2):
        try:
            store_id = stores[row["trgovina"].strip().lower()]
            seller_id = users[row["prodajalka"].strip().lower()]
            payload = {
                "store_id": store_id,
                "seller_id": seller_id,
                "closing_date": row["datum"].strip(),
                "opening_cash": row.get("zacetna_gotovina", 0),
                "cash_sales": row.get("gotovina", 0),
                "card_sales": row.get("kartice", 0),
                "other_sales": row.get("drugo", 0),
                "refunds": row.get("vracila", 0),
                "deposit": row.get("polog", 0),
                "counted_cash": row.get("presteta_gotovina", 0),
                "card_statement": row.get("pos_kartice", row.get("kartice", 0)),
                "notes": "Uvoz iz TRIS",
            }
            expected, cash_var, card_var = calc(payload)
            item_id = str(uuid.uuid4())
            conn.execute(
                """
                INSERT INTO closings (
                  id, store_id, seller_id, closing_date, opening_cash, cash_sales, card_sales, other_sales,
                  refunds, deposit, counted_cash, card_statement, expected_cash, cash_variance, card_variance,
                  notes, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
                """,
                (
                    item_id, store_id, seller_id, payload["closing_date"], float(payload["opening_cash"]),
                    float(payload["cash_sales"]), float(payload["card_sales"]), float(payload["other_sales"]),
                    float(payload["refunds"]), float(payload["deposit"]), float(payload["counted_cash"]),
                    float(payload["card_statement"]), expected, cash_var, card_var, payload["notes"], now_iso(), now_iso()
                ),
            )
            imported += 1
        except Exception as exc:
            skipped.append({"line": idx, "reason": str(exc)})
    audit(conn, "tris_import", f"{imported} rows", user)
    return {"imported": imported, "skipped": skipped}


if __name__ == "__main__":
    init_db()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Blagajne faza 3: http://127.0.0.1:{port}")
    server.serve_forever()
