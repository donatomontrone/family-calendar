import type {Area,EntityRegistryEntry,Hass} from "./types";
export const getAreas=(h:Hass)=>h.callWS<Area[]>({type:"config/area_registry/list"});
export const getEntityRegistry=(h:Hass)=>h.callWS<EntityRegistryEntry[]>({type:"config/entity_registry/list"});
export async function getFavorites(h:Hass){const r=await h.callWS<{entity_ids:string[]}>({type:"family_calendar/favorites/get"});return r.entity_ids??[];}
export async function setFavorites(h:Hass,ids:string[]){await h.callWS({type:"family_calendar/favorites/set",entity_ids:ids});}
export async function toggleEntity(h:Hass,id:string){await h.callService(id.split(".")[0],"toggle",{entity_id:id});}
export const displayName=(h:Hass,id:string)=>String(h.states[id]?.attributes?.friendly_name??id);
