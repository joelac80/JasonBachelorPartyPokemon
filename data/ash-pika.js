/* ash-pika.js — ⚡ ASH'S PIKACHU (form 10094): the living trophy for beating
   Pokémon Master Ash. Wears the shiny-Pikachu palette so he reads as HIS
   Pikachu at a glance, carries the Light Ball forever (statsFor hands him a
   Mega-class attack in Pikachu's own frail body — one-shot or be one-shot),
   keeps Pikachu's speed (90) and curated moveset (FORM_BASE → 25),
   and is absent from DEX_EVOS/EVO_LEVELS — so no stone, level, or KO streak
   will EVER evolve him. He doesn't need to. Awarded once, on the "ash" win. */
(function () {
  window.DEX = window.DEX || {};
  DEX[10094] = { n: "Ash's Pikachu", x: 112, t: ["electric"] };   // Pikachu's own body (x matches #25)
  window.DEX_SPEED = window.DEX_SPEED || {};
  DEX_SPEED[10094] = 90;
  var S = window.DEX_SPRITES || (window.DEX_SPRITES = {});
  var B = window.DEX_SPRITES_BACK || (window.DEX_SPRITES_BACK = {});
  var SS = window.DEX_SPRITES_SHINY || (window.DEX_SPRITES_SHINY = {});
  var BS = window.DEX_SPRITES_BACK_SHINY || (window.DEX_SPRITES_BACK_SHINY = {});
  if (SS[25]) { S[10094] = SS[25]; SS[10094] = SS[25]; }
  if (BS[25]) { B[10094] = BS[25]; BS[10094] = BS[25]; }
})();
