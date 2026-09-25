from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import ICON_STORAGE_KEY, STORAGE_KEY, STORAGE_VERSION


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



class IconOverrideStore:
    """Persist custom entity icon keys."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, dict[str, str]]] = Store(
            hass, STORAGE_VERSION, ICON_STORAGE_KEY
        )
        self._data: dict[str, dict[str, str]] = {"icons": {}}
        self._loaded = False

    async def async_get(self) -> dict[str, str]:
        if not self._loaded:
            stored = await self._store.async_load()
            if stored:
                self._data = stored
            self._loaded = True
        return dict(self._data.get("icons", {}))

    async def async_set(self, icons: dict[str, str]) -> dict[str, str]:
        normalized = {
            str(entity_id): str(icon_key)
            for entity_id, icon_key in icons.items()
            if entity_id and icon_key
        }
        self._data["icons"] = normalized
        self._loaded = True
        await self._store.async_save(self._data)
        return dict(normalized)
