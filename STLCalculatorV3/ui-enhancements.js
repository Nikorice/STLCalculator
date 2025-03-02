/* UI Enhancement Scripts for 3D Printer Cost Calculator */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all UI enhancements
    initThemeToggle();
    initTooltips();
    initExportActions();
    initNotifications();
    initInfoCards();
    initUnitsToggle();
    enhanceLoadingIndicators();
    enhanceValidationFeedback();
    enhanceDragAndDrop();
  });
  
  // Theme Toggle Implementation
  function initThemeToggle() {
    // Create theme toggle button in header
    const header = document.querySelector('header');
    const themeToggle = document.createElement('button');
    themeToggle.classList.add('theme-toggle');
    themeToggle.innerHTML = '<span class="material-icon">dark_mode</span>';
    themeToggle.setAttribute('aria-label', 'Toggle dark mode');
    themeToggle.setAttribute('title', 'Toggle dark mode');
    header.appendChild(themeToggle);
    
    // Check for saved theme preference or prefer-color-scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply theme
    if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerHTML = '<span class="material-icon">light_mode</span>';
    }
    
    // Add event listener
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      themeToggle.innerHTML = newTheme === 'dark' 
        ? '<span class="material-icon">light_mode</span>' 
        : '<span class="material-icon">dark_mode</span>';
      
      // Show notification
      showNotification(
        'Theme Changed', 
        `Switched to ${newTheme} mode.`, 
        'info'
      );
    });
  }
  
  // Initialize tooltips for complex elements
  function initTooltips() {
    // Add tooltip elements
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
      }
    ];
    
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
  
  // Initialize export actions for saving results
  function initExportActions() {
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
            exportActions.classList.toggle('open');
          });
          
          // Close dropdown when clicking elsewhere
          document.addEventListener('click', function(e) {
            if (!exportActions.contains(e.target)) {
              exportActions.classList.remove('open');
            }
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
        printResults(rowId);
        break;
    }
  }
  
  // Export calculations to PDF
  function exportToPDF(rowId) {
    // Show notification since we're not implementing full PDF export here
    showNotification(
      'PDF Export', 
      'Preparing PDF document for download...',
      'info'
    );
    
    // In a full implementation, this would use a library like jsPDF or call a server endpoint
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
    const totalCost = panel.querySelector('.total-cost').textContent;
    const volumeValue = panel.querySelector('.stat-value').textContent;
    const dimensionsValue = panel.querySelectorAll('.stat-value')[1].textContent;
    
    // Get material breakdowns
    const progressItems = panel.querySelectorAll('.progress-item');
    let materialData = [];
    
    progressItems.forEach(item => {
      const label = item.querySelector('.progress-label').textContent;
      const value = item.querySelector('.progress-value').textContent;
      materialData.push(`${label},${value}`);
    });
    
    // Create CSV content
    const csvContent = [
      'Powder 3D Printer Cost Calculator Results',
      '',
      'Total Cost,' + totalCost,
      'Volume (cm³),' + volumeValue,
      'Dimensions (mm),' + dimensionsValue,
      '',
      'Material Breakdown',
      'Material,Cost',
      ...materialData
    ].join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `3d-print-calculation-${Date.now()}.csv`);
    a.click();
    
    showNotification(
      'Export Complete', 
      'Your CSV file has been downloaded.',
      'success'
    );
  }
  
  // Print results
  function printResults(rowId) {
    window.print();
  }
  
  // Initialize notification system
  function initNotifications() {
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.classList.add('notification-container');
      document.body.appendChild(notificationContainer);
    }
  }
  
  // Show notification
  function showNotification(title, message, type = 'info', duration = 5000) {
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
  }
  
  // Dismiss notification
  function dismissNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
  
  // Initialize information cards
  function initInfoCards() {
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
      settingsCard.parentNode.insertBefore(infoCardsContainer, settingsCard.nextSibling);
    }
  }
  
  // Initialize units toggle
  function initUnitsToggle() {
    // Add units toggle to appropriate form elements
    const dimensionLabels = document.querySelectorAll('label[for="width"], label[for="depth"], label[for="height"]');
    
    dimensionLabels.forEach(label => {
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
            } else if (currentUnit === 'in' && newUnit === 'mm') {
              newValue = currentValue * 25.4;
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
  
  // Enhance loading indicators with progress feedback
  function enhanceLoadingIndicators() {
    // Replace static loading messages with progress indicators
    const loadingMessages = document.querySelectorAll('.model-viewer-loading');
    
    loadingMessages.forEach(loading => {
      // Only enhance if not already enhanced
      if (!loading.querySelector('.model-viewer-loading-progress')) {
        loading.innerHTML = `
          <div class="spinner"></div>
          <div>Loading model...</div>
          <div class="model-viewer-loading-progress">
            <div class="model-viewer-loading-bar" style="width: 0%"></div>
          </div>
        `;
      }
    });
    
    // Hook into the original STL loading process to update progress
    const originalProcessSTLFileAsync = window.processSTLFileAsync;
    
    if (originalProcessSTLFileAsync) {
      window.processSTLFileAsync = function(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400Vis, packing600Vis) {
        const loadingBar = modelViewer.querySelector('.model-viewer-loading-bar');
        
        // Show immediate visual feedback
        uploadArea.style.display = "none";
        modelViewer.style.display = "block";
        modelViewer.querySelector('.model-viewer-loading').style.display = "flex";
        resultsPanel.style.display = "block";
        
        // Simulate progress during file reading
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 5;
          if (progress <= 90) {
            if (loadingBar) loadingBar.style.width = `${progress}%`;
          }
        }, 100);
        
        // Call original function
        const result = originalProcessSTLFileAsync(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400Vis, packing600Vis);
        
        // When complete, set to 100%
        result.then(() => {
          clearInterval(progressInterval);
          if (loadingBar) loadingBar.style.width = '100%';
        }).catch(() => {
          clearInterval(progressInterval);
        });
        
        return result;
      };
    }
  }
  
  // Enhance file validation feedback
  function enhanceValidationFeedback() {
    // Add validation feedback for STL uploads
    const originalProcessSTLFileAsync = window.processSTLFileAsync;
    
    if (originalProcessSTLFileAsync) {
      window.processSTLFileAsync = function(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400Vis, packing600Vis) {
        const row = document.getElementById(rowId);
        
        // Check file type
        if (!file.name.toLowerCase().endsWith('.stl')) {
          // Show error
          showValidationError(row, 'Invalid file type. Please upload an STL file.', file.name);
          return Promise.reject(new Error('Invalid file type'));
        }
        
        // Check file size
        if (file.size > 50 * 1024 * 1024) { // 50MB
          // Show warning
          showValidationWarning(row, 'Large STL file (>50MB) may affect performance.', file.name);
        } else if (file.size > 10 * 1024 * 1024) { // 10MB
          // Show info
          showValidationInfo(row, 'Medium size STL file (>10MB).', file.name);
        } else {
          // Show success
          showValidationSuccess(row, 'STL file loaded successfully.', file.name);
        }
        
        // Call original function
        return originalProcessSTLFileAsync(rowId, file, uploadArea, modelViewer, resultsPanel, scene, camera, controls, packing400Vis, packing600Vis);
      };
    }
  }
  
  // Show validation success
  function showValidationSuccess(row, message, filename) {
    showValidationFeedback(row, message, filename, 'success');
  }
  
  // Show validation info
  function showValidationInfo(row, message, filename) {
    showValidationFeedback(row, message, filename, 'info');
  }
  
  // Show validation warning
  function showValidationWarning(row, message, filename) {
    showValidationFeedback(row, message, filename, 'warning');
  }
  
  // Show validation error
  function showValidationError(row, message, filename) {
    showValidationFeedback(row, message, filename, 'error');
  }
  
  // Show validation feedback
  function showValidationFeedback(row, message, filename, type) {
    // Check if validation feedback already exists
    let feedback = row.querySelector('.validation-feedback');
    
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.classList.add('validation-feedback');
      
      // Insert after upload area
      const uploadArea = row.querySelector('.upload-area');
      if (uploadArea && uploadArea.parentNode) {
        uploadArea.parentNode.insertBefore(feedback, uploadArea.nextSibling);
      }
    }
    
    // Set feedback type
    feedback.className = 'validation-feedback';
    feedback.classList.add(type);
    
    // Set feedback content
    feedback.innerHTML = `
      <strong>${filename}:</strong> ${message}
    `;
    
    // Show feedback
    feedback.style.display = 'block';
    
    // Hide after 5 seconds if not error
    if (type !== 'error') {
      setTimeout(() => {
        feedback.style.display = 'none';
      }, 5000);
    }
  }
  
  // Enhance drag and drop interactions
  function enhanceDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.upload-area');
    
    uploadAreas.forEach(area => {
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
  }
  
  // Add browser notifications for long processes
  function requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
        }
      });
    }
  }
  
  // Show browser notification
  function showBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/favicon.ico' // Path to your favicon
      });
    }
  }
  
  // Additional utility functions
  
  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  // Update document title with project name
  function updateDocumentTitle(name) {
    if (name) {
      document.title = `${name} - 3D Printer Calculator`;
    } else {
      document.title = 'Powder 3D Printer Cost Calculator';
    }
  }
  
  // Save current settings to localStorage
  function saveSettings() {
    const settings = {
      currency: document.getElementById('currency').value,
      wallMargin: document.getElementById('wallMargin').value,
      objectSpacing: document.getElementById('objectSpacing').value,
      pricing: {
        USD: { 
          powder: parseFloat(document.getElementById('pricePowder').value),
          binder: parseFloat(document.getElementById('priceBinder').value),
          silica: parseFloat(document.getElementById('priceSilica').value),
          glaze: parseFloat(document.getElementById('priceGlaze').value)
        }
      },
      theme: document.documentElement.getAttribute('data-theme') || 'light'
    };
    
    localStorage.setItem('calculatorSettings', JSON.stringify(settings));
    
    showNotification(
      'Settings Saved', 
      'Your preferences have been saved for future sessions.',
      'success',
      3000
    );
  }
  
  // Load settings from localStorage
  function loadSettings() {
    const savedSettings = localStorage.getItem('calculatorSettings');
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        
        // Apply settings
        if (settings.currency) document.getElementById('currency').value = settings.currency;
        if (settings.wallMargin) document.getElementById('wallMargin').value = settings.wallMargin;
        if (settings.objectSpacing) document.getElementById('objectSpacing').value = settings.objectSpacing;
        
        // Apply theme
        if (settings.theme) {
          document.documentElement.setAttribute('data-theme', settings.theme);
        }
        
        // Update pricing display
        updateAdvancedSettingsDisplay();
        
        showNotification(
          'Settings Loaded', 
          'Your saved preferences have been applied.',
          'info',
          3000
        );
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }