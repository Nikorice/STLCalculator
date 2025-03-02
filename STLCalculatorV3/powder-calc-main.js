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
    initAdvancedToggle();
    
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
        console.log("Update Pricing button clicked");
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

        // Store the updated values
        pricing[currency].powder = pricePowder;
        pricing[currency].binder = priceBinder;
        pricing[currency].silica = priceSilica;
        pricing[currency].glaze = priceGlaze;

        console.log("Updated pricing data:", pricing[currency]);
        
        // Update all calculations with new pricing
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

    // Set up tab switching
    setupTabSwitching();
    
    // Initial update of advanced settings display
    updateAdvancedSettingsDisplay();
    
    // Create first STL row
    if (document.getElementById("stlRows").children.length === 0) {
      createSTLRow();
    }
  });
  
// Set up tab switching functionality
function setupTabSwitching() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to current button
      button.classList.add('active');
      
      // Show the corresponding content
      const tabId = button.getAttribute('data-tab');
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) {
        tabContent.classList.add('active');
        
        // If switching to manual tab and results are visible, recalculate
        if (tabId === 'manual' && document.getElementById('manual-results').style.display === 'block') {
          calculateManualResults();
        }
      }
    });
  });
}

// Function to initialize advanced toggle
function initAdvancedToggle() {
  const advancedToggle = document.querySelector('.advanced-toggle');
  const advancedSettings = document.querySelector('.advanced-settings');
  
  if (!advancedToggle || !advancedSettings) {
    console.error("Advanced toggle or settings elements not found!");
    return;
  }
  
  console.log("Setting up advanced toggle...");
  
  // Fix CSS for collapsed state
  if (!advancedSettings.classList.contains('open')) {
    advancedSettings.style.maxHeight = "0";
    advancedSettings.style.overflow = "hidden";
  } else {
    advancedSettings.style.maxHeight = "500px";
  }
  
  advancedToggle.addEventListener('click', () => {
    console.log("Advanced toggle clicked");
    advancedToggle.classList.toggle('open');
    advancedSettings.classList.toggle('open');
    
    if (advancedSettings.classList.contains('open')) {
      advancedSettings.style.maxHeight = "500px";
    } else {
      advancedSettings.style.maxHeight = "0";
    }
  });
}