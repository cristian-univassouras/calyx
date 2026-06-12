from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    auth,
    cabinets,
    categories,
    devices,
    measurements,
    products,
    recipients,
)

app = FastAPI(
    title="Calyx API",
    version="0.1.0",
    description=(
        "API para cadastro de recipientes e estimativa do peso do conteudo "
        "a partir da leitura de um sensor IoT (distancia da tampa ao conteudo)."
    ),
)

# CORS liberado para o front (em producao, restrinja allow_origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cabinets.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(recipients.router)
app.include_router(measurements.router)
app.include_router(devices.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
