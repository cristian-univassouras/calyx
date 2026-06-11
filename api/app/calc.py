"""
Calculo de volume preenchido -> peso a partir da leitura do sensor.

O sensor IoT fica na tampa e mede `distance_from_lid`: a distancia (cm)
do topo do recipiente ate a superficie do conteudo. Logo:

    altura preenchida = altura_total - distance_from_lid

Todas as medidas estao em centimetros; o volume sai em cm3 e, multiplicado
pela densidade do produto (g/cm3), resulta no peso em gramas.

Chaves esperadas em `dimensions` (ver jsons.json):
    cilindric   -> radius, height
    square      -> side, height
    rectangular -> width, length, height
    conical     -> base_radius, height   (base larga embaixo, afina pra cima)
    spherical   -> radius
    custom      -> profile: [{"h": altura_cm, "v": volume_acumulado_cm3}, ...]
                   curva de calibracao medida (garrafas, potes irregulares...)
"""

import math
from dataclasses import dataclass

from .models import Format

REQUIRED_KEYS: dict[Format, tuple[str, ...]] = {
    Format.cilindric: ("radius", "height"),
    Format.square: ("side", "height"),
    Format.rectangular: ("width", "length", "height"),
    Format.conical: ("base_radius", "height"),
    Format.spherical: ("radius",),
}


class DimensionError(ValueError):
    """Erro de validacao das dimensoes informadas."""


def _profile(dimensions: dict) -> list[tuple[float, float]]:
    """Extrai e ordena a curva de calibracao do formato custom.
    Garante um ponto inicial (0, 0) e que h/v sejam crescentes."""
    raw = dimensions.get("profile")
    if not isinstance(raw, list) or len(raw) < 2:
        raise DimensionError("profile deve ser uma lista com ao menos 2 pontos {h, v}")
    pts: list[tuple[float, float]] = []
    for p in raw:
        try:
            h, v = float(p["h"]), float(p["v"])
        except (KeyError, TypeError, ValueError):
            raise DimensionError("cada ponto do profile precisa de 'h' e 'v' numericos")
        if h < 0 or v < 0:
            raise DimensionError("h e v do profile nao podem ser negativos")
        pts.append((h, v))
    pts.sort(key=lambda t: t[0])
    if pts[0][0] != 0:
        pts.insert(0, (0.0, 0.0))
    for i in range(1, len(pts)):
        if pts[i][0] <= pts[i - 1][0]:
            raise DimensionError("as alturas (h) do profile devem ser crescentes")
        if pts[i][1] < pts[i - 1][1]:
            raise DimensionError("os volumes (v) do profile nao podem diminuir")
    return pts


def _interp_volume(pts: list[tuple[float, float]], height: float) -> float:
    """Volume acumulado na altura `height` por interpolacao linear."""
    if height <= pts[0][0]:
        return pts[0][1]
    if height >= pts[-1][0]:
        return pts[-1][1]
    for i in range(1, len(pts)):
        h0, v0 = pts[i - 1]
        h1, v1 = pts[i]
        if height <= h1:
            return v0 + (v1 - v0) * (height - h0) / (h1 - h0)
    return pts[-1][1]


def validate_dimensions(fmt: Format, dimensions: dict) -> None:
    """Garante que `dimensions` tem as chaves do formato, todas numericas > 0."""
    if fmt == Format.custom:
        _profile(dimensions)  # levanta DimensionError se invalido
        return
    required = REQUIRED_KEYS[fmt]
    for key in required:
        if key not in dimensions:
            raise DimensionError(
                f"dimensions do formato '{fmt.value}' deve conter a chave '{key}'"
            )
        value = dimensions[key]
        if not isinstance(value, (int, float)) or isinstance(value, bool) or value <= 0:
            raise DimensionError(f"dimensions['{key}'] deve ser um numero maior que zero")


def total_height(fmt: Format, dimensions: dict) -> float:
    """Altura interna util do recipiente (eixo medido pelo sensor)."""
    if fmt == Format.spherical:
        return 2 * dimensions["radius"]
    if fmt == Format.custom:
        return _profile(dimensions)[-1][0]
    return dimensions["height"]


def total_volume(fmt: Format, dimensions: dict) -> float:
    """Volume total (cm3) do recipiente cheio."""
    if fmt == Format.custom:
        return _profile(dimensions)[-1][1]
    if fmt == Format.cilindric:
        return math.pi * dimensions["radius"] ** 2 * dimensions["height"]
    if fmt == Format.square:
        return dimensions["side"] ** 2 * dimensions["height"]
    if fmt == Format.rectangular:
        return dimensions["width"] * dimensions["length"] * dimensions["height"]
    if fmt == Format.conical:
        return (1 / 3) * math.pi * dimensions["base_radius"] ** 2 * dimensions["height"]
    if fmt == Format.spherical:
        return (4 / 3) * math.pi * dimensions["radius"] ** 3
    raise DimensionError(f"formato desconhecido: {fmt}")


def filled_volume(fmt: Format, dimensions: dict, distance_from_lid: float) -> float:
    """
    Volume (cm3) ocupado pelo conteudo, dada a distancia lida pelo sensor.
    `distance_from_lid` e limitada a [0, altura_total].
    """
    h_total = total_height(fmt, dimensions)
    d = min(max(distance_from_lid, 0.0), h_total)  # clamp
    h_filled = h_total - d

    if fmt == Format.custom:
        return _interp_volume(_profile(dimensions), h_filled)

    if fmt == Format.cilindric:
        return math.pi * dimensions["radius"] ** 2 * h_filled

    if fmt == Format.square:
        return dimensions["side"] ** 2 * h_filled

    if fmt == Format.rectangular:
        return dimensions["width"] * dimensions["length"] * h_filled

    if fmt == Format.conical:
        # Cone com base (base_radius) embaixo, afinando ate um ponto no topo.
        # O vazio no topo e um cone menor de altura d.
        r = dimensions["base_radius"]
        h = dimensions["height"]
        full = (1 / 3) * math.pi * r**2 * h
        empty_top = (1 / 3) * math.pi * (r * d / h) ** 2 * d
        return full - empty_top

    if fmt == Format.spherical:
        # O vazio no topo e uma calota esferica de altura d.
        radius = dimensions["radius"]
        cap = math.pi * d**2 * (3 * radius - d) / 3
        sphere = (4 / 3) * math.pi * radius**3
        return sphere - cap

    raise DimensionError(f"formato desconhecido: {fmt}")


@dataclass
class FillResult:
    distance_from_lid: float
    filled_volume_cm3: float
    total_volume_cm3: float
    fill_percent: float
    mass_g: float | None  # None se o recipiente nao tiver produto/densidade


def compute_fill(
    fmt: Format,
    dimensions: dict,
    distance_from_lid: float,
    density: float | None,
) -> FillResult:
    """Junta tudo: volume preenchido, % cheio e peso estimado (se houver densidade)."""
    total = total_volume(fmt, dimensions)
    filled = filled_volume(fmt, dimensions, distance_from_lid)
    percent = (filled / total * 100) if total > 0 else 0.0
    mass = filled * density if density is not None else None
    return FillResult(
        distance_from_lid=distance_from_lid,
        filled_volume_cm3=round(filled, 4),
        total_volume_cm3=round(total, 4),
        fill_percent=round(percent, 2),
        mass_g=round(mass, 4) if mass is not None else None,
    )
