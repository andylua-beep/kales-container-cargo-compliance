chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get("kales_cargo_presets")
  if (!existing.kales_cargo_presets) {
    await chrome.storage.local.set({
      kales_cargo_presets: [
        {
          name: "40ft Flatbed Semi-Trailer (3-Axle, 35.5T Payload, 40HQ Export Stack)",
          model: "flatbed-semi-trailer",
          axles: 3,
          payload: 35.5
        }
      ]
    })
  }
})
