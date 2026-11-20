// Input normalisation, container/cargo geometry, tare build-up and static load solution.
import {
  MODELS, SUSPENSIONS, TRACTORS, TYRES, CONTAINERS, TYRES_PER_AXLE,
  KINGPIN_SETBACK_M, FIFTH_WHEEL_MM, STD_BODY_WIDTH_M, tyresFor, tyreFit
} from "./equipment.js"
import { REGIONS } from "./regulations.js"

const round = (v, d = 2) => +v.toFixed(d)
const isNum = (v) => typeof v === "number" && Number.isFinite(v)
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

function bounded(issues, field, raw, min, max, fallback, bounds) {
  if (bounds) bounds[field] = { min, max }
  const value = isNum(raw) ? raw : fallback
  if (!isNum(raw)) return value
  if (raw < min || raw > max) {
    const used = clamp(raw, min, max)
    issues.push({ field, requested: raw, used, min, max })
    return used
  }
  return value
}

export function maxAxlesForLength(model, lengthM, rearOverhangM, spacingM, tyreDiaMm) {
  const lastX = lengthM - KINGPIN_SETBACK_M - rearOverhangM
  const available = lastX - tyreDiaMm / 2000 - model.minFrontClearM
  if (available < 0) return 0
  return Math.min(model.axles.max, Math.floor(available / spacingM + 1e-9) + 1)
}

export function minLengthForAxles(model, axles, rearOverhangM, spacingM, tyreDiaMm) {
  const exact = model.minFrontClearM + tyreDiaMm / 2000 + (axles - 1) * spacingM + rearOverhangM + KINGPIN_SETBACK_M
  return Math.ceil(exact * 10 - 1e-9) / 10
}

export function rearDeckHeightMm(model, suspension, tyre) {
  return Math.round(tyre.diaMm / 2 + suspension.stackMm + model.beamDepthMm)
}

export function normalizeConfig(raw = {}) {
  const issues = []
  const bounds = {}
  const regionId = Object.hasOwn(REGIONS, raw.region) ? raw.region : "CN"
  const modelId = Object.hasOwn(MODELS, raw.model) ? raw.model : "flatbed-semi-trailer"
  const model = MODELS[modelId]

  const tractorId = Object.hasOwn(TRACTORS, raw.tractor) ? raw.tractor : model.defaultTractor
  const fifthWheelMm = Math.round(bounded(issues, "fifthWheelMm", raw.fifthWheelMm, FIFTH_WHEEL_MM.min, FIFTH_WHEEL_MM.max, TRACTORS[tractorId].fifthWheelMm, bounds))
  const tractor = { ...TRACTORS[tractorId], fifthWheelMm }

  const suspensionId = model.suspensions.includes(raw.suspension) ? raw.suspension : model.suspensions[0]
  const suspension = SUSPENSIONS[suspensionId]
  const tyre = tyresFor().find((t) => t.id === raw.tyre) ?? tyresFor().find((t) => t.id === model.defaultTyre) ?? TYRES[0]

  const spacingM = bounded(issues, "spacingM", raw.spacingM, suspension.spacing.min, suspension.spacing.max, suspension.spacing.default, bounds)
  const minDeckMm = Math.max(model.deckMm.min, rearDeckHeightMm(model, suspension, tyre))
  const deckMm = Math.round(bounded(issues, "deckMm", raw.deckMm, minDeckMm, model.deckMm.max, Math.max(minDeckMm, model.deckMm.default), bounds))

  const isDryvan = model.family === "dryvan"
  const internalW = STD_BODY_WIDTH_M - 0.06
  const lengthM = bounded(issues, "lengthM", raw.lengthM, model.length.min, model.length.max, model.length.default, bounds)
  const overhangRoom = lengthM - KINGPIN_SETBACK_M - model.minFrontClearM - tyre.diaMm / 2000 - (model.axles.min - 1) * spacingM
  const overhangMax = Math.max(model.rearOverhang.min, Math.min(model.rearOverhang.max, Math.floor(overhangRoom * 20 + 1e-9) / 20))
  const rearOverhangM = bounded(issues, "rearOverhangM", raw.rearOverhangM, model.rearOverhang.min, overhangMax, Math.min(model.rearOverhang.default, overhangMax), bounds)
  const maxAxles = Math.max(model.axles.min, maxAxlesForLength(model, lengthM, rearOverhangM, spacingM, tyre.diaMm))
  const axles = Math.round(bounded(issues, "axles", raw.axles, model.axles.min, maxAxles, Math.min(model.axles.default, maxAxles), bounds))

  let wallMm = null
  if (model.wallMm) {
    const rawWall = isDryvan && !isNum(raw.wallMm) && isNum(raw.targetCbm)
      ? Math.round((raw.targetCbm / (lengthM * internalW)) * 1000)
      : raw.wallMm
    wallMm = Math.round(bounded(issues, "wallMm", rawWall, model.wallMm.min, model.wallMm.max, model.wallMm.default, bounds))
  }
  const usableHeightM = wallMm ? wallMm / 1000 : 1.8
  const boxCbm = round(lengthM * internalW * usableHeightM, 1)
  const cargoDensityT = isDryvan
    ? round(bounded(issues, "cargoDensityT", raw.cargoDensityT, model.cargoDensityT.min, model.cargoDensityT.max, model.cargoDensityT.default, bounds), 2)
    : null
  const rawPayload = isDryvan && !isNum(raw.payloadT) ? round(boxCbm * cargoDensityT, 1) : raw.payloadT
  const payloadT = round(bounded(issues, "payloadT", rawPayload, model.payloadT.min, model.payloadT.max, model.payloadT.default, bounds), 1)
  const targetCbm = isDryvan ? boxCbm : null
  if (isDryvan && bounds) {
    bounds.targetCbm = {
      min: round(model.length.min * internalW * (model.wallMm.min / 1000), 1),
      max: round(model.length.max * internalW * (model.wallMm.max / 1000), 1)
    }
  }
  const containerId = model.wallMm
    ? "none"
    : (Object.hasOwn(CONTAINERS, raw.container) ? raw.container : model.defaultContainer)
  const container = CONTAINERS[containerId]


  const config = {
    region: regionId,
    model: modelId,
    tractor: tractorId,
    fifthWheelMm,
    suspension: suspensionId,
    tyre: tyre.id,
    axles,
    spacingM,
    lengthM,
    rearOverhangM,
    deckMm,
    payloadT,
    cargoDensityT,
    targetCbm,
    wallMm,
    container: containerId
  }

  const geometry = buildGeometry({ config, model, suspension, tyre, container })
  return {
    config,
    issues,
    parts: { region: REGIONS[regionId], model, suspension, tyre, tractor, container },
    geometry,
    bounds
  }
}

export function buildGeometry({ config, model, suspension, tyre, container }) {
  const { axles: n, spacingM: s, lengthM: L, rearOverhangM, deckMm, wallMm } = config
  const tyreR = tyre.diaMm / 2000
  const frontX = -KINGPIN_SETBACK_M
  const rearX = L - KINGPIN_SETBACK_M
  const lastX = rearX - rearOverhangM
  const firstX = lastX - (n - 1) * s
  const deckM = deckMm / 1000
  const minDeckOverAxleMm = rearDeckHeightMm(model, suspension, tyre)
  const cargoH = wallMm ? wallMm / 1000 : container.heightM > 0 ? container.heightM : 0.1
  const overallHeightM = round(deckM + cargoH, 2)

  // Pallet & cubic meter capacity
  const palletPairs = Math.max(4, Math.floor((L - 0.3) / 1.05))
  const totalPallets = palletPairs * 2
  const usableHeightM = wallMm ? wallMm / 1000 : (container.heightM > 0 ? container.heightM - 0.2 : 1.8)
  const usableCbm = round(L * (STD_BODY_WIDTH_M - 0.06) * usableHeightM, 1)

  return {
    frontX,
    rearX,
    firstX,
    lastX,
    groupX: (firstX + lastX) / 2,
    groupSpanM: (n - 1) * s,
    frontTyreEdgeX: firstX - tyreR,
    tyreR,
    overallHeightM,
    minDeckOverAxleMm,
    palletPairs,
    totalPallets,
    usableCbm
  }
}

export function trailerTare(config, model, suspension) {
  const frameT = model.tare.baseT + model.tare.perMetreT * config.lengthM
  const frameX = model.tare.cgFrac * config.lengthM - KINGPIN_SETBACK_M
  const axlesT = config.axles * suspension.massPerAxleT
  return { frameT: round(frameT), frameX, axlesT: round(axlesT), totalT: round(frameT + axlesT, 1) }
}

export function payloadCgX(config, geo) {
  return (geo.frontX + geo.rearX) / 2
}

export function solveLoads({ payloadT, cgX, tare, geo, tractor, axles }) {
  const total = tare.frameT + tare.axlesT + payloadT
  const moment = tare.frameT * tare.frameX + tare.axlesT * geo.groupX + payloadT * cgX
  const groupT = moment / geo.groupX
  const kingpinT = total - groupT
  const leadRatio = tractor.fifthWheelLeadM / tractor.wheelbaseM
  const steerT = tractor.frontTareT + kingpinT * leadRatio
  const driveT = tractor.tareT - tractor.frontTareT + kingpinT * (1 - leadRatio)
  return {
    trailerGvwT: round(total, 2),
    groupT: round(groupT, 2),
    perAxleT: round(groupT / axles, 2),
    kingpinT: round(kingpinT, 2),
    steerT: round(steerT, 2),
    driveT: round(driveT, 2),
    gcwT: round(total + tractor.tareT, 2)
  }
}

export function tyreAxleCapT(tyre, fit) {
  const perTyre = fit === "wide" ? tyre.singleT : tyre.dualT
  return round(perTyre * TYRES_PER_AXLE[fit], 2)
}

export { TYRES, tyreFit, round }
