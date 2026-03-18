/**
 * Maps product categories (identified in Shot 1) to precise label locations for Shot 2.
 *
 * instruction     — shown to the user as the primary guide
 * secondaryHint   — shown as "Can't find it? Try:" fallback
 * locationHint    — short description used in processing context
 * keywords        — OCR/text strings that match this category
 */

export interface CategoryInfo {
  label: string
  locationHint: string
  instruction: string
  secondaryHint: string
  keywords: string[]
}

const CATEGORY_MAP: Record<string, CategoryInfo> = {

  // ── Vehicles ──────────────────────────────────────────────────────────────
  car: {
    label: 'vehicle',
    locationHint: 'driver door jamb sticker',
    instruction: 'Open the driver\'s door and look at the door frame where it latches (the B-pillar). There\'s always a white sticker there — it has the VIN, manufacture date, and tire info.',
    secondaryHint: 'Look through the windshield at the lower-left corner of the dashboard for the VIN plate.',
    keywords: ['car', 'vehicle', 'automobile', 'truck', 'suv', 'van', 'jeep', 'toyota', 'honda', 'ford', 'chevrolet', 'bmw', 'mercedes', 'tesla', 'audi', 'volkswagen', 'hyundai', 'kia'],
  },

  // ── Computers & Phones ────────────────────────────────────────────────────
  laptop: {
    label: 'laptop',
    locationHint: 'bottom panel sticker',
    instruction: 'Flip it over — there\'s a barcode sticker on the bottom with the serial number, model, and manufacture date. Lay it on a flat surface and snap it straight-on.',
    secondaryHint: 'On a Mac: Apple menu > About This Mac. On Windows: Settings > System > About.',
    keywords: ['laptop', 'notebook', 'macbook', 'thinkpad', 'chromebook', 'ultrabook', 'surface laptop', 'dell laptop', 'hp laptop', 'lenovo'],
  },
  smartphone: {
    label: 'smartphone',
    locationHint: 'back of phone or Settings > About',
    instruction: 'Snap the back of the phone — some models have a printed serial near the SIM tray. If nothing\'s there, go to Settings > General > About (iPhone) or Settings > About Phone (Android) and screenshot it.',
    secondaryHint: 'Remove the SIM card tray — the serial is often engraved inside the SIM slot on iPhones.',
    keywords: ['phone', 'iphone', 'smartphone', 'android', 'pixel', 'galaxy', 'mobile', 'oneplus', 'xiaomi'],
  },
  tablet: {
    label: 'tablet',
    locationHint: 'back panel or Settings > About',
    instruction: 'Snap the back panel — look for a small engraved or printed serial near the charging port or camera. If nothing\'s visible, go to Settings > About.',
    secondaryHint: 'On iPad: the serial is engraved on the SIM tray edge. On Surface: flip over and look under the kickstand.',
    keywords: ['tablet', 'ipad', 'surface', 'kindle', 'fire tablet', 'galaxy tab'],
  },

  // ── Televisions & Displays ────────────────────────────────────────────────
  television: {
    label: 'TV / smart TV',
    locationHint: 'back panel center sticker',
    instruction: 'Look at the back of the TV — there\'s a white label in the center or lower section, near the HDMI ports. It has the model number, serial, and manufacture date.',
    secondaryHint: 'On the TV itself: Settings > Support > About This TV (Samsung/LG) or Settings > System > About (Roku/Fire TV).',
    keywords: ['tv', 'television', 'smart tv', 'oled', 'qled', 'monitor', 'display', 'flatscreen', 'samsung tv', 'lg tv', 'sony tv'],
  },

  // ── Kitchen Appliances ────────────────────────────────────────────────────
  refrigerator: {
    label: 'refrigerator',
    locationHint: 'inside upper-left wall of fridge compartment',
    instruction: 'Open the refrigerator door. Look at the upper LEFT side wall — there\'s always a white sticker with the model, serial, and manufacture date. It\'s usually near or above the top shelf.',
    secondaryHint: 'If not there: pull out the bottom kick plate (the trim strip at floor level) — some models put the sticker behind it.',
    keywords: ['refrigerator', 'fridge', 'freezer', 'refrigeration', 'samsung fridge', 'lg fridge', 'whirlpool fridge'],
  },
  dishwasher: {
    label: 'dishwasher',
    locationHint: 'inner door edge sticker',
    instruction: 'Open the dishwasher door fully. Look along the TOP EDGE of the door — there\'s a sticker on the inner door frame with model and serial. Sometimes it\'s on the left or right side of the door opening.',
    secondaryHint: 'If not on the door edge: look at the side panel inside the tub, about halfway up.',
    keywords: ['dishwasher', 'dish washer', 'bosch dishwasher', 'whirlpool dishwasher'],
  },
  oven: {
    label: 'oven / range / stove',
    locationHint: 'inner door frame sticker',
    instruction: 'Open the oven door fully. Look at the frame around the oven opening — there\'s a sticker on the left side of the door frame with the model number, serial, and manufacture date.',
    secondaryHint: 'If not on the door frame: pull out the bottom storage drawer below the oven and look on the front frame.',
    keywords: ['oven', 'stove', 'range', 'cooktop', 'gas range', 'electric range', 'double oven', 'broiler'],
  },
  microwave: {
    label: 'microwave',
    locationHint: 'inside door frame sticker',
    instruction: 'Open the microwave door and look at the inner frame — usually the LEFT side or TOP of the door opening has a sticker with the model and serial.',
    secondaryHint: 'If nothing inside: pull the microwave out slightly and look at the back panel — there\'s always a sticker there.',
    keywords: ['microwave', 'microwave oven', 'over-the-range', 'countertop microwave'],
  },
  coffee_maker: {
    label: 'coffee maker',
    locationHint: 'bottom label',
    instruction: 'Flip it upside down — the label with model and serial is always on the bottom. Lay it on a soft surface and snap it.',
    secondaryHint: 'If the bottom is worn: check the back panel behind the water reservoir.',
    keywords: ['coffee', 'coffee maker', 'espresso', 'keurig', 'nespresso', 'breville', 'drip coffee', 'french press machine'],
  },
  blender: {
    label: 'blender / small appliance',
    locationHint: 'bottom of base',
    instruction: 'Flip the base upside down — the serial and model sticker is always on the bottom.',
    secondaryHint: 'If nothing on the bottom: look on the back of the motor base near the power cord exit.',
    keywords: ['blender', 'vitamix', 'nutribullet', 'ninja blender', 'food processor', 'mixer', 'stand mixer', 'juicer', 'air fryer', 'instant pot', 'pressure cooker', 'slow cooker', 'toaster'],
  },

  // ── Laundry ───────────────────────────────────────────────────────────────
  washer_dryer: {
    label: 'washer / dryer',
    locationHint: 'inside door frame sticker',
    instruction: 'Open the washer or dryer door. Look at the rim of the door opening (the tub frame) — the sticker with model, serial, and manufacture date is on the inside of the door opening, usually at the top or left side.',
    secondaryHint: 'If not visible: look on the back panel near the water connections (washer) or the back upper panel (dryer).',
    keywords: ['washer', 'dryer', 'washing machine', 'laundry', 'front load', 'top load', 'lg washer', 'samsung washer', 'whirlpool washer'],
  },

  // ── HVAC & Climate ────────────────────────────────────────────────────────
  hvac: {
    label: 'HVAC / air conditioner / heater',
    locationHint: 'side panel or inside access panel',
    instruction: 'For a central HVAC unit: look on the side panel of the outdoor condenser unit — there\'s a metal data plate with model and serial. For a window AC: look at the back or side panel.',
    secondaryHint: 'For furnaces or air handlers: open the front access panel — the label is inside on the right or left wall.',
    keywords: ['air conditioner', 'ac unit', 'hvac', 'furnace', 'heater', 'heat pump', 'boiler', 'window ac', 'portable ac', 'mini split', 'carrier', 'trane', 'lennox'],
  },

  // ── Electronics & Gaming ──────────────────────────────────────────────────
  gaming_console: {
    label: 'gaming console',
    locationHint: 'back or bottom label',
    instruction: 'Flip the console or look at the back — there\'s a label near the vents with the serial number. For PS5: the serial sticker is on the back lower section. For Xbox: bottom of the console. For Switch: back of the tablet unit.',
    secondaryHint: 'On PS5/Xbox: Settings > System > Console Info shows serial and model.',
    keywords: ['playstation', 'xbox', 'nintendo', 'ps5', 'ps4', 'console', 'switch', 'gaming'],
  },
  headphones: {
    label: 'headphones / earbuds',
    locationHint: 'inside earcup or charging case',
    instruction: 'Look inside one of the earcups — there\'s usually a small label or engraving with the model and serial. For earbuds: look inside the charging case lid.',
    secondaryHint: 'If nothing inside: look on the headband where it adjusts — some models engrave it there.',
    keywords: ['headphones', 'earbuds', 'airpods', 'headset', 'earphones', 'bose', 'sony headphones', 'beats', 'sennheiser'],
  },
  smartwatch: {
    label: 'smart watch',
    locationHint: 'back of watch case',
    instruction: 'Remove the band (or look around the band lugs) and snap the back of the watch case — the serial is engraved there, usually in very small text.',
    secondaryHint: 'On Apple Watch: Settings > General > About. On Garmin: Settings > About.',
    keywords: ['watch', 'smartwatch', 'apple watch', 'garmin', 'fitbit', 'galaxy watch', 'fossil', 'whoop'],
  },

  // ── Imaging & Electronics ─────────────────────────────────────────────────
  camera: {
    label: 'camera',
    locationHint: 'bottom or battery compartment',
    instruction: 'Open the battery compartment — the serial label is inside, either on the camera body inside the compartment or on the battery door itself.',
    secondaryHint: 'The serial may also be on the bottom of the camera body. On DSLR/mirrorless: Menu > Setup > Camera Info.',
    keywords: ['camera', 'dslr', 'mirrorless', 'canon', 'nikon', 'sony camera', 'fujifilm', 'gopro', 'action camera'],
  },
  printer: {
    label: 'printer / scanner',
    locationHint: 'inside cartridge door or back panel',
    instruction: 'Open the ink/toner cartridge door — the serial label is inside, usually on the right or bottom interior wall. Snap it with the door open.',
    secondaryHint: 'If not inside: look at the back panel or pull out the paper tray and look inside that opening.',
    keywords: ['printer', 'scanner', 'hp printer', 'canon printer', 'epson', 'brother printer', 'laser printer', 'inkjet'],
  },
  router: {
    label: 'router / modem',
    locationHint: 'bottom sticker',
    instruction: 'Flip it over — the bottom sticker has the model, serial, default WiFi credentials, and manufacture date all in one place.',
    secondaryHint: 'If the label is worn: log into the router admin panel (usually 192.168.1.1) and go to System Info.',
    keywords: ['router', 'modem', 'wifi', 'wi-fi', 'gateway', 'netgear', 'asus router', 'linksys', 'eero', 'orbi', 'google wifi'],
  },

  // ── Power & Tools ─────────────────────────────────────────────────────────
  power_tool: {
    label: 'power tool',
    locationHint: 'side label near handle or battery pack',
    instruction: 'Look on the side of the tool body near the handle — there\'s a sticker or embossed label with the model. If it has a battery pack, the serial is often on the battery itself.',
    secondaryHint: 'On cordless tools: remove the battery and look at the slot interior for the serial plate.',
    keywords: ['drill', 'saw', 'power tool', 'sander', 'grinder', 'dewalt', 'makita', 'milwaukee', 'ryobi', 'bosch tools'],
  },

  // ── Home & Cleaning ───────────────────────────────────────────────────────
  vacuum: {
    label: 'vacuum cleaner',
    locationHint: 'bottom or handle base label',
    instruction: 'Flip it over — there\'s a label on the underside of the base or bottom of the canister. For stick/upright vacuums: look at the base of the handle where it meets the body.',
    secondaryHint: 'For robot vacuums (Roomba etc): flip over and look at the underside — serial is on a sticker near the brushes.',
    keywords: ['vacuum', 'vacuum cleaner', 'dyson', 'roomba', 'hoover', 'shark vacuum', 'bissell', 'miele'],
  },

  // ── Mobility & Recreation ─────────────────────────────────────────────────
  drone: {
    label: 'drone',
    locationHint: 'underside or battery compartment',
    instruction: 'Flip the drone over — there\'s a sticker on the underside with the serial. Also check inside the battery compartment.',
    secondaryHint: 'In the DJI Fly/Go app: tap the drone name in the top bar > View Device Info.',
    keywords: ['drone', 'dji', 'quadcopter', 'fpv', 'phantom', 'mavic', 'mini drone'],
  },
  ebike: {
    label: 'e-bike / scooter',
    locationHint: 'frame sticker near battery',
    instruction: 'Look on the down tube (the diagonal frame tube near the pedals) or the seat tube — there\'s a sticker or engraved serial near the battery mount. On scooters: look under the deck.',
    secondaryHint: 'The serial may also be stamped into the bottom bracket area where the pedals attach.',
    keywords: ['bike', 'bicycle', 'e-bike', 'scooter', 'electric bike', 'ebike', 'rad power', 'vanmoof'],
  },
  fitness_tracker: {
    label: 'fitness tracker',
    locationHint: 'back of device or charging contacts area',
    instruction: 'Look at the back of the tracker — the serial is engraved or on a tiny sticker near the charging contacts or heart rate sensor.',
    secondaryHint: 'In the companion app: Device > About or tap the device name > Serial Number.',
    keywords: ['fitness', 'fitness tracker', 'band', 'whoop', 'oura', 'fitbit'],
  },

  // ── Document types ────────────────────────────────────────────────────────
  warranty_card: {
    label: 'warranty card',
    locationHint: 'full front of warranty card',
    instruction: 'Lay the warranty card flat on a solid surface. Make sure all four corners are in frame and the text is sharp.',
    secondaryHint: 'If the card is glossy and getting glare: tilt the angle slightly or use indirect lighting.',
    keywords: ['warranty', 'warranty card', 'guarantee', 'registration', 'limited warranty'],
  },
  receipt: {
    label: 'receipt',
    locationHint: 'full receipt, kept flat',
    instruction: 'Lay the receipt flat and snap the entire thing — keep all the text in frame. If it\'s a long receipt, scroll or take two overlapping shots.',
    secondaryHint: 'Thermal receipts fade fast — scan it soon. If it\'s digital, screenshot the email instead.',
    keywords: ['receipt', 'invoice', 'purchase', 'order', 'total', 'subtotal', 'tax'],
  },
}

/**
 * Find the best CategoryInfo match from a category hint string.
 * Uses whole-word matching (\b boundaries) to avoid false positives —
 * e.g. "van" must not match "advance" or "advantage".
 */
export function getCategoryInfo(categoryHint: string): CategoryInfo | null {
  const lower = categoryHint.toLowerCase()

  // Direct key match first
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower]

  // Whole-word keyword search — requires the keyword to appear as a standalone word
  for (const info of Object.values(CATEGORY_MAP)) {
    if (info.keywords.some((kw) => {
      try {
        return new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower)
      } catch {
        return lower.includes(kw) // fallback for any regex edge case
      }
    })) return info
  }

  return null
}

/** Default guidance when category is unknown */
export const DEFAULT_GUIDANCE: CategoryInfo = {
  label: 'product',
  locationHint: 'serial/model label',
  instruction: 'Now snap a close-up of the serial number or model label. It\'s usually on the back, bottom, or inside a door/compartment.',
  secondaryHint: 'Try checking the original box or the manufacturer\'s sticker wherever you see a barcode.',
  keywords: [],
}
