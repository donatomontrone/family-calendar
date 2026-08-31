from __future__ import annotations
from pathlib import Path
from homeassistant.components.frontend import async_register_built_in_panel,async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from .const import DOMAIN,FRONTEND_URL,PANEL_URL
from .storage import FavoriteStore
from .websocket import async_register_websocket_commands
FRONTEND_DIR=Path(__file__).parent/"frontend"
async def async_setup(hass:HomeAssistant,config:dict)->bool:
    hass.data.setdefault(DOMAIN,{})["favorites"]=FavoriteStore(hass);async_register_websocket_commands(hass);return True
async def async_setup_entry(hass:HomeAssistant,entry:ConfigEntry)->bool:
    await hass.http.async_register_static_paths([StaticPathConfig(FRONTEND_URL,str(FRONTEND_DIR),cache_headers=False)])
    async_register_built_in_panel(hass,component_name="custom",sidebar_title="Calendario",sidebar_icon="mdi:calendar-heart",frontend_url_path=PANEL_URL,config={"_panel_custom":{"name":"family-calendar","embed_iframe":False,"trust_external":False,"js_url":f"{FRONTEND_URL}/family-calendar-panel.js"}},require_admin=False)
    return True
async def async_unload_entry(hass:HomeAssistant,entry:ConfigEntry)->bool:
    async_remove_panel(hass,PANEL_URL);return True
