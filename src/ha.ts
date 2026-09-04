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
    const service = state.state === "open" ? "close_cover" : "open_cover";
    await hass.callService(domain, service, { entity_id: entityId });
    return;
  }

  if (domain === "climate") {
    const service = state.state === "off" ? "turn_on" : "turn_off";
    await hass.callService(domain, service, { entity_id: entityId });
    return;
  }

  await hass.callService(domain, "toggle", { entity_id: entityId });
}

export const displayName = (hass: Hass, entityId: string): string =>
  String(hass.states[entityId]?.attributes?.friendly_name ?? entityId);
