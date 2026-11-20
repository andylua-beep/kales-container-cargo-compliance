// Studio controller: binds form state -> evaluate() -> CAD SVG + checks + presets.
import { evaluate } from "./lib/engine.js"
import { REGIONS, REGION_ORDER } from "./lib/regulations.js"
import { MODELS, MODEL_ORDER, SUSPENSIONS, TRACTORS, CONTAINERS, tyresFor } from "./lib/equipment.js"
import { renderCad } from "./lib/render-svg.js"
import { renderResults } from "./lib/ui-results.js"
import { loadPresets, savePreset, deletePreset } from "./lib/presets.js"

const MODEL_CATALOG = {
  "skeletal-trailer": {
    title: "KALES 20ft/40ft/45ft Skeletal Container Chassis",
    categoryUrl: "https://www.kalestruck.com/product-category/trailers/container-bulk-transport/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    url: "https://www.kalestruck.com/product-category/trailers/skeletal-trailer/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    desc: "Lightweight high-tensile skeletal container chassis with 8/12 ISO twist-locks for port shuttle & highway intermodal haulage."
  },
  "flatbed-semi-trailer": {
    title: "KALES Multi-Purpose Flatbed Semi-Trailer",
    categoryUrl: "https://www.kalestruck.com/product-category/trailers/container-bulk-transport/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    url: "https://www.kalestruck.com/product-category/trailers/flatbed-semi-trailer/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    desc: "Versatile 40ft flatbed trailer for 1×40ft or 2×20ft ISO containers, bagged cement, steel coils & breakbulk freight."
  },
  "sidewall-semi-trailer": {
    title: "KALES Drop-Sidewall Semi-Trailer",
    categoryUrl: "https://www.kalestruck.com/product-category/trailers/container-bulk-transport/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    url: "https://www.kalestruck.com/product-category/trailers/sidewall-semi-trailer/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    desc: "Removable 600–1,200 mm drop-side walls with container twist-locks for grain bags, construction materials & general cargo."
  },
  "fence-trailers": {
    title: "KALES High-Stake Cargo Fence Semi-Trailer",
    categoryUrl: "https://www.kalestruck.com/product-category/trailers/container-bulk-transport/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    url: "https://www.kalestruck.com/product-category/trailers/fence-trailers/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    desc: "1,600–2,400 mm double-layer stake fence enclosure for agricultural produce, livestock & long-haul bulk logistics."
  },
  dryvan: {
    title: "KALES DryVan Enclosed Box & Curtain-Side Trailer",
    categoryUrl: "https://www.kalestruck.com/product-category/trailers/dryvan-transport/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    url: "https://www.kalestruck.com/product-category/trailers/dryvan/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
    desc: "Weatherproof enclosed box / wing-body trailer engineered for high-value palletized freight & parcel express."
  }
}

const CATEGORIES = [
  {
    id: "container-bulk-transport",
    label: "Container & Bulk",
    models: ["flatbed-semi-trailer", "skeletal-trailer", "sidewall-semi-trailer", "fence-trailers"],
    url: "https://www.kalestruck.com/product-category/trailers/container-bulk-transport/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo"
  },
  {
    id: "dryvan-transport",
    label: "DryVan Transport",
    models: ["dryvan"],
    url: "https://www.kalestruck.com/product-category/trailers/dryvan-transport/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo"
  }
]

function categoryForModel(modelId) {
  return CATEGORIES.find((c) => c.models.includes(modelId)) ?? CATEGORIES[0]
}

const NUMERIC_FIELDS = ["fifthWheelMm", "lengthM", "rearOverhangM", "deckMm", "axles", "spacingM", "payloadT", "cargoDensityT", "targetCbm", "wallMm"]
const UNITS = { fifthWheelMm: "mm", lengthM: "m", rearOverhangM: "m", deckMm: "mm", axles: "", spacingM: "m", payloadT: "t", cargoDensityT: "t/m³", targetCbm: "m³", wallMm: "mm" }

const $ = (id) => document.getElementById(id)
const num = (id) => {
  const v = $(id).value.trim()
  return v === "" ? undefined : Number(v)
}

let activeModel = "flatbed-semi-trailer"
let lastResult = null

function fillSelect(select, options, value) {
  select.replaceChildren(...options.map(([id, label]) => new Option(label, id, false, id === value)))
  select.value = value ?? options[0]?.[0] ?? ""
}

function setModelButtons(selected) {
  activeModel = selected
  const activeCat = categoryForModel(selected)
  $("categoryGroup")?.querySelectorAll(".cat-tab-btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.category === activeCat.id))
  })
  $("modelGroup").querySelectorAll(".chip-btn").forEach((btn) => {
    const on = btn.dataset.model === selected
    btn.setAttribute("aria-pressed", String(on))
    btn.classList.toggle("is-hidden", btn.dataset.category !== activeCat.id)
  })
  const cta = $("headerPrimaryCta")
  if (cta) {
    cta.href = activeCat.url
    cta.textContent = `${activeCat.label} specs ↗`
  }
}

function applyModelDefaults(modelId) {
  const model = MODELS[modelId]
  setModelButtons(modelId)
  $("tractor").value = model.defaultTractor
  $("fifthWheelMm").value = TRACTORS[model.defaultTractor].fifthWheelMm
  fillSelect($("suspension"), model.suspensions.map((id) => [id, SUSPENSIONS[id].label]), model.suspensions[0])
  $("tyre").value = model.defaultTyre
  $("lengthM").value = model.length.default
  $("rearOverhangM").value = model.rearOverhang.default
  $("deckMm").value = model.deckMm.default
  $("axles").value = model.axles.default
  $("spacingM").value = SUSPENSIONS[model.suspensions[0]].spacing.default
  $("payloadT").value = model.payloadT.default
  $("cargoDensityT").value = model.cargoDensityT?.default ?? ""
  $("targetCbm").value = ""
  $("wallMm").value = model.wallMm?.default ?? ""
  $("container").value = model.defaultContainer
}

function readRaw() {
  return {
    region: $("region").value,
    model: activeModel,
    tractor: $("tractor").value,
    fifthWheelMm: num("fifthWheelMm"),
    suspension: $("suspension").value,
    tyre: $("tyre").value,
    axles: num("axles"),
    spacingM: num("spacingM"),
    lengthM: num("lengthM"),
    rearOverhangM: num("rearOverhangM"),
    deckMm: num("deckMm"),
    payloadT: num("payloadT"),
    cargoDensityT: num("cargoDensityT"),
    targetCbm: num("targetCbm"),
    wallMm: num("wallMm"),
    container: $("container").value
  }
}

function syncForm(r, syncAll) {
  const { config, parts } = r
  const { model } = parts
  setModelButtons(config.model)
  fillSelect($("suspension"), model.suspensions.map((id) => [id, SUSPENSIONS[id].label]), config.suspension)
  fillSelect($("tyre"), tyresFor().map((t) => [t.id, t.label]), config.tyre)
  $("region").value = config.region
  $("tractor").value = config.tractor
  $("container").value = config.container

  const hasWalls = Boolean(model.wallMm)
  const isDryvan = model.family === "dryvan"
  $("dryvanVolumeRow").classList.toggle("is-hidden", !isDryvan)
  $("wallField").classList.toggle("is-hidden", !hasWalls)
  $("containerField").classList.toggle("is-hidden", hasWalls)
  $("wallLabel").firstChild.textContent = isDryvan ? "Internal box height " : model.family === "fence" ? "Stake fence height " : "Drop-sidewall height "
  $("payloadLabel").firstChild.textContent = isDryvan ? "Est. cargo weight (light freight) " : "Cargo payload "

  for (const field of NUMERIC_FIELDS) {
    const input = $(field)
    const value = config[field]
    if (syncAll || input.value === "" || (isDryvan && document.activeElement !== input && (field === "targetCbm" || field === "payloadT" || field === "wallMm" || field === "lengthM"))) input.value = value ?? ""
    const bounds = r.bounds[field]
    if (bounds) {
      input.min = bounds.min
      input.max = bounds.max
    }
  }
}

function boundsHint(r, field) {
  const b = r.bounds[field]
  if (!b) return ""
  const unit = UNITS[field]
  const range = `${b.min}–${b.max}${unit ? ` ${unit}` : ""}`
  if (field === "fifthWheelMm") return `${range} · ${r.parts.tractor.label} std ${TRACTORS[r.config.tractor].fifthWheelMm} mm`
  if (field === "deckMm") return `${range} · min ${r.geometry.minDeckOverAxleMm} mm over tyres`
  if (field === "axles") return `${range} fit ${r.config.lengthM} m`
  if (field === "targetCbm") return `${range} · ${r.geometry.totalPallets} pallets (${r.config.lengthM} × 2.44 × ${(r.config.wallMm / 1000).toFixed(2)} m)`
  if (field === "cargoDensityT") return `${range} · e.g. foam 0.12 · parcels 0.22 · FMCG 0.40`
  if (field === "payloadT" && r.parts.model.family === "dryvan") return `Volumetric cargo — legal headroom up to ${r.maxPayloadT.legal} t`
  return range
}

function renderHints(r) {
  const byField = new Map(r.issues.map((i) => [i.field, i]))
  for (const field of NUMERIC_FIELDS) {
    const hint = $(`hint-${field}`)
    if (!hint) continue
    const issue = byField.get(field)
    const input = $(field)
    input.setAttribute("aria-invalid", String(Boolean(issue)))
    hint.classList.toggle("error", Boolean(issue))
    hint.textContent = issue ? `Clamped ${issue.requested} → ${issue.used} (${issue.min}–${issue.max})` : boundsHint(r, field)
  }
}

function update(syncAll = false) {
  const r = evaluate(readRaw())
  lastResult = r
  syncForm(r, syncAll)
  renderHints(r)
  $("svgStage").innerHTML = renderCad(r)
  renderResults(r, MODEL_CATALOG)
}

async function renderPresetList() {
  const listEl = $("savedPresetsList")
  const presets = await loadPresets()
  if (!presets.length) {
    listEl.replaceChildren(Object.assign(document.createElement("li"), { textContent: globalThis.chrome?.storage?.local ? "No saved plans yet." : "Saved plans are active when loaded as a Chrome extension." }))
    return
  }
  listEl.replaceChildren(...presets.map((p, idx) => {
    const li = document.createElement("li")
    const load = document.createElement("button")
    load.type = "button"
    load.className = "btn-link"
    load.textContent = "Load"
    const name = Object.assign(document.createElement("span"), { textContent: `${p.name} · ${p.config.axles ?? 3} axles · ${p.config.payloadT ?? 30} t` })
    load.addEventListener("click", () => {
      applyModelDefaults(Object.hasOwn(MODELS, p.config.model) ? p.config.model : "flatbed-semi-trailer")
      for (const f of NUMERIC_FIELDS) if (p.config[f] !== undefined && p.config[f] !== null) $(f).value = p.config[f]
      if (p.config.region) $("region").value = p.config.region
      if (p.config.tractor) $("tractor").value = p.config.tractor
      if (p.config.container) $("container").value = p.config.container
      update(true)
    })
    const del = document.createElement("button")
    del.type = "button"
    del.className = "btn-link danger"
    del.textContent = "Delete"
    del.setAttribute("aria-label", `Delete ${p.name}`)
    del.addEventListener("click", async () => {
      await deletePreset(idx)
      await renderPresetList()
    })
    const actions = document.createElement("span")
    actions.append(load, del)
    li.append(name, actions)
    return li
  }))
}

function init() {
  fillSelect($("region"), REGION_ORDER.map((id) => [id, REGIONS[id].name]), "CN")
  fillSelect($("tractor"), Object.entries(TRACTORS).map(([id, t]) => [id, t.label]), "6x4")
  fillSelect($("container"), Object.values(CONTAINERS).map((c) => [c.id, c.label]), "1x40ft")

  $("categoryGroup").replaceChildren(...CATEGORIES.map((cat) => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "cat-tab-btn"
    btn.dataset.category = cat.id
    btn.textContent = `${cat.label} (${cat.models.length})`
    btn.addEventListener("click", () => {
      applyModelDefaults(cat.models[0])
      update(true)
    })
    return btn
  }))

  $("modelGroup").replaceChildren(...MODEL_ORDER.map((id) => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "chip-btn"
    btn.dataset.model = id
    btn.dataset.category = categoryForModel(id).id
    btn.textContent = MODELS[id].label
    btn.addEventListener("click", () => {
      applyModelDefaults(id)
      update(true)
    })
    return btn
  }))

  $("configForm").addEventListener("input", (event) => {
    const { id } = event.target
    if (id === "tractor") $("fifthWheelMm").value = TRACTORS[$("tractor").value].fifthWheelMm
    if (id === "suspension") $("spacingM").value = SUSPENSIONS[$("suspension").value].spacing.default
    if (activeModel === "dryvan") {
      if (id === "targetCbm") {
        const cbm = num("targetCbm")
        const model = MODELS.dryvan
        if (cbm > 0) {
          let len = num("lengthM") || model.length.default
          let wall = Math.round((cbm / (len * 2.44)) * 1000)
          if (wall > model.wallMm.max) {
            wall = model.wallMm.max
            len = Math.min(model.length.max, +(cbm / (2.44 * (wall / 1000))).toFixed(1))
            $("lengthM").value = len
          } else if (wall < model.wallMm.min) {
            wall = model.wallMm.min
            len = Math.max(model.length.min, +(cbm / (2.44 * (wall / 1000))).toFixed(1))
            $("lengthM").value = len
          }
          $("wallMm").value = Math.min(model.wallMm.max, Math.max(model.wallMm.min, wall))
        }
        $("payloadT").value = ""
      } else if (id === "wallMm" || id === "lengthM" || id === "cargoDensityT") {
        $("payloadT").value = ""
      } else if (id === "payloadT" && lastResult?.geometry?.usableCbm > 0) {
        const p = num("payloadT")
        if (p > 0) $("cargoDensityT").value = +(p / lastResult.geometry.usableCbm).toFixed(2)
      }
    }
    update(false)
  })
  $("configForm").addEventListener("submit", (e) => e.preventDefault())

  $("btnSavePreset").addEventListener("click", async () => {
    if (!lastResult) return
    const { parts, config } = lastResult
    await savePreset(`${parts.model.label} (${config.payloadT} t)`, config)
    await renderPresetList()
  })
  $("btnPrintSpec").addEventListener("click", () => window.print())

  applyModelDefaults(activeModel)
  update(true)
  renderPresetList()
}

init()
