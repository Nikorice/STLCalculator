# Powder 3D Printer Cost Calculator

## Overview
This application calculates material costs, print time, and optimal printer packing arrangements for powder-based 3D printing. It supports STL file uploads and manual dimension input for cost estimation.

## Default Constants & Material Calculations

### Material Usage Constants
```javascript
const POWDER_KG_PER_CM3 = 0.002;  // 2g per cm³
const BINDER_ML_PER_CM3 = 0.27;   // 270ml per liter
const SILICA_G_PER_CM3 = 0.55;    // 0.55g per cm³
```

### Glaze Usage Formula
The glaze usage is calculated using the following formula:
```javascript
function calculateGlazeUsage(volumeCm3) {
  return 0.1615 * volumeCm3 + 31.76; // grams
}
```

### Bulk Material Purchase Prices
The default unit prices are derived from these bulk purchase costs:

| Material | Quantity | JPY | EUR | USD | SGD |
|----------|----------|-----|-----|-----|-----|
| Powder | 14kg | ¥200,000 | €1,300 | $1,400 | S$1,890 |
| Binder | 20kg | ¥250,000 | €1,700 | $1,800 | S$2,400 |
| Silica | 1kg | ¥11,000 | €69 | $72 | S$100 |
| Glaze | 9L | ¥14,000 | €88 | $91 | S$123 |

### Default Material Pricing (Unit Prices)
Calculated from bulk purchase prices:

| Material | USD | EUR | JPY | SGD |
|----------|-----|-----|-----|-----|
| Powder (per kg) | $100.00 | €92.86 | ¥14,285.71 | S$135.00 |
| Binder (per ml) | $0.09 | €0.085 | ¥12.50 | S$0.12 |
| Silica (per g) | $0.072 | €0.069 | ¥11.00 | S$0.10 |
| Glaze (per g) | $0.01 | €0.0098 | ¥1.56 | S$0.0137 |

### Printer Specifications

#### Printer 400
- Print volume: 390mm × 290mm × 200mm
- Layer time: 45 seconds per 0.1mm layer

#### Printer 600
- Print volume: 595mm × 600mm × 250mm
- Layer time: 35 seconds per 0.1mm layer

### Spacing Settings
- Wall margin: 10mm (default)
- Object spacing: 15mm (default)

## Cost Calculation Formula

For each material:
1. Calculate volume-based usage
2. Multiply by cost per unit
3. Sum all material costs

```
Total Cost = (Powder_kg × Powder_price) + 
             (Binder_ml × Binder_price) + 
             (Silica_g × Silica_price) + 
             (Glaze_g × Glaze_price)
```

## Print Time Calculation

Print time is calculated based on the total height of the print and the layer time:
```
Print Time (seconds) = (Total_height_mm / 0.1) × Layer_time_seconds
```

## Packing Optimization

The application calculates:
1. Maximum number of objects that fit in XY plane
2. Maximum number of objects that can be stacked in Z direction
3. Total number of objects per print job
4. Optimized orientation (flat or vertical)

## STL Volume Calculation

Volume is calculated using the divergence theorem to sum the signed volumes of tetrahedra formed by triangular faces:

```
Total Volume = Sum of (Dot product of vertex position with cross product of other two vertices) / 6
```

## Performance Optimizations

- Chunked STL processing
- Web Worker for heavy calculations
- Three.js rendering optimizations
- Throttled updates and animations
- Memory-efficient data handling

## File Structure

- `powder-calc-part1.html`: Main HTML structure
- `powder-calc-main.js`: Script loader and initialization
- `powder-calc-part2.js`: Core functionality and calculations
- `powder-calc-part3.js`: Three.js visualizations
- `powder-calc-part4a.js`: UI core functions
- `powder-calc-part4b.js`: Calculation functions
- `stl-worker.js`: Web Worker for STL processing
