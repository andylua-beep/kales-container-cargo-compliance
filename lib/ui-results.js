// Renders verdict banner, KPI tiles, grouped check tables, region notes and KALES recommendation.
import { round } from "./model.js"
import { BASIS_LABELS } from "./regulations.js"

const STATUS_LABEL = { ok: "OK", info: "Info", warn: "Review", permit: "Permit", fail: "Fail" }
const GROUP_TITLES = {
  legal: (r) => `Statutory compliance (${r.parts.region.name})`,
  mechanical: () => "Equipment ratings & traction",
  geometry: () => "Container fit & chassis geometry"
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v
    else if (k === "text") node.textContent = v
    else node.setAttribute(k, v)
  }
  for (const child of children) if (child) node.append(child)
  return node
}

const fmt = (v, unit) => (v === null || v === undefined ? "—" : `${v}${unit === "°" || unit === "%" ? "" : " "}${unit}`)
const byId = (id) => document.getElementById(id)
const findCheck = (r, id) => r.checks.find((c) => c.id === id)

function renderVerdict(r) {
  const box = byId("verdict")
  box.className = `verdict st-${r.verdict.status}`
  byId("verdictTitle").textContent = r.verdict.title
  byId("verdictText").textContent = r.verdict.text
  const counts = r.checks.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }), {})
  const parts = ["fail", "warn"].filter((s) => counts[s]).map((s) => `${counts[s]} ${STATUS_LABEL[s].toLowerCase()}`)
  const legal = r.maxPayloadT.legal > 0 ? `Max legal payload ${r.maxPayloadT.legal} t` : "Exceeds non-weight limits"
  const prefix = r.parts.model.family === "dryvan"
    ? `Cubic capacity ${r.geometry.usableCbm} m³ (${r.geometry.totalPallets} pallets) · `
    : ""
  byId("verdictMeta").textContent = `${prefix}${legal} · ${r.maxPayloadT.technical} t by equipment ratings${parts.length ? ` · ${parts.join(", ")}` : ""}`
}

function kpi(title, value, sub, status = "ok") {
  return el("div", { class: `kpi st-${status}` }, [
    el("div", { class: "title", text: title }),
    el("div", { class: "val", text: value }),
    el("div", { class: "sub", text: sub })
  ])
}

function renderKpis(r) {
  const gcw = findCheck(r, "legal-gcw")
  const { suspension, model } = r.parts
  const axleCap = Math.min(suspension.ratingT, r.tyreAxleCapT)
  const isDryvan = model.family === "dryvan"
  const { container } = r.parts
  // Pallet counts only describe loose freight; with an ISO box on the chassis show the box instead.
  const isContainerLoad = !isDryvan && container?.count > 0
  const capTile = isDryvan
    ? kpi("Internal box volume", `${r.geometry.usableCbm} m³`, `${r.geometry.totalPallets} pallets · ${r.config.lengthM} × 2.44 × ${(r.config.wallMm / 1000).toFixed(2)} m`, "info")
    : isContainerLoad
      ? kpi("ISO container load", container.label.replace(/\s*\(.*\)$/, ""), `${r.config.payloadT} t payload · max legal ${r.maxPayloadT.legal} t`, "info")
      : kpi("Floor & cubic capacity", `${r.geometry.totalPallets} pallets`, `${r.geometry.usableCbm} m³ · ${r.geometry.palletPairs} rows × 2 · max legal ${r.maxPayloadT.legal} t`, "info")
  const gcwTile = isDryvan
    ? kpi("Light-cargo load", `${r.config.payloadT} t (${r.loads.gcwT} t GCW)`, `${r.config.cargoDensityT} t/m³ · headroom to ${r.maxPayloadT.legal} t (${r.parts.region.id})`, gcw?.status)
    : kpi("Gross combination weight", `${r.loads.gcwT} t`, `${gcw ? `Limit ${gcw.limit} t (${r.parts.region.id}) · ` : ""}tare ${r.tare.totalT} t`, gcw?.status)
  const maxPayloadTile = kpi("Max legal payload", `${r.maxPayloadT.legal} t`, `${r.maxPayloadT.technical} t by equipment ratings (${r.parts.region.id})`, "info")
  const tiles = isDryvan
    ? [
        capTile,
        gcwTile,
        kpi("Load per axle", `${r.loads.perAxleT} t`, `Cap ${axleCap} t (susp ${suspension.ratingT} · tyres ${r.tyreAxleCapT})`, r.loads.perAxleT > axleCap ? "fail" : "ok"),
        maxPayloadTile
      ]
    : [
        gcwTile,
        kpi("Load per axle", `${r.loads.perAxleT} t`, `Cap ${axleCap} t (susp ${suspension.ratingT} · tyres ${r.tyreAxleCapT})`, r.loads.perAxleT > axleCap ? "fail" : "ok"),
        capTile,
        maxPayloadTile
      ]
  byId("kpis").replaceChildren(...tiles)
}

function checkRow(c) {
  const util = c.limit ? Math.min(1, Math.max(0, c.value / c.limit)) : null
  const label = el("td", {}, [el("span", { text: c.label }), c.note ? el("span", { class: "note", text: c.note }) : null])
  const utilCell = el("td", { class: "col-util" }, util === null ? [] : [el("div", { class: "util", title: `${round(util * 100, 0)}%` }, [el("i", { style: `width:${round(util * 100, 1)}%` })])])
  return el("tr", { class: `st-${c.status}` }, [
    el("td", {}, [el("span", { class: "badge", text: STATUS_LABEL[c.status] })]),
    label,
    el("td", { class: "num", text: fmt(c.value, c.unit) }),
    el("td", { class: "num", text: fmt(c.limit, c.unit) }),
    utilCell
  ])
}

function renderChecks(r) {
  const tables = ["legal", "mechanical", "geometry"].map((group) => {
    const rows = r.checks.filter((c) => c.group === group)
    if (!rows.length) return null
    const head = el("tr", {}, ["Status", "Check", "Value", "Limit", ""].map((t, i) => el("th", { text: t, class: i === 4 ? "col-util" : "" })))
    return el("table", { class: "checks" }, [
      el("caption", { text: GROUP_TITLES[group](r) }),
      el("thead", {}, [head]),
      el("tbody", {}, rows.map(checkRow))
    ])
  })
  byId("checksTables").replaceChildren(...tables.filter(Boolean))
}

function renderRegion(r) {
  const region = r.parts.region
  byId("regionName").textContent = region.name
  const badge = byId("regionBadge")
  const basis = BASIS_LABELS[region.basis] ?? BASIS_LABELS.unverified
  badge.textContent = basis.label
  badge.className = `badge st-${basis.status}`
  byId("regionSourceFull").textContent = `Source: ${region.source}`
  byId("regionNotes").replaceChildren(...region.notes.map((n) => el("li", { text: n })))
  byId("regionSource").textContent = `${region.source}${basis.note}`
}

export function renderResults(r, catalog) {
  renderVerdict(r)
  renderKpis(r)
  renderChecks(r)
  renderRegion(r)
  const info = catalog[r.config.model]
  byId("matchedModelTitle").textContent = `Recommended: ${info.title}`
  byId("matchedModelDesc").textContent = info.desc
  byId("matchedModelUrl").href = info.url
  byId("headerPrimaryCta").href = info.categoryUrl
}
