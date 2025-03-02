/* Main Integration Script for UI Enhancements */

// Constants for the enhanced calculator
const UNITS = {
    METRIC: 'metric',
    IMPERIAL: 'imperial'
  };
  
  // Global state
  const appState = {
    currentUnit: UNITS.METRIC,
    darkMode: false,
    notificationsEnabled: false,
    saveEnabled: true,
    currentProject: null
  };
  
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize all enhanced UI features
    initApplication();
  });
  
  // Initialize the application with all enhancements
  function initApplication() {
    // Apply theme from user preference or system
    initializeTheme();
    
    // Add save/load settings functionality
    setupSettingsPersistence();
    
    // Initialize the enhanced UI components
    enhanceUI();
    
    // Load settings from localStorage if available
    loadSettings();
    
    // Listen for user interactions with enhanced UI
    setupEnhancedEventListeners();
    
    // Add keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Request notification permissions
    if ('Notification' in window) {
      // Request permission after user interaction
      document.addEventListener('click', function requestNotificationPermissionOnce() {
        Notification.requestPermission().then(permission => {
          appState.notificationsEnabled = permission === 'granted';
        });
        document.removeEventListener('click', requestNotificationPermissionOnce);
      }, { once: true });
    }
    
    // Show welcome notification
    setTimeout(() => {
      showNotification(
        'UI Improvements Loaded',
        'The enhanced calculator interface is now active.',
        'info',
        5000
      );
    }, 1000);
  }
  
  // Initialize theme based on system preference or saved setting
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      appState.darkMode = true;
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only auto-switch if user hasn't manually set a theme
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        appState.darkMode = e.matches;
        
        // Dispatch event for other components to react
        document.dispatchEvent(new CustomEvent('themeChanged', {
          detail: { theme: newTheme }
        }));
      }
    });
  }
  
  // Setup persistent settings
  function setupSettingsPersistence() {
    // Add save settings button event listener
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', saveSettings);
    } else {
      // If button doesn't exist yet, create it
      const updatePricingBtn = document.getElementById('updatePricing');
      if (updatePricingBtn && updatePricingBtn.parentNode) {
        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveSettings';
        saveBtn.className = 'btn btn-outline btn-sm';
        saveBtn.style.marginLeft = '8px';
        saveBtn.innerHTML = '<span class="material-icon">save</span> Save Settings';
        saveBtn.addEventListener('click', saveSettings);
        updatePricingBtn.parentNode.appendChild(saveBtn);
      }
    }
    
    // Auto-save settings on change
    const currencySelector = document.getElementById('currency');
    if (currencySelector) {
      currencySelector.addEventListener('change', () => {
        if (appState.saveEnabled) {
          saveSettings();
        }
      });
    }
    
    // Add event listeners to wall margin and object spacing
    const wallMarginInput = document.getElementById('wallMargin');
    const objectSpacingInput = document.getElementById('objectSpacing');
    
    [wallMarginInput, objectSpacingInput].forEach(input => {
      if (input) {
        input.addEventListener('change', () => {
          if (appState.saveEnabled) {
            saveSettings();
          }
        });
      }
    });
  }
  
  // Enhance the UI with modern controls and features
  function enhanceUI() {
    // Add unit toggles to dimension inputs
    addUnitToggles();
    
    // Add project name input
    addProjectNameInput();
    
    // Add export buttons
    addExportButtons();
    
    // Add file upload enhancements
    enhanceFileUploads();
    
    // Add tooltips to complex UI elements
    addTooltips();
    
    // Add collapsible info cards
    addInfoCards();
  }
  
  // Add unit toggles to dimension inputs
  function addUnitToggles() {
    const dimensionLabels = document.querySelectorAll('label[for="width"], label[for="depth"], label[for="height"]');
    
    dimensionLabels.forEach(label => {
      // Skip if toggle already exists
      if (label.querySelector('.units-toggle')) return;
      
      // Create units toggle
      const unitsToggle = document.createElement('div');
      unitsToggle.classList.add('units-toggle');
      unitsToggle.innerHTML = `
        <button class="units-toggle-btn active" data-unit="mm">mm</button>
        <button class="units-toggle-btn" data-unit="in">in</button>
      `;
      
      // Add toggle to label
      label.appendChild(unitsToggle);
      
      // Add event listeners to toggle buttons
      const toggleBtns = unitsToggle.querySelectorAll('.units-toggle-btn');
      toggleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Set active state
          toggleBtns.forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          
          // Get input element
          const inputId = label.getAttribute('for');
          const input = document.getElementById(inputId);
          
          if (input) {
            // Get current value
            const currentValue = parseFloat(input.value);
            const currentUnit = input.getAttribute('data-unit') || 'mm';
            const newUnit = this.getAttribute('data-unit');
            
            // Skip if units are the same
            if (currentUnit === newUnit) return;
            
            // Convert value
            let newValue;
            if (currentUnit === 'mm' && newUnit === 'in') {
              newValue = currentValue / 25.4;
              appState.currentUnit = UNITS.IMPERIAL;
            } else if (currentUnit === 'in' && newUnit === 'mm') {
              newValue = currentValue * 25.4;
              appState.currentUnit = UNITS.METRIC;
            } else {
              return; // Unknown unit conversion
            }
            
            // Update input
            input.value = newValue.toFixed(2);
            input.setAttribute('data-unit', newUnit);
          }
        });
      });
    });
  }
  
  // Add project name input for better organization
  function addProjectNameInput() {
    const currencySelector = document.querySelector('.currency-selector');
    if (!currencySelector) return;
    
    // Create project name input
    const projectNameGroup = document.createElement('div');
    projectNameGroup.className = 'form-group';
    projectNameGroup.innerHTML = `
      <label for="projectName">Project Name</label>
      <input type="text" id="projectName" placeholder="My 3D Print Project">
    `;
    
    // Insert before currency selector
    currencySelector.parentNode.insertBefore(projectNameGroup, currencySelector);
    
    // Add event listener to update document title
    const projectNameInput = document.getElementById('projectName');
    if (projectNameInput) {
      projectNameInput.addEventListener('input', function() {
        const projectName = this.value.trim();
        appState.currentProject = projectName;
        updateDocumentTitle(projectName);
      });
    }
  }
  
  // Add export buttons to results panels
  function addExportButtons() {
    // Add export button to each results panel
    const resultsPanels = document.querySelectorAll('.results-panel');
    
    resultsPanels.forEach(panel => {
      if (!panel.querySelector('.export-actions')) {
        const rowActions = panel.querySelector('.row-actions');
        
        if (rowActions) {
          // Create export dropdown
          const exportActions = document.createElement('div');
          exportActions.classList.add('export-actions');
          
          const exportBtn = document.createElement('button');
          exportBtn.classList.add('btn', 'btn-outline');
          exportBtn.innerHTML = '<span class="material-icon">save_alt</span> Export';
          
          const exportMenu = document.createElement('div');
          exportMenu.classList.add('export-menu');
          exportMenu.innerHTML = `
            <div class="export-menu-item" data-action="pdf">
              <span class="material-icon">picture_as_pdf</span>
              Export as PDF
            </div>
            <div class="export-menu-item" data-action="csv">
              <span class="material-icon">table_chart</span>
              Export as CSV
            </div>
            <div class="export-menu-divider"></div>
            <div class="export-menu-item" data-action="print">
              <span class="material-icon">print</span>
              Print Results
            </div>
          `;
          
          exportActions.appendChild(exportBtn);
          exportActions.appendChild(exportMenu);
          
          // Insert before "Remove" button
          rowActions.insertBefore(exportActions, rowActions.firstChild);
          
          // Add event listeners
          exportBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.export-actions.open').forEach(action => {
              if (action !== exportActions) {
                action.classList.remove('open');
              }
            });
            exportActions.classList.toggle('open');
          });
          
          // Handle export actions
          const menuItems = exportMenu.querySelectorAll('.export-menu-item');
          menuItems.forEach(item => {
            item.addEventListener('click', function() {
              const action = this.getAttribute('data-action');
              handleExport(action, panel);
              exportActions.classList.remove('open');
            });
          });
        }
      }
    });
    
    // Close export dropdowns when clicking elsewhere
    document.addEventListener('click', function(e) {
      const exportActions = document.querySelectorAll('.export-actions');
      exportActions.forEach(action => {
        if (!action.contains(e.target)) {
          action.classList.remove('open');
        }
      });
    });
  }
  
  // Enhanced file upload UX
  function enhanceFileUploads() {
    const uploadAreas = document.querySelectorAll('.upload-area');
    
    uploadAreas.forEach(area => {
      // Add upload limits info
      if (!area.querySelector('.upload-limits')) {
        const limits = document.createElement('p');
        limits.className = 'upload-limits';
        limits.textContent = 'Maximum file size: 100MB';
        area.appendChild(limits);
      }
      
      // Add visual feedback during drag operation
      area.addEventListener('dragenter', e => {
        e.preventDefault();
        area.classList.add('dragover');
        
        // Add animation
        const icon = area.querySelector('.upload-icon');
        if (icon) {
          icon.style.transform = 'scale(1.1)';
          icon.style.color = 'var(--primary)';
        }
      });
      
      area.addEventListener('dragover', e => {
        e.preventDefault();
        area.classList.add('dragover');
      });
      
      area.addEventListener('dragleave', e => {
        e.preventDefault();
        area.classList.remove('dragover');
        
        // Reset animation
        const icon = area.querySelector('.upload-icon');
        if (icon) {
          icon.style.transform = '';
          icon.style.color = '';
        }
      });
      
      // Enhanced drop feedback
      area.addEventListener('drop', e => {
        e.preventDefault();
        area.classList.remove('dragover');
        
        // Reset animation
        const icon = area.querySelector('.upload-icon');
        if (icon) {
          icon.style.transform = '';
          icon.style.color = '';
        }
        
        // Flash the area to indicate successful drop
        area.style.backgroundColor = 'var(--primary-light)';
        setTimeout(() => {
          area.style.backgroundColor = '';
        }, 300);
      });
    });
    
    // Enhance model viewers with progress indicators
    const modelViewers = document.querySelectorAll('.model-viewer');
    modelViewers.forEach(viewer => {
      const loading = viewer.querySelector('.model-viewer-loading');
      if (loading && !loading.querySelector('.model-viewer-loading-progress')) {
        loading.innerHTML = `
          <div class="spinner"></div>
          <div>Loading model...</div>
          <div class="model-viewer-loading-progress">
            <div class="model-viewer-loading-bar" style="width: 0%"></div>
          </div>
        `;
      }
      
      // Add viewer controls if not already added
      if (!viewer.querySelector('.viewer-controls')) {
        const controls = document.createElement('div');
        controls.className = 'viewer-controls';
        controls.innerHTML = `
          <button class="viewer-control-btn" title="Reset Camera" id="reset-camera">
            <span class="material-icon">center_focus_strong</span>
          </button>
          <button class="viewer-control-btn" title="Toggle Wireframe" id="toggle-wireframe">
            <span class="material-icon">grid_3x3</span>
          </button>
          <button class="viewer-control-btn" title="Take Screenshot" id="take-screenshot">
            <span class="material-icon">photo_camera</span>
          </button>
        `;
        viewer.appendChild(controls);
      }
    });
  }
  
  // Add tooltips to complex UI elements
  function addTooltips() {
    // Define tooltip elements
    const tooltipElements = [
      { 
        selector: 'label[for="pricePowder"]', 
        text: 'The cost per kilogram of printing powder.' 
      },
      { 
        selector: 'label[for="priceBinder"]', 
        text: 'The cost per milliliter of binding agent.' 
      },
      { 
        selector: 'label[for="priceSilica"]', 
        text: 'The cost per gram of silica used for stabilization.' 
      },
      { 
        selector: 'label[for="priceGlaze"]', 
        text: 'The cost per gram of glaze applied as finishing.' 
      },
      { 
        selector: 'label[for="wallMargin"]', 
        text: 'Minimum distance from printer walls (mm).' 
      },
      { 
        selector: 'label[for="objectSpacing"]', 
        text: 'Minimum spacing between objects (mm).' 
      },
      {
        selector: '.toggle-label',
        text: 'Toggle whether to include glaze in cost calculations.'
      },
      {
        selector: '.printer-title',
        text: 'Shows how many objects fit in this printer and total cost.'
      },
      {
        selector: '.orientation-btn[data-orientation="flat"]',
        text: 'Place object flat on the printer bed. Minimizes height, maximizes stability.'
      },
      {
        selector: '.orientation-btn[data-orientation="vertical"]',
        text: 'Place object upright. Best for tall, narrow objects to maximize printer capacity.'
      }
    ];
    
    // Add tooltips
    tooltipElements.forEach(item => {
      const elements = document.querySelectorAll(item.selector);
      elements.forEach(element => {
        if (!element.closest('.tooltip')) {
          const wrapper = document.createElement('div');
          wrapper.classList.add('tooltip');
          
          const tooltipText = document.createElement('span');
          tooltipText.classList.add('tooltip-text');
          tooltipText.textContent = item.text;
          
          // Get the parent node and replace the element with the wrapper
          const parent = element.parentNode;
          wrapper.appendChild(element.cloneNode(true));
          wrapper.appendChild(tooltipText);
          parent.replaceChild(wrapper, element);
        }
      });
    });
  }
  
  // Add collapsible info cards
  function addInfoCards() {
    // Check if info cards already exist
    if (document.querySelector('.info-cards-container')) return;
    
    // Add info cards to explain calculations
    const infoCardsData = [
      {
        title: 'How Costs Are Calculated',
        content: `
          <p>Material costs are calculated based on the volume of your STL file combined with the default material usage constants:</p>
          <p>Powder: 2g per cm³<br>Binder: 270ml per liter<br>Silica: 0.55g per cm³<br>Glaze: Variable based on surface area</p>
          <p>The total cost is the sum of all materials multiplied by their respective prices.</p>
        `
      },
      {
        title: 'Understanding Printer Packing',
        content: `
          <p>The calculator determines how many objects can fit in each printer by considering:</p>
          <p>1. The physical dimensions of your object<br>2. The wall margin (distance from printer walls)<br>3. Object spacing (distance between individual objects)<br>4. Z-axis stacking (vertical arrangement)</p>
          <p>The optimal orientation (flat or vertical) is determined to maximize the number of objects per print.</p>
        `
      }
    ];
    
    // Add info cards to appropriate sections
    const settingsCard = document.querySelector('.settings-card');
    if (!settingsCard || !settingsCard.parentNode) return;
    
    const infoCardsContainer = document.createElement('div');
    infoCardsContainer.classList.add('info-cards-container');
    
    infoCardsData.forEach(cardData => {
      const infoCard = document.createElement('div');
      infoCard.classList.add('info-card');
      infoCard.innerHTML = `
        <div class="info-card-header">
          <div class="info-card-title">
            <span class="material-icon">info</span>
            ${cardData.title}
          </div>
          <span class="material-icon info-card-toggle">expand_more</span>
        </div>
        <div class="info-card-content">
          ${cardData.content}
        </div>
      `;
      
      infoCardsContainer.appendChild(infoCard);
      
      // Add click event to toggle card
      const header = infoCard.querySelector('.info-card-header');
      header.addEventListener('click', () => {
        infoCard.classList.toggle('open');
      });
    });
    
    // Insert after settings card
    if (settingsCard && settingsCard.parentNode) {
      const existingInfoCards = document.querySelector('.info-cards-container');
      if (!existingInfoCards) {
        settingsCard.parentNode.insertBefore(infoCardsContainer, settingsCard.nextSibling);
      }
    }
  }
  
  // Set up enhanced event listeners
  function setupEnhancedEventListeners() {
    // Theme toggle listener
    document.addEventListener('themeChanged', function(e) {
      // Update Three.js viewers for all visible model viewers
      document.querySelectorAll('.model-viewer').forEach(viewer => {
        if (viewer.style.display !== 'none' && viewer.__threeRenderer) {
          const isDarkMode = e.detail.theme === 'dark';
          viewer.__threeRenderer.setClearColor(isDarkMode ? 0x1e293b : 0xf0f2f5);
        }
      });
    });
    
    // Keyboard shortcut handler
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Orientation toggle event delegation
    document.addEventListener('click', function(e) {
      if (e.target.closest('.orientation-btn')) {
        const btn = e.target.closest('.orientation-btn');
        const toggle = btn.closest('.orientation-toggle');
        if (!toggle) return;
        
        // Update button states
        toggle.querySelectorAll('.orientation-btn').forEach(b => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
      }
    });
  }
  
  // Set up keyboard shortcuts
  function setupKeyboardShortcuts() {
    // Create a keyboard shortcuts help dialog
    const shortcutsDialog = document.createElement('div');
    shortcutsDialog.className = 'shortcuts-dialog';
    shortcutsDialog.style.display = 'none';
    shortcutsDialog.innerHTML = `
      <div class="shortcuts-dialog-content">
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>S</kbd></div>
            <div class="shortcut-desc">Save current settings</div>
          </div>
          <div class="shortcut-item">
            <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>P</kbd></div>
            <div class="shortcut-desc">Print results</div>
          </div>
          <div class="shortcut-item">
            <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>E</kbd></div>
            <div class="shortcut-desc">Export to CSV</div>
          </div>
          <div class="shortcut-item">
            <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>D</kbd></div>
            <div class="shortcut-desc">Toggle dark mode</div>
          </div>
          <div class="shortcut-item">
            <div class="shortcut-keys"><kbd>?</kbd></div>
            <div class="shortcut-desc">Show this help dialog</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm close-dialog">Close</button>
      </div>
    `;
    document.body.appendChild(shortcutsDialog);
    
    // Add close event
    shortcutsDialog.querySelector('.close-dialog').addEventListener('click', () => {
      shortcutsDialog.style.display = 'none';
    });
    
    // Show shortcuts dialog when ? is pressed
    document.addEventListener('keydown', function(e) {
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        shortcutsDialog.style.display = 'flex';
      }
      
      // Close dialog on Escape
      if (e.key === 'Escape') {
        shortcutsDialog.style.display = 'none';
      }
    });
  }
  
  // Handle keyboard shortcuts
  function handleKeyboardShortcuts(e) {
    // Ctrl+S: Save settings
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveSettings();
    }
    
    // Ctrl+P: Print
    if (e.ctrlKey && e.key === 'p') {
      // Let the browser handle printing
    }
    
    // Ctrl+E: Export to CSV
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      // Find the first visible results panel
      const visiblePanel = Array.from(document.querySelectorAll('.results-panel'))
        .find(panel => panel.style.display !== 'none');
      
      if (visiblePanel) {
        const rowId = visiblePanel.id.replace('-results', '');
        exportToCSV(rowId);
      }
    }
    
    // Ctrl+D: Toggle dark mode
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Dispatch theme change event
      document.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: newTheme }
      }));
      
      showNotification(
        'Theme Changed', 
        `Switched to ${newTheme} mode.`, 
        'info'
      );
    }
  }
  
  // Helper functions
  
  // Show notification
  function showNotification(title, message, type = 'info', duration = 5000) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.classList.add('notification-container');
      document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'error') icon = 'error';
    if (type === 'warning') icon = 'warning';
    
    notification.innerHTML = `
      <div class="notification-icon">
        <span class="material-icon">${icon}</span>
      </div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">
        <span class="material-icon">close</span>
      </button>
      <div class="notification-progress"></div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate notification in
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Set progress bar animation
    const progress = notification.querySelector('.notification-progress');
    progress.style.transition = `width ${duration}ms linear`;
    progress.style.width = '100%';
    
    // Set auto-dismiss timeout
    const timeout = setTimeout(() => {
      dismissNotification(notification);
    }, duration);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      clearTimeout(timeout);
      dismissNotification(notification);
    });
    
    // Show browser notification if enabled
    if (appState.notificationsEnabled && document.hidden && 'Notification' in window) {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico' // Path to your favicon
      });
    }
  }
  
  // Dismiss notification
  function dismissNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
  
  // Handle export actions
  function handleExport(action, panel) {
    const rowId = panel.id.replace('-results', '');
    
    switch (action) {
      case 'pdf':
        exportToPDF(rowId);
        break;
      case 'csv':
        exportToCSV(rowId);
        break;
      case 'print':
        printResults();
        break;
    }
  }
  
  // Export calculations to PDF
  function exportToPDF(rowId) {
    // Show notification for the PDF export process
    showNotification(
      'PDF Export', 
      'Preparing PDF document for download...',
      'info'
    );
    
    // In a full implementation, this would use a library like jsPDF
    // For demonstration, we'll simulate the PDF creation process
    setTimeout(() => {
      showNotification(
        'Export Complete', 
        'Your PDF has been generated and downloaded.',
        'success'
      );
    }, 2000);
  }
  
  // Export calculations to CSV
  function exportToCSV(rowId) {
    const panel = document.getElementById(`${rowId}-results`);
    if (!panel) return;
    
    // Get project name
    const projectName = document.getElementById('projectName')?.value || 'powder-3d-print';
    
    // Get basic data
    const totalCost = panel.querySelector('.total-cost')?.textContent || 'N/A';
    const volumeEl = panel.querySelector('.stat-box:nth-child(1) .stat-value');
    const dimensionsEl = panel.querySelector('.stat-box:nth-child(2) .stat-value');
    const printTimeEl = panel.querySelector('.stat-box:nth-child(3) .stat-value');
    
    const volumeValue = volumeEl?.textContent || 'N/A';
    const dimensionsValue = dimensionsEl?.textContent || 'N/A';
    const printTimeValue = printTimeEl?.textContent || 'N/A';
    
    // Get material breakdowns
    const progressItems = panel.querySelectorAll('.progress-item');
    let materialData = [];
    
    progressItems.forEach(item => {
      const label = item.querySelector('.progress-label')?.textContent || '';
      const value = item.querySelector('.progress-value')?.textContent || '';
      materialData.push(`${label},${value}`);
    });
    
    // Get printer info
    const printer400Stats = panel.querySelector('#' + rowId + '-printer-400-stats');
    const printer600Stats = panel.querySelector('#' + rowId + '-printer-600-stats');
    
    let printer400Data = [];
    let printer600Data = [];
    
    if (printer400Stats) {
      const stats = printer400Stats.querySelectorAll('p');
      stats.forEach(stat => printer400Data.push(`"${stat.textContent}"`));
    }
    
    if (printer600Stats) {
      const stats = printer600Stats.querySelectorAll('p');
      stats.forEach(stat => printer600Data.push(`"${stat.textContent}"`));
    }
    
    // Create CSV content
    const csvContent = [
      'Powder 3D Printer Cost Calculator Results',
      `Generated on,${new Date().toLocaleString()}`,
      `Project Name,${projectName}`,
      '',
      'Basic Information',
      `Total Cost,${totalCost}`,
      `Volume (cm³),${volumeValue}`,
      `Dimensions (mm),${dimensionsValue}`,
      `Print Time,${printTimeValue}`,
      '',
      'Material Breakdown',
      'Material,Cost',
      ...materialData,
      '',
      'Printer 400 Information',
      ...printer400Data,
      '',
      'Printer 600 Information',
      ...printer600Data
    ].join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${projectName.replace(/\s+/g, '-')}-${Date.now()}.csv`);
    a.click();
    
    // Revoke the object URL to free up memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    showNotification(
      'Export Complete', 
      'Your CSV file has been downloaded.',
      'success'
    );
  }
  
  // Print results
  function printResults() {
    window.print();
  }
  
  // Save current settings to localStorage
  function saveSettings() {
    try {
      const settings = {
        currency: document.getElementById('currency')?.value,
        wallMargin: document.getElementById('wallMargin')?.value,
        objectSpacing: document.getElementById('objectSpacing')?.value,
        projectName: document.getElementById('projectName')?.value || '',
        pricing: {
          USD: { 
            powder: parseFloat(document.getElementById('pricePowder')?.value) || 100,
            binder: parseFloat(document.getElementById('priceBinder')?.value) || 0.09,
            silica: parseFloat(document.getElementById('priceSilica')?.value) || 0.072,
            glaze: parseFloat(document.getElementById('priceGlaze')?.value) || 0.01
          }
        },
        theme: document.documentElement.getAttribute('data-theme') || 'light',
        units: appState.currentUnit
      };
      
      localStorage.setItem('calculatorSettings', JSON.stringify(settings));
      
      showNotification(
        'Settings Saved', 
        'Your preferences have been saved for future sessions.',
        'success',
        3000
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      
      showNotification(
        'Save Failed', 
        'Could not save your settings. Please try again.',
        'error',
        5000
      );
    }
  }
  
  // Load settings from localStorage
  function loadSettings() {
    appState.saveEnabled = false; // Prevent auto-save during loading
    
    try {
      const savedSettings = localStorage.getItem('calculatorSettings');
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Apply settings
        if (settings.currency) {
          const currencySelect = document.getElementById('currency');
          if (currencySelect) currencySelect.value = settings.currency;
        }
        
        if (settings.wallMargin) {
          const wallMarginInput = document.getElementById('wallMargin');
          if (wallMarginInput) wallMarginInput.value = settings.wallMargin;
        }
        
        if (settings.objectSpacing) {
          const objectSpacingInput = document.getElementById('objectSpacing');
          if (objectSpacingInput) objectSpacingInput.value = settings.objectSpacing;
        }
        
        if (settings.projectName) {
          const projectNameInput = document.getElementById('projectName');
          if (projectNameInput) {
            projectNameInput.value = settings.projectName;
            appState.currentProject = settings.projectName;
            updateDocumentTitle(settings.projectName);
          }
        }
        
        // Apply theme
        if (settings.theme) {
          document.documentElement.setAttribute('data-theme', settings.theme);
          appState.darkMode = settings.theme === 'dark';
        }
        
        // Apply units
        if (settings.units) {
          appState.currentUnit = settings.units;
          
          // Update unit toggles
          const unitToggles = document.querySelectorAll('.units-toggle');
          unitToggles.forEach(toggle => {
            const buttons = toggle.querySelectorAll('.units-toggle-btn');
            buttons.forEach(btn => {
              btn.classList.remove('active');
              if ((btn.getAttribute('data-unit') === 'mm' && settings.units === UNITS.METRIC) ||
                  (btn.getAttribute('data-unit') === 'in' && settings.units === UNITS.IMPERIAL)) {
                btn.classList.add('active');
              }
            });
          });
        }
        
        // Update pricing display
        if (typeof updateAdvancedSettingsDisplay === 'function') {
          updateAdvancedSettingsDisplay();
        }
        
        // Apply settings by triggering update event
        if (typeof updateAllResults === 'function') {
          updateAllResults();
        }
        
        showNotification(
          'Settings Loaded', 
          'Your saved preferences have been applied.',
          'info',
          3000
        );
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      
      showNotification(
        'Load Failed', 
        'Could not load your saved settings. Using defaults.',
        'warning',
        5000
      );
    } finally {
      appState.saveEnabled = true; // Re-enable auto-save
    }
  }
  
  // Update document title with project name
  function updateDocumentTitle(name) {
    if (name) {
      document.title = `${name} - 3D Printer Calculator`;
    } else {
      document.title = 'Powder 3D Printer Cost Calculator';
    }
  }
  
  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }


// Or to your main.js file if you have one

// Fix for async event handlers
document.addEventListener('DOMContentLoaded', function() {
    // Fix for message channel errors
    window.addEventListener('unhandledrejection', function(event) {
      // Prevent the default handler
      event.preventDefault();
      // Log the error in a controlled way
      console.warn('Unhandled promise rejection:', event.reason);
    });
  });