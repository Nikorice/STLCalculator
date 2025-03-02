/* powder-calc-part4a.js - UI Core Functions */

/* Utility Functions */
function createUniqueId() {
    // Generate a unique ID using a random string (e.g., "row-abc123")
    return 'row-' + Math.random().toString(36).substr(2, 9);
  }
  
  /* ====================== UI CORE FUNCTIONS ====================== */
  // Create progress bars for cost breakdown
  function createProgressBars(container, items, totalCost, currency) {
      container.innerHTML = "";
      
      items.forEach(item => {
        if (item.cost <= 0) return; // Skip items with zero or negative cost
        
        const percentage = totalCost > 0 ? (item.cost / totalCost) * 100 : 0;
        
        const progressItem = document.createElement("div");
        progressItem.className = "progress-item";
        
        const progressHeader = document.createElement("div");
        progressHeader.className = "progress-header";
        
        const progressLabel = document.createElement("div");
        progressLabel.className = "progress-label";
        progressLabel.textContent = item.name;
        
        const progressValue = document.createElement("div");
        progressValue.className = "progress-value";
        progressValue.textContent = `${item.cost.toFixed(2)} ${currency} (${percentage.toFixed(1)}%)`;
        
        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar";
        
        const progressFill = document.createElement("div");
        progressFill.className = "progress-fill";
        progressFill.style.width = `${percentage}%`;
        progressFill.style.backgroundColor = item.color;
        
        progressHeader.appendChild(progressLabel);
        progressHeader.appendChild(progressValue);
        progressBar.appendChild(progressFill);
        progressItem.appendChild(progressHeader);
        progressItem.appendChild(progressBar);
        
        container.appendChild(progressItem);
      });
    }
      
    // Create a new STL row
    function createSTLRow() {
      perfMonitor.start('createSTLRow');
      
      const rowId = createUniqueId();
      const stlRows = document.getElementById("stlRows");
      
      // Create row container
      const row = document.createElement("div");
      row.className = "stl-row card";
      row.id = rowId;
      
      // Create left column (upload and viewer)
      const leftCol = document.createElement("div");
      leftCol.className = "stl-col";
      
      // Create upload area
      const uploadArea = document.createElement("div");
      uploadArea.className = "upload-area";
      uploadArea.innerHTML = `
        <div class="upload-icon">
          <span class="material-icon">cloud_upload</span>
        </div>
        <p><strong>Click or drag to upload STL</strong></p>
        <p>Supports binary STL files</p>
      `;
      
      // Create hidden file input
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".stl";
      fileInput.style.display = "none";
      
      // Create 3D model viewer with loading indicator
      const modelViewer = document.createElement("div");
      modelViewer.className = "model-viewer";
      
      // Add loading indicator to model viewer
      const modelViewerLoading = document.createElement("div");
      modelViewerLoading.className = "model-viewer-loading";
      modelViewerLoading.innerHTML = `<div class="spinner"></div> Loading model...`;
      modelViewer.appendChild(modelViewerLoading);
      
      // Add orientation toggle buttons beneath the model viewer
      const orientationToggle = document.createElement("div");
      orientationToggle.className = "orientation-toggle";
      orientationToggle.innerHTML = `
        <button type="button" class="orientation-btn active" data-orientation="flat">
          <span class="material-icon">crop_landscape</span> Flat
        </button>
        <button type="button" class="orientation-btn" data-orientation="vertical">
          <span class="material-icon">crop_portrait</span> Vertical
        </button>
      `;
      
      // Create packing visualizers
      const packingVisualizers = document.createElement("div");
      packingVisualizers.className = "packing-visualizers";
      
      const packing400 = document.createElement("div");
      packing400.className = "packing-visualizer";
      packing400.id = `${rowId}-packing-400`;
      
      const packing600 = document.createElement("div");
      packing600.className = "packing-visualizer";
      packing600.id = `${rowId}-packing-600`;
      
      packingVisualizers.appendChild(packing400);
      packingVisualizers.appendChild(packing600);
      
      // Add elements to left column
      leftCol.appendChild(uploadArea);
      leftCol.appendChild(fileInput);
      leftCol.appendChild(modelViewer);
      leftCol.appendChild(orientationToggle); // Add orientation toggle
      leftCol.appendChild(packingVisualizers);
      
      // Create right column (results)
      const rightCol = document.createElement("div");
      rightCol.className = "stl-col";
      
      // Create results panel
      const resultsPanel = document.createElement("div");
      resultsPanel.className = "results-panel";
      resultsPanel.id = `${rowId}-results`;
      resultsPanel.innerHTML = `
        <h3>
          <span class="material-icon">analytics</span>
          Cost Analysis
        </h3>
        <div class="error-message"></div>
        <div class="loading-message">
          <div class="spinner"></div>
          Processing STL file...
        </div>
        <div class="total-cost">--</div>
        
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value">--</div>
            <div class="stat-label">Volume (cm³)</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">--</div>
            <div class="stat-label">Dimensions (mm)</div>
          </div>
        </div>
        
        <div class="toggle-container">
          <label class="toggle-switch">
            <input type="checkbox" class="glaze-toggle" checked>
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">Apply Glaze</span>
        </div>
        
        <div class="progress-container"></div>
        
        <h3>
          <span class="material-icon">view_in_ar</span>
          Printer Capacity
        </h3>
        
        <div class="printer-cards">
          <div class="printer-card">
            <div class="printer-title">Printer 400</div>
            <div class="printer-stats" id="${rowId}-printer-400-stats">
              <p>Calculating...</p>
            </div>
          </div>
          
          <div class="printer-card">
            <div class="printer-title">Printer 600</div>
            <div class="printer-stats" id="${rowId}-printer-600-stats">
              <p>Calculating...</p>
            </div>
          </div>
        </div>
        
        <div class="row-actions">
          <button class="btn btn-danger remove-stl-btn">
            <span class="material-icon">delete</span> Remove
          </button>
        </div>
      `;
      
      // Add elements to right column
      rightCol.appendChild(resultsPanel);
      
      // Add columns to row
      row.appendChild(leftCol);
      row.appendChild(rightCol);
      
      // Add row to container
      stlRows.appendChild(row);
      
      // Initialize Three.js viewer (optimized for speed)
      const { renderer, scene, camera, controls, cleanup } = initThreeJSViewer(modelViewer);
      
      // Store these objects for reference
      row.threeJsObjects = { renderer, scene, camera, controls, cleanup };
      
      // Set up event listeners
      setupRowEventListeners(rowId, uploadArea, fileInput, modelViewer, resultsPanel, scene, camera, controls, packing400, packing600, orientationToggle);
      
      perfMonitor.end('createSTLRow');
      return rowId;
    }
    
    // Set up event listeners for a row
    function setupRowEventListeners(rowId, uploadArea, fileInput, modelViewer, resultsPanel, scene, camera, controls, packing400, packing600, orientationToggle) {
      const row = document.getElementById(rowId);
      const modelViewerLoading = modelViewer.querySelector('.model-viewer-loading');
      
      // Upload area click
      uploadArea.addEventListener("click", () => {
        fileInput.click();
      });
      
      // File input change
      fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) {
          // Show immediate visual feedback
          uploadArea.style.display = "none";
          modelViewer.style.display = "block";
          modelViewerLoading.style.display = "flex";
          resultsPanel.style.display = "block";
          orientationToggle.style.display = "flex"; // Show orientation toggle
          
          // Process the file
          processSTLFileAsync(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400, packing600);
        }
      });
      
      // Drag and drop
      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
      });
      
      uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
      });
      
      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");
        
        const file = e.dataTransfer.files[0];
        if (file) {
          // Show immediate visual feedback
          uploadArea.style.display = "none";
          modelViewer.style.display = "block";
          modelViewerLoading.style.display = "flex";
          resultsPanel.style.display = "block";
          orientationToggle.style.display = "flex"; // Show orientation toggle
          
          // Store the file data for packing visualization
          row.fileData = file;
          
          // Process the file
          processSTLFileAsync(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400, packing600);
        }
      });
      
      // Orientation toggle buttons
      const orientationBtns = orientationToggle.querySelectorAll('.orientation-btn');
      orientationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          console.log(`Switching orientation to: ${btn.getAttribute('data-orientation')}`);
          // Skip if no model is loaded yet
          if (!scene.userData || !scene.userData.mesh) {
            console.error("No mesh or scene data found for orientation change");
            return;
          }
          
          // Update button states
          orientationBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Get the orientation type
          const orientationType = btn.getAttribute('data-orientation');
          
          // Apply the orientation change
          const newOrientation = changeOrientation(scene, camera, controls, orientationType);
          
          // Update the results panel with new dimensions and orientation
          if (newOrientation) {
            resultsPanel.dataset.width = newOrientation.width;
            resultsPanel.dataset.depth = newOrientation.depth;
            resultsPanel.dataset.height = newOrientation.height;
            resultsPanel.dataset.orientation = orientationType;
            resultsPanel.dataset.printTime = newOrientation.printTime;
            
            // Update results with new dimensions
            updateResults(rowId);
          }
        });
      });
      
      // Initially hide orientation toggle until file is loaded
      orientationToggle.style.display = "none";
      
      // Glaze toggle
      const glazeToggle = resultsPanel.querySelector(".glaze-toggle");
      glazeToggle.addEventListener("change", () => {
        updateResults(rowId);
      });
      
      // Remove button
      const removeBtn = resultsPanel.querySelector(".remove-stl-btn");
      removeBtn.addEventListener("click", () => {
        if (row) {
          // Clean up Three.js resources before removing
          if (row.threeJsObjects && row.threeJsObjects.cleanup) {
            row.threeJsObjects.cleanup();
          }
          
          // Clean up packing visualizers
          if (packing400.cleanup) packing400.cleanup();
          if (packing600.cleanup) packing600.cleanup();
          
          row.remove();
        }
      });
    }
    
    // Process STL file with optimized async loading
    async function processSTLFileAsync(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400Vis, packing600Vis) {
      perfMonitor.start('processSTL');
      
      // Get elements
      const row = document.getElementById(rowId);
      const loadingMessage = resultsPanel.querySelector(".loading-message");
      const errorMessage = resultsPanel.querySelector(".error-message");
      const modelViewerLoading = modelViewer.querySelector('.model-viewer-loading');
      const orientationToggle = row.querySelector('.orientation-toggle');
      
      // Show loading message, hide error message
      loadingMessage.style.display = "flex";
      errorMessage.style.display = "none";
      modelViewerLoading.style.display = "flex";
      orientationToggle.style.display = "none"; // Hide orientation toggle until loaded
      
      // Use Promise-based FileReader
      try {
        // Read the file as ArrayBuffer
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (error) => reject(error);
          reader.readAsArrayBuffer(file);
        });
        
        // Store the array buffer for packing visualization
        row.stlArrayBuffer = arrayBuffer;
        
        try {
          // Parse volume asynchronously
          const triangles = await parseBinarySTLAsync(arrayBuffer);
          const volumeCm3 = await computeVolumeCm3Async(triangles);
          
          // Store volume in the results panel's dataset
          resultsPanel.dataset.volume = volumeCm3;
          
          // Use STLLoader for geometry (fast and efficient)
          const stlLoader = new THREE.STLLoader();
          const geometry = stlLoader.parse(arrayBuffer);
          
          // Get bounding box dimensions
          geometry.computeBoundingBox();
          const bbox = geometry.boundingBox;
          const sizeVec = new THREE.Vector3();
          bbox.getSize(sizeVec);
          
          // Display the geometry in the viewer and get optimal orientation
          const orientationData = displayGeometry(geometry, scene, camera, controls);
          
          // Store optimal dimensions and orientation in the results panel's dataset
          resultsPanel.dataset.width = orientationData.width;
          resultsPanel.dataset.depth = orientationData.depth;
          resultsPanel.dataset.height = orientationData.height;
          resultsPanel.dataset.orientation = orientationData.type;
          resultsPanel.dataset.printTime = orientationData.printTime;
          
          // Set flat orientation button as active by default
          const orientationBtns = orientationToggle.querySelectorAll('.orientation-btn');
          orientationBtns.forEach(btn => {
            if (btn.getAttribute('data-orientation') === 'flat') {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
          
          // Show orientation toggle
          orientationToggle.style.display = "flex";
          
          // Update the results panel
          await updateResults(rowId);
          
          // Hide loading messages
          loadingMessage.style.display = "none";
          modelViewerLoading.style.display = "none";
          
        } catch (err) {
          console.error("Error processing STL:", err);
          
          // Show error message
          errorMessage.textContent = `Failed to parse STL file: ${err.message || "Unknown error"}`;
          errorMessage.style.display = "block";
          loadingMessage.style.display = "none";
          
          // Reset upload area
          modelViewer.style.display = "none";
          uploadArea.style.display = "block";
          orientationToggle.style.display = "none";
        }
      } catch (err) {
        console.error("Error reading file:", err);
        
        // Show error message
        errorMessage.textContent = "Error reading file.";
        errorMessage.style.display = "block";
        loadingMessage.style.display = "none";
        
        // Reset upload area
        modelViewer.style.display = "none";
        uploadArea.style.display = "block";
        orientationToggle.style.display = "none";
      }
      
      perfMonitor.end('processSTL');
    }
    
    // Initialize manual input event handlers - remove orientation toggle
    function initManualInputHandlers() {
      console.log("Initializing manual input handlers...");
      // Calculate button for manual input
      const calculateBtn = document.getElementById("calculateBtn");
      if (calculateBtn) {
        calculateBtn.addEventListener("click", () => {
          console.log("Calculate Costs button clicked");
          calculateManualResults();
        });
      } else {
        console.error("CalculateBtn not found in DOM!");
      }
      
      // Manual glaze toggle
      const glazeToggle = document.getElementById("manual-glazeToggle");
      if (glazeToggle) {
        glazeToggle.addEventListener("change", () => {
          console.log("Glaze toggle changed, checked:", glazeToggle.checked);
          calculateManualResults();
        });
      } else {
        console.error("Manual-glazeToggle not found in DOM!");
      }
    }
    
    // Calculate manual input results without orientation setting
    function calculateManualResults() {
      console.log("Calculating manual results...");
      console.log("Volume:", document.getElementById("volume").value);
      console.log("Width:", document.getElementById("width").value);
      console.log("Depth:", document.getElementById("depth").value);
      console.log("Height:", document.getElementById("height").value);
      console.log("Currency:", document.getElementById("currency").value);
      console.log("Glaze Toggle Checked:", document.getElementById("manual-glazeToggle").checked);
      
      perfMonitor.start('manualCalculation');
      
      // Get input values
      const volumeCm3 = parseFloat(document.getElementById("volume").value);
      const width = parseFloat(document.getElementById("width").value);
      const depth = parseFloat(document.getElementById("depth").value);
      const height = parseFloat(document.getElementById("height").value);
      
      // Validate inputs
      if (isNaN(volumeCm3) || isNaN(width) || isNaN(depth) || isNaN(height) || volumeCm3 <= 0 || width <= 0 || depth <= 0 || height <= 0) {
        console.error("Invalid input values:", { volumeCm3, width, depth, height });
        alert("Please enter valid dimensions and volume.");
        perfMonitor.end('manualCalculation');
        return;
      }
      
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
      
      // Get pricing based on currency
      const p = pricing[currency];
      
      // Calculate costs
      let costPowder = powderKg * p.powder;
      let costBinder = binderMl * p.binder;
      let costSilica = silicaG * p.silica;
      let costGlaze = glazeG * p.glaze;
      
      // Check if glaze is included
      const glazeToggle = document.getElementById("manual-glazeToggle");
      const includeGlaze = glazeToggle.checked;
      if (!includeGlaze) costGlaze = 0;
      
      // Calculate total cost
      const totalCost = costPowder + costBinder + costSilica + costGlaze;
      
      console.log("Total Cost:", totalCost);
      
      // Show results panel
      document.getElementById("manual-results").style.display = "block";
      
      // Update total cost display
      document.getElementById("manual-total-cost").textContent = `${currencySymbol}${totalCost.toFixed(2)}`;
      
      // Update stats
      document.getElementById("volume-display").textContent = volumeCm3.toFixed(2);
      document.getElementById("dimensions-display").textContent = `${width.toFixed(1)} × ${depth.toFixed(1)} × ${height.toFixed(1)}`;
      
      // Update progress bars
      const progressContainer = document.getElementById("manual-costBreakdown");
      const data = [
        { name: "Powder", cost: costPowder, color: "#3a86ff" },
        { name: "Binder", cost: costBinder, color: "#ff006e" },
        { name: "Silica", cost: costSilica, color: "#8338ec" },
        { name: "Glaze", cost: costGlaze, color: "#ffbe0b" }
      ];
      createProgressBars(progressContainer, data, totalCost, currency);
      
      // Calculate printer packing with dimensions as entered
      try {
        // Printer 400
        const packing400 = calculateOptiPacking(width, depth, height, printer400);
        const cost400 = packing400.totalObjects * totalCost;
        
        // Calculate print time for Printer 400
        let printTime400 = "N/A";
        if (packing400.fitsInPrinter) {
          const totalLayers400 = Math.ceil(packing400.totalHeight / 0.1); // 0.1mm layer height
          printTime400 = totalLayers400 * printer400.layerTime;
        }
        
        // Printer 600
        const packing600 = calculateOptiPacking(width, depth, height, printer600);
        const cost600 = packing600.totalObjects * totalCost;
        
        // Calculate print time for Printer 600
        let printTime600 = "N/A";
        if (packing600.fitsInPrinter) {
          const totalLayers600 = Math.ceil(packing600.totalHeight / 0.1); // 0.1mm layer height
          printTime600 = totalLayers600 * printer600.layerTime;
        }
        
        // Update printer stats
        const printer400Stats = document.getElementById("manual-printer400-stats");
        
        if (packing400.fitsInPrinter) {
          printer400Stats.innerHTML = `
            <p><span class="printer-highlight">${packing400.totalObjects}</span> objects</p>
            <p>Arrangement: ${packing400.arrangement}</p>
            <p>Print Time: ${formatPrintTime(printTime400)}</p>
            <p>Total Cost: ${currencySymbol}${cost400.toFixed(2)}</p>
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