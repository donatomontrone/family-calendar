from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import async_register_built_in_panel, async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, FRONTEND_URL, PANEL_URL
from .storage import FavoriteStore
from .websocket import async_register_websocket_commands

FRONTEND_DIR = Path(__file__).parent / "frontend"
CONFIG_SCHEMA = cv.config_entry_only_config_schema


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up shared Family Calendar resources once per Home Assistant load."""
    hass.data.setdefault(DOMAIN, {})["favorites"] = FavoriteStore(hass)
    async_register_websocket_commands(hass)
    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_URL, str(FRONTEND_DIR), cache_headers=False)]
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register the full-screen Family Calendar panel."""
    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Family Calendar",
        sidebar_icon="mdi:calendar-heart",
        frontend_url_path=PANEL_URL,
        config={
            "_panel_custom": {
                "name": "family-calendar",
                "embed_iframe": False,
                "trust_external": False,
                "js_url": f"{FRONTEND_URL}/family-calendar-panel.js",
            }
        },
        require_admin=False,
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the Family Calendar panel."""
    async_remove_panel(hass, PANEL_URL)
    return True
