/* powder-calc-main.js - Loads all script parts in correct order */

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
    'powder-calc-part2.js',  // Core functionality
    'powder-calc-part3.js',  // Three.js visualizations
    'powder-calc-part4a.js', // UI core functions
    'powder-calc-part4b.js'  // Calculation and event handlers
  ];
  
  // Load all scripts and set up all buttons and handlers
  loadScripts(scripts, function() {
    console.log('All scripts loaded successfully!');
    
    // Set up the "Add New STL" button
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
    initManualInputHandlers();
    
    // Set up Advanced Pricing Settings toggle
    const advancedToggle = document.querySelector('.advanced-toggle');
    if (advancedToggle) {
      advancedToggle.addEventListener('click', () => {
        console.log("Toggling advanced settings...");
        advancedToggle.classList.toggle('open');
        const advancedSettings = document.querySelector('.advanced-settings');
        advancedSettings.classList.toggle('open');
      });
    } else {
      console.error("Advanced toggle not found in DOM!");
    }
    
    // Set up Apply Settings button
    const applySettingsBtn = document.getElementById("updateSettings");
    if (applySettingsBtn) {
      applySettingsBtn.addEventListener("click", () => {
        console.log("Applying settings...");
        // Call update functions (ensure these exist in powder-calc-part4b.js or elsewhere)
        updateAdvancedSettingsDisplay();
        // Update WALL_MARGIN and OBJECT_SPACING if needed
        WALL_MARGIN = parseFloat(document.getElementById("wallMargin").value) || 10;
        OBJECT_SPACING = parseFloat(document.getElementById("objectSpacing").value) || 15;
        updateAllResults(); // Update all calculations
      });
    } else {
      console.error("Apply Settings button not found in DOM!");
    }
    
    // Set up Update Pricing button
    const updatePricingBtn = document.getElementById("updatePricing");
    if (updatePricingBtn) {
      updatePricingBtn.addEventListener("click", () => {
        const currency = document.getElementById("currency").value;
        const pricePowder = parseFloat(document.getElementById("pricePowder").value);
        const priceBinder = parseFloat(document.getElementById("priceBinder").value);
        const priceSilica = parseFloat(document.getElementById("priceSilica").value);
        const priceGlaze = parseFloat(document.getElementById("priceGlaze").value);

        if (isNaN(pricePowder) || isNaN(priceBinder) || isNaN(priceSilica) || isNaN(priceGlaze) || 
            pricePowder < 0 || priceBinder < 0 || priceSilica < 0 || priceGlaze < 0) {
          alert("Please enter valid non-negative numbers for all prices.");
          return;
        }

        pricing[currency].powder = pricePowder;
        pricing[currency].binder = priceBinder;
        pricing[currency].silica = priceSilica;
        pricing[currency].glaze = priceGlaze;

        updateAllResults();
      });
    } else {
      console.error("Update Pricing button not found in DOM!");
    }

    // Set up currency change
    const currencySelector = document.getElementById("currency");
    if (currencySelector) {
      currencySelector.addEventListener("change", () => {
        updateAdvancedSettingsDisplay();
        updateAllResults();
      });
    } else {
      console.error("Currency selector not found in DOM!");
    }

    // Initial update of advanced settings display
    updateAdvancedSettingsDisplay();
  });