export interface HassState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HassLocale {
  language?: string;
  time_format?: "12" | "24" | "language";
}

export interface Hass {
  states: Record<string, HassState>;
  locale?: HassLocale;
  callService: (
    domain: string,
    service: string,
    data?: Record<string, unknown>,
  ) => Promise<void>;
  callWS: <T = unknown>(message: Record<string, unknown>) => Promise<T>;
}

export interface Area {
  area_id: string;
  name: string;
  icon?: string | null;
}

export interface EntityRegistryEntry {
  entity_id: string;
  area_id?: string | null;
  device_id?: string | null;
  name?: string | null;
  original_name?: string | null;
}
