// HomeDue — Icon System
// Custom icon family: rounded, minimal, consistent 1.75px stroke, 24x24 viewBox.
// Usage: Icon('house', {size: 24, className: 'icon'})

const ICON_PATHS = {
  // Navigation
  home: '<path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9.5V19a1 1 0 0 0 1 1h4.25v-5.5h2.5V20H17.5a1 1 0 0 0 1-1V9.5"/>',
  grid: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.75"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.75"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.75"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.75"/>',
  people: '<circle cx="8.5" cy="8" r="3"/><path d="M2.5 20v-1.5A4.5 4.5 0 0 1 7 14h3a4.5 4.5 0 0 1 4.5 4.5V20"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2a4 4 0 0 1 4.5 3.95V20"/>',
  folder: '<path d="M3.5 7.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2.25h8a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 17z"/>',
  gear: '<circle cx="12" cy="12" r="3.25"/><path d="M12 2.75v2.6M12 18.65v2.6M4.83 4.83l1.84 1.84M17.33 17.33l1.84 1.84M2.75 12h2.6M18.65 12h2.6M4.83 19.17l1.84-1.84M17.33 6.67l1.84-1.84"/>',

  // Task categories
  hvac: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5M6.2 6.2l3.5 3.5M14.3 14.3l3.5 3.5M6.2 17.8l3.5-3.5M14.3 9.7l3.5-3.5"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 1 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.3-.5-.5-2.3z"/>',
  bolt: '<path d="M12.5 2.5 5 13h5.5L10 21.5 19 10h-5.5z"/>',
  roof: '<path d="M3 12.5 12 4l9 8.5"/><path d="M5.5 11v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8"/><path d="M9.5 20v-5.5h5V20"/>',
  paint: '<path d="M7 3.5h9a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H10v3.2a2.3 2.3 0 1 1-3 0V9.5H5.5A1.5 1.5 0 0 1 4 8V5A1.5 1.5 0 0 1 5.5 3.5z"/>',
  leaf: '<path d="M20 4.5c-9 0-15.5 6.5-15.5 15.5C13.5 20 20 13.5 20 4.5z"/><path d="M8 16 15 9"/>',
  leaves: '<path d="M12 20c-4.5-1-7-4.5-6-9.5C7.8 8 11 6.5 13.5 7c1.8 3 1.3 6.7-1.5 9.5z"/><path d="M12 20c3.8-1.3 5.7-4.3 5-8.3-1.4-2-4-3.2-6.1-2.7"/><path d="M12 20V11"/>',
  snowflake: '<path d="M12 2.5v19M4.3 6.75l15.4 10.5M19.7 6.75 4.3 17.25"/><path d="M9 4.3 12 6l3-1.7M9 19.7 12 18l3 1.7M4.7 10 6 12l-1.3 2M19.3 10 18 12l1.3 2"/>',
  droplet: '<path d="M12 3s6.5 7.2 6.5 11.5a6.5 6.5 0 1 1-13 0C5.5 10.2 12 3 12 3z"/>',
  shield: '<path d="M12 3 19.5 6v6c0 5-3.5 8-7.5 9-4-1-7.5-4-7.5-9V6z"/>',
  siren: '<path d="M12 3.5a5.5 5.5 0 0 0-5.5 5.5V17h11V9a5.5 5.5 0 0 0-5.5-5.5z"/><path d="M4.5 17h15M12 3.5V2M8.5 20.5h7"/>',
  brick: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 10h18M3 16h18M9 4v6M15 10v6M9 16v4"/>',
  washer: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><circle cx="12" cy="13" r="5.5"/><path d="M9.2 13a2.8 2.8 0 0 1 5.6 0"/><path d="M7.5 6.5h2M12.5 6.5h4"/>',
  flower: '<circle cx="12" cy="12" r="2.3"/><path d="M12 9.2a2.6 2.6 0 1 1 0-5 2.6 2.6 0 0 1 0 5zM12 19.8a2.6 2.6 0 1 1 0-5 2.6 2.6 0 0 1 0 5zM9.2 12a2.6 2.6 0 1 1-5 0 2.6 2.6 0 0 1 5 0zM19.8 12a2.6 2.6 0 1 1-5 0 2.6 2.6 0 0 1 5 0z"/>',

  // Actions / detail
  checklist: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8.2 9.5 9.7 12.5 6.7M8 15.2h8M8 17.7h5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>',
  bell: '<path d="M6.5 16V10a5.5 5.5 0 0 1 11 0v6l1.5 2.2H5z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/><path d="M4.2 8.5 3.5 5l3.4.9"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z"/><circle cx="12" cy="13" r="3.3"/>',
  receipt: '<path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5z"/><path d="M9 7.5h6M9 11h6M9 14.5h4"/>',
  hardhat: '<path d="M4.5 15.5a7.5 7.5 0 0 1 15 0z"/><path d="M2.5 15.5h19"/><path d="M12 6.5V4"/>',
  tools: '<path d="M9.5 3.5 6 7l2.2 2.2M14.5 20.5 18 17l-2.2-2.2"/><path d="M4.3 19.7 10 14M14 10l5.7-5.7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3 20 20"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M20 20H4"/>',
  pulse: '<path d="M3.5 12h3.2l2-4.5 3 9L14 9l1.8 3h4.7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  phone: '<path d="M6.6 4h3l1.4 5-2.3 1.6a12.5 12.5 0 0 0 5.7 5.7l1.6-2.3 5 1.4v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 6.2 2 2 0 0 1 6.6 4z"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.7-7.94A5.5 5.5 0 0 1 17 9.5 4 4 0 0 1 17.5 18z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12 18.5 4.5M16 7l2 2M13.5 9.5l2 2"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5V5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8l1.8-1.8M18 6l1.8-1.8"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M4.2 12h4M15.8 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M17.7 6.3l-2.5 2.5M8.8 15.2l-2.5 2.5"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  house2: '<path d="M12 3 3.5 10.5V20a1 1 0 0 0 1 1h5v-6.5h5V21h5a1 1 0 0 0 1-1v-9.5z"/>',
  layers: '<path d="M12 3.5 20.5 8 12 12.5 3.5 8z"/><path d="M3.5 12 12 16.5 20.5 12M3.5 16l8.5 4.5L20.5 16"/>',
};

function Icon(name, opts = {}) {
  const size = opts.size || 22;
  const cls = opts.className || '';
  const strokeWidth = opts.strokeWidth || 1.75;
  const path = ICON_PATHS[name] || ICON_PATHS.checklist;
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

// Category → icon name mapping (replaces emoji CATEGORY_ICONS)
const CATEGORY_ICON_NAMES = {
  'HVAC': 'hvac',
  'Plumbing': 'droplet',
  'Electrical': 'bolt',
  'Roof & Gutters': 'roof',
  'Exterior': 'paint',
  'Interior': 'home',
  'Lawn & Yard': 'leaf',
  'Seasonal - Spring': 'flower',
  'Seasonal - Fall': 'leaves',
  'Seasonal - Winter': 'snowflake',
  'Appliances': 'washer',
  'Safety & Security': 'shield',
  'Foundation & Structure': 'brick'
};

function CategoryIcon(category, opts = {}) {
  return Icon(CATEGORY_ICON_NAMES[category] || 'checklist', opts);
}