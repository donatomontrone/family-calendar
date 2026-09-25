from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .storage import FavoriteStore, IconOverrideStore


def _favorite_store(hass: HomeAssistant) -> FavoriteStore:
    return hass.data[DOMAIN]["favorites"]


def _icon_store(hass: HomeAssistant) -> IconOverrideStore:
    return hass.data[DOMAIN]["icons"]


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_get_favorites)
    websocket_api.async_register_command(hass, ws_set_favorites)
    websocket_api.async_register_command(hass, ws_get_icons)
    websocket_api.async_register_command(hass, ws_set_icons)


@websocket_api.websocket_command(
    {vol.Required("type"): "family_calendar/favorites/get"}
)
@websocket_api.async_response
async def ws_get_favorites(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    entity_ids = await _favorite_store(hass).async_get()
    connection.send_result(msg["id"], {"entity_ids": entity_ids})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "family_calendar/favorites/set",
        vol.Required("entity_ids"): vol.All([str], vol.Length(min=0, max=100)),
    }
)
@websocket_api.async_response
async def ws_set_favorites(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    entity_ids = await _favorite_store(hass).async_set(msg["entity_ids"])
    connection.send_result(msg["id"], {"entity_ids": entity_ids})



@websocket_api.websocket_command(
    {vol.Required("type"): "family_calendar/icons/get"}
)
@websocket_api.async_response
async def ws_get_icons(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    icons = await _icon_store(hass).async_get()
    connection.send_result(msg["id"], {"icon_overrides": icons})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "family_calendar/icons/set",
        vol.Required("icon_overrides"): vol.All({str: str}, vol.Length(max=500)),
    }
)
@websocket_api.async_response
async def ws_set_icons(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    icons = await _icon_store(hass).async_set(msg["icon_overrides"])
    connection.send_result(msg["id"], {"icon_overrides": icons})
