from __future__ import annotations
import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant,callback
from .const import DOMAIN
@callback
def async_register_websocket_commands(hass:HomeAssistant)->None:
    websocket_api.async_register_command(hass,ws_get_favorites);websocket_api.async_register_command(hass,ws_set_favorites)
@websocket_api.websocket_command({vol.Required("type"):"family_calendar/favorites/get"})
@websocket_api.async_response
async def ws_get_favorites(hass:HomeAssistant,connection:websocket_api.ActiveConnection,msg:dict)->None:
    connection.send_result(msg["id"],{"entity_ids":await hass.data[DOMAIN]["favorites"].async_get()})
@websocket_api.websocket_command({vol.Required("type"):"family_calendar/favorites/set",vol.Required("entity_ids"):vol.All([str],vol.Length(min=0,max=100))})
@websocket_api.async_response
async def ws_set_favorites(hass:HomeAssistant,connection:websocket_api.ActiveConnection,msg:dict)->None:
    await hass.data[DOMAIN]["favorites"].async_set(msg["entity_ids"]);connection.send_result(msg["id"],{"entity_ids":msg["entity_ids"]})
