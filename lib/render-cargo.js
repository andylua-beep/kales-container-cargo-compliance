// CAD rendering for skeletal container chassis, flatbed, drop-sidewall, stake fence and DryVan.
import { poly, rect, line, dot, grad, rearEnd, markers, landingLeg } from "./render-parts.js"

function baseChassis(s, r, deckM, beamM) {
  const g = r.geometry
  const fw = r.config.fifthWheelMm / 1000
  const frameBottom = deckM - beamM
  const neckEnd = g.frontX + 2.2
  const dropEnd = g.frontX + 3.0
  const legX = g.frontX + 2.7
  const framePoly = [
    [g.frontX, deckM], [g.rearX, deckM], [g.rearX, frameBottom],
    [dropEnd, frameBottom], [neckEnd, Math.min(fw, frameBottom)], [g.frontX + 0.35, Math.min(fw, frameBottom)], [g.frontX, fw]
  ]
  const stiffeners = []
  for (let x = g.frontX + 1.2; x < g.firstX - 0.8; x += 1.2) {
    stiffeners.push(line(s, x, deckM - 0.08, x, frameBottom + 0.05, "cad-stiffener"))
  }
  const guardStart = legX + 0.45
  const guardEnd = g.frontTyreEdgeX - 0.35
  const guard = guardEnd - guardStart > 0.8
    ? `${rect(s, guardStart, 0.56, guardEnd, 0.63, "cad-guard", 1)}${rect(s, guardStart, 0.71, guardEnd, 0.78, "cad-guard", 1)}`
    : ""
  return `<g>
    ${landingLeg(s, legX, frameBottom)}
    ${guard}
    ${poly(s, framePoly, "cad-trailer", grad("gTrailer"))}
    ${stiffeners.join("")}
    ${line(s, g.frontX + 0.08, deckM - 0.04, g.rearX - 0.08, deckM - 0.04, "cad-deckline")}
    ${markers(s, g.frontX + 0.6, g.rearX - 0.4, deckM - 0.12, 1.8)}
    ${rearEnd(s, g.rearX, deckM, beamM)}
    ${rect(s, -0.5, fw - 0.035, 0.5, fw, "cad-saddle", 1)}${rect(s, -0.06, fw - 0.15, 0.06, fw, "cad-kingpin")}
  </g>`
}

function isoContainer(s, x1, x2, deckM, heightM) {
  const top = deckM + heightM
  const ribs = []
  for (let x = x1 + 0.28; x < x2 - 0.2; x += 0.28) {
    ribs.push(line(s, x, deckM + 0.12, x, top - 0.12, "cad-container-rib"))
  }
  return `<g>
    ${rect(s, x1, deckM, x2, top, "cad-container", 2, grad("gContainer"))}
    ${ribs.join("")}
    ${rect(s, x1, deckM, x1 + 0.16, deckM + 0.14, "cad-corner")}
    ${rect(s, x2 - 0.16, deckM, x2, deckM + 0.14, "cad-corner")}
    ${rect(s, x1, top - 0.14, x1 + 0.16, top, "cad-corner")}
    ${rect(s, x2 - 0.16, top - 0.14, x2, top, "cad-corner")}
  </g>`
}

function containersLayer(s, r, deckM) {
  const { container } = r.parts
  if (!container || container.lengthM <= 0) return ""
  const g = r.geometry
  if (container.count === 2) {
    const gap = 0.07
    const boxL = (container.lengthM - gap) / 2
    const x0 = g.rearX - container.lengthM
    return isoContainer(s, x0, x0 + boxL, deckM, container.heightM) + isoContainer(s, x0 + boxL + gap, g.rearX, deckM, container.heightM)
  }
  const x0 = Math.max(g.frontX, g.rearX - container.lengthM)
  return isoContainer(s, x0, Math.min(g.rearX, x0 + container.lengthM), deckM, container.heightM)
}

function sidewallPanels(s, r, deckM, wallM) {
  const g = r.geometry
  const top = deckM + wallM
  const panels = Math.max(3, Math.round(r.config.lengthM / 2.2))
  const w = (g.rearX - g.frontX) / panels
  const posts = []
  for (let i = 1; i < panels; i++) {
    const px = g.frontX + i * w
    posts.push(rect(s, px - 0.04, deckM, px + 0.04, top, "cad-post", 1))
  }
  return `<g>
    ${rect(s, g.frontX, deckM, g.rearX, top, "cad-wall", 2, grad("gTrailer"))}
    ${posts.join("")}
    ${rect(s, g.frontX, deckM, g.frontX + 0.09, top + 0.06, "cad-post", 1)}
    ${rect(s, g.rearX - 0.09, deckM, g.rearX, top + 0.06, "cad-post", 1)}
  </g>`
}

function fenceBody(s, r, deckM, wallM) {
  const g = r.geometry
  const lowerH = Math.min(0.75, wallM * 0.42)
  const top = deckM + wallM
  const stakes = Math.max(5, Math.round(r.config.lengthM / 1.6))
  const w = (g.rearX - g.frontX) / stakes
  const els = [sidewallPanels(s, r, deckM, lowerH)]
  for (let i = 0; i <= stakes; i++) {
    const sx = i === stakes ? g.rearX - 0.05 : g.frontX + i * w
    els.push(rect(s, sx, deckM + lowerH, sx + 0.05, top, "cad-post", 1))
  }
  for (const frac of [0.33, 0.66, 1.0]) {
    const ry = deckM + lowerH + (wallM - lowerH) * frac
    els.push(line(s, g.frontX, ry, g.rearX, ry, "cad-fence-rail"))
  }
  return `<g>${els.join("")}</g>`
}

function dryvanBody(s, r, deckM, wallM) {
  const g = r.geometry
  const top = deckM + wallM
  const ribs = []
  for (let x = g.frontX + 0.35; x < g.rearX - 0.25; x += 0.35) {
    ribs.push(line(s, x, deckM + 0.08, x, top - 0.08, "cad-van-rib"))
  }
  return `<g>
    ${rect(s, g.frontX, deckM, g.rearX, top, "cad-dryvan", 2, grad("gDryvan"))}
    ${ribs.join("")}
    ${rect(s, g.frontX, deckM, g.rearX, deckM + 0.14, "cad-trailer-shade")}
    ${rect(s, g.frontX, top - 0.09, g.rearX, top, "cad-trailer-shade")}
    ${rect(s, g.rearX - 0.12, deckM + 0.14, g.rearX, top - 0.09, "cad-post")}
  </g>`
}

export function cargoParts(s, r) {
  const deckM = r.config.deckMm / 1000
  const beamM = r.parts.model.beamDepthMm / 1000
  const fam = r.parts.model.family
  const chassis = baseChassis(s, r, deckM, beamM)
  if (fam === "skeletal" || fam === "flatbed") return chassis + containersLayer(s, r, deckM)
  const wallM = (r.config.wallMm ?? 1200) / 1000
  if (fam === "sidewall") return chassis + sidewallPanels(s, r, deckM, wallM)
  if (fam === "fence") return chassis + fenceBody(s, r, deckM, wallM)
  return chassis + dryvanBody(s, r, deckM, wallM)
}

export const cargoAxleFrameM = (r) => r.config.deckMm / 1000 - r.parts.model.beamDepthMm / 1000
