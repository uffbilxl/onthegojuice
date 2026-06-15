// ─────────────────────────────────────────────────────────────────────────────
// Flavor Matchmaker — Recommendation Engine
// Scoring weights: base 40 | texture 30 | modifier 20 | dietary 10 (60 if special)
// ─────────────────────────────────────────────────────────────────────────────

const DRINKS_DB = [
  { name: "Carrot & Ginger",                         base: "carrot",   texture: "juice",  modifier: "ginger",      dietary: "standard"     },
  { name: "Carrot & Lime",                            base: "carrot",   texture: "juice",  modifier: "citrus",      dietary: "standard"     },
  { name: "Carrot & Lemon",                           base: "carrot",   texture: "juice",  modifier: "citrus",      dietary: "standard"     },
  { name: "Carrot & Milk",                            base: "carrot",   texture: "creamy", modifier: "classic",     dietary: "standard"     },
  { name: "Beetroot & Milk",                          base: "beetroot", texture: "creamy", modifier: "classic",     dietary: "standard"     },
  { name: "Carrot & Beetroot with Milk",              base: "mix",      texture: "creamy", modifier: "classic",     dietary: "standard"     },
  { name: "Beetroot & Apple",                         base: "beetroot", texture: "juice",  modifier: "sweet_fruit", dietary: "standard"     },
  { name: "Beetroot & Ginger",                        base: "beetroot", texture: "juice",  modifier: "ginger",      dietary: "standard"     },
  { name: "Beetroot & ginger shots",                  base: "beetroot", texture: "juice",  modifier: "ginger",      dietary: "standard"     },
  { name: "Carrot & Grapefruit",                      base: "carrot",   texture: "juice",  modifier: "citrus",      dietary: "standard"     },
  { name: "Sorrel & Ginger",                          base: "tropical", texture: "juice",  modifier: "ginger",      dietary: "standard"     },
  { name: "Lactose Free Carrot & Milk",               base: "carrot",   texture: "creamy", modifier: "classic",     dietary: "lactose_free" },
  { name: "Lactose Free Beetroot, Carrot & Milk",     base: "mix",      texture: "creamy", modifier: "classic",     dietary: "lactose_free" },
  { name: "Beetroot, Carrot & Milk - No added sugar", base: "mix",      texture: "creamy", modifier: "classic",     dietary: "no_sugar"     },
  { name: "Carrot & Milk - No added sugar",           base: "carrot",   texture: "creamy", modifier: "classic",     dietary: "no_sugar"     },
  { name: "Breadfruit and Milk",                      base: "tropical", texture: "creamy", modifier: "classic",     dietary: "standard"     },
  { name: "Mango and Milk",                           base: "tropical", texture: "creamy", modifier: "sweet_fruit", dietary: "standard"     },
  { name: "Carrot and Water Melon",                   base: "carrot",   texture: "juice",  modifier: "sweet_fruit", dietary: "standard"     },
  { name: "Ginger shots",                             base: "fire",     texture: "juice",  modifier: "ginger",      dietary: "standard"     },
];

function getBestMatch({ base, texture, modifier, dietary }) {
  let best      = null;
  let bestScore = -Infinity;

  for (const drink of DRINKS_DB) {
    let score = 0;

    // Base (40 pts) — partial credit when user picks mix and drink is single-base, or vice-versa
    if (drink.base === base) {
      score += 40;
    } else if (base === "mix" && (drink.base === "carrot" || drink.base === "beetroot")) {
      score += 15;
    } else if ((base === "carrot" || base === "beetroot") && drink.base === "mix") {
      score += 15;
    }

    // Texture (30 pts)
    if (drink.texture === texture) score += 30;

    // Modifier (20 pts) — small fallback keeps "classic" competitive against unmatched flavors
    if (drink.modifier === modifier) {
      score += 20;
    } else if (modifier === "classic") {
      score += 5;
    }

    // Dietary — aggressive weighting so lactose-free / no-sugar always surface first
    if (dietary === "lactose_free") {
      if (drink.dietary === "lactose_free") score += 60;
      else if (drink.texture === "creamy")  score -= 40;  // penalise other creamy options
    } else if (dietary === "no_sugar") {
      if (drink.dietary === "no_sugar")     score += 60;
      else if (drink.texture === "creamy")  score -= 30;
    } else {
      // standard
      if (drink.dietary === "standard")     score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      best      = drink.name;
    }
  }

  return best;
}

const VALID = {
  base:     ["carrot", "beetroot", "mix", "tropical", "fire"],
  texture:  ["creamy", "juice"],
  modifier: ["ginger", "citrus", "sweet_fruit", "classic"],
  dietary:  ["standard", "lactose_free", "no_sugar"],
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { base, texture, modifier, dietary } = req.body || {};

  if (!base || !texture || !modifier || !dietary) {
    return res.status(400).json({ error: "Missing required fields: base, texture, modifier, dietary" });
  }

  if (
    !VALID.base.includes(base)     ||
    !VALID.texture.includes(texture) ||
    !VALID.modifier.includes(modifier) ||
    !VALID.dietary.includes(dietary)
  ) {
    return res.status(400).json({ error: "One or more answer values are invalid" });
  }

  const recommended_drink = getBestMatch({ base, texture, modifier, dietary });
  return res.status(200).json({ recommended_drink });
}
