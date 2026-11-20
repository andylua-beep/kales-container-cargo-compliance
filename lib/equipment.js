// KALES container, flatbed, sidewall, fence & DryVan equipment catalog.
// All dimensions in m or mm; masses in tonnes.

export const KINGPIN_SETBACK_M = 0.9
export const FIFTH_WHEEL_MM = { min: 1000, max: 1400 }
export const TRACTOR_TYRE_DIA_M = 1.07
export const TRACTOR_BOGIE_HALF_SPACING_M = 0.68
export const NECK_TYRE_CLEARANCE_M = 0.08
export const LANDING_LEG = { stowedFootM: 0.35, offsetFromNeckM: 1.5 }
export const TYRES_PER_AXLE = { dual: 4, wide: 2 }
export const STD_BODY_WIDTH_M = 2.5

export const SUSPENSIONS = {
  "mechanical-13": {
    label: "Leaf spring · 13 t/axle",
    kind: "mechanical",
    ratingT: 13,
    stackMm: 240,
    massPerAxleT: 0.55,
    spacing: { min: 1.25, max: 1.85, default: 1.31 }
  },
  "air-10": {
    label: "Air suspension · 10 t/axle",
    kind: "air",
    ratingT: 10,
    stackMm: 220,
    massPerAxleT: 0.42,
    spacing: { min: 1.25, max: 1.85, default: 1.31 }
  },
  "mechanical-16": {
    label: "Heavy leaf spring · 16 t/axle",
    kind: "mechanical",
    ratingT: 16,
    stackMm: 300,
    massPerAxleT: 0.65,
    spacing: { min: 1.3, max: 1.85, default: 1.36 }
  }
}

export const TYRES = [
  { id: "12R22.5-152", label: "12R22.5 18PR (3.55 t · Ø1084 mm)", diaMm: 1084, widthMm: 300, dualT: 3.25, singleT: 3.55, fits: ["dual"] },
  { id: "12R22.5-148", label: "12R22.5 16PR (3.15 t · Ø1084 mm)", diaMm: 1084, widthMm: 300, dualT: 2.9, singleT: 3.15, fits: ["dual"] },
  { id: "11.00R20-152", label: "11.00R20 18PR (3.55 t · Ø1082 mm)", diaMm: 1082, widthMm: 293, dualT: 3.25, singleT: 3.55, fits: ["dual"] },
  { id: "12.00R20-156", label: "12.00R20 20PR (4.00 t · Ø1122 mm)", diaMm: 1122, widthMm: 315, dualT: 3.65, singleT: 4.0, fits: ["dual"] },
  { id: "315/80R22.5-154", label: "315/80R22.5 LI 154/150 (3.75 t · Ø1076 mm)", diaMm: 1076, widthMm: 312, dualT: 3.35, singleT: 3.75, fits: ["dual"] },
  { id: "385/65R22.5-160", label: "385/65R22.5 Super Single (4.50 t · Ø1072 mm)", diaMm: 1072, widthMm: 389, dualT: 4.5, singleT: 4.5, fits: ["wide"] },
  { id: "235/75R17.5-143", label: "235/75R17.5 Low-CG (2.50 t · Ø797 mm)", diaMm: 797, widthMm: 233, dualT: 2.5, singleT: 2.725, fits: ["dual"] }
]

export const TRACTORS = {
  "4x2": {
    label: "4×2 tractor",
    tareT: 6.8,
    frontTareT: 4.5,
    wheelbaseM: 3.6,
    fifthWheelLeadM: 0.45,
    frontOverhangM: 1.4,
    driveAxles: 1,
    fifthWheelMm: 1200,
    swingRadiusM: 2.1
  },
  "6x4": {
    label: "6×4 tractor",
    tareT: 8.5,
    frontTareT: 5.0,
    wheelbaseM: 3.875,
    fifthWheelLeadM: 0.4,
    frontOverhangM: 1.45,
    driveAxles: 2,
    fifthWheelMm: 1250,
    swingRadiusM: 2.35
  },
  "6x4-heavy": {
    label: "6×4 heavy tractor",
    tareT: 9.8,
    frontTareT: 5.2,
    wheelbaseM: 4.0,
    fifthWheelLeadM: 0.4,
    frontOverhangM: 1.45,
    driveAxles: 2,
    fifthWheelMm: 1300,
    swingRadiusM: 2.45
  }
}

export const CONTAINERS = {
  none: { id: "none", label: "No ISO container (breakbulk / pallet)", lengthM: 0, heightM: 0, count: 0 },
  "1x20ft": { id: "1x20ft", label: "1 × 20ft ISO (6.06 m × 2.59 m)", lengthM: 6.06, heightM: 2.59, count: 1 },
  "2x20ft": { id: "2x20ft", label: "2 × 20ft ISO (12.19 m × 2.59 m)", lengthM: 12.19, heightM: 2.59, count: 2 },
  "1x40ft": { id: "1x40ft", label: "1 × 40ft Std ISO (12.19 m × 2.59 m)", lengthM: 12.19, heightM: 2.59, count: 1 },
  "1x40hq": { id: "1x40hq", label: "1 × 40ft High-Cube (12.19 m × 2.90 m)", lengthM: 12.19, heightM: 2.90, count: 1 },
  "1x45hq": { id: "1x45hq", label: "1 × 45ft High-Cube (13.72 m × 2.90 m)", lengthM: 13.72, heightM: 2.90, count: 1 }
}

export const MODELS = {
  "skeletal-trailer": {
    label: "Skeletal container chassis",
    family: "skeletal",
    length: { min: 7.0, max: 14.5, default: 12.8 },
    deckMm: { min: 1050, max: 1480, default: 1300 },
    axles: { min: 2, max: 4, default: 3 },
    rearOverhang: { min: 0.7, max: 2.0, default: 1.0 },
    minFrontClearM: 3.4,
    beamDepthMm: 450,
    suspensions: ["mechanical-13", "air-10", "mechanical-16"],
    defaultTractor: "6x4",
    defaultTyre: "12R22.5-152",
    defaultContainer: "1x40ft",
    tare: { baseT: 1.8, perMetreT: 0.16, cgFrac: 0.5 }, // lightweight ~5.3 t trailer
    payloadT: { min: 1, max: 70, default: 32 },
    wallMm: null
  },
  "flatbed-semi-trailer": {
    label: "Flatbed semi-trailer",
    family: "flatbed",
    length: { min: 8.5, max: 14.5, default: 12.8 },
    deckMm: { min: 1100, max: 1520, default: 1320 },
    axles: { min: 2, max: 4, default: 3 },
    rearOverhang: { min: 0.8, max: 2.0, default: 1.0 },
    minFrontClearM: 3.4,
    beamDepthMm: 480,
    suspensions: ["mechanical-13", "air-10", "mechanical-16"],
    defaultTractor: "6x4",
    defaultTyre: "12R22.5-152",
    defaultContainer: "1x40ft",
    tare: { baseT: 2.1, perMetreT: 0.22, cgFrac: 0.5 }, // ~6.5 t trailer
    payloadT: { min: 1, max: 75, default: 31 },
    wallMm: null
  },
  "sidewall-semi-trailer": {
    label: "Drop-sidewall trailer",
    family: "sidewall",
    length: { min: 8.5, max: 14.5, default: 12.8 },
    deckMm: { min: 1100, max: 1520, default: 1320 },
    axles: { min: 2, max: 4, default: 3 },
    rearOverhang: { min: 0.8, max: 2.0, default: 1.0 },
    minFrontClearM: 3.4,
    beamDepthMm: 480,
    suspensions: ["mechanical-13", "air-10", "mechanical-16"],
    defaultTractor: "6x4",
    defaultTyre: "12R22.5-152",
    defaultContainer: "none",
    tare: { baseT: 2.3, perMetreT: 0.25, cgFrac: 0.5 },
    payloadT: { min: 1, max: 75, default: 30 },
    wallMm: { min: 400, max: 1200, default: 800 }
  },
  "fence-trailers": {
    label: "High-stake fence trailer",
    family: "fence",
    length: { min: 9.0, max: 14.5, default: 12.8 },
    deckMm: { min: 1100, max: 1520, default: 1320 },
    axles: { min: 2, max: 4, default: 3 },
    rearOverhang: { min: 0.8, max: 2.0, default: 1.0 },
    minFrontClearM: 3.4,
    beamDepthMm: 480,
    suspensions: ["mechanical-13", "air-10", "mechanical-16"],
    defaultTractor: "6x4",
    defaultTyre: "12R22.5-152",
    defaultContainer: "none",
    tare: { baseT: 2.4, perMetreT: 0.28, cgFrac: 0.5 },
    payloadT: { min: 1, max: 75, default: 29 },
    wallMm: { min: 1200, max: 2400, default: 1800 }
  },
  dryvan: {
    label: "Dry Van / enclosed box trailer",
    family: "dryvan",
    length: { min: 8.5, max: 14.5, default: 12.8 },
    deckMm: { min: 1100, max: 1500, default: 1280 },
    axles: { min: 2, max: 4, default: 3 },
    rearOverhang: { min: 0.8, max: 2.0, default: 1.0 },
    minFrontClearM: 3.4,
    beamDepthMm: 450,
    suspensions: ["air-10", "mechanical-13"],
    defaultTractor: "6x4",
    defaultTyre: "12R22.5-152",
    defaultContainer: "none",
    tare: { baseT: 2.6, perMetreT: 0.27, cgFrac: 0.5 },
    payloadT: { min: 1, max: 65, default: 16.8 },
    cargoDensityT: { min: 0.08, max: 0.9, default: 0.22 },
    wallMm: { min: 2000, max: 2700, default: 2450 }
  }
}

export const MODEL_ORDER = Object.keys(MODELS)

export function tyresFor() {
  return TYRES
}

export function tyreFit(tyre) {
  return tyre.fits.includes("wide") ? "wide" : "dual"
}
