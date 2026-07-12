#!/usr/bin/env node
/**
 * HomeKeeper — Database Seed Script
 * Generates homekeeping.db with 159 home maintenance tasks
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'www', 'data', 'homekeeping.db');

// Ensure www/data exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Remove old DB
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE categories (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL UNIQUE,
    icon      TEXT    NOT NULL DEFAULT '📋',
    color     TEXT    NOT NULL DEFAULT '#6366f1',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE tasks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id     INTEGER NOT NULL,
    title           TEXT    NOT NULL,
    description     TEXT,
    frequency       TEXT    NOT NULL DEFAULT 'yearly'
                    CHECK (frequency IN ('monthly','quarterly','biyearly','yearly','seasonal','as_needed')),
    frequency_value INTEGER,
    season          TEXT
                    CHECK (season IS NULL OR season IN ('spring','summer','fall','winter')),
    difficulty      TEXT    NOT NULL DEFAULT 'easy'
                    CHECK (difficulty IN ('easy','moderate','hard')),
    est_minutes     INTEGER DEFAULT 30,
    priority        TEXT    NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','critical')),
    skills_required TEXT,
    tools_needed    TEXT,
    safety_tips     TEXT,
    pro_recommended INTEGER DEFAULT 0,
    created_at      TEXT    DEFAULT (datetime('now')),
    updated_at      TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE task_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     INTEGER NOT NULL,
    completed_at TEXT   DEFAULT (datetime('now')),
    notes       TEXT,
    cost_incurred REAL DEFAULT 0,
    pro_hired   INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE INDEX idx_tasks_category ON tasks(category_id);
  CREATE INDEX idx_tasks_frequency ON tasks(frequency);
  CREATE INDEX idx_task_log_task ON task_log(task_id);
  CREATE INDEX idx_task_log_date ON task_log(completed_at);
`);

// ─── Categories ────────────────────────────────────────────────────
const categories = [
  { name: 'HVAC',              icon: '❄️',  color: '#3b82f6', sort: 1 },
  { name: 'Plumbing',          icon: '🔧',  color: '#06b6d4', sort: 2 },
  { name: 'Electrical',        icon: '⚡',  color: '#f59e0b', sort: 3 },
  { name: 'Kitchen',           icon: '🍳',  color: '#ef4444', sort: 4 },
  { name: 'Bathroom',          icon: '🛁',  color: '#8b5cf6', sort: 5 },
  { name: 'Laundry & Utilities', icon: '🧺', color: '#14b8a6', sort: 6 },
  { name: 'Roof & Gutters',    icon: '🏠',  color: '#78716c', sort: 7 },
  { name: 'Exterior — Siding & Paint', icon: '🎨', color: '#f97316', sort: 8 },
  { name: 'Deck, Patio & Porch', icon: '🪑', color: '#a8a29e', sort: 9 },
  { name: 'Driveway & Walkways', icon: '🛣️', color: '#64748b', sort: 10 },
  { name: 'Fence & Gates',     icon: '🚧',  color: '#92400e', sort: 11 },
  { name: 'Lawn & Garden',     icon: '🌱',  color: '#22c55e', sort: 12 },
  { name: 'Trees & Shrubs',    icon: '🌳',  color: '#16a34a', sort: 13 },
  { name: 'Pest Control',      icon: '🐜',  color: '#dc2626', sort: 14 },
  { name: 'Floors & Surfacing', icon: '🧹', color: '#d97706', sort: 15 },
  { name: 'Walls & Ceilings',  icon: '🧱',  color: '#a1a1aa', sort: 16 },
  { name: 'Windows & Doors',   icon: '🪟',  color: '#0ea5e9', sort: 17 },
  { name: 'Basement & Attic',  icon: '⬇️',  color: '#57534e', sort: 18 },
  { name: 'Safety & Security', icon: '🔒',  color: '#dc2626', sort: 19 },
  { name: 'Seasonal Prep',     icon: '📅',  color: '#7c3aed', sort: 20 },
];

const catStmt = db.prepare(
  'INSERT INTO categories (name, icon, color, sort_order) VALUES (@name, @icon, @color, @sort)'
);
for (const c of categories) catStmt.run(c);

// ─── Tasks (159 total) ─────────────────────────────────────────────
const tasks = [
  // ===== HVAC (8) =====
  { cat: 'HVAC', title: 'Replace HVAC air filter', desc: 'Replace disposable filter or clean reusable filter. Check monthly during peak seasons.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'high', skills: null, tools: 'Replacement filter', safety: 'Turn system off before accessing filter', pro: 0 },
  { cat: 'HVAC', title: 'Clean AC condenser coils', desc: 'Remove debris and gently spray coils with a hose. Straighten bent fins with a fin comb.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 60, pri: 'high', skills: null, tools: 'Fin comb, garden hose, coil cleaner', safety: 'Disconnect power to unit before cleaning', pro: 0 },
  { cat: 'HVAC', title: 'Schedule annual HVAC professional inspection', desc: 'Have a licensed tech inspect refrigerant levels, electrical connections, and overall system health.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 120, pri: 'critical', skills: null, tools: null, safety: null, pro: 1 },
  { cat: 'HVAC', title: 'Clean evaporator drain line', desc: 'Flush drain line with vinegar or bleach solution to prevent algae buildup and clogs.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 20, pri: 'medium', skills: null, tools: 'Wet/dry vac, vinegar, funnel', safety: null, pro: 0 },
  { cat: 'HVAC', title: 'Test thermostat calibration', desc: 'Compare thermostat reading to a separate thermometer. Replace batteries if low.', freq: 'biyearly', fv: 2, season: null, diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Thermometer, replacement batteries', safety: null, pro: 0 },
  { cat: 'HVAC', title: 'Inspect ductwork for leaks', desc: 'Look for disconnected or crushed ducts in attic and basement. Seal with mastic or foil tape.', freq: 'biyearly', fv: 2, season: null, diff: 'moderate', mins: 60, pri: 'medium', skills: null, tools: 'Foil tape, mastic sealant, flashlight', safety: 'Wear mask if handling fiberglass ducts', pro: 0 },
  { cat: 'HVAC', title: 'Clean furnace burner assembly', desc: 'Remove burner cover and brush away soot and debris. Check flame color — should be blue.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 45, pri: 'high', skills: null, tools: 'Wire brush, vacuum, shop light', safety: 'Gas shutoff — if you smell gas, call a pro immediately', pro: 0 },
  { cat: 'HVAC', title: 'Lubricate HVAC motor bearings', desc: 'Apply a few drops of electric motor oil to blower and fan motor bearings. Do not over-oil.', freq: 'yearly', fv: 1, season: 'fall', diff: 'easy', mins: 15, pri: 'low', skills: null, tools: 'Electric motor oil (SAE 20)', safety: 'Disconnect power first', pro: 0 },

  // ===== Plumbing (10) =====
  { cat: 'Plumbing', title: 'Test all shutoff valves', desc: 'Turn each valve under sinks, behind toilets, and at the main shutoff. Ensure they turn freely and don\'t leak when reopened.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 30, pri: 'high', skills: null, tools: 'Bucket, towel', safety: 'Be prepared if valve breaks — have main shutoff accessible', pro: 0 },
  { cat: 'Plumbing', title: 'Flush water heater (sediment removal)', desc: 'Attach garden hose to drain valve, run to floor drain or outside, open valve until water runs clear.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 60, pri: 'high', skills: null, tools: 'Garden hose, bucket, screwdriver', safety: 'Water may be very hot — let cool 2 hours first', pro: 0 },
  { cat: 'Plumbing', title: 'Inspect & replace water heater anode rod', desc: 'Check sacrificial anode rod for corrosion. Replace if more than 50% consumed. Extends water heater life.', freq: 'yearly', fv: 1, season: 'spring', diff: 'hard', mins: 90, pri: 'medium', skills: 'Basic wrench work', tools: '1-1/16" socket, breaker bar, Teflon tape', safety: 'Turn off gas/breaker and let water cool before starting', pro: 0 },
  { cat: 'Plumbing', title: 'Clean faucet aerators & showerheads', desc: 'Unscrew aerators and showerheads, soak in vinegar overnight, scrub with toothbrush to remove mineral deposits.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 20, pri: 'low', skills: null, tools: 'White vinegar, toothbrush, pliers (with tape)', safety: null, pro: 0 },
  { cat: 'Plumbing', title: 'Check under-sink cabinet for leaks', desc: 'Place paper towels under all connections. Run water and check for any dampness. Tighten slip nuts if needed.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'medium', skills: null, tools: 'Flashlight, paper towels', safety: null, pro: 0 },
  { cat: 'Plumbing', title: 'Snap slow drains', desc: 'Use a drain snake or zip-it tool on bathroom and kitchen sinks that drain slowly. Avoid chemical drain cleaners.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Drain snake or zip-it tool', safety: 'Wear gloves', pro: 0 },
  { cat: 'Plumbing', title: 'Test toilet flapper & fill valve', desc: 'Check for silent leaks with food coloring in tank. Replace flapper if water seeps into bowl. Adjust fill valve water level.', freq: 'biyearly', fv: 2, season: null, diff: 'easy', mins: 20, pri: 'medium', skills: null, tools: 'Food coloring, replacement flapper', safety: null, pro: 0 },
  { cat: 'Plumbing', title: 'Insulate exposed pipes', desc: 'Wrap foam insulation around pipes in unheated areas — crawlspace, garage, exterior walls — to prevent freezing.', freq: 'yearly', fv: 1, season: 'fall', diff: 'easy', mins: 60, pri: 'high', skills: null, tools: 'Foam pipe insulation, duct tape', safety: null, pro: 0 },
  { cat: 'Plumbing', title: 'Test sump pump', desc: 'Pour a few gallons of water into the sump pit to verify pump activates and discharges properly. Clean intake screen.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 15, pri: 'critical', skills: null, tools: 'Buckets of water', safety: 'Unplug pump before cleaning intake', pro: 0 },
  { cat: 'Plumbing', title: 'Check exterior spigots for freeze damage', desc: 'Turn on outdoor faucets and check for drips from the handle or spout after winter. Replace vacuum breaker if cracked.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Replacement vacuum breaker', safety: null, pro: 0 },

  // ===== Electrical (8) =====
  { cat: 'Electrical', title: 'Test all GFCI outlets', desc: 'Press TEST button — outlet should cut power. Press RESET to restore. Test every GFCI in kitchen, bath, garage, and exterior.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'critical', skills: null, tools: 'Plug-in nightlight or tester', safety: null, pro: 0 },
  { cat: 'Electrical', title: 'Check & reset circuit breakers', desc: 'Flip each breaker off and on to exercise the mechanism. Label any unidentified breakers in the panel.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 30, pri: 'medium', skills: null, tools: 'Flashlight, label maker', safety: 'Never remove panel cover — high voltage behind it', pro: 0 },
  { cat: 'Electrical', title: 'Replace smoke/CO detector batteries', desc: 'Replace batteries in all smoke and carbon monoxide detectors. Vacuum dust from vents.', freq: 'biyearly', fv: 2, season: null, diff: 'easy', mins: 20, pri: 'critical', skills: null, tools: '9V batteries, AA batteries, vacuum with brush', safety: null, pro: 0 },
  { cat: 'Electrical', title: 'Replace smoke detectors (10-year)', desc: 'Smoke detectors expire after 10 years. Check manufacture date and replace entire unit if expired.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 30, pri: 'high', skills: null, tools: 'New smoke detectors, screwdriver', safety: null, pro: 0 },
  { cat: 'Electrical', title: 'Tighten loose outlet & switch plates', desc: 'Check each outlet and switch for loose cover plates or wobbly receptacles. Tighten screws — do not overtighten (cracks plates).', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 20, pri: 'low', skills: null, tools: 'Flathead & Phillips screwdrivers', safety: null, pro: 0 },
  { cat: 'Electrical', title: 'Inspect extension cords & power strips', desc: 'Check for frayed wires, cracked plugs, or hot cords. Discard damaged ones — never repair with electrical tape.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 10, pri: 'high', skills: null, tools: null, safety: 'Do not daisy-chain power strips', pro: 0 },
  { cat: 'Electrical', title: 'Test arc-fault circuit interrupters (AFCIs)', desc: 'Press TEST button on AFCI breakers. They should trip immediately. If not, replace breaker.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 15, pri: 'high', skills: null, tools: null, safety: 'If breaker doesn\'t trip on test, call electrician', pro: 0 },
  { cat: 'Electrical', title: 'Clean light fixture globes & LEDs', desc: 'Remove glass globes, wash in warm soapy water, dry completely before reattaching. Dust exposed bulbs.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 30, pri: 'low', skills: null, tools: 'Step stool, microfiber cloth, mild soap', safety: 'Ensure bulbs are cool before touching', pro: 0 },

  // ===== Kitchen (8) =====
  { cat: 'Kitchen', title: 'Clean refrigerator condenser coils', desc: 'Pull fridge out and vacuum or brush dust from coils. Improves efficiency and extends appliance life.', freq: 'biyearly', fv: 2, season: null, diff: 'moderate', mins: 30, pri: 'high', skills: null, tools: 'Coil brush, vacuum with crevice tool', safety: 'Unplug fridge first', pro: 0 },
  { cat: 'Kitchen', title: 'Replace refrigerator water filter', desc: 'Locate filter (inside fridge or behind front grille). Follow manufacturer replacement schedule (typically 6 months).', freq: 'biyearly', fv: 2, season: null, diff: 'easy', mins: 10, pri: 'medium', skills: null, tools: 'Replacement filter', safety: 'Run 2 gallons through new filter before drinking', pro: 0 },
  { cat: 'Kitchen', title: 'Clean dishwasher filter & spray arms', desc: 'Remove lower rack, unscrew filter assembly, rinse debris from screen. Clear spray arm holes with toothpick.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Toothpick, sponge', safety: null, pro: 0 },
  { cat: 'Kitchen', title: 'Run dishwasher cleaning cycle', desc: 'Use commercial dishwasher cleaner or place a bowl of white vinegar on top rack and run hot cycle.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 5, pri: 'low', skills: null, tools: 'Dishwasher cleaner or white vinegar', safety: null, pro: 0 },
  { cat: 'Kitchen', title: 'Clean range hood filter', desc: 'Remove metal grease filter and soak in hot water with degreasing dish soap. Scrub and rinse thoroughly.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 20, pri: 'medium', skills: null, tools: 'Degreasing soap, scrub brush', safety: null, pro: 0 },
  { cat: 'Kitchen', title: 'Check oven door seal', desc: 'Close oven door on a piece of paper — if it pulls out easily, the gasket needs replacement. Check for gaps or tears.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'low', skills: null, tools: 'Piece of paper', safety: null, pro: 0 },
  { cat: 'Kitchen', title: 'Deep clean garbage disposal', desc: 'Grind ice cubes and lemon peels to clean blades. Flush with baking soda and vinegar. Check splash guard for mold.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'low', skills: null, tools: 'Ice, lemon, baking soda, vinegar', safety: 'Never put hands inside disposal — use tongs or brush', pro: 0 },
  { cat: 'Kitchen', title: 'Calibrate oven temperature', desc: 'Place oven thermometer in center of oven. Compare to set temp. Adjust calibration dial or use digital offset if available.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 30, pri: 'low', skills: null, tools: 'Oven thermometer', safety: null, pro: 0 },

  // ===== Bathroom (8) =====
  { cat: 'Bathroom', title: 'Clean and re-caulk shower/tub', desc: 'Remove old caulk with a caulk remover tool. Dry completely, apply fresh silicone caulk, and smooth with a wet finger.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 60, pri: 'high', skills: null, tools: 'Caulk gun, silicone caulk, caulk remover tool, utility knife', safety: 'Ensure good ventilation', pro: 0 },
  { cat: 'Bathroom', title: 'Deep clean grout lines', desc: 'Scrub grout with baking soda paste and stiff brush. Apply grout sealer after cleaning and drying.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 90, pri: 'medium', skills: null, tools: 'Grout brush, baking soda, hydrogen peroxide, grout sealer', safety: 'Wear gloves and mask when using grout cleaner', pro: 0 },
  { cat: 'Bathroom', title: 'Check exhaust fan function', desc: 'Turn on fan and hold a tissue up to the grille — it should hold the tissue. Clean fan blades and grille if weak.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Vacuum, screwdriver', safety: null, pro: 0 },
  { cat: 'Bathroom', title: 'Inspect toilet wax ring', desc: 'Check for water stains or odor around toilet base. If wax ring is compromised, remove toilet and replace the ring.', freq: 'yearly', fv: 1, season: null, diff: 'hard', mins: 60, pri: 'high', skills: 'Toilet removal experience', tools: 'New wax ring, wrench, putty knife', safety: 'Turn off water valve and flush before removing', pro: 0 },
  { cat: 'Bathroom', title: 'Clean & reseal bathroom mirror', desc: 'Check mirror edges for blackening (moisture damage). Clean thoroughly and apply mirror edge sealer if needed.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 20, pri: 'low', skills: null, tools: 'Mirror edge sealer, microfiber cloth', safety: null, pro: 0 },
  { cat: 'Bathroom', title: 'Replace worn toilet seat', desc: 'Check for cracks, stains, or wobbling. Unscrew hinges and replace with a new seat. Tighten evenly.', freq: 'as_needed', fv: null, season: null, diff: 'easy', mins: 15, pri: 'low', skills: null, tools: 'New toilet seat, screwdriver, adjustable wrench', safety: null, pro: 0 },
  { cat: 'Bathroom', title: 'Clean shower door tracks', desc: 'Use vinegar and baking soda paste to scrub track channels. Rinse thoroughly. Lubricate rollers if stuck.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 20, pri: 'low', skills: null, tools: 'Vinegar, baking soda, toothbrush', safety: null, pro: 0 },
  { cat: 'Bathroom', title: 'Test bathroom GFCI outlet', desc: 'Press TEST button — should kill power. Press RESET. Important — bathrooms are high-moisture zones.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 5, pri: 'critical', skills: null, tools: null, safety: null, pro: 0 },

  // ===== Laundry & Utilities (8) =====
  { cat: 'Laundry & Utilities', title: 'Clean dryer lint trap & vent hose', desc: 'Remove lint from trap after every load. Annually, disconnect vent hose and vacuum lint buildup from inside the wall.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 45, pri: 'critical', skills: null, tools: 'Vent brush kit, vacuum', safety: 'Lint buildup is a leading cause of house fires — do not skip', pro: 0 },
  { cat: 'Laundry & Utilities', title: 'Clean washing machine drum', desc: 'Run an empty hot cycle with washing machine cleaner or 2 cups of white vinegar. Wipe rubber gasket dry.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 5, pri: 'medium', skills: null, tools: 'Washing machine cleaner or vinegar', safety: null, pro: 0 },
  { cat: 'Laundry & Utilities', title: 'Check washing machine hoses', desc: 'Inspect rubber fill hoses for bulging, cracking, or rust at connections. Replace braided steel hoses every 5 years.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'high', skills: null, tools: 'Flashlight', safety: 'Turn off water valves if hoses look compromised', pro: 0 },
  { cat: 'Laundry & Utilities', title: 'Clean water softener brine tank', desc: 'Scoop out old salt and scrub tank walls with mild soap. Refill with fresh salt pellets.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 60, pri: 'medium', skills: null, tools: 'Shop vac, scrub brush, salt pellets', safety: null, pro: 0 },
  { cat: 'Laundry & Utilities', title: 'Replace whole-house water filter', desc: 'Unscrew filter housing, remove old cartridge, clean O-ring with silicone grease, install new cartridge.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Filter wrench, replacement cartridge, silicone grease', safety: 'Turn off water supply and relieve pressure first', pro: 0 },
  { cat: 'Laundry & Utilities', title: 'Inspect gas dryer venting', desc: 'Check gas dryer vent pipe for blockages and secure connections. Metal rigid or flexible duct only — no plastic or foil.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 45, pri: 'high', skills: null, tools: 'Vent brush kit', safety: 'If you smell gas, leave doors open and call utility company', pro: 0 },
  { cat: 'Laundry & Utilities', title: 'Level washing machine', desc: 'Check with bubble level. Adjust front legs up or down until machine doesn\'t rock. Lock nuts tight.', freq: 'as_needed', fv: null, season: null, diff: 'easy', mins: 15, pri: 'low', skills: null, tools: 'Bubble level, adjustable wrench', safety: null, pro: 0 },
  { cat: 'Laundry & Utilities', title: 'Clean utility sink trap', desc: 'Remove trap under utility sink and clear debris. Flush with hot water and reassemble.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 15, pri: 'low', skills: null, tools: 'Bucket, pipe wrench', safety: null, pro: 0 },

  // ===== Roof & Gutters (8) =====
  { cat: 'Roof & Gutters', title: 'Clean gutters & downspouts', desc: 'Remove leaves and debris from gutters. Flush downspouts with hose. Install gutter guards if debris is heavy.', freq: 'biyearly', fv: 2, season: 'fall', diff: 'moderate', mins: 120, pri: 'high', skills: null, tools: 'Gutter scoop, garden hose, trowel, bucket', safety: 'Use stable ladder with standoff — never lean from roof edge', pro: 0 },
  { cat: 'Roof & Gutters', title: 'Inspect roof for damaged shingles', desc: 'Look for curled, cracked, or missing shingles. Check flashing around chimneys, vents, and skylights for gaps.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 60, pri: 'high', skills: null, tools: 'Binoculars, extension ladder', safety: 'Do not walk on steep roofs — inspect from ladder', pro: 0 },
  { cat: 'Roof & Gutters', title: 'Check gutters for proper pitch', desc: 'Pour water into gutter — it should flow toward downspouts. Adjust hangers if water pools.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 45, pri: 'medium', skills: null, tools: 'Bucket of water, level', safety: 'Use stable ladder, have a spotter', pro: 0 },
  { cat: 'Roof & Gutters', title: 'Inspect chimney crown & flashing', desc: 'Look for cracks in mortar crown and gaps in metal flashing. Apply crown sealant or replace flashing as needed.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 30, pri: 'high', skills: null, tools: 'Binoculars, extension ladder', safety: 'Call pro for high chimney work', pro: 0 },
  { cat: 'Roof & Gutters', title: 'Check attic for roof leaks', desc: 'After heavy rain, check attic for water stains, damp insulation, or daylight visible through roof deck.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 20, pri: 'high', skills: null, tools: 'Flashlight', safety: 'Watch your step — stay on attic floor joists', pro: 0 },
  { cat: 'Roof & Gutters', title: 'Install gutter downspout extensions', desc: 'Attach flexible or rigid extensions to carry water 4–6 feet from foundation. Prevents basement seepage.', freq: 'as_needed', fv: null, season: null, diff: 'easy', mins: 30, pri: 'medium', skills: null, tools: 'Downspout extensions, screws, drill', safety: null, pro: 0 },
  { cat: 'Roof & Gutters', title: 'Seal roof vents & boot flashing', desc: 'Apply roofing caulk around plumbing vent boots and turbine vents. Replace cracked rubber gaskets.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 30, pri: 'medium', skills: null, tools: 'Roofing caulk, putty knife', safety: 'Use harness if working on a steep slope', pro: 0 },
  { cat: 'Roof & Gutters', title: 'Check soffit & fascia boards', desc: 'Look for rot, peeling paint, or holes (pest entry). Scrape and paint as needed. Replace rotted sections.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 60, pri: 'medium', skills: null, tools: 'Putty knife, exterior paint, brush', safety: 'Watch for power lines near fascia', pro: 0 },

  // ===== Exterior — Siding & Paint (8) =====
  { cat: 'Exterior — Siding & Paint', title: 'Power wash exterior walls', desc: 'Use a pressure washer (1500-2000 PSI) on low setting to remove dirt, mildew, and cobwebs from siding.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 120, pri: 'medium', skills: null, tools: 'Pressure washer, siding cleaner', safety: 'Wear eye protection, keep spray away from windows & doors', pro: 0 },
  { cat: 'Exterior — Siding & Paint', title: 'Inspect & repair exterior caulking', desc: 'Check caulking around windows, doors, and trim. Remove old cracked caulk and reapply exterior silicone.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 60, pri: 'medium', skills: null, tools: 'Exterior caulk, caulk gun, utility knife', safety: null, pro: 0 },
  { cat: 'Exterior — Siding & Paint', title: 'Scrape & repaint peeling trim', desc: 'Scrape loose paint, sand edges smooth, prime bare wood, and apply exterior paint. Focus on window sills and door frames.', freq: 'as_needed', fv: null, season: 'summer', diff: 'moderate', mins: 180, pri: 'medium', skills: 'Basic painting', tools: 'Paint scraper, sandpaper, primer, exterior paint, brushes', safety: 'Use drop cloths, wear mask when sanding old paint (lead risk)', pro: 0 },
  { cat: 'Exterior — Siding & Paint', title: 'Clean & treat wood siding', desc: 'Wash wood siding with oxygen bleach. Apply wood preservative or stain to protect from moisture and UV.', freq: 'yearly', fv: 1, season: 'summer', diff: 'hard', mins: 240, pri: 'high', skills: null, tools: 'Pressure washer, oxygen bleach, stain/preservative, roller', safety: 'Use respirator, protect plants with plastic sheeting', pro: 0 },
  { cat: 'Exterior — Siding & Paint', title: 'Inspect brick mortar for cracks', desc: 'Check brick joints for crumbling or missing mortar. Use a tuck pointer to remove loose bits before repointing.', freq: 'yearly', fv: 1, season: 'spring', diff: 'hard', mins: 120, pri: 'medium', skills: 'Tuckpointing skills', tools: 'Mortar mix, tuck pointer, hawk, jointer', safety: 'Wear dust mask and safety glasses', pro: 0 },
  { cat: 'Exterior — Siding & Paint', title: 'Replace damaged siding panels', desc: 'Remove and replace cracked vinyl or rotted wood siding pieces. Match siding profile and color.', freq: 'as_needed', fv: null, season: null, diff: 'moderate', mins: 120, pri: 'medium', skills: null, tools: 'Zip tool, hammer, replacement siding, utility knife', safety: null, pro: 0 },
  { cat: 'Exterior — Siding & Paint', title: 'Treat moss & mildew on siding', desc: 'Apply moss-killing solution (bleach/water or commercial) to north-facing walls. Scrub with a long-handled brush.', freq: 'yearly', fv: 1, season: 'summer', diff: 'moderate', mins: 90, pri: 'low', skills: null, tools: 'Long-handled brush, bleach solution or moss killer', safety: 'Wear goggles, protect plants, rinse thoroughly', pro: 0 },
  { cat: 'Exterior — Siding & Paint', title: 'Check house wrap integrity', desc: 'If siding is off for repair, inspect house wrap beneath. Patch tears with house wrap tape. Ensures proper moisture barrier.', freq: 'as_needed', fv: null, season: null, diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'House wrap tape, utility knife', safety: null, pro: 0 },

  // ===== Deck, Patio & Porch (8) =====
  { cat: 'Deck, Patio & Porch', title: 'Clean & seal wood deck', desc: 'Power wash deck, let dry 48 hours, apply water-repellent stain or sealer with roller and brush.', freq: 'yearly', fv: 1, season: 'spring', diff: 'hard', mins: 240, pri: 'high', skills: null, tools: 'Pressure washer, deck cleaner, stain/sealer, roller, brush', safety: 'Wear respirator and gloves when applying sealant', pro: 0 },
  { cat: 'Deck, Patio & Porch', title: 'Inspect deck for loose boards & nails', desc: 'Walk the deck checking for springy, loose, or rotting boards. Hammer down pops nails, replace rotted planks.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 60, pri: 'high', skills: null, tools: 'Hammer, screwdriver, replacement boards, deck screws', safety: 'Check railing stability — kids lean on them', pro: 0 },
  { cat: 'Deck, Patio & Porch', title: 'Check deck railing & balusters', desc: 'Railing should not wobble. Space between balusters should not exceed 4 inches (code). Tighten loose connections.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 30, pri: 'high', skills: null, tools: 'Drill, level, replacement screws', safety: null, pro: 0 },
  { cat: 'Deck, Patio & Porch', title: 'Power wash patio & walkway pavers', desc: 'Remove moss and dirt from concrete or stone pavers. Re-sand joints with polymeric sand after drying.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 120, pri: 'medium', skills: null, tools: 'Pressure washer, polymeric sand, broom', safety: 'Wear boots and eye protection', pro: 0 },
  { cat: 'Deck, Patio & Porch', title: 'Treat concrete patio cracks', desc: 'Clean crack thoroughly, fill with concrete crack filler, smooth with putty knife. Prevents widening and weed growth.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 45, pri: 'medium', skills: null, tools: 'Concrete crack filler, putty knife, wire brush', safety: null, pro: 0 },
  { cat: 'Deck, Patio & Porch', title: 'Oil porch swing hinges & hardware', desc: 'Apply WD-40 or 3-in-1 oil to all moving hardware. Tighten any loose bolts or screws on porch furniture.', freq: 'biyearly', fv: 2, season: 'spring', diff: 'easy', mins: 15, pri: 'low', skills: null, tools: 'Lubricant, screwdriver, wrench', safety: null, pro: 0 },
  { cat: 'Deck, Patio & Porch', title: 'Check deck support posts & footings', desc: 'Inspect under-deck area for rot at post bottoms, frost heave in footings, or loose connection brackets.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 20, pri: 'high', skills: null, tools: 'Flashlight', safety: 'Watch for spiders and snakes in crawlspace', pro: 0 },
  { cat: 'Deck, Patio & Porch', title: 'Replace worn deck boards', desc: 'Identify severely split, cupped, or rotted boards. Pry out old boards, cut new ones to length, and screw in place.', freq: 'as_needed', fv: null, season: null, diff: 'moderate', mins: 120, pri: 'medium', skills: null, tools: 'Crowbar, circular saw, drill, deck screws', safety: 'Wear eye and ear protection when sawing', pro: 0 },

  // ===== Driveway & Walkways (6) =====
  { cat: 'Driveway & Walkways', title: 'Seal asphalt driveway', desc: 'Clean driveway thoroughly, fill cracks with filler, apply sealer with a squeegee in two thin coats.', freq: 'yearly', fv: 1, season: 'summer', diff: 'hard', mins: 240, pri: 'high', skills: null, tools: 'Driveway sealer, squeegee, crack filler, push broom', safety: 'Stay off driveway for 24-48 hours to cure', pro: 0 },
  { cat: 'Driveway & Walkways', title: 'Fill concrete expansion joints', desc: 'Remove old filler from expansion joints. Install foam backer rod, then apply self-leveling sealant.', freq: 'as_needed', fv: null, season: 'summer', diff: 'moderate', mins: 90, pri: 'medium', skills: null, tools: 'Backer rod, self-leveling sealant, caulk gun, utility knife', safety: null, pro: 0 },
  { cat: 'Driveway & Walkways', title: 'Remove weeds from pavement cracks', desc: 'Pull weeds from driveway and walkway cracks, apply boiling water or vinegar-based weed killer. Sweep polymeric sand into gaps.', freq: 'monthly', fv: 1, season: 'summer', diff: 'easy', mins: 20, pri: 'low', skills: null, tools: 'Weed puller, boiling water or vinegar', safety: null, pro: 0 },
  { cat: 'Driveway & Walkways', title: 'Level sunken walkway pavers', desc: 'Remove sunken paver, add or remove base sand, tamp level, and reset paver. Sweep sand into joints.', freq: 'as_needed', fv: null, season: null, diff: 'moderate', mins: 60, pri: 'medium', skills: null, tools: 'Shovel, rubber mallet, level, sand', safety: 'Wear gloves', pro: 0 },
  { cat: 'Driveway & Walkways', title: 'Apply ice melt before freeze', desc: 'Spread pet-safe ice melt on driveway and walkways before predicted freezing rain or snow. Less is more.', freq: 'seasonal', fv: null, season: 'winter', diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Ice melt spreader, pet-safe ice melt', safety: null, pro: 0 },
  { cat: 'Driveway & Walkways', title: 'Inspect driveway apron for cracks', desc: 'Check where driveway meets street for heaved or cracked concrete. Mark cracks with chalk and monitor growth.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 15, pri: 'low', skills: null, tools: 'Chalk', safety: 'Watch for traffic if near street', pro: 0 },

  // ===== Fence & Gates (6) =====
  { cat: 'Fence & Gates', title: 'Inspect fence for loose boards', desc: 'Walk entire fence line. Re-nail or screw loose pickets. Replace rotted or broken boards.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 90, pri: 'medium', skills: null, tools: 'Hammer/drill, replacement boards, galvanized nails/screws', safety: null, pro: 0 },
  { cat: 'Fence & Gates', title: 'Check fence posts for rot', desc: 'Push on each post at ground level. If it moves or feels spongy, dig out and replace with treated lumber and gravel base.', freq: 'yearly', fv: 1, season: 'spring', diff: 'hard', mins: 180, pri: 'high', skills: 'Digging & concrete work', tools: 'Shovel, treated post, gravel, post-hole digger, concrete mix', safety: 'Call 811 before digging for buried utilities', pro: 0 },
  { cat: 'Fence & Gates', title: 'Lubricate gate hinges & latch', desc: 'Apply silicone or lithium grease to gate hinges, spring mechanisms, and latch. Tighten loose hinge screws.', freq: 'biyearly', fv: 2, season: null, diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Silicone spray lubricant, screwdriver', safety: null, pro: 0 },
  { cat: 'Fence & Gates', title: 'Adjust sagging gate', desc: 'Install a turnbuckle cable or anti-sag kit to pull sagging gate back to square. Tighten until gap is even.', freq: 'as_needed', fv: null, season: null, diff: 'moderate', mins: 45, pri: 'medium', skills: null, tools: 'Anti-sag kit, drill, wrench', safety: null, pro: 0 },
  { cat: 'Fence & Gates', title: 'Stain or paint wooden fence', desc: 'Power wash fence, let dry, apply stain or paint with sprayer or roller. External latex lasts longest.', freq: 'every 3 years', fv: null, season: 'summer', diff: 'hard', mins: 480, pri: 'medium', skills: null, tools: 'Pressure washer, paint sprayer or roller, stain/paint', safety: 'Cover nearby plants, wear respirator', pro: 0 },
  { cat: 'Fence & Gates', title: 'Check chain link tension', desc: 'Tighten tension bar and adjust turnbuckles if fence is loose. Replace rusted or broken chain link sections.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 60, pri: 'low', skills: null, tools: 'Tension bar, fence pliers, replacement chain link', safety: null, pro: 0 },

  // ===== Lawn & Garden (10) =====
  { cat: 'Lawn & Garden', title: 'Aerate lawn', desc: 'Use core aerator to pull plugs of soil across the entire lawn. Reduces compaction and improves water penetration.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 120, pri: 'high', skills: null, tools: 'Core aerator (rental or manual)', safety: 'Mark sprinkler heads before starting', pro: 0 },
  { cat: 'Lawn & Garden', title: 'Overseed thin lawn areas', desc: 'Rake bare spots, spread grass seed matching existing lawn type, cover with thin layer of compost, water daily.', freq: 'yearly', fv: 1, season: 'fall', diff: 'easy', mins: 60, pri: 'medium', skills: null, tools: 'Grass seed, rake, compost, spreader', safety: null, pro: 0 },
  { cat: 'Lawn & Garden', title: 'Apply pre-emergent weed control', desc: 'Spread pre-emergent herbicide in early spring before soil temp reaches 55°F. Prevents crabgrass and other annual weeds.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 30, pri: 'high', skills: null, tools: 'Drop spreader, pre-emergent granules', safety: 'Wear gloves and mask, keep off lawn for 24h', pro: 0 },
  { cat: 'Lawn & Garden', title: 'Fertilize lawn (seasonal plan)', desc: 'Apply balanced lawn fertilizer following seasonal schedule — high nitrogen in spring, lower in fall. Water after application.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 30, pri: 'medium', skills: null, tools: 'Lawn fertilizer, broadcast spreader', safety: 'Sweep fertilizer off driveways — it pollutes waterways', pro: 0 },
  { cat: 'Lawn & Garden', title: 'Mulch garden beds', desc: 'Spread 2-3 inches of fresh mulch in all garden beds. Prevents weeds, retains moisture, and looks clean.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 120, pri: 'medium', skills: null, tools: 'Shovel, wheelbarrow, landscape rake, mulch', safety: null, pro: 0 },
  { cat: 'Lawn & Garden', title: 'Edge lawn along beds & walkways', desc: 'Use a half-moon edger or power edger to create a clean line between grass and garden beds or pavement.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 30, pri: 'low', skills: null, tools: 'Half-moon edger or string trimmer', safety: 'Wear sturdy shoes', pro: 0 },
  { cat: 'Lawn & Garden', title: 'Prune perennials before winter', desc: 'Cut back dead perennial foliage to 2" above ground after frost kills the tops. Leave some for winter interest.', freq: 'yearly', fv: 1, season: 'fall', diff: 'easy', mins: 60, pri: 'low', skills: null, tools: 'Pruning shears, garden gloves', safety: null, pro: 0 },
  { cat: 'Lawn & Garden', title: 'Install rain barrel', desc: 'Position rain barrel under downspout, cut downspout to height, install diverter kit. Place on level, solid base.', freq: 'as_needed', fv: null, season: 'spring', diff: 'moderate', mins: 60, pri: 'low', skills: null, tools: 'Rain barrel, diverter kit, hacksaw, level', safety: 'Elevate barrel for gravity flow to hose', pro: 0 },
  { cat: 'Lawn & Garden', title: 'Test & amend garden soil', desc: 'Take soil samples from several spots. Test pH and nutrients with home kit. Add lime (acidic) or sulfur (alkaline) as needed.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 60, pri: 'medium', skills: null, tools: 'Soil test kit, lime or sulfur', safety: null, pro: 0 },
  { cat: 'Lawn & Garden', title: 'Set up irrigation timer', desc: 'Program sprinkler timer with start times, zone durations, and days. Adjust for rain delays and seasonal changes.', freq: 'seasonal', fv: null, season: 'spring', diff: 'easy', mins: 30, pri: 'medium', skills: null, tools: 'Irrigation controller manual', safety: null, pro: 0 },

  // ===== Trees & Shrubs (6) =====
  { cat: 'Trees & Shrubs', title: 'Prune dead & diseased branches', desc: 'Using clean, sharp loppers or pole saw, cut branches at the branch collar. Remove all dead, crossing, or diseased wood.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 120, pri: 'high', skills: null, tools: 'Loppers, pruning saw, pole pruner, ladder', safety: 'Never prune near power lines — call utility company', pro: 0 },
  { cat: 'Trees & Shrubs', title: 'Trim shrubs & hedges', desc: 'Trim overgrown shrubs into shape using hedge shears. Remove old wood at ground level to encourage new growth.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 90, pri: 'medium', skills: null, tools: 'Hedge shears or power trimmer, loppers', safety: 'Watch for nesting birds before trimming', pro: 0 },
  { cat: 'Trees & Shrubs', title: 'Mulch around tree bases', desc: 'Spread 2-3" of mulch in a donut shape around tree trunks — never pile against trunk (volcano mulching kills trees).', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 30, pri: 'low', skills: null, tools: 'Mulch, wheelbarrow, rake', safety: 'Keep mulch 6" away from trunk', pro: 0 },
  { cat: 'Trees & Shrubs', title: 'Check trees for storm damage risk', desc: 'Look for large hanging limbs, cracks in major crotches, or trees that lean significantly. Call arborist if worried.', freq: 'yearly', fv: 1, season: 'fall', diff: 'easy', mins: 30, pri: 'high', skills: null, tools: 'Binoculars', safety: 'If tree has large cracked limb, stay clear and call pro', pro: 0 },
  { cat: 'Trees & Shrubs', title: 'Fertilize shrubs & trees', desc: 'Apply slow-release granular fertilizer around drip line of trees and shrubs in early spring. Water in thoroughly.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 30, pri: 'low', skills: null, tools: 'Slow-release granular fertilizer, spreader', safety: null, pro: 0 },
  { cat: 'Trees & Shrubs', title: 'Remove invasive vines from trees', desc: 'Cut and remove English ivy, kudzu, or honeysuckle vines climbing tree trunks. Pull roots to prevent regrowth.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 60, pri: 'medium', skills: null, tools: 'Pruning shears, gloves, loppers', safety: 'Watch for poison ivy mixed in', pro: 0 },

  // ===== Pest Control (6) =====
  { cat: 'Pest Control', title: 'Inspect foundation for cracks & gaps', desc: 'Walk around foundation with a flashlight. Seal any cracks over 1/8" with hydraulic cement or expanding foam. Mice enter through gaps as small as a dime.', freq: 'yearly', fv: 1, season: 'fall', diff: 'easy', mins: 30, pri: 'high', skills: null, tools: 'Flashlight, hydraulic cement, expanding foam, caulk', safety: null, pro: 0 },
  { cat: 'Pest Control', title: 'Set & monitor rodent traps', desc: 'Place snap traps along walls in basement/garage/attic — rodents travel along edges. Check weekly. Dispose of catches.', freq: 'monthly', fv: 1, season: 'fall', diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Snap traps, peanut butter (bait), gloves', safety: 'Wear gloves when handling traps', pro: 0 },
  { cat: 'Pest Control', title: 'Treat for ants & roaches (preventive)', desc: 'Apply gel bait along baseboards and under appliances. Spray perimeter with barrier insecticide quarterly.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 30, pri: 'medium', skills: null, tools: 'Gel bait, perimeter spray, caulk (to seal entry points)', safety: 'Keep pets and kids away from treated areas until dry', pro: 0 },
  { cat: 'Pest Control', title: 'Schedule termite inspection', desc: 'Annual termite inspection by licensed professional. Look for mud tubes along foundation, hollow-sounding wood.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 30, pri: 'critical', skills: null, tools: null, safety: 'If you see active termites — don\'t disturb them, call pro', pro: 1 },
  { cat: 'Pest Control', title: 'Treat wood for carpenter bees', desc: 'Fill existing holes with wood putty or cork. Paint/stain exposed wood. Hang carpenter bee traps near problem areas.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 30, pri: 'medium', skills: null, tools: 'Wood putty, paint, carpenter bee traps', safety: 'Wear gloves — some people are allergic to bee venom', pro: 0 },
  { cat: 'Pest Control', title: 'Clean out spider webs & egg sacs', desc: 'Use broom or vacuum to remove webs from eaves, corners, and crawlspaces. Apply residual insecticide to prevent rebuilding.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 20, pri: 'low', skills: null, tools: 'Broom, vacuum, spider/insecticide spray', safety: 'Watch for black widows and brown recluses in dark corners', pro: 0 },

  // ===== Floors & Surfacing (7) =====
  { cat: 'Floors & Surfacing', title: 'Deep clean all carpets (steam)', desc: 'Rent or use carpet cleaner. Vacuum first, pre-treat stains, and steam clean room by room. Use fans to dry completely.', freq: 'yearly', fv: 1, season: null, diff: 'hard', mins: 240, pri: 'medium', skills: null, tools: 'Carpet cleaner rental, cleaning solution, stain remover, fans', safety: 'Open windows — carpet cleaning fumes can be strong', pro: 0 },
  { cat: 'Floors & Surfacing', title: 'Strip & wax vinyl/tile floors', desc: 'Apply stripper, scrub with floor machine, rinse thoroughly. Apply two coats of wax, buffing between coats.', freq: 'yearly', fv: 1, season: null, diff: 'hard', mins: 180, pri: 'low', skills: null, tools: 'Floor stripper, wax, mop, buffer (rental)', safety: 'Ventilate well when using chemical strippers', pro: 0 },
  { cat: 'Floors & Surfacing', title: 'Refinish hardwood floors (screen & coat)', desc: 'Lightly sand surface with floor buffer, vacuum dust, apply polyurethane coat. Needs 24h dry time between coats.', freq: 'every 3-5 years', fv: null, season: null, diff: 'hard', mins: 360, pri: 'medium', skills: 'Floor refinishing experience', tools: 'Floor buffer, sanding screens, vacuum, polyurethane, applicator', safety: 'Wear respirator — polyurethane fumes are strong', pro: 0 },
  { cat: 'Floors & Surfacing', title: 'Clean & seal tile grout', desc: 'Scrub grout lines with brush and alkaline cleaner. Apply grout sealer with small applicator bottle. Wipe excess immediately.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 90, pri: 'medium', skills: null, tools: 'Grout brush, grout cleaner, grout sealer, sponge', safety: 'Wear rubber gloves', pro: 0 },
  { cat: 'Floors & Surfacing', title: 'Replace worn floor transition strips', desc: 'Remove old threshold/transition strip. Cut new strip to width with hacksaw and screw or adhesive in place.', freq: 'as_needed', fv: null, season: null, diff: 'easy', mins: 30, pri: 'low', skills: null, tools: 'Hacksaw, screwdriver, replacement transition strip', safety: null, pro: 0 },
  { cat: 'Floors & Surfacing', title: 'Polish natural stone floors', desc: 'Clean stone floor with pH-neutral cleaner. Apply stone polish with microfiber pad buffing in circular motion.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 120, pri: 'low', skills: null, tools: 'pH-neutral cleaner, stone polish, microfiber pads, buffer', safety: 'Never use vinegar on stone — it etches the surface', pro: 0 },
  { cat: 'Floors & Surfacing', title: 'Repair squeaky hardwood spots', desc: 'Locate squeak from below if possible. Drive screws through subfloor into joists. Use squeak-repair kit if no basement access.', freq: 'as_needed', fv: null, season: null, diff: 'moderate', mins: 45, pri: 'low', skills: null, tools: 'Squeak repair kit, screwdriver, drill', safety: null, pro: 0 },

  // ===== Walls & Ceilings (7) =====
  { cat: 'Walls & Ceilings', title: 'Patch nail holes & small dents', desc: 'Fill holes with spackling compound, let dry, sand smooth with fine-grit sponge. Spot-prime and paint.', freq: 'as_needed', fv: null, season: null, diff: 'easy', mins: 30, pri: 'low', skills: null, tools: 'Spackling compound, putty knife, sanding sponge, paint', safety: null, pro: 0 },
  { cat: 'Walls & Ceilings', title: 'Wash walls & baseboards', desc: 'Use mild detergent and sponge to wash walls from bottom up. Rinse with clean water. Don\'t soak drywall.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 120, pri: 'low', skills: null, tools: 'Sponges, mild detergent, buckets, step stool', safety: null, pro: 0 },
  { cat: 'Walls & Ceilings', title: 'Repair drywall cracks', desc: 'V-groove crack with utility knife, fill with joint compound, embed tape, apply two more coats, sand, and paint.', freq: 'as_needed', fv: null, season: null, diff: 'moderate', mins: 120, skills: 'Drywall finishing', tools: 'Joint compound, drywall tape, putty knives, sanding sponge', safety: 'Wear dust mask when sanding', pro: 0 },
  { cat: 'Walls & Ceilings', title: 'Touch up painted walls', desc: 'Keep leftover paint for touch-ups. Stir well, apply with small brush or mini-roller to scuffs and marks.', freq: 'as_needed', fv: null, season: null, diff: 'easy', mins: 20, pri: 'low', skills: null, tools: 'Touch-up paint, small brush, mini-roller', safety: null, pro: 0 },
  { cat: 'Walls & Ceilings', title: 'Check ceiling for water stains', desc: 'Inspect ceilings in each room for yellow or brown stains. Investigate source — plumbing above, roof leak, or condensation.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 15, pri: 'high', skills: null, tools: 'Flashlight, moisture meter (optional)', safety: 'If stain is actively wet, poke small hole to drain before it bows', pro: 0 },
  { cat: 'Walls & Ceilings', title: 'Clean crown molding & ceiling fans', desc: 'Dust crown molding with soft brush attachment. Wipe ceiling fan blades top and bottom — they collect surprising dust.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 30, pri: 'low', skills: null, tools: 'Vacuum with brush, step stool, microfiber cloth', safety: null, pro: 0 },
  { cat: 'Walls & Ceilings', title: 'Repair popped drywall nails', desc: 'Drive new drywall screw 1" above or below popped nail, then sink the nail head below surface or remove it.', freq: 'as_needed', fv: null, season: null, diff: 'easy', mins: 15, pri: 'low', skills: null, tools: 'Drywall screws, screwdriver, drywall knife', safety: null, pro: 0 },

  // ===== Windows & Doors (7) =====
  { cat: 'Windows & Doors', title: 'Clean windows inside & out', desc: 'Use squeegee and microfiber cloths with window cleaner. Clean tracks with vacuum and toothbrush.', freq: 'quarterly', fv: 4, season: null, diff: 'moderate', mins: 90, pri: 'medium', skills: null, tools: 'Squeegee, microfiber cloths, window cleaner, toothbrush', safety: 'Use stable ladder for second-story windows', pro: 0 },
  { cat: 'Windows & Doors', title: 'Lubricate window tracks & hardware', desc: 'Clean window tracks with brush and vacuum. Apply silicone spray to sliding channels. Lubricate crank mechanisms.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 30, pri: 'medium', skills: null, tools: 'Silicone spray, vacuum, toothbrush', safety: null, pro: 0 },
  { cat: 'Windows & Doors', title: 'Replace weatherstripping on doors', desc: 'Remove old weatherstripping. Clean frame surface. Apply new adhesive-backed foam, V-strip, or door sweep. Check for drafts.', freq: 'as_needed', fv: null, season: 'fall', diff: 'easy', mins: 30, pri: 'high', skills: null, tools: 'Weatherstripping, scissors, tape measure, utility knife', safety: null, pro: 0 },
  { cat: 'Windows & Doors', title: 'Adjust door hinges for sag', desc: 'Tighten hinge screws. If screw holes are stripped, use longer screws (3") that reach into the wall frame.', freq: 'as_needed', fv: null, season: null, diff: 'easy', mins: 15, pri: 'low', skills: null, tools: 'Screwdriver, 3" deck screws', safety: null, pro: 0 },
  { cat: 'Windows & Doors', title: 'Clean & lubricate garage door tracks', desc: 'Wipe track with rag to remove old grease. Apply garage door lubricant (not WD-40) to rollers, hinges, and springs.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 20, pri: 'medium', skills: null, tools: 'Garage door lubricant, clean rag', safety: 'Never attempt to adjust garage door springs — they\'re dangerous', pro: 0 },
  { cat: 'Windows & Doors', title: 'Test garage door auto-reverse', desc: 'Place a 2x4 board in the door\'s path. Door should reverse upon contact. Adjust sensitivity if needed.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'critical', skills: null, tools: '2x4 board', safety: 'This is a critical safety feature — test monthly', pro: 0 },
  { cat: 'Windows & Doors', title: 'Inspect window screens for tears', desc: 'Check each screen for holes or tears. Patch small tears with screen repair kit. Replace screen mesh if badly damaged.', freq: 'yearly', fv: 1, season: 'spring', diff: 'easy', mins: 30, pri: 'low', skills: null, tools: 'Screen repair kit, spline roller, utility knife', safety: null, pro: 0 },

  // ===== Basement & Attic (6) =====
  { cat: 'Basement & Attic', title: 'Check attic insulation depth', desc: 'Measure insulation depth across attic floor. Should be R-38 (12-15") for fiberglass. Add blown-in insulation if low.', freq: 'yearly', fv: 1, season: 'fall', diff: 'easy', mins: 20, pri: 'medium', skills: null, tools: 'Tape measure, flashlight', safety: 'Stay on attic joists, watch for exposed nails in roof deck', pro: 0 },
  { cat: 'Basement & Attic', title: 'Inspect basement for water seepage', desc: 'After heavy rain, check basement walls and floor for moisture, efflorescence (white mineral deposits), or puddles.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 20, pri: 'high', skills: null, tools: 'Flashlight', safety: 'If standing water present, check for electrical hazards first', pro: 0 },
  { cat: 'Basement & Attic', title: 'Organize & declutter basement/attic', desc: 'Sort stored items, discard or donate unused things. Use clear bins for easy identification. Label everything.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 240, pri: 'low', skills: null, tools: 'Storage bins, labels, marker', safety: 'Wear mask in dusty attics', pro: 0 },
  { cat: 'Basement & Attic', title: 'Check attic vents & soffit baffles', desc: 'Ensure soffit vents aren\'t blocked by insulation. Install cardboard or foam baffles to maintain proper airflow path.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 60, pri: 'medium', skills: null, tools: 'Flashlight, baffles (if needed), staple gun', safety: 'Work carefully — attic temps can be extreme', pro: 0 },
  { cat: 'Basement & Attic', title: 'Install dehumidifier in basement', desc: 'Set up dehumidifier, connect drain hose to floor drain or sump pit. Set to 50% humidity. Empty bucket if no drain.', freq: 'seasonal', fv: null, season: 'spring', diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Dehumidifier, drain hose', safety: 'Clean filter monthly during peak use', pro: 0 },
  { cat: 'Basement & Attic', title: 'Test basement radon levels', desc: 'Place a radon test kit in the lowest lived-in level. Leave undisturbed for required time (often 7 days). Mail to lab.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'high', skills: null, tools: 'Radon test kit', safety: 'If levels > 4 pCi/L, install mitigation system', pro: 0 },

  // ===== Safety & Security (8) =====
  { cat: 'Safety & Security', title: 'Test & program fire extinguishers', desc: 'Check pressure gauge on each extinguisher — should be in green zone. Invert and shake to prevent powder clumping.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'critical', skills: null, tools: null, safety: 'Replace extinguisher every 12 years or if gauge is in red', pro: 0 },
  { cat: 'Safety & Security', title: 'Review & practice fire escape plan', desc: 'Draw a floor plan with two escape routes from each room. Choose outside meeting spot. Practice with all household members.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 30, pri: 'high', skills: null, tools: 'Paper, marker', safety: null, pro: 0 },
  { cat: 'Safety & Security', title: 'Change exterior door lock codes/pins', desc: 'Re-program electronic lock codes. Re-key or change deadbolt locks if keys are lost or after moving into a new home.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 30, pri: 'high', skills: null, tools: 'Screwdriver, re-keying kit or new locks', safety: null, pro: 0 },
  { cat: 'Safety & Security', title: 'Test security system & sensors', desc: 'Test alarm panel, motion sensors, door/window contacts, and glass break detectors. Replace sensor batteries if low.', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 15, pri: 'high', skills: null, tools: null, safety: 'Notify monitoring company before testing', pro: 0 },
  { cat: 'Safety & Security', title: 'Check carbon monoxide detectors', desc: 'Press TEST button on each CO detector. Replace units older than 7 years (expiration date on back).', freq: 'monthly', fv: 1, season: null, diff: 'easy', mins: 10, pri: 'critical', skills: null, tools: null, safety: 'CO is odorless — detectors save lives', pro: 0 },
  { cat: 'Safety & Security', title: 'Inspect outdoor lighting (security)', desc: 'Test all exterior lights including motion-activated ones. Replace bulbs, clean sensor lenses, adjust timer settings.', freq: 'quarterly', fv: 4, season: null, diff: 'easy', mins: 30, pri: 'medium', skills: null, tools: 'Replacement bulbs, ladder', safety: null, pro: 0 },
  { cat: 'Safety & Security', title: 'Review home inventory (insurance)', desc: 'Walk through each room taking photos/video of belongings. Update spreadsheet with serial numbers and estimated values.', freq: 'yearly', fv: 1, season: null, diff: 'moderate', mins: 120, pri: 'high', skills: null, tools: 'Camera phone, spreadsheet', safety: 'Store inventory offsite or in cloud for insurance claims', pro: 0 },
  { cat: 'Safety & Security', title: 'Update emergency contact & medical info', desc: 'Post emergency numbers near phone. Update family members\' allergies, medications, and medical conditions in emergency kit.', freq: 'yearly', fv: 1, season: null, diff: 'easy', mins: 20, pri: 'medium', skills: null, tools: 'Paper, pen', safety: null, pro: 0 },

  // ===== Seasonal Prep (8) =====
  { cat: 'Seasonal Prep', title: 'Winterize outdoor faucets & irrigation', desc: 'Shut off interior shutoff valve for outdoor spigots. Open outdoor valve to drain. Blow out irrigation system with compressor.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 90, pri: 'high', skills: null, tools: 'Insulated faucet cover, air compressor (for irrigation)', safety: 'Disconnect hoses to prevent bursting', pro: 0 },
  { cat: 'Seasonal Prep', title: 'Prepare emergency winter kit', desc: 'Stock kit with blankets, flashlights, batteries, first aid, non-perishable food, water, and pet supplies. Keep in accessible spot.', freq: 'yearly', fv: 1, season: 'fall', diff: 'easy', mins: 60, pri: 'medium', skills: null, tools: 'Storage tote, emergency supplies', safety: null, pro: 0 },
  { cat: 'Seasonal Prep', title: 'Service snow blower', desc: 'Change oil, replace spark plug, fill with fresh gas + stabilizer. Check auger shear pins and drive belt.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 60, pri: 'medium', skills: 'Small engine maintenance', tools: 'Oil, spark plug, fuel stabilizer, socket set', safety: 'Disconnect spark plug wire before servicing', pro: 0 },
  { cat: 'Seasonal Prep', title: 'Check & replace generator oil/spark plug', desc: 'Change oil, replace spark plug, test run generator under load for 30 minutes. Drain old fuel or add stabilizer.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 60, pri: 'high', skills: null, tools: 'Oil, spark plug, fuel stabilizer', safety: 'Never run generator indoors or in garage', pro: 0 },
  { cat: 'Seasonal Prep', title: 'Check & fill propane tank', desc: 'Check propane level in tank. Refill before peak season prices. Test gas line connections with soapy water.', freq: 'seasonal', fv: null, season: 'fall', diff: 'easy', mins: 15, pri: 'medium', skills: null, tools: 'Propane tank, soapy water test solution', safety: 'If you smell gas, close valve and call propane company', pro: 0 },
  { cat: 'Seasonal Prep', title: 'Clean & store outdoor furniture', desc: 'Wash furniture with mild soap, apply protectant (for wicker/wood), store cushions in dry bin. Cover and move under roof.', freq: 'yearly', fv: 1, season: 'fall', diff: 'moderate', mins: 120, pri: 'medium', skills: null, tools: 'Mild soap, protectant, storage bins, furniture covers', safety: null, pro: 0 },
  { cat: 'Seasonal Prep', title: 'Spring cleanup — yard debris removal', desc: 'Rake remaining leaves, pick up fallen branches, remove winter debris from flower beds. Prepare beds for planting.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 180, pri: 'medium', skills: null, tools: 'Rake, yard bags, gloves, pruners', safety: null, pro: 0 },
  { cat: 'Seasonal Prep', title: 'Check & clean window AC units', desc: 'Remove AC from window, clean coils and filter with coil cleaner, check seal foam, store or re-install with fresh weatherstripping.', freq: 'yearly', fv: 1, season: 'spring', diff: 'moderate', mins: 60, pri: 'medium', skills: null, tools: 'Coil cleaner, vacuum, foam weatherstripping', safety: 'Get help — AC units are heavy', pro: 0 },
];

console.log(`Seeding ${tasks.length} maintenance tasks...`);

const taskStmt = db.prepare(`
  INSERT INTO tasks (category_id, title, description, frequency, frequency_value, season, difficulty, est_minutes, priority, skills_required, tools_needed, safety_tips, pro_recommended)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Build category lookup
const catMap = {};
for (const c of categories) catMap[c.name] = c.sort; // sort order = id

const catRows = db.prepare('SELECT id, name FROM categories').all();
const catIdMap = {};
for (const r of catRows) catIdMap[r.name] = r.id;

const insertMany = db.transaction(() => {
  for (const t of tasks) {
    taskStmt.run(
      catIdMap[t.cat],
      t.title,
      t.desc,
      t.freq,
      t.fv || null,
      t.season || null,
      t.diff,
      t.mins,
      t.pri,
      t.skills || null,
      t.tools || null,
      t.safety || null,
      t.pro || 0
    );
  }
});

insertMany();

// Verify count
const count = db.prepare('SELECT COUNT(*) as cnt FROM tasks').get();
console.log(`✓ Seeded ${count.cnt} home maintenance tasks across ${categories.length} categories`);

// Show category breakdown
const breakdown = db.prepare(`
  SELECT c.name, c.icon, COUNT(t.id) as count
  FROM categories c
  LEFT JOIN tasks t ON t.category_id = c.id
  GROUP BY c.id
  ORDER BY c.sort_order
`).all();

console.log('\nCategory breakdown:');
for (const b of breakdown) {
  console.log(`  ${b.icon} ${b.name}: ${b.count} tasks`);
}

db.close();
console.log('\n✓ Database created at: www/data/homekeeping.db');