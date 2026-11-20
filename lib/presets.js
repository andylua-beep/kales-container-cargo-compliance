// Saved cargo & container projects in chrome.storage.local. Older v1 presets are migrated on read.
export const PRESET_KEY = "kales_cargo_presets"
const MAX_PRESETS = 12

const hasStorage = () => Boolean(globalThis.chrome?.storage?.local)

/** v1 presets stored flat fields (axles, deckLen, payload, wallHeight). */
export function migratePreset(p) {
  if (p?.config) return p
  return {
    name: String(p?.name ?? "Imported cargo plan"),
    savedAt: p?.savedAt ?? null,
    config: {
      model: p?.model ?? "flatbed-semi-trailer",
      axles: p?.axles ?? 3,
      lengthM: p?.deckLen ?? 12.5,
      payloadT: p?.payload ?? 30,
      wallMm: p?.wallHeight ?? 1800
    }
  }
}

export async function loadPresets() {
  if (!hasStorage()) return []
  try {
    const stored = await chrome.storage.local.get(PRESET_KEY)
    const list = Array.isArray(stored[PRESET_KEY]) ? stored[PRESET_KEY] : []
    return list.map(migratePreset)
  } catch (err) {
    console.error("KALES Cargo CAD: failed to read saved projects", err)
    return []
  }
}

async function writePresets(list) {
  await chrome.storage.local.set({ [PRESET_KEY]: list.slice(0, MAX_PRESETS) })
}

export async function savePreset(name, config) {
  if (!hasStorage()) return false
  const list = await loadPresets()
  await writePresets([{ name, savedAt: new Date().toISOString(), config: structuredClone(config) }, ...list])
  return true
}

export async function deletePreset(index) {
  if (!hasStorage()) return false
  const list = await loadPresets()
  await writePresets(list.filter((_, i) => i !== index))
  return true
}
