/* powder-calc-part4b.js - Calculation Functions & Event Handlers */

/* ====================== CALCULATION AND EVENT FUNCTIONS ====================== */
// Update results for a specific STL row
async function updateResults(rowId) {
    perfMonitor.start('updateResults');
    
    const row = document.getElementById(rowId);
    const resultsPanel = document.getElementById(`${rowId}-results`);
    
    if (!resultsPanel || !row) {
      perfMonitor.end('updateResults');
      return;
    }
    
    const volumeCm3 = parseFloat(resultsPanel.dataset.volume);
    if (isNaN(volumeCm3)) {
      perfMonitor.end('updateResults');
      return;
    }
    
    // Get width, depth, height, orientation, and print time
    const width = parseFloat(resultsPanel.dataset.width);
    const depth = parseFloat(resultsPanel.dataset.depth);
    const height = parseFloat(resultsPanel.dataset.height);
    const orientation = resultsPanel.dataset.orientation || "flat";
    
    // Get current currency
    const currency = document.getElementById("currency").value;
    const currencySymbol = {
      'EUR': '€',
      'USD': '$',
      'JPY': '¥',
      'SGD': 'S$'
    }[currency];
    
    // Calculate material usage
    const powderKg = volumeCm3 * POWDER_KG_PER_CM3;
    const binderMl = volumeCm3 * BINDER_ML_PER_CM3;
    const silicaG = volumeCm3 * SILICA_G_PER_CM3;
    const glazeG = calculateGlazeUsage(volumeCm3);
    
    // Get pricing
    const p = pricing[currency];
    
    // Calculate costs
    let costPowder = powderKg * p.powder;
    let costBinder = binderMl * p.binder;
    let costSilica = silicaG * p.silica;
    let costGlaze = glazeG * p.glaze;
    
    // Check glaze toggle
    const glazeToggle = resultsPanel.querySelector('.glaze-toggle');
    const includeGlaze = glazeToggle && glazeToggle.checked;
    if (!includeGlaze) costGlaze = 0;
    
    // Total cost
    const totalCost = costPowder + costBinder + costSilica + costGlaze;
    
    // Batch DOM updates for better performance
    // Create a document fragment for updates
    const updates = {};
    
    // Prepare total cost update
    updates.totalCost = `${currencySymbol}${totalCost.toFixed(2)}`;
    
    // Prepare stats updates
    updates.volume = volumeCm3.toFixed(2);
    updates.dimensions = `${width.toFixed(1)} × ${depth.toFixed(1)} × ${height.toFixed(1)}`;
    
    // Prepare progress bar data
    updates.progressData = [
      { name: "Powder", cost: costPowder, color: "#3a86ff" },
      { name: "Binder", cost: costBinder, color: "#ff006e" },
      { name: "Silica", cost: costSilica, color: "#8338ec" },
      { name: "Glaze", cost: costGlaze, color: "#ffbe0b" }
    ];
    
    // Calculate printer packing in parallel with the UI updates
    const packingPromise = (async () => {
      if (isNaN(width) || isNaN(depth) || isNaN(height)) return null;
      
      try {
        // Printer 400
        const packing400 = calculateOptiPacking(width, depth, height, printer400);
        const packPositions400 = packing400.fitsInPrinter ? 
          generatePackingPositions(width, depth, height, printer400) : [];
        const cost400 = packing400.totalObjects * totalCost;
        
        let printTime400 = "N/A";
        if (packing400.fitsInPrinter) {
          const totalLayers400 = Math.ceil(packing400.totalHeight / 0.1);
          printTime400 = totalLayers400 * printer400.layerTime;
        }
        
        // Printer 600
        const packing600 = calculateOptiPacking(width, depth, height, printer600);
        const packPositions600 = packing600.fitsInPrinter ? 
          generatePackingPositions(width, depth, height, printer600) : [];
        const cost600 = packing600.totalObjects * totalCost;
        
        let printTime600 = "N/A";
        if (packing600.fitsInPrinter) {
          const totalLayers600 = Math.ceil(packing600.totalHeight / 0.1);
          printTime600 = totalLayers600 * printer600.layerTime;
        }
        
        return {
          printer400: {
            packing: packing400,
            positions: packPositions400,
            cost: cost400,
            printTime: printTime400
          },
          printer600: {
            packing: packing600,
            positions: packPositions600,
            cost: cost600,
            printTime: printTime600
          }
        };
      } catch (err) {
        console.error("Error in packing calculation:", err);
        return null;
      }
    })();
    
    // Apply all DOM updates at once - this reduces layout thrashing
    requestAnimationFrame(() => {
      // Update total cost
      const totalCostElement = resultsPanel.querySelector(".total-cost");
      if (totalCostElement) {
        totalCostElement.textContent = updates.totalCost;
      }
      
      // Update stats
      const statBoxes = resultsPanel.querySelectorAll(".stat-box");
      if (statBoxes.length >= 2) {
        const volumeValue = statBoxes[0].querySelector(".stat-value");
        if (volumeValue) {
          volumeValue.textContent = updates.volume;
        }
        const dimensionsValue = statBoxes[1].querySelector(".stat-value");
        if (dimensionsValue) {
          dimensionsValue.textContent = updates.dimensions;
        }
      }
      
      // Update progress bars
      const progressContainer = resultsPanel.querySelector(".progress-container");
      if (progressContainer) {
        createProgressBars(progressContainer, updates.progressData, totalCost, currency);
      }
    });
    
    // Now handle the packing results after they've been calculated
    const packingResults = await packingPromise;
    if (packingResults) {
      requestAnimationFrame(() => {
        // Prepare STL geometry for packing
        let stlGeometry = null;
        if (row.stlArrayBuffer) {
          try {
            const stlLoader = new THREE.STLLoader();
            stlGeometry = stlLoader.parse(row.stlArrayBuffer);
          } catch (err) {
            console.warn("Could not load STL for packing visualization:", err);
          }
        }
        
        // Update printer stats
        const printer400Stats = document.getElementById(`${rowId}-printer-400-stats`);
        if (printer400Stats) {
          if (packingResults.printer400.packing.fitsInPrinter) {
            printer400Stats.innerHTML = `
              <p><span class="printer-highlight">${packingResults.printer400.packing.totalObjects}</span> objects</p>
              <p>Arrangement: ${packingResults.printer400.packing.arrangement}</p>
              <p>Print Time: ${formatPrintTime(packingResults.printer400.printTime)}</p>
              <p>Total Cost: ${currencySymbol}${packingResults.printer400.cost.toFixed(2)}</p>
            `;
          } else {
            printer400Stats.innerHTML = `
              <p style="color: #e63946; font-weight: 600;">Object exceeds printer capacity</p>
              <p>Max dimensions: ${printer400.width}mm × ${printer400.depth}mm × ${printer400.height}mm</p>
            `;
          }
        }
        
        const printer600Stats = document.getElementById(`${rowId}-printer-600-stats`);
        if (printer600Stats) {
          if (packingResults.printer600.packing.fitsInPrinter) {
            printer600Stats.innerHTML = `
              <p><span class="printer-highlight">${packingResults.printer600.packing.totalObjects}</span> objects</p>
              <p>Arrangement: ${packingResults.printer600.packing.arrangement}</p>
              <p>Print Time: ${formatPrintTime(packingResults.printer600.printTime)}</p>
              <p>Total Cost: ${currencySymbol}${packingResults.printer600.cost.toFixed(2)}</p>
            `;
          } else {
            printer600Stats.innerHTML = `
              <p style="color: #e63946; font-weight: 600;">Object exceeds printer capacity</p>
              <p>Max dimensions: ${printer600.width}mm × ${printer600.depth}mm × ${printer600.height}mm</p>
            `;
          }
        }
        
        // Visualize packing on next animation frame to avoid blocking the UI
        setTimeout(() => {
          // Visualize packing (updated to pass orientation)
          const packing400Vis = document.getElementById(`${rowId}-packing-400`);
          if (packing400Vis) {
            visualizePacking(
              printer400,
              width,
              depth,
              height,
              packingResults.printer400.positions,
              packing400Vis,
              stlGeometry,
              orientation
            );
          }
          
          const packing600Vis = document.getElementById(`${rowId}-packing-600`);
          if (packing600Vis) {
            visualizePacking(
              printer600,
              width,
              depth,
              height,
              packingResults.printer600.positions,
              packing600Vis,
              stlGeometry,
              orientation
            );
          }
        }, 0);
      });
    }
    
    perfMonitor.end('updateResults');
  }

// Calculate manual input results
function calculateManualResults() {
  perfMonitor.start('manualCalculation');
  
  // Get input values
  const volumeCm3 = parseFloat(document.getElementById("volume").value);
  const width = parseFloat(document.getElementById("width").value);
  const depth = parseFloat(document.getElementById("depth").value);
  const height = parseFloat(document.getElementById("height").value);
  
  if (
    isNaN(volumeCm3) || isNaN(width) ||
    isNaN(depth) || isNaN(height) ||
    volumeCm3 <= 0 || width <= 0 ||
    depth <= 0 || height <= 0
  ) {
    alert("Please enter valid dimensions and volume.");
    perfMonitor.end('manualCalculation');
    return;
  }
  
  // Determine orientation automatically
  const optimalOrientation = determineOptimalOrientation(width, depth, height);
  
  // Get currency
  const currency = document.getElementById("currency").value;
  const currencySymbol = {
    'EUR': '€',
    'USD': '$',
    'JPY': '¥',
    'SGD': 'S$'
  }[currency];
  
  // Calculate material usage
  const powderKg = volumeCm3 * POWDER_KG_PER_CM3;
  const binderMl = volumeCm3 * BINDER_ML_PER_CM3;
  const silicaG = volumeCm3 * SILICA_G_PER_CM3;
  const glazeG = calculateGlazeUsage(volumeCm3);
  
  // Pricing
  const p = pricing[currency];
  
  let costPowder = powderKg * p.powder;
  let costBinder = binderMl * p.binder;
  let costSilica = silicaG * p.silica;
  let costGlaze = glazeG * p.glaze;
  
  // Glaze toggle
  const glazeToggle = document.getElementById("manual-glazeToggle");
  const includeGlaze = glazeToggle.checked;
  if (!includeGlaze) costGlaze = 0;
  
  const totalCost = costPowder + costBinder + costSilica + costGlaze;
  
  document.getElementById("manual-results").style.display = "block";
  document.getElementById("manual-total-cost").textContent = `${currencySymbol}${totalCost.toFixed(2)}`;
  
  document.getElementById("volume-display").textContent = volumeCm3.toFixed(2);
  document.getElementById("dimensions-display").textContent = 
    `${optimalOrientation.width.toFixed(1)} × ${optimalOrientation.depth.toFixed(1)} × ${optimalOrientation.height.toFixed(1)}`;
  
  const progressContainer = document.getElementById("manual-costBreakdown");
  const data = [
    { name: "Powder", cost: costPowder, color: "#3a86ff" },
    { name: "Binder", cost: costBinder, color: "#ff006e" },
    { name: "Silica", cost: costSilica, color: "#8338ec" },
    { name: "Glaze", cost: costGlaze, color: "#ffbe0b" }
  ];
  createProgressBars(progressContainer, data, totalCost, currency);
  
  // Printer packing
  try {
    const packing400 = calculateOptiPacking(
      optimalOrientation.width,
      optimalOrientation.depth,
      optimalOrientation.height,
      printer400
    );
    const cost400 = packing400.totalObjects * totalCost;
    let printTime400 = "N/A";
    if (packing400.fitsInPrinter) {
      const totalLayers400 = Math.ceil(packing400.totalHeight / 0.1);
      printTime400 = totalLayers400 * printer400.layerTime;
    }
    
    const packing600 = calculateOptiPacking(
      optimalOrientation.width,
      optimalOrientation.depth,
      optimalOrientation.height,
      printer600
    );
    const cost600 = packing600.totalObjects * totalCost;
    let printTime600 = "N/A";
    if (packing600.fitsInPrinter) {
      const totalLayers600 = Math.ceil(packing600.totalHeight / 0.1);
      printTime600 = totalLayers600 * printer600.layerTime;
    }
    
    const printer400Stats = document.getElementById("manual-printer400-stats");
    if (packing400.fitsInPrinter) {
      printer400Stats.innerHTML = `
        <p><span class="printer-highlight">${packing400.totalObjects}</span> objects</p>
        <p>Arrangement: ${packing400.arrangement}</p>
        <p>Print Time: ${formatPrintTime(printTime400)}</p>
        <p>Total Cost: ${currencySymbol}${cost400.toFixed(2)}</p>
        <p>Orientation: ${optimalOrientation.type}</p>
      `;
    } else {
      printer400Stats.innerHTML = `
        <p style="color: #e63946; font-weight: 600;">Object exceeds printer capacity</p>
        <p>Max dimensions: ${printer400.width}mm × ${printer400.depth}mm × ${printer400.height}mm</p>
      `;
    }
    
    const printer600Stats = document.getElementById("manual-printer600-stats");
    if (packing600.fitsInPrinter) {
      printer600Stats.innerHTML = `
        <p><span class="printer-highlight">${packing600.totalObjects}</span> objects</p>
        <p>Arrangement: ${packing600.arrangement}</p>
        <p>Print Time: ${formatPrintTime(printTime600)}</p>
        <p>Total Cost: ${currencySymbol}${cost600.toFixed(2)}</p>
        <p>Orientation: ${optimalOrientation.type}</p>
      `;
    } else {
      printer600Stats.innerHTML = `
        <p style="color: #e63946; font-weight: 600;">Object exceeds printer capacity</p>
        <p>Max dimensions: ${printer600.width}mm × ${printer600.depth}mm × ${printer600.height}mm</p>
      `;
    }
  } catch (err) {
    console.error("Error in manual calculation:", err);
  }
  
  perfMonitor.end('manualCalculation');
}

// Update all rows
function updateAllResults() {
  perfMonitor.start('updateAll');
  const updateRows = async () => {
    const rows = document.querySelectorAll(".stl-row");
    for (const row of rows) {
      if (row.id) {
        await updateResults(row.id);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  };
  
  updateRows().then(() => {
    if (document.getElementById("manual-tab").classList.contains("active") && 
        document.getElementById("manual-results").style.display === "block") {
      calculateManualResults();
    }
    perfMonitor.end('updateAll');
  });
}

// Advanced settings display
function updateAdvancedSettingsDisplay() {
    console.log("Updating advanced settings display...");
    const currency = document.getElementById("currency").value;
    const p = pricing[currency];
    
    // Make sure pricing data exists for the selected currency
    if (!p) {
      console.error(`No pricing data found for currency: ${currency}`);
      return;
    }
    
    // Update input fields with current pricing values
    const pricePowderInput = document.getElementById("pricePowder");
    const priceBinderInput = document.getElementById("priceBinder");
    const priceSilicaInput = document.getElementById("priceSilica");
    const priceGlazeInput = document.getElementById("priceGlaze");
    
    // Limit to 2 decimal places for all price inputs
    if (pricePowderInput) pricePowderInput.value = p.powder.toFixed(2);
    if (priceBinderInput) priceBinderInput.value = p.binder.toFixed(2);
    if (priceSilicaInput) priceSilicaInput.value = p.silica.toFixed(2);
    if (priceGlazeInput) priceGlazeInput.value = p.glaze.toFixed(2);
    
    // Update currency labels
    document.querySelectorAll(".input-group-append").forEach(elem => {
      elem.textContent = currency;
    });
    
    console.log("Advanced settings updated with values:", {
      powder: p.powder.toFixed(2),
      binder: p.binder.toFixed(2),
      silica: p.silica.toFixed(2),
      glaze: p.glaze.toFixed(2)
    });
  }
  
// Format print time
function formatPrintTime(sec) {
  if (sec === "N/A") return "N/A";
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}