from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from .const import STORAGE_KEY,STORAGE_VERSION
class FavoriteStore:
    def __init__(self,hass:HomeAssistant): self._store=Store(hass,STORAGE_VERSION,STORAGE_KEY);self._data={"entity_ids":[]}
    async def async_get(self):
        data=await self._store.async_load()
        if data:self._data=data
        return list(self._data.get("entity_ids",[]))
    async def async_set(self,ids):
        self._data["entity_ids"]=list(dict.fromkeys(ids));await self._store.async_save(self._data)
