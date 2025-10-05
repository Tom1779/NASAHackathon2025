# Asteroid Economic & Composition Model Documentation

## Introduction

This document explains the data and algorithms behind the asteroid composition and economic value calculations within this application. The model is heavily inspired by the original Asterank project but includes significant enhancements and ongoing refinements for scientific accuracy and economic realism.

The goal is to provide a transparent, step-by-step guide to how the application determines what an asteroid is made of and what it's worth.

---

## Part 1: Asteroid Physical & Composition Model

### 1.1 Mass Calculation

The asteroid's mass is the single most important factor in its valuation. The calculation logic resides in `calculateAsterankMass` within `useAsteroidCalculations.ts`.

**Calculation Hierarchy:**

1. **Gravitational Parameter (GM):** If NASA's SBDB provides a `GM` value, mass is calculated directly (`mass = GM / G`). This is the most accurate method.
2. **Diameter & Density:** If `GM` is unavailable, mass is estimated from the asteroid's diameter and its estimated density, which is derived from its spectral type.

**The "Huge Asteroid Penalty"**

A critical feature inherited from the original Asterank code is a penalty applied to very large asteroids:

```typescript
// Asterank penalty for huge asteroids
if (mass > 1e18) {
  mass = mass * 1e-6
}
```

- **What it does:** If an asteroid's calculated mass exceeds 1 quintillion tons (1e18 kg), its mass is artificially reduced by a factor of one million.
- **Why it exists:** This is not a scientific correction but an _economic_ one. The original author reasoned that for massive bodies like dwarf planets, the most valuable materials would be buried deep beneath a thick crust and a powerful gravity well would make extraction prohibitively expensive. The penalty reflects an assumption that only a tiny fraction of the total mass is economically accessible.

### 1.2 Composition Data

An asteroid's composition is derived from its spectral type (e.g., C, S, M). This data is the foundation for all economic valuations.

- **Data Location:** The composition percentages for each spectral type are defined in `frontend/src/composables/useComposition.ts`.
- **Key Improvement - Precious Metals:** A significant enhancement was made to add realistic trace amounts of **Gold (Au)** and **Platinum (Pt)** to various spectral types (M, S, C, O, X-types). The original data was missing these, making it impossible to replicate Asterank's high-value estimates. These precious metals are the primary drivers of profit in the economic model.

**Spectral Type Examples:**

- **M-type (Metallic):** 45% iron, 35% nickel, 0.05% platinum, 0.02% gold
- **S-type (Stony):** 25% iron, 12% nickel, 0.001% platinum, 0.0005% gold
- **C-type (Carbonaceous):** 35% carbon, 20% water, trace precious metals
- **X-type variants:** High metallic content with significant precious metal percentages

---

## Part 2: Economic Calculation Model

The application presents two distinct profit calculations, which can be confusing without context:

- **Per-Material Net Profit (The Green/Red Numbers):** Shows the profitability of extracting _each individual material_.
- **Overall Mission Profit (The Purple Number):** A holistic mission feasibility score based on the original Asterank formula.

### 2.1 Per-Material Net Profit (The Green/Red Numbers)

This calculation shows which materials are worth mining from an individual material perspective.

**Current Implementation:**

- **Formula:** `Net Profit = Gross Value - Total Costs`
- **Cost Model:** Uses realistic operational costs from `OPERATIONAL_COSTS`:

  ```typescript
  OPERATIONAL_COSTS = {
    extraction: 15, // $15/kg - mining and processing
    transportation: 85, // $85/kg - Earth to asteroid and return
    refining: 25, // $25/kg - purification and processing
    overhead: 10, // $10/kg - mission overhead and profit margin
  }
  // Total: $135/kg
  ```

**The Problem - Uniform Cost Application:**
Currently, the same $135/kg operational cost is applied to ALL materials, leading to unrealistic results:

- **Gold ($124,800/kg):** $124,800 - $135 = **+$124,665/kg profit** ✅
- **Platinum ($51,600/kg):** $51,600 - $135 = **+$51,465/kg profit** ✅
- **Water ($22/kg):** $22 - $135 = **-$113/kg loss** ❌
- **Iron ($0.57/kg):** $0.57 - $135 = **-$134.43/kg loss** ❌

This creates massive apparent losses for bulk materials that would actually be profitable when used in-situ.

**Color Coding:**

- 🟢 **Green:** Material generates positive profit (netProfit > 0)
- 🔴 **Red:** Material loses money (netProfit < 0)

### 2.2 Overall Mission Profit (The Purple Number)

This is the top-line profit estimate, based on the original Asterank algorithm.

**Purpose:** To provide a single, comparable score for an asteroid's economic viability.

**Formula:**

```typescript
profit = (price / 12) * (closeness / 3417.5490736698116) * profitRatio * massComplexityPenalty
```

**Key Factors:**

1. **Total Value (`price`):** The total market value of all materials in the asteroid
2. **Accessibility (`closeness`):** A score based on the asteroid's orbit (MOID, delta-v, etc.)
3. **Profit Ratio:** Based on the mission's delta-v requirements
4. **Mass Complexity Penalty:** Logarithmic scaling for very large asteroids to account for extraction difficulties

**Why Purple ≠ Sum of Green Numbers:**
These use completely different cost models:

- **Green numbers:** Per-kg operational costs
- **Purple number:** Asterank's mission-level economic formula

---

## Part 3: Market Prices & Economic Assumptions

### 3.1 Material Pricing

The economic model uses 2025 market prices with space delivery premiums:

```typescript
MARKET_PRICES = {
  gold: 124800, // $124,800/kg (2x Earth price for space delivery)
  platinum: 51600, // $51,600/kg
  nickel: 35.2, // $35.2/kg
  cobalt: 92.4, // $92.4/kg
  water: 22, // $22/kg (high value in space)
  iron: 0.57, // $0.57/kg
  carbon: 2.2, // $2.2/kg
  silicates: 0.1, // $0.1/kg
}
```

### 3.2 Economic Drivers

**Primary Profit Drivers:**

1. **Precious Metals (Gold, Platinum):** Extremely high value-to-weight ratio
2. **Strategic Metals (Cobalt, Rare Earths):** Critical for technology
3. **Space Resources (Water, Carbon):** Essential for in-space operations

**Economic Insights:**

- Even trace amounts of precious metals (0.01%) can make an asteroid profitable
- Bulk materials are often unprofitable to return to Earth but valuable in space
- Mission accessibility (delta-v) significantly impacts overall profitability

---

## Part 4: Known Issues & Future Improvements

### 4.1 Current Problems

1. **Material Cost Uniformity:** The flat $135/kg cost doesn't reflect real-world extraction economics
2. **Transport Assumption:** Current model assumes ALL materials are transported to Earth
3. **In-Situ Resource Utilization:** No accounting for materials used in space operations

### 4.2 Proposed Solutions

**Material-Specific Operational Costs:**

```typescript
const MATERIAL_SPECIFIC_COSTS = {
  // High-cost tier (Earth return required)
  gold: 1000, // $1000/kg (complex refining + transport)
  platinum: 800, // $800/kg (complex refining + transport)

  // Mid-cost tier (in-space processing)
  cobalt: 200, // $200/kg (moderate processing)
  nickel: 50, // $50/kg (simple extraction)

  // Low-cost tier (in-situ use)
  water: 5, // $5/kg (simple collection)
  carbon: 3, // $3/kg (bulk organic)
  iron: 10, // $10/kg (construction material)
  silicates: 1, // $1/kg (construction aggregate)
}
```

This would resolve the contradiction where water shows massive losses despite being extremely valuable in space.

### 4.3 Future Enhancements

1. **Mission Scenario Selection:** Allow users to choose Earth-return vs. in-space utilization
2. **Dynamic Pricing:** Adjust prices based on supply/demand scenarios
3. **Technology Progression:** Model improving extraction efficiency over time
4. **Risk Assessment:** Include geological and technical risk factors

---

## Conclusion

The current economic model provides a solid foundation for asteroid valuation but requires refinement to resolve contradictions between per-material and mission-level calculations. The key insight is that **precious metals drive the economics** - even tiny percentages of gold and platinum can make an otherwise unprofitable asteroid extremely valuable.

The model successfully demonstrates why companies like Planetary Resources focused on metallic asteroids: the combination of high-value materials and established Earth markets creates compelling investment opportunities, even with the enormous technical challenges of space mining.

**Key Takeaway:** Focus on the green numbers for material selection, use the purple number for mission feasibility, and remember that the real value lies in the precious metals hidden within these ancient space rocks.
