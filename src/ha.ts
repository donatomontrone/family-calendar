import type { Area, EntityRegistryEntry, Hass } from "./types";

export const getAreas = (hass: Hass) =>
  hass.callWS<Area[]>({ type: "config/area_registry/list" });

export const getEntityRegistry = (hass: Hass) =>
  hass.callWS<EntityRegistryEntry[]>({ type: "config/entity_registry/list" });

export async function getFavorites(hass: Hass): Promise<string[]> {
  const result = await hass.callWS<{ entity_ids: string[] }>({
    type: "family_calendar/favorites/get",
  });
  return result.entity_ids ?? [];
}

export async function setFavorites(hass: Hass, entityIds: string[]): Promise<void> {
  await hass.callWS({
    type: "family_calendar/favorites/set",
    entity_ids: entityIds,
  });
}

export async function activateEntity(hass: Hass, entityId: string): Promise<void> {
  const state = hass.states[entityId];
  if (!state) return;

  const [domain] = entityId.split(".");
  if (domain === "cover") {
    await hass.callService("cover", state.state === "open" ? "close_cover" : "open_cover", { entity_id: entityId });
    return;
  }
  if (domain === "climate") {
    await hass.callService("climate", state.state === "off" ? "turn_on" : "turn_off", { entity_id: entityId });
    return;
  }
  await hass.callService(domain, "toggle", { entity_id: entityId });
}

export async function deactivateEntity(hass: Hass, entityId: string): Promise<void> {
  const [domain] = entityId.split(".");
  if (!hass.states[entityId]) return;

  if (domain === "cover") {
    await hass.callService("cover", "close_cover", { entity_id: entityId });
    return;
  }
  if (["light", "switch", "fan", "media_player", "climate"].includes(domain)) {
    await hass.callService(domain, "turn_off", { entity_id: entityId });
  }
}

export async function deactivateEntities(hass: Hass, entityIds: string[]): Promise<void> {
  await Promise.all(entityIds.map((entityId) => deactivateEntity(hass, entityId)));
}

export async function setLightBrightness(hass: Hass, entityId: string, brightnessPct: number): Promise<void> {
  await hass.callService("light", "turn_on", {
    entity_id: entityId,
    brightness_pct: Math.max(1, Math.min(100, Math.round(brightnessPct))),
  });
}

export async function setLightColor(hass: Hass, entityId: string, hex: string): Promise<void> {
  const clean = hex.replace("#", "");
  const rgb = [0, 2, 4].map((index) => Number.parseInt(clean.slice(index, index + 2), 16));
  await hass.callService("light", "turn_on", { entity_id: entityId, rgb_color: rgb });
}

export async function setCoverPosition(hass: Hass, entityId: string, position: number): Promise<void> {
  await hass.callService("cover", "set_cover_position", {
    entity_id: entityId,
    position: Math.max(0, Math.min(100, Math.round(position))),
  });
}

export const displayName = (hass: Hass, entityId: string): string =>
  String(hass.states[entityId]?.attributes?.friendly_name ?? entityId);
