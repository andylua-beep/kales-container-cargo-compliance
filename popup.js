import { evaluate } from "./lib/engine.js"
import { REGIONS, REGION_ORDER } from "./lib/regulations.js"
import { MODELS, MODEL_ORDER, SUSPENSIONS, tyresFor } from "./lib/equipment.js"

const MODEL_URLS = {
  "skeletal-trailer": "https://www.kalestruck.com/product-category/trailers/skeletal-trailer/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
  "flatbed-semi-trailer": "https://www.kalestruck.com/product-category/trailers/flatbed-semi-trailer/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
  "sidewall-semi-trailer": "https://www.kalestruck.com/product-category/trailers/sidewall-semi-trailer/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
  "fence-trailers": "https://www.kalestruck.com/product-category/trailers/fence-trailers/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo",
  dryvan: "https://www.kalestruck.com/product-category/trailers/dryvan/?utm_source=chrome-extension&utm_medium=referral&utm_campaign=cargo"
}

const $ = (id) => document.getElementById(id)

function fillSelect(select, options, value) {
  select.replaceChildren(...options.map(([id, label]) => new Option(label, id, false, id === value)))
  select.value = value ?? options[0]?.[0] ?? ""
}

function readRaw() {
  return {
    region: $("quickRegion").value,
    model: $("quickModel").value,
    suspension: $("quickSuspension").value,
    tyre: $("quickTyre").value,
    axles: Number($("quickAxles").value),
    payloadT: Number($("quickPayload").value)
  }
}

function applyModelDefaults(modelId) {
  const model = MODELS[modelId]
  Object.assign($("quickPayload"), { min: model.payloadT.min, max: 65, value: model.payloadT.default })
  $("quickAxles").value = model.axles.default
  fillSelect($("quickSuspension"), model.suspensions.map((id) => [id, SUSPENSIONS[id].label]), model.suspensions[0])
  $("quickTyre").value = model.defaultTyre
}

function render(r) {
  const { config, parts, loads } = r
  fillSelect($("quickTyre"), tyresFor().map((t) => [t.id, t.label]), config.tyre)
  const issue = r.issues.find((i) => i.field === "axles")
  $("quickAxles").setAttribute("aria-invalid", String(Boolean(issue)))
  const hint = $("quickAxlesHint")
  hint.classList.toggle("error", Boolean(issue))
  hint.textContent = issue
    ? `Only ${issue.max} fit ${config.lengthM} m — using ${issue.used}`
    : `${r.bounds.axles.min}–${r.bounds.axles.max} fit ${config.lengthM} m`

  const isContainerLoad = r.parts.container?.count > 0 && r.parts.model.family !== "dryvan"
  const loadNote = isContainerLoad ? r.parts.container.label.replace(/\s*\(.*\)$/, "") : `${r.geometry.totalPallets} pallets`
  $("quickPayloadVal").textContent = `${config.payloadT.toFixed(1)} t (${loadNote})`
  const gcw = r.checks.find((c) => c.id === "legal-gcw")
  $("qGvw").textContent = `${loads.gcwT} / ${gcw?.limit ?? "—"} t`
  const cap = Math.min(parts.suspension.ratingT, r.tyreAxleCapT)
  $("qAxle").textContent = `${loads.perAxleT} / ${cap} t`
  $("qMaxPayload").textContent = `${r.maxPayloadT.legal} t`

  const worst = r.checks.find((c) => c.status === r.verdict.status && c.status !== "ok")
  const status = $("quickStatus")
  status.className = `status-pill st-${r.verdict.status}`
  status.textContent = worst ? `${r.verdict.title}: ${worst.label}${worst.limit !== null ? ` ${worst.value} > ${worst.limit} ${worst.unit}` : ""}` : `${r.verdict.title} — ${parts.region.id}`

  const link = $("quickCategoryLink")
  link.href = MODEL_URLS[config.model]
  link.textContent = `KALES ${parts.model.label} specs ↗`
}

function update() {
  render(evaluate(readRaw()))
}

function init() {
  fillSelect($("quickRegion"), REGION_ORDER.map((id) => [id, REGIONS[id].name]), "CN")
  fillSelect($("quickModel"), MODEL_ORDER.map((id) => [id, MODELS[id].label]), "flatbed-semi-trailer")
  applyModelDefaults("flatbed-semi-trailer")
  $("quickForm").addEventListener("input", (event) => {
    if (event.target.id === "quickModel") applyModelDefaults(event.target.value)
    update()
  })
  $("quickForm").addEventListener("submit", (e) => e.preventDefault())
  $("btnOpenFullTab").addEventListener("click", () => chrome.tabs.create({ url: chrome.runtime.getURL("app.html") }))
  update()
}

init()
