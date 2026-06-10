from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel
from urllib.parse import parse_qs
from datetime import datetime
from collections import deque
from pathlib import Path
import asyncio
import json
import uuid

app = FastAPI(title="ESP32 Monitor")

readings: deque = deque(maxlen=500)
clients: list[asyncio.Queue] = []
current_status: dict = {}          # cid → último reading

DATA_FILE = Path(__file__).parent / "containers.json"


def load_data() -> dict:
    if DATA_FILE.exists():
        try:
            return json.loads(DATA_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"containers": {}, "active_id": None}


def save_data():
    DATA_FILE.write_text(
        json.dumps({"containers": containers, "active_id": active_id},
                   indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


_data = load_data()
containers: dict = _data["containers"]   # {id: {name, height, lat, lng}}
active_id: str | None = _data["active_id"]


class ContainerBody(BaseModel):
    name: str
    height: float
    lat: float | None = None
    lng: float | None = None


def calcular_nivel(distancia: float, altura: float) -> tuple[float, str]:
    fill = max(0.0, min(100.0, (altura - distancia) / altura * 100))
    if fill <= 33:
        status = "vazio"
    elif fill <= 66:
        status = "medio"
    else:
        status = "cheio"
    return round(fill, 1), status


# ── Containers ───────────────────────────────────────────────────────────────

@app.get("/containers")
async def list_containers():
    return {"containers": containers, "active_id": active_id}


@app.post("/containers")
async def create_container(body: ContainerBody):
    cid = str(uuid.uuid4())[:8]
    containers[cid] = {
        "name": body.name.strip(),
        "height": max(1.0, body.height),
        "lat": body.lat,
        "lng": body.lng,
    }
    save_data()
    return {"id": cid, **containers[cid]}


@app.put("/containers/{cid}")
async def update_container(cid: str, body: ContainerBody):
    if cid not in containers:
        return {"error": "not found"}
    containers[cid] = {
        "name": body.name.strip(),
        "height": max(1.0, body.height),
        "lat": body.lat,
        "lng": body.lng,
    }
    save_data()
    return {"id": cid, **containers[cid]}


@app.delete("/containers/{cid}")
async def delete_container(cid: str):
    global active_id
    containers.pop(cid, None)
    current_status.pop(cid, None)
    if active_id == cid:
        active_id = None
    save_data()
    return {"ok": True}


@app.post("/containers/{cid}/activate")
async def activate_container(cid: str):
    global active_id
    if cid not in containers:
        return {"error": "not found"}
    active_id = cid
    save_data()
    return {"active_id": cid, **containers[cid]}


# ── Status geral ─────────────────────────────────────────────────────────────

@app.get("/status")
async def get_status():
    result = {}
    for cid, c in containers.items():
        s = current_status.get(cid, {})
        result[cid] = {
            "name":      c["name"],
            "height":    c["height"],
            "lat":       c.get("lat"),
            "lng":       c.get("lng"),
            "fill_pct":  s.get("fill_pct"),
            "nivel":     s.get("status"),
            "last_seen": s.get("timestamp"),
            "distancia": s.get("distancia"),
        }
    return result


# ── ESP32 data ───────────────────────────────────────────────────────────────

@app.post("/post")
async def receive_data(request: Request):
    global active_id
    body = await request.body()
    params = parse_qs(body.decode())
    distancia_raw = params.get("distancia", ["?"])[0]

    # Dispositivo pode enviar seu cid; senão usa o ativo
    cid = params.get("cid", [None])[0] or active_id
    if not cid or cid not in containers:
        return {"status": "error", "msg": "container nao encontrado"}

    altura = containers[cid]["height"]
    try:
        distancia_val = float(distancia_raw.replace("cm", "").strip())
        fill_pct, status = calcular_nivel(distancia_val, altura)
    except ValueError:
        fill_pct, status = 0.0, "vazio"

    reading = {
        "timestamp":        datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "distancia":        distancia_raw,
        "fill_pct":         fill_pct,
        "status":           status,
        "container_height": altura,
        "cid":              cid,
        "container":        containers[cid]["name"],
    }
    readings.append(reading)
    current_status[cid] = reading

    for queue in clients:
        await queue.put(json.dumps(reading))

    return {"status": "ok", "fill_pct": fill_pct, "nivel": status, "container": containers[cid]["name"]}


# ── SSE ──────────────────────────────────────────────────────────────────────

@app.get("/events")
async def sse(request: Request):
    queue: asyncio.Queue = asyncio.Queue()
    clients.append(queue)

    async def generate():
        try:
            for r in readings:
                yield f"data: {json.dumps(r)}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=25)
                    yield f"data: {msg}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            if queue in clients:
                clients.remove(queue)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Frontend ──────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index():
    html = (Path(__file__).parent / "static" / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(html)
