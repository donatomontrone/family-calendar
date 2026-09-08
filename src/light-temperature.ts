export type WhiteTemperature = {
  minKelvin: number;
  maxKelvin: number;
  currentKelvin: number;
};

const asFinite = (value: unknown): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
};

const kelvinFromMired = (value: unknown): number | undefined => {
  const mired = asFinite(value);
  return mired ? Math.round(1_000_000 / mired) : undefined;
};

export function getWhiteTemperature(attributes: Record<string, unknown>): WhiteTemperature {
  const minKelvin = Math.round(
    asFinite(attributes.min_color_temp_kelvin)
      ?? kelvinFromMired(attributes.max_mireds)
      ?? 2200,
  );
  const maxKelvin = Math.round(
    asFinite(attributes.max_color_temp_kelvin)
      ?? kelvinFromMired(attributes.min_mireds)
      ?? 6500,
  );

  const low = Math.min(minKelvin, maxKelvin);
  const high = Math.max(minKelvin, maxKelvin);
  const fallback = Math.round(low + (high - low) * 0.42);
  const rawCurrent = Math.round(
    asFinite(attributes.color_temp_kelvin)
      ?? kelvinFromMired(attributes.color_temp)
      ?? fallback,
  );

  return {
    minKelvin: low,
    maxKelvin: high,
    currentKelvin: Math.max(low, Math.min(high, rawCurrent)),
  };
}

export function whiteTemperatureAccent(temperature: WhiteTemperature): string {
  const { minKelvin, maxKelvin, currentKelvin } = temperature;
  const span = Math.max(1, maxKelvin - minKelvin);
  const ratio = Math.max(0, Math.min(1, (currentKelvin - minKelvin) / span));

  // UI-only tunable-white accent: warm ivory -> ice white. Home Assistant still
  // receives the actual Kelvin value, so this never approximates the device state.
  const warm = [255, 214, 166];
  const cool = [201, 227, 255];
  const rgb = warm.map((channel, index) => Math.round(channel + (cool[index] - channel) * ratio));
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
