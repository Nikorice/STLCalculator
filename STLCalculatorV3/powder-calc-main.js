/* calc-main.js - Loads all script parts in correct order */

// Function to load scripts in sequence
function loadScripts(scripts, callback) {
    let index = 0;
    function loadScript() {
      if (index < scripts.length) {
        const script = document.createElement('script');
        script.src = scripts[index];
        script.onload = function() {
          index++;
          loadScript();
        };
        script.onerror = function() {
          console.error(`Error loading script: ${scripts[index]}`);
          index++;
          loadScript();
        };
        document.body.appendChild(script);
      } else {
        if (callback) callback();
      }
    }
    loadScript();
  }
  
  // List of scripts to load in order
  const scripts = [
    'stl-worker.js',         // (Optional) If you load it as a separate worker file, you might not need to load it here
    'powder-calc-part2.js',  // Core functionality
    'powder-calc-part3.js',  // Three.js visualizations
    'powder-calc-part4a.js', // UI core functions
    'powder-calc-part4b.js', // Calculation & event handlers
    'main-integration.js'    // Additional integration if needed
  ];
  
  // Load all scripts, then initialize
  loadScripts(scripts, function() {
    console.log('All scripts loaded successfully!');
  
    // Once everything is loaded, set up the “Add New STL” button
    const addNewStlBtn = document.getElementById("addNewStl");
    if (addNewStlBtn) {
      addNewStlBtn.addEventListener("click", function() {
        const rowId = createSTLRow();
        console.log(`Created new STL row with ID: ${rowId}`);
      });
    } else {
      console.error("Add New STL button not found in DOM!");
    }
  
    // Initialize manual input handlers
    if (typeof initManualInputHandlers === 'function') {
      initManualInputHandlers();
    }
  
    // Advanced toggle
    initAdvancedToggle();
  
    // Apply Settings button
    const applySettingsBtn = document.getElementById("updateSettings");
    if (applySettingsBtn) {
      applySettingsBtn.addEventListener("click", () => {
        console.log("Applying printer settings...");
        if (typeof updateAdvancedSettingsDisplay === 'function') {
          updateAdvancedSettingsDisplay();
        }
        WALL_MARGIN = parseFloat(document.getElementById("wallMargin").value) || 10;
        OBJECT_SPACING = parseFloat(document.getElementById("objectSpacing").value) || 15;
        if (typeof updateAllResults === 'function') {
          updateAllResults();
        }
      });
    }
  
    // Update Pricing button
    const updatePricingBtn = document.getElementById("updatePricing");
    if (updatePricingBtn) {
      updatePricingBtn.addEventListener("click", () => {
        console.log("Update Pricing button clicked");
        const currency = document.getElementById("currency").value;
        const pricePowder = parseFloat(document.getElementById("pricePowder").value);
        const priceBinder = parseFloat(document.getElementById("priceBinder").value);
        const priceSilica = parseFloat(document.getElementById("priceSilica").value);
        const priceGlaze = parseFloat(document.getElementById("priceGlaze").value);
  
        if (
          isNaN(pricePowder) || isNaN(priceBinder) ||
          isNaN(priceSilica) || isNaN(priceGlaze) ||
          pricePowder < 0 || priceBinder < 0 || priceSilica < 0 || priceGlaze < 0
        ) {
          alert("Please enter valid non-negative numbers for all prices.");
          return;
        }
  
        // Update pricing data for selected currency
        pricing[currency].powder = pricePowder;
        pricing[currency].binder = priceBinder;
        pricing[currency].silica = priceSilica;
        pricing[currency].glaze = priceGlaze;
        console.log("Updated pricing:", pricing[currency]);
  
        if (typeof updateAllResults === 'function') {
          updateAllResults();
        }
      });
    }
  
    // Currency selector
    const currencySelector = document.getElementById("currency");
    if (currencySelector) {
      currencySelector.addEventListener("change", () => {
        if (typeof updateAdvancedSettingsDisplay === 'function') {
          updateAdvancedSettingsDisplay();
        }
        if (typeof updateAllResults === 'function') {
          updateAllResults();
        }
      });
    }
  
    // Set up tab switching
    setupTabSwitching();
  
    // Initial update of advanced settings display
    if (typeof updateAdvancedSettingsDisplay === 'function') {
      updateAdvancedSettingsDisplay();
    }
  
    // Create the first STL row if none exist
    const stlRows = document.getElementById("stlRows");
    if (stlRows && stlRows.children.length === 0) {
      createSTLRow();
    }
  });
  
  // Tab switching logic
  function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
  
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
  
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (tabContent) {
          tabContent.classList.add('active');
          // If we switch to manual tab & the manual results are displayed, recalc
          if (tabId === 'manual') {
            const manualResults = document.getElementById('manual-results');
            if (manualResults && manualResults.style.display !== 'none') {
              if (typeof calculateManualResults === 'function') {
                calculateManualResults();
              }
            }
          }
        }
      });
    });
  }
  
  // Advanced toggle
  function initAdvancedToggle() {
    const advancedToggle = document.querySelector('.advanced-toggle');
    const advancedSettings = document.querySelector('.advanced-settings');
  
    if (!advancedToggle || !advancedSettings) return;
  
    // Collapsed by default
    if (!advancedSettings.classList.contains('open')) {
      advancedSettings.style.maxHeight = "0";
      advancedSettings.style.overflow = "hidden";
    }
  
    advancedToggle.addEventListener('click', () => {
      advancedToggle.classList.toggle('open');
      advancedSettings.classList.toggle('open');
      if (advancedSettings.classList.contains('open')) {
        advancedSettings.style.maxHeight = "500px";
      } else {
        advancedSettings.style.maxHeight = "0";
      }
    });
  }
  