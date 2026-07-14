/* moves.js — the move dictionary (window.MOVES_DB). Gen-2 flavored. Every
   move a learnset references MUST exist here; the duel engine falls back to a
   type move if a name is missing, so bad data can never break a battle.

   Schema per move:
     t    type (matches the type-effectiveness chart)
     cat  "phys" | "spec" | "status"
     pow  base power (0 for status moves)
     acc  accuracy 0-100  (>=101 = never misses, e.g. self-buffs)
     pri  priority (optional, default 0; Quick Attack = 1)
     fx   optional effect descriptor:
        status {id:"par"|"brn"|"psn"|"slp"|"frz", chance}
        stat   {who:"self"|"foe", stat:"atk"|"def"|"spa"|"spd"|"spe"|"acc", stg, chance?}
        flinch chance
        drain  fraction of damage dealt healed to the user (Giga Drain 0.5)
        heal   fraction of the user's max HP restored (Recover 0.5)
        recoil fraction of damage dealt taken by the user (Double-Edge 0.25)
        crit   "high" (boosted crit rate: Slash, Crabhammer)
   Powers/accuracies are lightly tuned for our Lv50 one-scalar model, not exact
   cartridge values, but the character of each move is preserved. */
(function () {
  window.MOVES_DB = {
    // ---- Normal ----
    "Tackle":      { t: "normal", cat: "phys", pow: 40, acc: 100 },
    "Scratch":     { t: "normal", cat: "phys", pow: 40, acc: 100 },
    "Pound":       { t: "normal", cat: "phys", pow: 40, acc: 100 },
    "Quick Attack":{ t: "normal", cat: "phys", pow: 40, acc: 100, pri: 1 },
    "Body Slam":   { t: "normal", cat: "phys", pow: 70, acc: 100, fx: { status: { id: "par", chance: 30 } } },
    "Slash":       { t: "normal", cat: "phys", pow: 70, acc: 100, fx: { crit: "high" } },
    "Headbutt":    { t: "normal", cat: "phys", pow: 65, acc: 100, fx: { flinch: 30 } },
    "Stomp":       { t: "normal", cat: "phys", pow: 65, acc: 100, fx: { flinch: 30 } },
    "Double-Edge": { t: "normal", cat: "phys", pow: 100, acc: 100, fx: { recoil: 0.25 } },
    "Take Down":   { t: "normal", cat: "phys", pow: 90, acc: 85, fx: { recoil: 0.25 } },
    "Hyper Beam":  { t: "normal", cat: "spec", pow: 150, acc: 90, recharge: true },
    "Swift":       { t: "normal", cat: "spec", pow: 60, acc: 101 },
    "Tri Attack":  { t: "normal", cat: "spec", pow: 80, acc: 100, fx: { status: { id: "par", chance: 20 } } },
    "Return":      { t: "normal", cat: "phys", pow: 75, acc: 100 },
    "Strength":    { t: "normal", cat: "phys", pow: 70, acc: 100 },
    "Cut":         { t: "normal", cat: "phys", pow: 50, acc: 95 },
    "Fury Swipes": { t: "normal", cat: "phys", pow: 55, acc: 90 },
    "Egg Bomb":    { t: "normal", cat: "phys", pow: 100, acc: 75 },
    "Growl":       { t: "normal", cat: "status", pow: 0, acc: 100, fx: { stat: { who: "foe", stat: "atk", stg: -1 } } },
    "Leer":        { t: "normal", cat: "status", pow: 0, acc: 100, fx: { stat: { who: "foe", stat: "def", stg: -1 } } },
    "Screech":     { t: "normal", cat: "status", pow: 0, acc: 85, fx: { stat: { who: "foe", stat: "def", stg: -2 } } },
    "Swords Dance":{ t: "normal", cat: "status", pow: 0, acc: 101, fx: { stat: { who: "self", stat: "atk", stg: 2 } } },
    "Sharpen":     { t: "normal", cat: "status", pow: 0, acc: 101, fx: { stat: { who: "self", stat: "atk", stg: 1 } } },
    "Harden":      { t: "normal", cat: "status", pow: 0, acc: 101, fx: { stat: { who: "self", stat: "def", stg: 1 } } },
    "Recover":     { t: "normal", cat: "status", pow: 0, acc: 101, fx: { heal: 0.5 } },
    "Soft-Boiled": { t: "normal", cat: "status", pow: 0, acc: 101, fx: { heal: 0.5 } },
    "Rest":        { t: "psychic", cat: "status", pow: 0, acc: 101, fx: { rest: true } },
    "Sand-Attack": { t: "ground", cat: "status", pow: 0, acc: 100, fx: { stat: { who: "foe", stat: "acc", stg: -1 } } },
    "Supersonic":  { t: "normal", cat: "status", pow: 0, acc: 55, fx: { stat: { who: "foe", stat: "acc", stg: -1 } } },
    // ---- Fire ----
    "Ember":       { t: "fire", cat: "spec", pow: 40, acc: 100, fx: { status: { id: "brn", chance: 10 } } },
    "Flamethrower":{ t: "fire", cat: "spec", pow: 90, acc: 100, fx: { status: { id: "brn", chance: 10 } } },
    "Fire Blast":  { t: "fire", cat: "spec", pow: 110, acc: 85, fx: { status: { id: "brn", chance: 10 } } },
    "Fire Punch":  { t: "fire", cat: "phys", pow: 75, acc: 100, fx: { status: { id: "brn", chance: 10 } } },
    "Flame Wheel": { t: "fire", cat: "phys", pow: 60, acc: 100, fx: { status: { id: "brn", chance: 10 } } },
    "Sacred Fire": { t: "fire", cat: "phys", pow: 100, acc: 95, fx: { status: { id: "brn", chance: 50 } } },
    // ---- Water ----
    "Water Gun":   { t: "water", cat: "spec", pow: 40, acc: 100 },
    "Bubble Beam": { t: "water", cat: "spec", pow: 65, acc: 100, fx: { stat: { who: "foe", stat: "spe", stg: -1, chance: 20 } } },
    "Surf":        { t: "water", cat: "spec", pow: 90, acc: 100, spread: true },
    "Hydro Pump":  { t: "water", cat: "spec", pow: 110, acc: 80 },
    "Waterfall":   { t: "water", cat: "phys", pow: 80, acc: 100 },
    "Crabhammer":  { t: "water", cat: "phys", pow: 90, acc: 85, fx: { crit: "high" } },
    // ---- Electric ----
    "Thunder Shock":{ t: "electric", cat: "spec", pow: 40, acc: 100, fx: { status: { id: "par", chance: 10 } } },
    "Thunderbolt": { t: "electric", cat: "spec", pow: 90, acc: 100, fx: { status: { id: "par", chance: 10 } } },
    "Thunder":     { t: "electric", cat: "spec", pow: 110, acc: 70, fx: { status: { id: "par", chance: 30 } } },
    "Thunder Punch":{ t: "electric", cat: "phys", pow: 75, acc: 100, fx: { status: { id: "par", chance: 10 } } },
    "Spark":       { t: "electric", cat: "phys", pow: 65, acc: 100, fx: { status: { id: "par", chance: 30 } } },
    "Thunder Wave":{ t: "electric", cat: "status", pow: 0, acc: 100, fx: { status: { id: "par", chance: 100 } } },
    // ---- Grass ----
    "Absorb":      { t: "grass", cat: "spec", pow: 40, acc: 100, fx: { drain: 0.5 } },
    "Mega Drain":  { t: "grass", cat: "spec", pow: 60, acc: 100, fx: { drain: 0.5 } },
    "Giga Drain":  { t: "grass", cat: "spec", pow: 70, acc: 100, fx: { drain: 0.5 } },
    "Razor Leaf":  { t: "grass", cat: "phys", pow: 60, acc: 95, fx: { crit: "high" } },
    "Solar Beam":  { t: "grass", cat: "spec", pow: 150, acc: 100, charge: { msg: "absorbed light!" } },
    "Vine Whip":   { t: "grass", cat: "phys", pow: 45, acc: 100 },
    "Petal Dance": { t: "grass", cat: "spec", pow: 90, acc: 100 },
    "Sleep Powder":{ t: "grass", cat: "status", pow: 0, acc: 75, fx: { status: { id: "slp", chance: 100 } } },
    "Spore":       { t: "grass", cat: "status", pow: 0, acc: 100, fx: { status: { id: "slp", chance: 100 } } },
    "Stun Spore":  { t: "grass", cat: "status", pow: 0, acc: 75, fx: { status: { id: "par", chance: 100 } } },
    "Leech Seed":  { t: "grass", cat: "status", pow: 0, acc: 90, fx: { seed: true } },
    // ---- Ice ----
    "Ice Beam":    { t: "ice", cat: "spec", pow: 90, acc: 100, fx: { status: { id: "frz", chance: 10 } } },
    "Blizzard":    { t: "ice", cat: "spec", pow: 110, acc: 70, fx: { status: { id: "frz", chance: 10 } }, spread: true },
    "Ice Punch":   { t: "ice", cat: "phys", pow: 75, acc: 100, fx: { status: { id: "frz", chance: 10 } } },
    "Aurora Beam": { t: "ice", cat: "spec", pow: 65, acc: 100, fx: { stat: { who: "foe", stat: "atk", stg: -1, chance: 10 } } },
    "Powder Snow": { t: "ice", cat: "spec", pow: 40, acc: 100, fx: { status: { id: "frz", chance: 10 } }, spread: true },
    // ---- Fighting ----
    "Karate Chop": { t: "fighting", cat: "phys", pow: 50, acc: 100, fx: { crit: "high" } },
    "Brick Break": { t: "fighting", cat: "phys", pow: 65, acc: 100 },
    "Cross Chop":  { t: "fighting", cat: "phys", pow: 100, acc: 80, fx: { crit: "high" } },
    "Low Kick":    { t: "fighting", cat: "phys", pow: 55, acc: 90, fx: { flinch: 30 } },
    // the cartridge's 100% confusion isn't modeled — the flinch is the daze
    "Dynamic Punch":{ t: "fighting", cat: "phys", pow: 100, acc: 55, fx: { flinch: 60 } },
    "Mach Punch":  { t: "fighting", cat: "phys", pow: 40, acc: 100, pri: 1 },
    "Submission":  { t: "fighting", cat: "phys", pow: 80, acc: 80, fx: { recoil: 0.25 } },
    // ---- Poison ----
    "Sludge":      { t: "poison", cat: "spec", pow: 65, acc: 100, fx: { status: { id: "psn", chance: 30 } }, spread: true },
    "Sludge Bomb": { t: "poison", cat: "spec", pow: 90, acc: 100, fx: { status: { id: "psn", chance: 30 } } },
    "Poison Sting":{ t: "poison", cat: "phys", pow: 40, acc: 100, fx: { status: { id: "psn", chance: 30 } } },
    "Acid":        { t: "poison", cat: "spec", pow: 60, acc: 100, fx: { stat: { who: "foe", stat: "def", stg: -1, chance: 10 } } },
    "Toxic":       { t: "poison", cat: "status", pow: 0, acc: 90, fx: { status: { id: "psn", chance: 100 } } },
    // ---- Ground ----
    "Earthquake":  { t: "ground", cat: "phys", pow: 100, acc: 100, spread: true },
    "Dig":         { t: "ground", cat: "phys", pow: 80, acc: 100, charge: { msg: "burrowed underground!", invuln: true } },
    "Mud-Slap":    { t: "ground", cat: "spec", pow: 40, acc: 100, fx: { stat: { who: "foe", stat: "acc", stg: -1 } } },
    "Bone Club":   { t: "ground", cat: "phys", pow: 65, acc: 85, fx: { flinch: 10 } },
    "Bonemerang":  { t: "ground", cat: "phys", pow: 50, acc: 90 },
    // ---- Flying ----
    "Wing Attack": { t: "flying", cat: "phys", pow: 60, acc: 100 },
    "Aerial Ace":  { t: "flying", cat: "phys", pow: 60, acc: 101 },
    "Drill Peck":  { t: "flying", cat: "phys", pow: 80, acc: 100 },
    "Peck":        { t: "flying", cat: "phys", pow: 35, acc: 100 },
    "Sky Attack":  { t: "flying", cat: "phys", pow: 140, acc: 90, fx: { flinch: 30 }, charge: { msg: "started glowing!" } },
    "Fly":         { t: "flying", cat: "phys", pow: 90, acc: 95, charge: { msg: "flew up high!", invuln: true } },
    "Gust":        { t: "flying", cat: "spec", pow: 40, acc: 100 },
    // ---- Psychic ----
    "Confusion":   { t: "psychic", cat: "spec", pow: 50, acc: 100 },
    "Psybeam":     { t: "psychic", cat: "spec", pow: 65, acc: 100 },
    "Psychic":     { t: "psychic", cat: "spec", pow: 90, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 10 } } },
    "Hypnosis":    { t: "psychic", cat: "status", pow: 0, acc: 60, fx: { status: { id: "slp", chance: 100 } } },
    "Agility":     { t: "psychic", cat: "status", pow: 0, acc: 101, fx: { stat: { who: "self", stat: "spe", stg: 2 } } },
    "Amnesia":     { t: "psychic", cat: "status", pow: 0, acc: 101, fx: { stat: { who: "self", stat: "spd", stg: 2 } } },
    // ---- Bug ----
    "Fury Cutter": { t: "bug", cat: "phys", pow: 50, acc: 95 },
    "Megahorn":    { t: "bug", cat: "phys", pow: 120, acc: 85 },
    "Pin Missile": { t: "bug", cat: "phys", pow: 55, acc: 85 },
    "Twineedle":   { t: "bug", cat: "phys", pow: 60, acc: 100, fx: { status: { id: "psn", chance: 20 } } },
    "Leech Life":  { t: "bug", cat: "phys", pow: 40, acc: 100, fx: { drain: 0.5 } },
    "String Shot": { t: "bug", cat: "status", pow: 0, acc: 95, fx: { stat: { who: "foe", stat: "spe", stg: -1 } } },
    // ---- Rock ----
    "Rock Throw":  { t: "rock", cat: "phys", pow: 50, acc: 90 },
    "Rock Slide":  { t: "rock", cat: "phys", pow: 75, acc: 90, fx: { flinch: 30 }, spread: true },
    "Ancient Power":{ t: "rock", cat: "spec", pow: 60, acc: 100 },
    // ---- Ghost ----
    "Lick":        { t: "ghost", cat: "phys", pow: 30, acc: 100, fx: { status: { id: "par", chance: 30 } } },
    "Night Shade": { t: "ghost", cat: "spec", pow: 60, acc: 100 },
    "Shadow Ball": { t: "ghost", cat: "spec", pow: 80, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 20 } } },
    "Confuse Ray": { t: "ghost", cat: "status", pow: 0, acc: 100, fx: { stat: { who: "foe", stat: "acc", stg: -1 } } },
    // ---- Dragon ----
    "Dragon Breath":{ t: "dragon", cat: "spec", pow: 60, acc: 100, fx: { status: { id: "par", chance: 30 } } },
    "Dragon Claw": { t: "dragon", cat: "phys", pow: 80, acc: 100 },
    "Outrage":     { t: "dragon", cat: "phys", pow: 90, acc: 100 },
    "Twister":     { t: "dragon", cat: "spec", pow: 40, acc: 100, fx: { flinch: 20 } },
    // ---- Dark ----
    "Bite":        { t: "dark", cat: "phys", pow: 60, acc: 100, fx: { flinch: 30 } },
    "Crunch":      { t: "dark", cat: "phys", pow: 80, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 20 } } },
    "Faint Attack":{ t: "dark", cat: "phys", pow: 60, acc: 101 },
    "Pursuit":     { t: "dark", cat: "phys", pow: 40, acc: 100 },
    // ---- Steel ----
    "Metal Claw":  { t: "steel", cat: "phys", pow: 50, acc: 95, fx: { stat: { who: "self", stat: "atk", stg: 1, chance: 10 } } },
    "Iron Tail":   { t: "steel", cat: "phys", pow: 100, acc: 75, fx: { stat: { who: "foe", stat: "def", stg: -1, chance: 30 } } },
    "Steel Wing":  { t: "steel", cat: "phys", pow: 70, acc: 90, fx: { stat: { who: "self", stat: "def", stg: 1, chance: 10 } } },
    // ---- Fairy (Gen-2 had no Fairy type; these read as fairy in our chart) ----
    "Fairy Wind":  { t: "fairy", cat: "spec", pow: 40, acc: 100 },
    "Sweet Kiss":  { t: "fairy", cat: "status", pow: 0, acc: 75, fx: { stat: { who: "foe", stat: "acc", stg: -1 } } },
    "Moonblast":   { t: "fairy", cat: "spec", pow: 95, acc: 100, fx: { stat: { who: "foe", stat: "spa", stg: -1, chance: 30 } } },
    "Charm":       { t: "fairy", cat: "status", pow: 0, acc: 100, fx: { stat: { who: "foe", stat: "atk", stg: -2 } } },

    // ============================================================
    // Gen 3/4 additions — signature moves for #252-493 (and coverage
    // some Gen 1/2 mons pick up). fx.stats = multi-stat setup/drawback.
    // ============================================================
    // Normal
    "Extreme Speed":{ t: "normal", cat: "phys", pow: 80, acc: 100, pri: 2 },
    "Giga Impact":  { t: "normal", cat: "phys", pow: 150, acc: 90, recharge: true },
    "Hyper Voice":  { t: "normal", cat: "spec", pow: 90, acc: 100, spread: true },
    "Crush Claw":   { t: "normal", cat: "phys", pow: 75, acc: 95, fx: { stat: { who: "foe", stat: "def", stg: -1, chance: 50 } } },
    "Wish":         { t: "normal", cat: "status", pow: 0, acc: 101, fx: { heal: 0.5 } },
    // Fire
    "Will-O-Wisp":  { t: "fire", cat: "status", pow: 0, acc: 85, fx: { status: { id: "brn", chance: 100 } } },
    "Flare Blitz":  { t: "fire", cat: "phys", pow: 120, acc: 100, fx: { recoil: 0.33, status: { id: "brn", chance: 10 } } },
    "Overheat":     { t: "fire", cat: "spec", pow: 130, acc: 90, fx: { stat: { who: "self", stat: "spa", stg: -2 } } },
    "Lava Plume":   { t: "fire", cat: "spec", pow: 80, acc: 100, fx: { status: { id: "brn", chance: 30 } }, spread: true },
    "Fire Fang":    { t: "fire", cat: "phys", pow: 65, acc: 95, fx: { status: { id: "brn", chance: 10 } } },
    "Heat Wave":    { t: "fire", cat: "spec", pow: 95, acc: 90, fx: { status: { id: "brn", chance: 10 } }, spread: true },
    // Water
    "Aqua Jet":     { t: "water", cat: "phys", pow: 40, acc: 100, pri: 1 },
    "Aqua Tail":    { t: "water", cat: "phys", pow: 90, acc: 90 },
    "Water Pulse":  { t: "water", cat: "spec", pow: 60, acc: 100 },
    "Muddy Water":  { t: "water", cat: "spec", pow: 90, acc: 85, fx: { stat: { who: "foe", stat: "acc", stg: -1, chance: 30 } }, spread: true },
    // Electric
    "Discharge":    { t: "electric", cat: "spec", pow: 80, acc: 100, fx: { status: { id: "par", chance: 30 } }, spread: true },
    "Volt Tackle":  { t: "electric", cat: "phys", pow: 120, acc: 100, fx: { recoil: 0.33, status: { id: "par", chance: 10 } } },
    "Thunder Fang": { t: "electric", cat: "phys", pow: 65, acc: 95, fx: { status: { id: "par", chance: 10 } } },
    // Grass
    "Leaf Blade":   { t: "grass", cat: "phys", pow: 90, acc: 100, fx: { crit: "high" } },
    "Energy Ball":  { t: "grass", cat: "spec", pow: 90, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 10 } } },
    "Seed Bomb":    { t: "grass", cat: "phys", pow: 80, acc: 100 },
    "Bullet Seed":  { t: "grass", cat: "phys", pow: 65, acc: 100 },
    "Leaf Storm":   { t: "grass", cat: "spec", pow: 130, acc: 90, fx: { stat: { who: "self", stat: "spa", stg: -2 } } },
    "Wood Hammer":  { t: "grass", cat: "phys", pow: 120, acc: 100, fx: { recoil: 0.33 } },
    // Ice
    "Ice Shard":    { t: "ice", cat: "phys", pow: 40, acc: 100, pri: 1 },
    "Ice Fang":     { t: "ice", cat: "phys", pow: 65, acc: 95, fx: { status: { id: "frz", chance: 10 } } },
    "Icicle Crash": { t: "ice", cat: "phys", pow: 85, acc: 90, fx: { flinch: 30 } },
    // Fighting
    "Aura Sphere":  { t: "fighting", cat: "spec", pow: 80, acc: 101 },
    "Close Combat": { t: "fighting", cat: "phys", pow: 120, acc: 100, fx: { stats: [{ who: "self", stat: "def", stg: -1 }, { who: "self", stat: "spd", stg: -1 }] } },
    "Superpower":   { t: "fighting", cat: "phys", pow: 120, acc: 100, fx: { stats: [{ who: "self", stat: "atk", stg: -1 }, { who: "self", stat: "def", stg: -1 }] } },
    "Bulk Up":      { t: "fighting", cat: "status", pow: 0, acc: 101, fx: { stats: [{ who: "self", stat: "atk", stg: 1 }, { who: "self", stat: "def", stg: 1 }] } },
    "Sky Uppercut": { t: "fighting", cat: "phys", pow: 85, acc: 90 },
    // Poison
    "Poison Jab":   { t: "poison", cat: "phys", pow: 80, acc: 100, fx: { status: { id: "psn", chance: 30 } } },
    "Gunk Shot":    { t: "poison", cat: "phys", pow: 120, acc: 70, fx: { status: { id: "psn", chance: 30 } } },
    "Cross Poison": { t: "poison", cat: "phys", pow: 70, acc: 100, fx: { crit: "high" } },
    // Ground
    "Earth Power":  { t: "ground", cat: "spec", pow: 90, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 10 } } },
    // Flying
    "Air Slash":    { t: "flying", cat: "spec", pow: 75, acc: 95, fx: { flinch: 30 } },
    "Brave Bird":   { t: "flying", cat: "phys", pow: 120, acc: 100, fx: { recoil: 0.33 } },
    "Roost":        { t: "flying", cat: "status", pow: 0, acc: 101, fx: { heal: 0.5 } },
    "Air Cutter":   { t: "flying", cat: "spec", pow: 60, acc: 95, fx: { crit: "high" } },
    // Psychic
    "Calm Mind":    { t: "psychic", cat: "status", pow: 0, acc: 101, fx: { stats: [{ who: "self", stat: "spa", stg: 1 }, { who: "self", stat: "spd", stg: 1 }] } },
    "Zen Headbutt": { t: "psychic", cat: "phys", pow: 80, acc: 90, fx: { flinch: 20 } },
    "Psycho Cut":   { t: "psychic", cat: "phys", pow: 70, acc: 100, fx: { crit: "high" } },
    "Extrasensory": { t: "psychic", cat: "spec", pow: 80, acc: 100, fx: { flinch: 10 } },
    // Bug
    "Bug Buzz":     { t: "bug", cat: "spec", pow: 90, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 10 } } },
    "X-Scissor":    { t: "bug", cat: "phys", pow: 80, acc: 100 },
    "Signal Beam":  { t: "bug", cat: "spec", pow: 75, acc: 100 },
    "Silver Wind":  { t: "bug", cat: "spec", pow: 60, acc: 100 },
    // Rock
    "Stone Edge":   { t: "rock", cat: "phys", pow: 100, acc: 80, fx: { crit: "high" } },
    "Power Gem":    { t: "rock", cat: "spec", pow: 80, acc: 100 },
    "Rock Blast":   { t: "rock", cat: "phys", pow: 65, acc: 90 },
    "Rock Polish":  { t: "rock", cat: "status", pow: 0, acc: 101, fx: { stat: { who: "self", stat: "spe", stg: 2 } } },
    // Ghost
    "Shadow Claw":  { t: "ghost", cat: "phys", pow: 70, acc: 100, fx: { crit: "high" } },
    "Shadow Sneak": { t: "ghost", cat: "phys", pow: 40, acc: 100, pri: 1 },
    "Ominous Wind": { t: "ghost", cat: "spec", pow: 60, acc: 100 },
    // Dragon
    "Dragon Dance": { t: "dragon", cat: "status", pow: 0, acc: 101, fx: { stats: [{ who: "self", stat: "atk", stg: 1 }, { who: "self", stat: "spe", stg: 1 }] } },
    "Dragon Pulse": { t: "dragon", cat: "spec", pow: 85, acc: 100 },
    "Draco Meteor": { t: "dragon", cat: "spec", pow: 130, acc: 90, fx: { stat: { who: "self", stat: "spa", stg: -2 } } },
    // Dark
    "Dark Pulse":   { t: "dark", cat: "spec", pow: 80, acc: 100, fx: { flinch: 20 } },
    "Sucker Punch": { t: "dark", cat: "phys", pow: 70, acc: 100, pri: 1 },
    "Nasty Plot":   { t: "dark", cat: "status", pow: 0, acc: 101, fx: { stat: { who: "self", stat: "spa", stg: 2 } } },
    "Payback":      { t: "dark", cat: "phys", pow: 50, acc: 100 },
    // Steel
    "Flash Cannon": { t: "steel", cat: "spec", pow: 80, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 10 } } },
    "Meteor Mash":  { t: "steel", cat: "phys", pow: 90, acc: 90, fx: { stat: { who: "self", stat: "atk", stg: 1, chance: 20 } } },
    "Bullet Punch": { t: "steel", cat: "phys", pow: 40, acc: 100, pri: 1 },
    "Meteor Beam":  { t: "steel", cat: "spec", pow: 120, acc: 90, charge: { msg: "is overflowing with space power!", stat: { stat: "spa", stg: 1 } } },

    // ============================================================
    // Gen 5-9 additions — signature/common moves for #494-1025.
    // ============================================================
    // Normal
    "Boomburst":    { t: "normal", cat: "spec", pow: 110, acc: 100, spread: true },
    "Judgment":     { t: "normal", cat: "spec", pow: 100, acc: 100 },
    "Tera Blast":   { t: "normal", cat: "spec", pow: 80, acc: 100 },
    "Population Bomb":{ t: "normal", cat: "phys", pow: 90, acc: 90 },
    // Fire
    "Scald":        { t: "water", cat: "spec", pow: 80, acc: 100, fx: { status: { id: "brn", chance: 30 } } },
    "Blue Flare":   { t: "fire", cat: "spec", pow: 120, acc: 85, fx: { status: { id: "brn", chance: 20 } } },
    "Fusion Flare": { t: "fire", cat: "spec", pow: 100, acc: 100 },
    "Searing Shot": { t: "fire", cat: "spec", pow: 100, acc: 100, fx: { status: { id: "brn", chance: 30 } }, spread: true },
    // Water
    "Origin Pulse": { t: "water", cat: "spec", pow: 110, acc: 85, spread: true },
    "Aqua Step":    { t: "water", cat: "phys", pow: 80, acc: 100, fx: { stat: { who: "self", stat: "spe", stg: 1 } } },
    "Fishious Rend":{ t: "water", cat: "phys", pow: 85, acc: 100 },
    // Electric
    "Bolt Strike":  { t: "electric", cat: "phys", pow: 120, acc: 85, fx: { status: { id: "par", chance: 20 } } },
    "Fusion Bolt":  { t: "electric", cat: "phys", pow: 100, acc: 100 },
    "Volt Switch":  { t: "electric", cat: "spec", pow: 70, acc: 100 },
    // Grass
    "Seed Flare":   { t: "grass", cat: "spec", pow: 120, acc: 85, fx: { stat: { who: "foe", stat: "spd", stg: -2, chance: 40 } } },
    "Ivy Cudgel":   { t: "grass", cat: "phys", pow: 100, acc: 100, fx: { crit: "high" } },
    "Apple Acid":   { t: "grass", cat: "spec", pow: 80, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1 } } },
    // Ice
    "Freeze-Dry":   { t: "ice", cat: "spec", pow: 70, acc: 100, freezeDry: true, fx: { status: { id: "frz", chance: 20 } } },
    "Glaciate":     { t: "ice", cat: "spec", pow: 65, acc: 95, fx: { stat: { who: "foe", stat: "spe", stg: -1 } }, spread: true },
    "Freezing Glare":{ t: "psychic", cat: "spec", pow: 90, acc: 100, fx: { status: { id: "frz", chance: 10 } } },
    // Fighting
    "Focus Blast":  { t: "fighting", cat: "spec", pow: 120, acc: 70, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 10 } } },
    "Secret Sword": { t: "fighting", cat: "spec", pow: 85, acc: 100 },
    "Collision Course":{ t: "fighting", cat: "phys", pow: 100, acc: 100 },
    "Drain Punch":  { t: "fighting", cat: "phys", pow: 75, acc: 100, fx: { drain: 0.5 } },
    // Poison
    "Sludge Wave":  { t: "poison", cat: "spec", pow: 95, acc: 100, fx: { status: { id: "psn", chance: 10 } }, spread: true },
    "Barb Barrage": { t: "poison", cat: "phys", pow: 60, acc: 100, fx: { status: { id: "psn", chance: 50 } } },
    // Ground
    "Scorching Sands":{ t: "ground", cat: "spec", pow: 70, acc: 100, fx: { status: { id: "brn", chance: 30 } } },
    "Sandsear Storm":{ t: "ground", cat: "spec", pow: 100, acc: 80, fx: { status: { id: "brn", chance: 20 } }, spread: true },
    "Headlong Rush":{ t: "ground", cat: "phys", pow: 120, acc: 100, fx: { stats: [{ who: "self", stat: "def", stg: -1 }, { who: "self", stat: "spd", stg: -1 }] } },
    // Flying
    "Hurricane":    { t: "flying", cat: "spec", pow: 110, acc: 70 },
    "Dual Wingbeat":{ t: "flying", cat: "phys", pow: 80, acc: 90 },
    "Bleakwind Storm":{ t: "flying", cat: "spec", pow: 100, acc: 80, fx: { stat: { who: "foe", stat: "spe", stg: -1, chance: 30 } }, spread: true },
    // Psychic
    "Psyshock":     { t: "psychic", cat: "spec", pow: 80, acc: 100 },
    "Psystrike":    { t: "psychic", cat: "spec", pow: 100, acc: 100 },
    "Expanding Force":{ t: "psychic", cat: "spec", pow: 80, acc: 100 },
    "Luster Purge": { t: "psychic", cat: "spec", pow: 95, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 50 } } },
    // Bug
    "Bug Bite":     { t: "bug", cat: "phys", pow: 60, acc: 100 },
    "Lunge":        { t: "bug", cat: "phys", pow: 80, acc: 100, fx: { stat: { who: "foe", stat: "atk", stg: -1 } } },
    "First Impression":{ t: "bug", cat: "phys", pow: 90, acc: 100, pri: 2 },
    // Rock
    "Meteor Assault":{ t: "rock", cat: "phys", pow: 150, acc: 100, recharge: true },
    "Diamond Storm":{ t: "rock", cat: "phys", pow: 100, acc: 95, fx: { stat: { who: "self", stat: "def", stg: 1, chance: 50 } }, spread: true },
    // Ghost
    "Moongeist Beam":{ t: "ghost", cat: "spec", pow: 100, acc: 100 },
    "Astral Barrage":{ t: "ghost", cat: "spec", pow: 120, acc: 100, spread: true },
    "Spectral Thief":{ t: "ghost", cat: "phys", pow: 90, acc: 100 },
    "Phantom Force":{ t: "ghost", cat: "phys", pow: 90, acc: 100, charge: { msg: "vanished instantly!", invuln: true } },
    "Hex":          { t: "ghost", cat: "spec", pow: 65, acc: 100 },
    "Poltergeist":  { t: "ghost", cat: "phys", pow: 110, acc: 90 },
    // Dragon
    "Dragon Rush":  { t: "dragon", cat: "phys", pow: 100, acc: 75, fx: { flinch: 20 } },
    "Scale Shot":   { t: "dragon", cat: "phys", pow: 75, acc: 90 },
    "Clanging Scales":{ t: "dragon", cat: "spec", pow: 110, acc: 100, fx: { stat: { who: "self", stat: "def", stg: -1 } }, spread: true },
    "Glaive Rush":  { t: "dragon", cat: "phys", pow: 120, acc: 100 },
    "Roar of Time": { t: "dragon", cat: "spec", pow: 150, acc: 90, recharge: true },
    "Spacial Rend": { t: "dragon", cat: "spec", pow: 100, acc: 95, fx: { crit: "high" } },
    // Dark
    "Knock Off":    { t: "dark", cat: "phys", pow: 65, acc: 100 },
    "Foul Play":    { t: "dark", cat: "phys", pow: 95, acc: 100 },
    "Snarl":        { t: "dark", cat: "spec", pow: 55, acc: 95, fx: { stat: { who: "foe", stat: "spa", stg: -1 } } },
    "Ruination":    { t: "dark", cat: "spec", pow: 80, acc: 90 },
    "Lash Out":     { t: "dark", cat: "phys", pow: 75, acc: 100 },
    "Fiery Wrath":  { t: "dark", cat: "spec", pow: 90, acc: 100, fx: { flinch: 20 }, spread: true },
    // Steel
    "Sunsteel Strike":{ t: "steel", cat: "phys", pow: 100, acc: 100 },
    "Behemoth Blade":{ t: "steel", cat: "phys", pow: 100, acc: 100 },
    "Make It Rain": { t: "steel", cat: "spec", pow: 120, acc: 100, fx: { stat: { who: "self", stat: "spa", stg: -1 } }, spread: true },
    "Gigaton Hammer":{ t: "steel", cat: "phys", pow: 120, acc: 100 },
    "Steel Beam":   { t: "steel", cat: "spec", pow: 120, acc: 95, fx: { recoil: 0.25 } },
    // Fairy
    "Play Rough":   { t: "fairy", cat: "phys", pow: 90, acc: 90, fx: { stat: { who: "foe", stat: "atk", stg: -1, chance: 10 } } },
    "Dazzling Gleam":{ t: "fairy", cat: "spec", pow: 80, acc: 100, spread: true },
    "Spirit Break": { t: "fairy", cat: "phys", pow: 75, acc: 100, fx: { stat: { who: "foe", stat: "spa", stg: -1 } } },
    "Fleur Cannon": { t: "fairy", cat: "spec", pow: 130, acc: 90, fx: { stat: { who: "self", stat: "spa", stg: -2 } } },
    "Draining Kiss":{ t: "fairy", cat: "spec", pow: 50, acc: 100, fx: { drain: 0.5 } },
  };
})();
