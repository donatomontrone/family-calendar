from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_VERSION


class FavoriteStore:
    """Persist favorite Home Assistant entity IDs."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, list[str]]] = Store(
            hass, STORAGE_VERSION, STORAGE_KEY
        )
        self._data: dict[str, list[str]] = {"entity_ids": []}
        self._loaded = False

    async def async_get(self) -> list[str]:
        if not self._loaded:
            stored = await self._store.async_load()
            if stored:
                self._data = stored
            self._loaded = True
        return list(self._data.get("entity_ids", []))

    async def async_set(self, entity_ids: list[str]) -> list[str]:
        unique_ids = list(dict.fromkeys(entity_ids))
        self._data["entity_ids"] = unique_ids
        self._loaded = True
        await self._store.async_save(self._data)
        return unique_ids
