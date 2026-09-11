import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import ClimateControl from "./ClimateControl";
import type { Hass } from "./types";
import { displayName, setCoverPosition, setLightBrightness, setLightColorTemperature } from "./ha";
import { t, type Language } from "./i18n";
import { getWhiteTemperature } from "./light-temperature";

type DeviceControlsProps = {
  hass: Hass;
  entityId: string;
  language: Language;
  onClose: () => void;
};

export default function DeviceControls({ hass, entityId, language, onClose }: DeviceControlsProps) {
  const state = hass.states[entityId];
  if (!state) return null;

  const domain = entityId.split(".")[0];
  const brightness = Math.round((Number(state.attributes.brightness ?? 200) / 255) * 100);
  const position = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));
  const whiteTemperature = getWhiteTemperature(state.attributes);
  const isNight = typeof document !== "undefined" && document.querySelector("main.app-shell")?.classList.contains("night");

  const dialog = (
    <div
      id="family-shared-device-overlay"
      className={`app-shell shared-device-controls-overlay ${isNight ? "night" : "day"}`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        id="family-shared-device-controls"
        className={`device-controls device-controls-${domain}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${t("controls", language)} ${displayName(hass, entityId)}`}
      >
        <div className="device-controls-heading">
          <div><span className="section-kicker">{t("controls", language)}</span><strong>{displayName(hass, entityId)}</strong></div>
          <button onClick={onClose} aria-label={t("close", language)}><CloseIcon /></button>
        </div>
        {domain === "light" && (
          <>
            <ControlRow label={t("brightness", language)} value={`${brightness}%`}>
              <input type="range" min="1" max="100" defaultValue={brightness} onChange={(event) => void setLightBrightness(hass, entityId, Number(event.target.value))} />
            </ControlRow>
            <ControlRow label={language === "it" ? "Temperatura bianco" : "White temperature"} value={`${whiteTemperature.currentKelvin} K`}>
              <input
                className="white-temperature-control"
                type="range"
                min={whiteTemperature.minKelvin}
                max={whiteTemperature.maxKelvin}
                step="50"
                defaultValue={whiteTemperature.currentKelvin}
                onChange={(event) => void setLightColorTemperature(hass, entityId, Number(event.target.value))}
              />
            </ControlRow>
          </>
        )}
        {domain === "cover" && (
          <ControlRow label={t("position", language)} value={`${position}%`}>
            <input type="range" min="0" max="100" defaultValue={position} onChange={(event) => void setCoverPosition(hass, entityId, Number(event.target.value))} />
          </ControlRow>
        )}
        {domain === "climate" && (
          <ClimateControl hass={hass} entityId={entityId} language={language} variant="compact" showName={false} />
        )}
      </div>
    </div>
  );

  return typeof document === "undefined" ? dialog : createPortal(dialog, document.body);
}

function ControlRow({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return <div className="control-row"><div className="control-meta"><span>{label}</span><strong>{value}</strong></div>{children}</div>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7.5 7.5 9 9M16.5 7.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}
