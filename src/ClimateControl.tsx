import type { ReactNode } from "react";
import type { Hass } from "./types";
import type { Language } from "./i18n";
import {
  displayName,
  setClimateFanMode,
  setClimateHvacMode,
  setClimatePresetMode,
  setClimateTemperature,
} from "./ha";

type ClimateControlProps = {
  hass: Hass;
  entityId: string;
  language: Language;
  variant?: "compact" | "full";
  showName?: boolean;
};

export default function ClimateControl({
  hass,
  entityId,
  language,
  variant = "full",
  showName = true,
}: ClimateControlProps) {
  const state = hass.states[entityId];
  if (!state) return null;

  const copy = language === "it" ? itCopy : enCopy;
  const attributes = state.attributes;
  const currentTemperature = numeric(attributes.current_temperature);
  const targetTemperature = numeric(attributes.temperature) ?? currentTemperature ?? 22;
  const minTemperature = numeric(attributes.min_temp) ?? 16;
  const maxTemperature = numeric(attributes.max_temp) ?? 30;
  const temperatureStep = numeric(attributes.target_temp_step) ?? 0.5;
  const hvacModes = stringArray(attributes.hvac_modes, ["off", "heat", "cool", "heat_cool", "fan_only"]);
  const fanModes = stringArray(attributes.fan_modes);
  const presetModes = stringArray(attributes.preset_modes);
  const currentFanMode = stringValue(attributes.fan_mode);
  const currentPreset = stringValue(attributes.preset_mode);
  const hvacAction = stringValue(attributes.hvac_action);
  const currentMode = state.state;

  const setTemperature = (value: number) => {
    const clamped = Math.max(minTemperature, Math.min(maxTemperature, roundToStep(value, temperatureStep)));
    void setClimateTemperature(hass, entityId, clamped);
  };

  return (
    <section className={`climate-control climate-${variant} mode-${sanitizeClass(currentMode)}`}>
      <div className="climate-control-head">
        <div className="climate-control-title">
          <span className="climate-control-icon">{modeIcon(currentMode)}</span>
          <div>
            {showName && <strong>{displayName(hass, entityId)}</strong>}
            <small>{modeLabel(currentMode, copy)}{hvacAction && hvacAction !== "idle" ? ` · ${actionLabel(hvacAction, copy)}` : ""}</small>
          </div>
        </div>
        <div className="climate-current">
          <strong>{formatTemperature(currentTemperature)}</strong>
          <span>{copy.current}</span>
        </div>
      </div>

      <div className="climate-target-row">
        <button
          className="climate-step-button"
          type="button"
          aria-label={copy.decrease}
          onClick={() => setTemperature(targetTemperature - temperatureStep)}
        >
          <MinusIcon />
        </button>
        <div className="climate-target-value">
          <span>{copy.target}</span>
          <strong>{formatTemperature(targetTemperature)}</strong>
        </div>
        <button
          className="climate-step-button"
          type="button"
          aria-label={copy.increase}
          onClick={() => setTemperature(targetTemperature + temperatureStep)}
        >
          <PlusIcon />
        </button>
      </div>

      <input
        className="climate-temperature-slider"
        type="range"
        min={minTemperature}
        max={maxTemperature}
        step={temperatureStep}
        value={targetTemperature}
        aria-label={copy.targetTemperature}
        onChange={(event) => setTemperature(Number(event.target.value))}
      />

      <div className="climate-section-label">{copy.mode}</div>
      <div className="climate-mode-grid">
        {hvacModes.map((mode) => (
          <button
            type="button"
            key={mode}
            className={`climate-mode-button mode-${sanitizeClass(mode)} ${currentMode === mode ? "active" : ""}`}
            onClick={() => void setClimateHvacMode(hass, entityId, mode)}
            title={modeLabel(mode, copy)}
          >
            {modeIcon(mode)}
            <span>{modeLabel(mode, copy)}</span>
          </button>
        ))}
      </div>

      {fanModes.length > 0 && (
        <div className="climate-secondary-section">
          <div className="climate-section-label">{copy.fan}</div>
          <div className="climate-chip-row">
            {fanModes.map((mode) => (
              <button
                type="button"
                key={mode}
                className={currentFanMode === mode ? "active" : ""}
                onClick={() => void setClimateFanMode(hass, entityId, mode)}
              >
                <FanIcon />
                <span>{optionLabel(mode, language)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {presetModes.length > 0 && (
        <div className="climate-secondary-section">
          <div className="climate-section-label">{copy.preset}</div>
          <div className="climate-chip-row climate-preset-row">
            {presetModes.map((preset) => (
              <button
                type="button"
                key={preset}
                className={currentPreset === preset ? "active" : ""}
                onClick={() => void setClimatePresetMode(hass, entityId, preset)}
              >
                <span>{optionLabel(preset, language)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const itCopy = {
  current: "Attuale",
  target: "Impostata",
  targetTemperature: "Temperatura impostata",
  mode: "Modalità",
  fan: "Ventola",
  preset: "Profilo",
  off: "Spento",
  heat: "Caldo",
  cool: "Freddo",
  auto: "Automatico",
  fanOnly: "Ventola",
  dry: "Deumidifica",
  idle: "In attesa",
  heating: "Riscalda",
  cooling: "Raffresca",
  drying: "Deumidifica",
  fanAction: "Ventola",
  decrease: "Riduci temperatura",
  increase: "Aumenta temperatura",
};

const enCopy: typeof itCopy = {
  current: "Current",
  target: "Target",
  targetTemperature: "Target temperature",
  mode: "Mode",
  fan: "Fan",
  preset: "Preset",
  off: "Off",
  heat: "Heat",
  cool: "Cool",
  auto: "Auto",
  fanOnly: "Fan",
  dry: "Dry",
  idle: "Idle",
  heating: "Heating",
  cooling: "Cooling",
  drying: "Drying",
  fanAction: "Fan",
  decrease: "Decrease temperature",
  increase: "Increase temperature",
};

function modeLabel(mode: string, copy: typeof itCopy): string {
  const labels: Record<string, string> = {
    off: copy.off,
    heat: copy.heat,
    cool: copy.cool,
    heat_cool: copy.auto,
    auto: copy.auto,
    fan_only: copy.fanOnly,
    dry: copy.dry,
  };
  return labels[mode] ?? humanize(mode);
}

function actionLabel(action: string, copy: typeof itCopy): string {
  const labels: Record<string, string> = {
    idle: copy.idle,
    heating: copy.heating,
    cooling: copy.cooling,
    drying: copy.drying,
    fan: copy.fanAction,
  };
  return labels[action] ?? humanize(action);
}

function optionLabel(value: string, language: Language): string {
  if (language !== "it") return humanize(value);
  const labels: Record<string, string> = {
    auto: "Automatico",
    automatic: "Automatico",
    low: "Bassa",
    medium: "Media",
    middle: "Media",
    high: "Alta",
    quiet: "Silenziosa",
    silent: "Silenziosa",
    boost: "Turbo",
    turbo: "Turbo",
    eco: "Eco",
    comfort: "Comfort",
    sleep: "Notte",
    night: "Notte",
    away: "Assenza",
    home: "Casa",
    none: "Nessuno",
    normal: "Normale",
  };
  return labels[value.toLowerCase()] ?? humanize(value);
}

function modeIcon(mode: string) {
  if (mode === "heat") return <FlameIcon />;
  if (mode === "cool") return <SnowflakeIcon />;
  if (mode === "heat_cool" || mode === "auto") return <AutoIcon />;
  if (mode === "fan_only") return <FanIcon />;
  if (mode === "dry") return <DropletIcon />;
  return <PowerIcon />;
}

function formatTemperature(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(value % 1 === 0 ? 0 : 1)}°` : "—";
}

function numeric(value: unknown): number | undefined {
  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
}

function stringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map(String).filter(Boolean);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roundToStep(value: number, step: number): number {
  const decimals = String(step).includes(".") ? String(step).split(".")[1]?.length ?? 0 : 0;
  return Number((Math.round(value / step) * step).toFixed(decimals));
}

function sanitizeClass(value: string): string {
  return value.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
}

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{children}</svg>;
}

function PowerIcon() {
  return <Icon><path d="M12 3.5v8M7.55 6.45a7.45 7.45 0 1 0 8.9 0" /></Icon>;
}

function FlameIcon() {
  return <Icon><path d="M13.5 3.5c.7 3.1-.8 4.5-2 6.2-1.3 1.7-1.8 3.4-.4 5.2.7.9 1.9 1.4 3.1 1.1 2.2-.5 3.6-2.7 3-5.1-.3-1.2-1.1-2.5-2.4-4.1.1 2.1-.7 3.1-1.5 3.8" /><path d="M9.2 10.4c-2 2.1-2.8 4-2.2 6.1.7 2.6 3 4 5.7 4" /></Icon>;
}

function SnowflakeIcon() {
  return <Icon><path d="M12 3v18M8.8 5.1 12 8l3.2-2.9M8.8 18.9 12 16l3.2 2.9M4.2 7.5l15.6 9M4.2 16.5l15.6-9M5.8 11.1 9.6 10 8.8 6.3M18.2 12.9 14.4 14l.8 3.7M18.2 11.1 14.4 10l.8-3.7M5.8 12.9 9.6 14l-.8 3.7" /></Icon>;
}

function AutoIcon() {
  return <Icon><path d="M7.1 7.5A6.6 6.6 0 0 1 18 9l1.6-1.5M18 9l-.2-2.2M16.9 16.5A6.6 6.6 0 0 1 6 15l-1.6 1.5M6 15l.2 2.2" /></Icon>;
}

function FanIcon() {
  return <Icon><circle cx="12" cy="12" r="1.7" /><path d="M12 10.3c-1.7-4.8 1.8-6.8 4-4.8 1.3 1.2 0 4.2-4 6.5M10.5 12.8C5.8 14.7 4 11.2 6 9.1c1.3-1.3 4.3 0 6.2 3.5M13.4 13.2c2.8 4.2-.2 6.9-2.8 5.5-1.6-.9-1.2-4.2 1.5-6.7" /></Icon>;
}

function DropletIcon() {
  return <Icon><path d="M12 3.4c-2 3-5 6.4-5 10a5 5 0 0 0 10 0c0-3.6-3-7-5-10Z" /></Icon>;
}

function MinusIcon() {
  return <Icon><path d="M6.5 12h11" /></Icon>;
}

function PlusIcon() {
  return <Icon><path d="M12 6.5v11M6.5 12h11" /></Icon>;
}
