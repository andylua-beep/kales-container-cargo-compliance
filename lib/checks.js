// Mechanical, geometric and container-fit checks.
import { TRACTOR_TYRE_DIA_M, NECK_TYRE_CLEARANCE_M } from "./equipment.js"
import { tyreAxleCapT, tyreFit, round } from "./model.js"

const TRACTOR_LIMITS = { steerMaxT: 7.5, driveMaxSingleT: 13, driveMaxTandemT: 26, kingpinMaxT: 24 }

function limitCheck({ id, group, label, value, limit, unit, note = "", isWeightBased = true }) {
  const status = value > limit + 1e-6 ? "fail" : value / limit > 0.96 ? "warn" : "ok"
  return { id, group, label, value: round(value, 2), limit: round(limit, 2), unit, status, note, isWeightBased }
}

function infoCheck({ id, group, label, value = null, limit = null, unit = "", status = "info", note = "", isWeightBased = false }) {
  return { id, group, label, value, limit, unit, status, note, isWeightBased }
}

export function mechanicalChecks({ parts, loads }) {
  const { suspension, tyre, tractor } = parts
  const fit = tyreFit(tyre)
  const tyreCap = tyreAxleCapT(tyre, fit)
  const driveLimit = tractor.driveAxles > 1 ? TRACTOR_LIMITS.driveMaxTandemT : TRACTOR_LIMITS.driveMaxSingleT
  const driveShare = round((loads.driveT / loads.gcwT) * 100, 1)
  return [
    limitCheck({ id: "axle-rating", group: "mechanical", label: "Suspension rating per axle", value: loads.perAxleT, limit: suspension.ratingT, unit: "t", note: suspension.label }),
    limitCheck({ id: "tyre-rating", group: "mechanical", label: "Tyre capacity per axle", value: loads.perAxleT, limit: tyreCap, unit: "t", note: `${tyre.label} (${fit === "wide" ? "2/axle" : "4/axle"})` }),
    limitCheck({ id: "kingpin", group: "mechanical", label: "Kingpin static load", value: loads.kingpinT, limit: TRACTOR_LIMITS.kingpinMaxT, unit: "t", note: "2\" or 3.5\" kingpin vertical rating" }),
    limitCheck({ id: "tractor-steer", group: "mechanical", label: "Tractor steer axle", value: loads.steerT, limit: TRACTOR_LIMITS.steerMaxT, unit: "t" }),
    limitCheck({ id: "tractor-drive", group: "mechanical", label: `Tractor drive ${tractor.driveAxles > 1 ? "tandem" : "axle"}`, value: loads.driveT, limit: driveLimit, unit: "t" }),
    infoCheck({ id: "traction", group: "mechanical", label: "Drive-axle share (traction)", value: driveShare, limit: 25, unit: "%", status: driveShare < 25 ? "warn" : "ok", note: "≥ 25% keeps drive tyres planted on wet grades", isWeightBased: true })
  ]
}

export function geometryChecks({ config, parts, geo, maxAxles, minLengthForMax }) {
  const checks = [
    limitCheck({ id: "axle-fit", group: "geometry", label: "Axles fitting in trailer length", value: config.axles, limit: maxAxles, unit: "", isWeightBased: false, note: minLengthForMax })
  ]
  const clearanceM = round(parts.tractor.fifthWheelMm / 1000 - TRACTOR_TYRE_DIA_M, 2)
  const isTight = clearanceM < NECK_TYRE_CLEARANCE_M
  checks.push(infoCheck({
    id: "fifth-wheel-height", group: "geometry", label: "Frame underside over tractor drive tyres",
    value: clearanceM, unit: "m", status: isTight ? "warn" : "info",
    note: isTight ? `Fifth wheel ${parts.tractor.fifthWheelMm} mm is tight over Ø${TRACTOR_TYRE_DIA_M * 1000} mm drive tyres` : `Fifth wheel ${parts.tractor.fifthWheelMm} mm`
  }))
  checks.push(limitCheck({
    id: "deck-stack", group: "geometry", label: "Min. frame height over tyres vs. set height",
    value: geo.minDeckOverAxleMm, limit: config.deckMm, unit: "mm", isWeightBased: false,
    note: `Tyre radius + ${parts.suspension.kind} stack + ${parts.model.beamDepthMm} mm main beam`
  }))
  if (parts.container.lengthM > 0) {
    checks.push(limitCheck({
      id: "container-fit", group: "geometry", label: "ISO container length vs. chassis length",
      value: parts.container.lengthM, limit: config.lengthM, unit: "m", isWeightBased: false,
      note: parts.container.label
    }))
  }
  return checks
}
