/* powder-calc-part4a.js - UI Core Functions */

/* Utility: Create unique ID for each row */
function createUniqueId() {
    return 'row-' + Math.random().toString(36).substr(2, 9);
  }
  
  /* Create progress bars for cost breakdown */
  function createProgressBars(container, items, totalCost, currency) {
    container.innerHTML = "";
    items.forEach(item => {
      if (item.cost <= 0) return;
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
  
  /* Create a new STL row */
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
  
    // Create packing visualizers with unique IDs
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
    leftCol.appendChild(orientationToggle);
    leftCol.appendChild(packingVisualizers);
  
    // Create right column (results)
    const rightCol = document.createElement("div");
    rightCol.className = "stl-col";
  
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
  
    rightCol.appendChild(resultsPanel);
  
    // Add columns to row
    row.appendChild(leftCol);
    row.appendChild(rightCol);
  
    stlRows.appendChild(row);
  
    // Initialize Three.js viewer for this row (unique per row)
    const { renderer, scene, camera, controls, cleanup } = initThreeJSViewer(modelViewer);
    row.threeJsObjects = { renderer, scene, camera, controls, cleanup };
  
    // Set up event listeners (using row-scoped queries)
    setupRowEventListeners(rowId, uploadArea, fileInput, modelViewer, resultsPanel, scene, camera, controls, packing400, packing600, orientationToggle);
  
    perfMonitor.end('createSTLRow');
    return rowId;
  }
  
  // Set up event listeners for a row (scoped to that row)
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
        uploadArea.style.display = "none";
        modelViewer.style.display = "block";
        modelViewerLoading.style.display = "flex";
        resultsPanel.style.display = "block";
        orientationToggle.style.display = "flex";
  
        // Process the file (using enhancedProcessSTLFileAsync, see below)
        enhancedProcessSTLFileAsync(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400, packing600);
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
        uploadArea.style.display = "none";
        modelViewer.style.display = "block";
        modelViewerLoading.style.display = "flex";
        resultsPanel.style.display = "block";
        orientationToggle.style.display = "flex";
        row.fileData = file;
        enhancedProcessSTLFileAsync(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400, packing600);
      }
    });
  
    // Orientation toggle buttons
    const orientationBtns = orientationToggle.querySelectorAll('.orientation-btn');
    orientationBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!scene.userData || !scene.userData.mesh) {
          console.error("No mesh found for orientation change");
          return;
        }
        orientationBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const orientationType = btn.getAttribute('data-orientation');
        const newOrientation = changeOrientation(scene, camera, controls, orientationType);
        if (newOrientation) {
          resultsPanel.dataset.width = newOrientation.width;
          resultsPanel.dataset.depth = newOrientation.depth;
          resultsPanel.dataset.height = newOrientation.height;
          resultsPanel.dataset.orientation = orientationType;
          updateResults(rowId);
        }
      });
    });
    orientationToggle.style.display = "none";
  
    // Glaze toggle
    const glazeToggle = resultsPanel.querySelector(".glaze-toggle");
    glazeToggle.addEventListener("change", () => {
      updateResults(rowId);
    });
  
    // Remove button with cleanup
    const removeBtn = resultsPanel.querySelector(".remove-stl-btn");
    removeBtn.addEventListener("click", () => {
      if (row) {
        if (row.threeJsObjects && row.threeJsObjects.cleanup) {
          row.threeJsObjects.cleanup();
        }
        // Optionally, remove any additional event listeners here if needed.
        row.remove();
      }
    });
  }
  
  // Enhanced wrapper around processSTLFileAsync to include progress and validation feedback
  async function enhancedProcessSTLFileAsync(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400Vis, packing600Vis) {
    perfMonitor.start('processSTL');
    const row = document.getElementById(rowId);
    const loadingMessage = resultsPanel.querySelector(".loading-message");
    const errorMessage = resultsPanel.querySelector(".error-message");
    const modelViewerLoading = modelViewer.querySelector('.model-viewer-loading');
    const orientationToggle = row.querySelector('.orientation-toggle');
  
    loadingMessage.style.display = "flex";
    errorMessage.style.display = "none";
    modelViewerLoading.style.display = "flex";
    orientationToggle.style.display = "none";
  
    // File type and size validation
    if (!file.name.toLowerCase().endsWith('.stl')) {
      errorMessage.textContent = "Invalid file type. Please upload an STL file.";
      errorMessage.style.display = "block";
      loadingMessage.style.display = "none";
      modelViewerLoading.style.display = "none";
      uploadArea.style.display = "block";
      perfMonitor.end('processSTL');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      console.warn("Large STL file; performance may be affected.");
    }
  
    try {
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
      });
  
      row.stlArrayBuffer = arrayBuffer;
  
      let volumeCm3;
      if (window.Worker) {
        volumeCm3 = await new Promise((resolve, reject) => {
          const worker = new Worker('stl-worker.js');
          worker.onmessage = function(e) {
            if (e.data.success) {
              resolve(e.data.volumeCm3);
            } else {
              reject(new Error(e.data.error));
            }
            worker.terminate();
          };
          worker.onerror = function(error) {
            reject(error);
            worker.terminate();
          };
          worker.postMessage(arrayBuffer);
        }).catch(async (err) => {
          console.warn("Worker failed, falling back to main thread parsing:", err);
          const triangles = await parseBinarySTLAsync(arrayBuffer);
          return await computeVolumeCm3Async(triangles);
        });
      } else {
        const triangles = await parseBinarySTLAsync(arrayBuffer);
        volumeCm3 = await computeVolumeCm3Async(triangles);
      }
  
      resultsPanel.dataset.volume = volumeCm3;
  
      // Use STLLoader for geometry
      const stlLoader = new THREE.STLLoader();
      const geometry = stlLoader.parse(arrayBuffer);
  
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const sizeVec = new THREE.Vector3();
      bbox.getSize(sizeVec);
  
      const orientationData = displayGeometry(geometry, scene, camera, controls);
  
      resultsPanel.dataset.width = orientationData.width;
      resultsPanel.dataset.depth = orientationData.depth;
      resultsPanel.dataset.height = orientationData.height;
      resultsPanel.dataset.orientation = orientationData.type;
      resultsPanel.dataset.printTime = orientationData.printTime;
  
      // Set flat orientation button active by default
      const orientationBtns = orientationToggle.querySelectorAll('.orientation-btn');
      orientationBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-orientation') === 'flat');
      });
      orientationToggle.style.display = "flex";
  
      setTimeout(() => {
        updateResults(rowId).then(() => {
          loadingMessage.style.display = "none";
          modelViewerLoading.style.display = "none";
        });
      }, 10);
  
    } catch (err) {
      console.error("Error processing STL:", err);
      errorMessage.textContent = `Failed to parse STL file: ${err.message || "Unknown error"}`;
      errorMessage.style.display = "block";
      loadingMessage.style.display = "none";
      modelViewerLoading.style.display = "none";
      modelViewer.style.display = "none";
      uploadArea.style.display = "block";
      orientationToggle.style.display = "none";
    }
  
    perfMonitor.end('processSTL');
  }
  