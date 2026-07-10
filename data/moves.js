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
    "Take Down":   { t: "normal", cat: "phys", pow: 80, acc: 85, fx: { recoil: 0.25 } },
    "Hyper Beam":  { t: "normal", cat: "spec", pow: 120, acc: 90 },
    "Swift":       { t: "normal", cat: "spec", pow: 60, acc: 101 },
    "Tri Attack":  { t: "normal", cat: "spec", pow: 80, acc: 100, fx: { status: { id: "par", chance: 20 } } },
    "Return":      { t: "normal", cat: "phys", pow: 75, acc: 100 },
    "Strength":    { t: "normal", cat: "phys", pow: 70, acc: 100 },
    "Cut":         { t: "normal", cat: "phys", pow: 50, acc: 95 },
    "Fury Swipes": { t: "normal", cat: "phys", pow: 55, acc: 90 },
    "Egg Bomb":    { t: "normal", cat: "phys", pow: 90, acc: 75 },
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
    "Surf":        { t: "water", cat: "spec", pow: 90, acc: 100 },
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
    "Solar Beam":  { t: "grass", cat: "spec", pow: 110, acc: 100 },
    "Vine Whip":   { t: "grass", cat: "phys", pow: 45, acc: 100 },
    "Petal Dance": { t: "grass", cat: "spec", pow: 90, acc: 100 },
    "Sleep Powder":{ t: "grass", cat: "status", pow: 0, acc: 75, fx: { status: { id: "slp", chance: 100 } } },
    "Spore":       { t: "grass", cat: "status", pow: 0, acc: 100, fx: { status: { id: "slp", chance: 100 } } },
    "Stun Spore":  { t: "grass", cat: "status", pow: 0, acc: 75, fx: { status: { id: "par", chance: 100 } } },
    "Leech Seed":  { t: "grass", cat: "status", pow: 0, acc: 90, fx: { seed: true } },
    // ---- Ice ----
    "Ice Beam":    { t: "ice", cat: "spec", pow: 90, acc: 100, fx: { status: { id: "frz", chance: 10 } } },
    "Blizzard":    { t: "ice", cat: "spec", pow: 110, acc: 70, fx: { status: { id: "frz", chance: 10 } } },
    "Ice Punch":   { t: "ice", cat: "phys", pow: 75, acc: 100, fx: { status: { id: "frz", chance: 10 } } },
    "Aurora Beam": { t: "ice", cat: "spec", pow: 65, acc: 100, fx: { stat: { who: "foe", stat: "atk", stg: -1, chance: 10 } } },
    "Powder Snow": { t: "ice", cat: "spec", pow: 40, acc: 100, fx: { status: { id: "frz", chance: 10 } } },
    // ---- Fighting ----
    "Karate Chop": { t: "fighting", cat: "phys", pow: 50, acc: 100, fx: { crit: "high" } },
    "Brick Break": { t: "fighting", cat: "phys", pow: 65, acc: 100 },
    "Cross Chop":  { t: "fighting", cat: "phys", pow: 100, acc: 80, fx: { crit: "high" } },
    "Low Kick":    { t: "fighting", cat: "phys", pow: 55, acc: 90, fx: { flinch: 30 } },
    "Dynamic Punch":{ t: "fighting", cat: "phys", pow: 100, acc: 50 },
    "Mach Punch":  { t: "fighting", cat: "phys", pow: 40, acc: 100, pri: 1 },
    "Submission":  { t: "fighting", cat: "phys", pow: 80, acc: 80, fx: { recoil: 0.25 } },
    // ---- Poison ----
    "Sludge":      { t: "poison", cat: "spec", pow: 65, acc: 100, fx: { status: { id: "psn", chance: 30 } } },
    "Sludge Bomb": { t: "poison", cat: "spec", pow: 90, acc: 100, fx: { status: { id: "psn", chance: 30 } } },
    "Poison Sting":{ t: "poison", cat: "phys", pow: 40, acc: 100, fx: { status: { id: "psn", chance: 30 } } },
    "Acid":        { t: "poison", cat: "spec", pow: 60, acc: 100, fx: { stat: { who: "foe", stat: "def", stg: -1, chance: 10 } } },
    "Toxic":       { t: "poison", cat: "status", pow: 0, acc: 90, fx: { status: { id: "psn", chance: 100 } } },
    // ---- Ground ----
    "Earthquake":  { t: "ground", cat: "phys", pow: 100, acc: 100 },
    "Dig":         { t: "ground", cat: "phys", pow: 60, acc: 100 },
    "Mud-Slap":    { t: "ground", cat: "spec", pow: 40, acc: 100, fx: { stat: { who: "foe", stat: "acc", stg: -1 } } },
    "Bone Club":   { t: "ground", cat: "phys", pow: 65, acc: 85, fx: { flinch: 10 } },
    "Bonemerang":  { t: "ground", cat: "phys", pow: 50, acc: 90 },
    // ---- Flying ----
    "Wing Attack": { t: "flying", cat: "phys", pow: 60, acc: 100 },
    "Aerial Ace":  { t: "flying", cat: "phys", pow: 60, acc: 101 },
    "Drill Peck":  { t: "flying", cat: "phys", pow: 80, acc: 100 },
    "Peck":        { t: "flying", cat: "phys", pow: 35, acc: 100 },
    "Sky Attack":  { t: "flying", cat: "phys", pow: 110, acc: 90 },
    "Fly":         { t: "flying", cat: "phys", pow: 70, acc: 95 },
    "Gust":        { t: "flying", cat: "spec", pow: 40, acc: 100 },
    // ---- Psychic ----
    "Confusion":   { t: "psychic", cat: "spec", pow: 50, acc: 100 },
    "Psybeam":     { t: "psychic", cat: "spec", pow: 65, acc: 100 },
    "Psychic":     { t: "psychic", cat: "spec", pow: 90, acc: 100, fx: { stat: { who: "foe", stat: "spd", stg: -1, chance: 10 } } },
    "Hypnosis":    { t: "psychic", cat: "status", pow: 0, acc: 60, fx: { status: { id: "slp", chance: 100 } } },
    "Agility":     { t: "psychic", cat: "status", pow: 0, acc: 101, fx: { stat: { who: "self", stat: "spe", stg: 2 } } },
    "Amnesia":     { t: "psychic", cat: "status", pow: 0, acc: 101, fx: { stat: { who: "self", stat: "spd", stg: 2 } } },
    "Future Sight":{ t: "psychic", cat: "spec", pow: 80, acc: 90 },
    // ---- Bug ----
    "Fury Cutter": { t: "bug", cat: "phys", pow: 50, acc: 95 },
    "Megahorn":    { t: "bug", cat: "phys", pow: 120, acc: 85 },
    "Pin Missile": { t: "bug", cat: "phys", pow: 55, acc: 85 },
    "Twineedle":   { t: "bug", cat: "phys", pow: 60, acc: 100, fx: { status: { id: "psn", chance: 20 } } },
    "Leech Life":  { t: "bug", cat: "phys", pow: 40, acc: 100, fx: { drain: 0.5 } },
    "String Shot": { t: "bug", cat: "status", pow: 0, acc: 95, fx: { stat: { who: "foe", stat: "spe", stg: -1 } } },
    // ---- Rock ----
    "Rock Throw":  { t: "rock", cat: "phys", pow: 50, acc: 90 },
    "Rock Slide":  { t: "rock", cat: "phys", pow: 75, acc: 90, fx: { flinch: 30 } },
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
    "Iron Tail":   { t: "steel", cat: "phys", pow: 90, acc: 75, fx: { stat: { who: "foe", stat: "def", stg: -1, chance: 30 } } },
    "Steel Wing":  { t: "steel", cat: "phys", pow: 70, acc: 90, fx: { stat: { who: "self", stat: "def", stg: 1, chance: 10 } } },
    // ---- Fairy (Gen-2 had no Fairy type; these read as fairy in our chart) ----
    "Fairy Wind":  { t: "fairy", cat: "spec", pow: 40, acc: 100 },
    "Sweet Kiss":  { t: "fairy", cat: "status", pow: 0, acc: 75, fx: { stat: { who: "foe", stat: "acc", stg: -1 } } },
    "Moonblast":   { t: "fairy", cat: "spec", pow: 95, acc: 100, fx: { stat: { who: "foe", stat: "spa", stg: -1, chance: 30 } } },
    "Charm":       { t: "fairy", cat: "status", pow: 0, acc: 100, fx: { stat: { who: "foe", stat: "atk", stg: -2 } } },
  };
})();
