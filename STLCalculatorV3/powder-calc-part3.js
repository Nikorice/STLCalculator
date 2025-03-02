/* powder-calc-part3.js - Consolidated Three.js Visualization Functions */

/* ====================== THREE.JS FUNCTIONS ====================== */
/* Performance Optimizations */

// Enhanced version of initThreeJSViewer
function initThreeJSViewer(container) {
    perfMonitor.start('initViewer');
    
    // Create renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: window.devicePixelRatio < 1.5, // Use antialiasing only for lower-res displays
      powerPreference: 'high-performance',
      precision: 'mediump',
      alpha: true
    });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio
    
    // Check for dark mode and set background accordingly
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    renderer.setClearColor(isDarkMode ? 0x1e293b : 0xf0f2f5);
    container.appendChild(renderer.domElement);
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x1e293b : 0xf0f2f5);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 50, 50);
    
    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(50, 50, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Add a gentle hemisphere light for more pleasing visuals
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
    scene.add(hemiLight);
    
    // Enhanced orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.8;
    controls.rotateSpeed = 0.6;
    controls.autoRotate = false; // Start without auto-rotation
    controls.autoRotateSpeed = 1.0;
    
    // Add viewer controls
    setupViewerControls(container, scene, camera, controls, renderer);
    
    // Throttled resize handler
    let resizeTimeout;
    const onWindowResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        needsRender = true;
      }, 200);
    };
    
    const resizeObserver = new ResizeObserver(onWindowResize);
    resizeObserver.observe(container);
    
    // Enhanced animation loop with throttling and visibility detection
    let active = false;
    let needsRender = false;
    let animationFrameId;
    let lastRenderTime = 0;
    const FRAME_INTERVAL = 33; // Limit to 30fps
    
    function animate(time) {
      animationFrameId = requestAnimationFrame(animate);
      
      // Only render when visible in viewport
      if (!active) return;
      
      // Check if enough time has passed or if a render is needed
      if (time - lastRenderTime >= FRAME_INTERVAL || needsRender) {
        controls.update();
        renderer.render(scene, camera);
        lastRenderTime = time;
        needsRender = false;
      }
    }
    
    // Use Intersection Observer to only animate when in viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        active = entry.isIntersecting;
        if (active) {
          needsRender = true;
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(container);
    
    // Start animation
    animate(0);
    
    // Listen for theme changes
    document.addEventListener('themeChanged', (e) => {
      const isDarkMode = e.detail.theme === 'dark';
      scene.background = new THREE.Color(isDarkMode ? 0x1e293b : 0xf0f2f5);
      needsRender = true;
    });
    
    // Enhanced cleanup
    const cleanup = () => {
      observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      
      // Remove all control buttons
      const controlButtons = container.querySelectorAll('.viewer-control-btn');
      controlButtons.forEach(btn => btn.remove());
      
      renderer.dispose();
    };
    
    perfMonitor.end('initViewer');
    return { renderer, scene, camera, controls, cleanup };
}
  
// Setup viewer controls
function setupViewerControls(container, scene, camera, controls, renderer) {
    // Get control buttons
    const resetCameraBtn = container.querySelector('.reset-camera-btn');
    const toggleWireframeBtn = container.querySelector('.toggle-wireframe-btn');
    const takeScreenshotBtn = container.querySelector('.take-screenshot-btn');
    
    // Reset camera button
    if (resetCameraBtn) {
      resetCameraBtn.addEventListener('click', () => {
        gsap.to(camera.position, {
          x: 50,
          y: 50,
          z: 50,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: function() {
            controls.update();
          }
        });
        
        // Reset controls
        controls.target.set(0, 0, 0);
        
        // Show notification
        if (typeof showNotification === 'function') {
          showNotification('Camera Reset', 'View has been reset to default.', 'info', 2000);
        }
      });
    }
    
    // Toggle wireframe button
    if (toggleWireframeBtn) {
      let wireframeEnabled = false;
      
      toggleWireframeBtn.addEventListener('click', () => {
        wireframeEnabled = !wireframeEnabled;
        
        // Update all materials in the scene
        scene.traverse(obj => {
          if (obj.isMesh && obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(material => {
                material.wireframe = wireframeEnabled;
              });
            } else {
              obj.material.wireframe = wireframeEnabled;
            }
          }
        });
        
        // Toggle button appearance
        if (wireframeEnabled) {
          toggleWireframeBtn.classList.add('active');
          toggleWireframeBtn.style.backgroundColor = 'var(--primary)';
          toggleWireframeBtn.style.color = 'white';
        } else {
          toggleWireframeBtn.classList.remove('active');
          toggleWireframeBtn.style.backgroundColor = '';
          toggleWireframeBtn.style.color = '';
        }
        
        // Show notification
        if (typeof showNotification === 'function') {
          showNotification(
            wireframeEnabled ? 'Wireframe Enabled' : 'Wireframe Disabled', 
            wireframeEnabled ? 'Model is now displayed in wireframe mode.' : 'Model is now displayed in solid mode.',
            'info',
            2000
          );
        }
      });
    }
    
    // Take screenshot button
    if (takeScreenshotBtn) {
      takeScreenshotBtn.addEventListener('click', () => {
        // Temporarily render at high resolution
        const originalPixelRatio = renderer.getPixelRatio();
        renderer.setPixelRatio(Math.max(window.devicePixelRatio, 2));
        renderer.render(scene, camera);
        
        try {
          // Get image data
          const dataURL = renderer.domElement.toDataURL('image/png');
          
          // Create download link
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `3d-model-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Show notification
          if (typeof showNotification === 'function') {
            showNotification(
              'Screenshot Taken', 
              'Your screenshot has been downloaded.',
              'success',
              3000
            );
          }
        } catch (error) {
          console.error('Error taking screenshot:', error);
          
          // Show error notification
          if (typeof showNotification === 'function') {
            showNotification(
              'Screenshot Failed', 
              'Could not capture screenshot. Check browser permissions.',
              'error',
              5000
            );
          }
        }
        
        // Reset pixel ratio
        renderer.setPixelRatio(originalPixelRatio);
        renderer.render(scene, camera);
      });
    }
    
    // Add auto-rotate toggle
    const autoRotateBtn = document.createElement('button');
    autoRotateBtn.classList.add('viewer-control-btn');
    autoRotateBtn.setAttribute('title', 'Toggle Auto-Rotate');
    autoRotateBtn.innerHTML = '<span class="material-icon">rotate_right</span>';
    
    // Insert before other controls
    const viewerControls = container.querySelector('.viewer-controls');
    if (viewerControls) {
      viewerControls.insertBefore(autoRotateBtn, viewerControls.firstChild);
      
      // Add event listener
      autoRotateBtn.addEventListener('click', () => {
        controls.autoRotate = !controls.autoRotate;
        
        // Toggle button appearance
        if (controls.autoRotate) {
          autoRotateBtn.classList.add('active');
          autoRotateBtn.style.backgroundColor = 'var(--primary)';
          autoRotateBtn.style.color = 'white';
        } else {
          autoRotateBtn.classList.remove('active');
          autoRotateBtn.style.backgroundColor = '';
          autoRotateBtn.style.color = '';
        }
      });
    }
}
  
// Enhanced version of displayGeometry that makes the STL object sit on a flat grid
// Enhanced version of displayGeometry that makes the STL object sit on the grid
function displayGeometry(geometry, scene, camera, controls) {
    perfMonitor.start('displayModel');
  
    // Clone original geometry and clear existing meshes from the scene
    const originalGeometry = geometry.clone();
    scene.traverse(obj => {
      if (obj.isMesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        scene.remove(obj);
      }
    });
  
    // Create an enhanced material
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const material = new THREE.MeshPhysicalMaterial({
      color: isDarkMode ? 0x3b82f6 : 0x3a86ff,
      metalness: 0.1,
      roughness: 0.5,
      reflectivity: 0.2,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3,
      flatShading: true
    });
  
    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);
  
    // Compute the original bounding box and size for orientation data
    originalGeometry.computeBoundingBox();
    const originalSize = new THREE.Vector3();
    originalGeometry.boundingBox.getSize(originalSize);
  
    // Store original data for future resets
    mesh.userData.originalGeometry = originalGeometry;
    mesh.userData.originalSize = originalSize.clone();
  
    // Determine optimal orientation (for example, flat or vertical)
    const orientationData = determineOptimalOrientation(
      originalSize.x, originalSize.y, originalSize.z
    );
  
    // Apply default "flat" orientation
    applyOrientation(mesh, originalSize, "flat");
  
    // Now adjust the mesh so its lowest point is at y = 0.
    // Compute the bounding box after orientation and shift it upward.
    mesh.geometry.computeBoundingBox();
    const bbox = mesh.geometry.boundingBox;
    const yOffset = bbox.min.y; // distance below y=0
    mesh.position.y -= yOffset;
  
    // Add the mesh to the scene
    scene.add(mesh);
  
    // Adjust camera position and target based on the new bounding box
    mesh.geometry.computeBoundingBox();
    const newBbox = mesh.geometry.boundingBox;
    const size = new THREE.Vector3();
    newBbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = Math.max(maxDim * 1.5, 50);
  
    if (typeof gsap !== 'undefined') {
      gsap.to(camera.position, {
        x: distance,
        y: distance,
        z: distance,
        duration: 1.2,
        ease: "power2.inOut"
      });
      gsap.to(controls.target, {
        x: 0,
        y: size.y / 2,
        z: 0,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: function() {
          controls.update();
        }
      });
    } else {
      camera.position.set(distance, distance, distance);
      controls.target.set(0, size.y / 2, 0);
      camera.lookAt(0, size.y / 2, 0);
      controls.update();
    }
  
    // Add grid for better spatial reference
    const gridSize = Math.max(maxDim * 2, 50);
    const gridDivisions = 20;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x3a86ff, 0xd1d5db);
    gridHelper.position.y = 0;  // Place grid at y = 0 (the floor)
    scene.add(gridHelper);
  
    // Save data in scene.userData for later use if needed
    scene.userData = {
      originalGeometry,
      originalSize,
      mesh,
      orientationData
    };
  
    perfMonitor.end('displayModel');
    return orientationData;
}
  
// Enhanced axis helpers
function addEnhancedAxisHelpers(scene, size) {
    // Remove existing axis helpers
    scene.traverse(child => {
      if (child.isAxesHelper) {
        scene.remove(child);
      }
    });
    
    // Create enhanced axis helper
    const axesHelper = new THREE.AxesHelper(size);
    
    // Customize axis colors for better visibility
    const materials = axesHelper.material;
    if (Array.isArray(materials)) {
      materials[0].color.set(0xff4a4a); // X-axis (red)
      materials[1].color.set(0xff4a4a);
      materials[2].color.set(0x4aff4a); // Y-axis (green)
      materials[3].color.set(0x4aff4a);
      materials[4].color.set(0x4a4aff); // Z-axis (blue)
      materials[5].color.set(0x4a4aff);
    }
    
    scene.add(axesHelper);
    
    // Add axis labels for better understanding
    addAxisLabels(scene, size);
}
  
// Add axis labels
function addAxisLabels(scene, size) {
    // Remove existing labels
    scene.traverse(child => {
      if (child.userData && child.userData.isAxisLabel) {
        scene.remove(child);
      }
    });
    
    // Function to create a text sprite
    function createTextSprite(text, position, color) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 64;
      
      // Set background to transparent
      context.fillStyle = 'rgba(0, 0, 0, 0)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      context.font = 'Bold 48px Arial';
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      // Create texture
      const texture = new THREE.CanvasTexture(canvas);
      
      // Create sprite material
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      
      // Create sprite
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(5, 2.5, 1);
      sprite.userData.isAxisLabel = true;
      
      return sprite;
    }
    
    // Create labels
    const xLabel = createTextSprite('X', new THREE.Vector3(size + 2, 0, 0), '#ff4a4a');
    const yLabel = createTextSprite('Y', new THREE.Vector3(0, size + 2, 0), '#4aff4a');
    const zLabel = createTextSprite('Z', new THREE.Vector3(0, 0, size + 2), '#4a4aff');
    
    scene.add(xLabel);
    scene.add(yLabel);
    scene.add(zLabel);
}
  
// Add grid for better spatial reference
function addGrid(scene, size) {
    // Remove existing grids
    scene.traverse(child => {
      if (child.isGridHelper) {
        scene.remove(child);
      }
    });
    
    // Create grid helper
    const gridSize = Math.ceil(size / 10) * 10; // Round to nearest 10
    const gridDivisions = 20;
    
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    const gridHelper = new THREE.GridHelper(
      gridSize, 
      gridDivisions,
      isDarkMode ? 0x4a4aff : 0x3a86ff, // Main lines
      isDarkMode ? 0x334155 : 0xd1d5db  // Secondary lines
    );
    
    // Rotate grid to XY plane (for better visualization of printer bed)
    gridHelper.rotation.x = 0;
    
    // Position grid at the bottom of the object
    gridHelper.position.set(0, 0, 0);
    
    scene.add(gridHelper);
    
    // Listen for theme changes
    document.addEventListener('themeChanged', (e) => {
      const isDarkMode = e.detail.theme === 'dark';
      if (gridHelper) {
        // Update grid colors based on theme
        const mainColor = isDarkMode ? 0x4a4aff : 0x3a86ff;
        const secondaryColor = isDarkMode ? 0x334155 : 0xd1d5db;
        
        if (gridHelper.material && gridHelper.material.color) {
          gridHelper.material.color.set(mainColor);
        }
        
        if (gridHelper.material && gridHelper.material.colors) {
          gridHelper.material.colors = [
            new THREE.Color(mainColor),
            new THREE.Color(secondaryColor)
          ];
        }
      }
    });
}
  
// Enhanced version of changeOrientation
function changeOrientation(scene, camera, controls, orientationType) {
    if (!scene.userData || !scene.userData.mesh) return null;
    
    const mesh = scene.userData.mesh;
    const originalSize = scene.userData.originalSize;
    const orientationData = scene.userData.orientationData;
    
    // Apply orientation with a visual transition
    const startRotation = new THREE.Euler().copy(mesh.rotation);
    const startPosition = new THREE.Vector3().copy(mesh.position);
    
    // First, reset to original geometry
    const newGeometry = applyOrientation(mesh, originalSize, orientationType);
    
    // Animate the transition if GSAP is available
    if (typeof gsap !== 'undefined') {
      gsap.from(mesh.rotation, {
        x: startRotation.x,
        y: startRotation.y,
        z: startRotation.z,
        duration: 0.8,
        ease: "power1.inOut"
      });
      
      gsap.from(mesh.position, {
        x: startPosition.x,
        y: startPosition.y,
        z: startPosition.z,
        duration: 0.8,
        ease: "power1.inOut"
      });
      
      // Adjust camera to focus on the reoriented object
      newGeometry.computeBoundingBox();
      const bbox = newGeometry.boundingBox;
      const size = new THREE.Vector3();
      bbox.getSize(size);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = Math.max(maxDim * 1.5, 50);
      
      // Position camera based on orientation
      if (orientationType === "vertical") {
        // For vertical orientation, position camera to see height properly
        gsap.to(camera.position, {
          x: distance,
          y: distance,
          z: distance,
          duration: 0.8,
          ease: "power2.inOut"
        });
      } else {
        // For flat orientation, position camera more from above
        gsap.to(camera.position, {
          x: distance,
          y: distance,
          z: distance,
          duration: 0.8,
          ease: "power2.inOut"
        });
      }
      
      // Update controls target
      gsap.to(controls.target, {
        x: 0,
        y: 0,
        z: size.z / 2,
        duration: 0.8,
        ease: "power2.inOut",
        onUpdate: function() {
          controls.update();
        }
      });
    } else {
      // Fallback if GSAP isn't available
      camera.position.set(distance, distance, distance);
      controls.target.set(0, 0, size.z / 2);
      controls.update();
    }
    
    // Update orientationData
    orientationData.type = orientationType;
    if (orientationType === "vertical") {
      orientationData.width = orientationData.vertical.width;
      orientationData.depth = orientationData.vertical.depth;
      orientationData.height = orientationData.vertical.height;
      orientationData.printTime = orientationData.vertical.printTime;
    } else {
      orientationData.width = orientationData.flat.width;
      orientationData.depth = orientationData.flat.depth;
      orientationData.height = orientationData.flat.height;
      orientationData.printTime = orientationData.flat.printTime;
    }
    
    return orientationData;
}
  
// Enhanced packing visualization with clearer layout and minimal labels
function visualizePacking(printer, objWidth, objDepth, objHeight, positions, container, stlGeometry, orientationType) {
    perfMonitor.start('visualizePacking');
    
    // Clean up old renderer
    if (container.cleanup) {
      container.cleanup();
    }
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Check for dark mode
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Show "exceeds capacity" if no positions
    if (!positions || positions.length === 0) {
      const message = document.createElement("div");
      message.style.height = "100%";
      message.style.display = "flex";
      message.style.flexDirection = "column";
      message.style.alignItems = "center";
      message.style.justifyContent = "center";
      message.style.fontSize = "14px";
      message.style.color = "var(--danger)";
      message.innerHTML = `
        <span class="material-icon" style="font-size: 36px; margin-bottom: 8px;">error_outline</span>
        <span>Object exceeds printer capacity</span>
      `;
      container.appendChild(message);
      perfMonitor.end('visualizePacking');
      return;
    }
    
    // Create dimension label
    const dimensionLabel = document.createElement('div');
    dimensionLabel.className = 'dimension-label';
    dimensionLabel.style.position = 'absolute';
    dimensionLabel.style.bottom = '10px';
    dimensionLabel.style.left = '10px';
    dimensionLabel.style.backgroundColor = isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)';
    dimensionLabel.style.padding = '5px 8px';
    dimensionLabel.style.borderRadius = '4px';
    dimensionLabel.style.fontSize = '12px';
    dimensionLabel.style.color = isDarkMode ? '#e2e8f0' : '#1e293b';
    dimensionLabel.style.pointerEvents = 'none';
    dimensionLabel.textContent = `${printer.width}mm × ${printer.depth}mm × ${printer.height}mm`;
    container.appendChild(dimensionLabel);
    
    try {
      // Create renderer with more conservative settings
      const renderer = new THREE.WebGLRenderer({
        antialias: false, // Disable antialiasing for better performance
        alpha: true,
        powerPreference: 'default',
        precision: 'lowp' // Use low precision for better performance
      });
      
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(isDarkMode ? 0x1e293b : 0xffffff, 1);
      container.appendChild(renderer.domElement);
      
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(isDarkMode ? 0x1e293b : 0xffffff);
      
      // Use orthographic camera with simpler settings
      const aspect = container.clientWidth / container.clientHeight;
      const frustumSize = Math.max(printer.width, printer.depth, printer.height) * 1.2;
      
      const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
      
      const isoDist = Math.max(printer.width, printer.depth, printer.height) * 0.7;
      camera.position.set(isoDist, -isoDist, isoDist);
      camera.lookAt(printer.width/2, printer.depth/2, printer.height/2);
      
      // Add simpler controls with less demanding settings
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = false; // Disable damping for better performance
      controls.minZoom = 0.5;
      controls.maxZoom = 2;
      controls.target.set(printer.width/2, printer.depth/2, printer.height/2);
      controls.update();
      
      // Simpler lighting setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);
      
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
      dirLight.position.set(isoDist, -isoDist, isoDist);
      scene.add(dirLight);
      
      // Create printer outline
      createPrinterOutline(scene, printer, isDarkMode);
      
      // Create base plate with better visual appearance
      const basePlateGeom = new THREE.BoxGeometry(printer.width, printer.depth, 1);
      const basePlateMat = new THREE.MeshBasicMaterial({ // Use MeshBasicMaterial instead of PhongMaterial
        color: isDarkMode ? 0x334155 : 0xf1f5f9,
        opacity: 0.7,
        transparent: true
      });
      const basePlate = new THREE.Mesh(basePlateGeom, basePlateMat);
      basePlate.position.set(printer.width/2, printer.depth/2, 0.5);
      scene.add(basePlate);
      
      // Add grid to base plate
      const gridHelper = new THREE.GridHelper(
        Math.max(printer.width, printer.depth),
        10,
        isDarkMode ? 0x475569 : 0xd1d5db,
        isDarkMode ? 0x334155 : 0xe2e8f0
      );
      gridHelper.rotation.x = Math.PI / 2;
      gridHelper.position.set(printer.width/2, printer.depth/2, 1.1);
      scene.add(gridHelper);
      
      // Enhanced axis lines and labels
      const axisLength = Math.max(printer.width, printer.depth, printer.height) * 0.4;
      
      // X axis (red)
      const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(axisLength, 0, 0)
      ]);
      const xAxis = new THREE.Line(xAxisGeom, new THREE.LineBasicMaterial({
        color: 0xff4a4a,
        linewidth: 2
      }));
      scene.add(xAxis);
      
      // Y axis (green)
      const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, axisLength, 0)
      ]);
      const yAxis = new THREE.Line(yAxisGeom, new THREE.LineBasicMaterial({
        color: 0x4aff4a,
        linewidth: 2
      }));
      scene.add(yAxis);
      
      // Z axis (blue)
      const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, axisLength)
      ]);
      const zAxis = new THREE.Line(zAxisGeom, new THREE.LineBasicMaterial({
        color: 0x4a4aff,
        linewidth: 2
      }));
      scene.add(zAxis);
      
      // Create axis labels
      const createLabel = (text, position, color) => {
        const div = document.createElement('div');
        div.textContent = text;
        div.style.position = 'absolute';
        div.style.color = color;
        div.style.backgroundColor = isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)';
        div.style.padding = '3px 6px';
        div.style.borderRadius = '3px';
        div.style.fontWeight = 'bold';
        div.style.fontSize = '14px';
        div.style.fontFamily = '"Inter", sans-serif';
        div.style.textShadow = isDarkMode ? 'none' : '1px 1px 1px rgba(255,255,255,0.7)';
        div.style.pointerEvents = 'none';
        container.appendChild(div);
        return { element: div, position };
      };
      
      const labels = [
        createLabel('X', new THREE.Vector3(axisLength + 5, 0, 0), '#ff4a4a'),
        createLabel('Y', new THREE.Vector3(0, axisLength + 5, 0), '#4aff4a'),
        createLabel('Z', new THREE.Vector3(0, 0, axisLength + 5), '#4a4aff')
      ];
      
      // Create objects
      if (stlGeometry) {
        // Parse bounding box once
        const stlBbox = new THREE.Box3().setFromObject(new THREE.Mesh(stlGeometry));
        const stlSize = new THREE.Vector3();
        stlBbox.getSize(stlSize);
        
        positions.forEach(pos => {
          // Create object material with translucent effect
          const objectMat = new THREE.MeshBasicMaterial({
            color: 0x10b981, // Green color
            opacity: 0.8,
            transparent: true
          });
          
          // Create a mesh from the STL
          const stlMesh = new THREE.Mesh(stlGeometry.clone(), objectMat);
          
          // Store original for orientation
          stlMesh.userData.originalGeometry = stlGeometry.clone();
          stlMesh.userData.originalSize = stlSize.clone();
          
          // Apply the same orientation user selected
          applyOrientation(stlMesh, stlMesh.userData.originalSize, orientationType);
          
          // Scale to correct dimensions
          stlMesh.geometry.computeBoundingBox();
          const orientedBbox = stlMesh.geometry.boundingBox;
          const orientedSize = new THREE.Vector3();
          orientedBbox.getSize(orientedSize);
          
          const scaleX = objWidth / orientedSize.x;
          const scaleY = objDepth / orientedSize.y;
          const scaleZ = objHeight / orientedSize.z;
          stlMesh.scale.set(scaleX, scaleY, scaleZ);
          
          // Recompute bounding box after scaling
          stlMesh.geometry.computeBoundingBox();
          const finalBbox = stlMesh.geometry.boundingBox;
          
          // Position so that bottom corner is at pos.x, pos.y, pos.z
          stlMesh.position.set(
            pos.x - finalBbox.min.x,
            pos.y - finalBbox.min.y,
            pos.z - finalBbox.min.z
          );
          
          scene.add(stlMesh);
        });
      } else {
        // If no STL geometry, use simple boxes
        positions.forEach(pos => {
          const boxGeom = new THREE.BoxGeometry(objWidth, objDepth, objHeight);
          const boxMat = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            opacity: 0.8,
            transparent: true
          });
          const box = new THREE.Mesh(boxGeom, boxMat);
          box.position.set(
            pos.x + objWidth/2,
            pos.y + objDepth/2,
            pos.z + objHeight/2
          );
          scene.add(box);
        });
      }
      
      // Simplified animation loop
      let animationId;
      let active = true;
      
      function animate() {
        if (!active) return;
        
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        
        // Update label positions
        labels.forEach(label => {
          const screenPos = label.position.clone().project(camera);
          label.element.style.left = `${(screenPos.x * 0.5 + 0.5) * container.clientWidth}px`;
          label.element.style.top = `${(-screenPos.y * 0.5 + 0.5) * container.clientHeight}px`;
        });
      }
      
      // Start animation with a short delay
      setTimeout(() => {
        animate();
      }, 100);
      
      // Responsive resize handling
      const resizeObserver = new ResizeObserver(() => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        const aspect = container.clientWidth / container.clientHeight;
        camera.left = frustumSize * aspect / -2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = frustumSize / -2;
        camera.updateProjectionMatrix();
      });
      resizeObserver.observe(container);
      
      // Theme change listener
      const themeChangeListener = (e) => {
        const isDark = e.detail.theme === 'dark';
        scene.background = new THREE.Color(isDark ? 0x1e293b : 0xffffff);
        
        // Update base plate
        basePlateMat.color.set(isDark ? 0x334155 : 0xf1f5f9);
        
        // Update labels
        dimensionLabel.style.backgroundColor = isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        dimensionLabel.style.color = isDark ? '#e2e8f0' : '#1e293b';
        
        labels.forEach(label => {
          label.element.style.backgroundColor = isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)';
          label.element.style.textShadow = isDark ? 'none' : '1px 1px 1px rgba(255,255,255,0.7)';
        });
      };
      
      document.addEventListener('themeChanged', themeChangeListener);
      
      // Improved cleanup function
      container.cleanup = () => {
        active = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        
        document.removeEventListener('themeChanged', themeChangeListener);
        
        // Remove all DOM elements
        labels.forEach(label => {
          if (label.element && label.element.parentNode) {
            label.element.parentNode.removeChild(label.element);
          }
        });
        
        if (dimensionLabel && dimensionLabel.parentNode) {
          dimensionLabel.parentNode.removeChild(dimensionLabel);
        }
        
        // Dispose of all scene objects
        scene.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
        
        // Dispose of renderer
        if (renderer) {
          renderer.dispose();
          if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        }
        
        // Clear THREE.js cache
        THREE.Cache.clear();
      };
      
    } catch (error) {
      console.error("Error in visualizePacking:", error);
      
      // Display fallback message if visualization fails
      const errorMessage = document.createElement("div");
      errorMessage.style.height = "100%";
      errorMessage.style.display = "flex";
      errorMessage.style.flexDirection = "column";
      errorMessage.style.alignItems = "center";
      errorMessage.style.justifyContent = "center";
      errorMessage.style.fontSize = "14px";
      errorMessage.style.color = "var(--danger)";
      errorMessage.innerHTML = `
        <span class="material-icon" style="font-size: 36px; margin-bottom: 8px;">error_outline</span>
        <span>Visualization error: ${error.message}</span>
      `;
      container.appendChild(errorMessage);
    }
    
    perfMonitor.end('visualizePacking');
}
  
// Create minimalist printer outline
function createPrinterOutline(scene, printer, isDarkMode) {
    const w = printer.width;
    const d = printer.depth;
    const h = printer.height;
    
    // Use dashed lines for better visibility
    const lineMaterial = new THREE.LineDashedMaterial({ 
      color: isDarkMode ? 0x94a3b8 : 0x64748b, 
      dashSize: 5,
      gapSize: 3,
      opacity: 0.8,
      transparent: true,
      linewidth: 1
    });
    
    const edges = [
      // bottom
      [[0, 0, 0], [w, 0, 0]],
      [[w, 0, 0], [w, d, 0]],
      [[w, d, 0], [0, d, 0]],
      [[0, d, 0], [0, 0, 0]],
      
      // top
      [[0, 0, h], [w, 0, h]],
      [[w, 0, h], [w, d, h]],
      [[w, d, h], [0, d, h]],
      [[0, d, h], [0, 0, h]],
      
      // verticals
      [[0, 0, 0], [0, 0, h]],
      [[w, 0, 0], [w, 0, h]],
      [[w, d, 0], [w, d, h]],
      [[0, d, 0], [0, d, h]]
    ];
    
    edges.forEach(edge => {
      const points = [
        new THREE.Vector3(...edge[0]),
        new THREE.Vector3(...edge[1])
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      line.computeLineDistances(); // Required for dashed lines
      scene.add(line);
    });
}

// Improved applyOrientation function that properly rotates without stretching
function applyOrientation(mesh, originalSize, orientationType) {
    // Reset mesh transforms
    mesh.rotation.set(0, 0, 0);
    mesh.position.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.updateMatrix();
  
    // Get a fresh copy of the original geometry
    const baseGeometry = mesh.userData.originalGeometry 
        ? mesh.userData.originalGeometry.clone() 
        : mesh.geometry.clone();
  
    // Determine original dimensions along each axis
    const dimensions = [
      { axis: 'x', value: originalSize.x },
      { axis: 'y', value: originalSize.y },
      { axis: 'z', value: originalSize.z }
    ];
    // Sort descending so that the first element has the longest dimension
    dimensions.sort((a, b) => b.value - a.value);
    const longestAxis = dimensions[0].axis;
  
    // Prepare a rotation matrix to change the orientation
    let rotMatrix = new THREE.Matrix4();
    if (orientationType === "vertical") {
      // We want the longest dimension to align with the Z-axis.
      if (longestAxis === 'x') {
        // Rotate around Y by -90° so X becomes Z.
        rotMatrix.makeRotationY(-Math.PI / 2);
      } else if (longestAxis === 'y') {
        // Rotate around X by +90° so Y becomes Z.
        rotMatrix.makeRotationX(Math.PI / 2);
      } else {
        // If already along Z, no rotation is needed.
        rotMatrix.identity();
      }
    } else { // "flat" orientation
      // For a flat print, we want the longest dimension to lie in the XY plane.
      if (longestAxis === 'z') {
        // Rotate around X by -90° so that Z is rotated into the Y direction.
        rotMatrix.makeRotationX(-Math.PI / 2);
      } else {
        rotMatrix.identity();
      }
    }
  
    // Apply the rotation to the geometry
    baseGeometry.applyMatrix4(rotMatrix);
    mesh.geometry.dispose();
    mesh.geometry = baseGeometry;
  
    // Recompute bounding box and center the mesh so that its lowest point is at z = 0.
    baseGeometry.computeBoundingBox();
    const bbox = baseGeometry.boundingBox;
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    // Center in X and Y, and shift in Z so that the minimum Z becomes 0.
    mesh.position.set(-center.x, -center.y, -bbox.min.z);
  
    return baseGeometry;
  }
  
  
// Determine the optimal orientation for an object (longest dimension = vertical or default to flat, etc.)
function determineOptimalOrientation(width, depth, height) {
    const dimensions = [
      { value: width, name: 'width' },
      { value: depth, name: 'depth' },
      { value: height, name: 'height' }
    ];
    dimensions.sort((a, b) => b.value - a.value); // descending
    
    const maxDim = dimensions[0];
    const midDim = dimensions[1];
    const minDim = dimensions[2];
    
    let orientation = {
      width: 0,
      depth: 0,
      height: 0,
      type: "",
      printTime: 0,
      vertical: {
        width: 0,
        depth: 0, 
        height: 0,
        printTime: 0
      },
      flat: {
        width: 0,
        depth: 0,
        height: 0,
        printTime: 0
      }
    };
    
    // vertical: put the longest dimension on Z
    if (maxDim.value <= printer600.height) {
      orientation.vertical.width = minDim.value;
      orientation.vertical.depth = midDim.value;
      orientation.vertical.height = maxDim.value;
      orientation.vertical.printTime = Math.ceil(maxDim.value / 0.1) * printer600.layerTime;
    } else {
      // too tall; scale it or just set to max
      const scale = printer600.height / maxDim.value;
      orientation.vertical.width = minDim.value * scale;
      orientation.vertical.depth = midDim.value * scale;
      orientation.vertical.height = printer600.height;
      orientation.vertical.printTime = Math.ceil(printer600.height / 0.1) * printer600.layerTime;
    }
    
    // flat: put the shortest dimension on Z
    orientation.flat.width = maxDim.value;
    orientation.flat.depth = midDim.value;
    orientation.flat.height = minDim.value;
    orientation.flat.printTime = Math.ceil(minDim.value / 0.1) * printer600.layerTime;
    
    // default to flat
    orientation.width = orientation.flat.width;
    orientation.depth = orientation.flat.depth;
    orientation.height = orientation.flat.height;
    orientation.printTime = orientation.flat.printTime;
    orientation.type = "flat";
    
    return orientation;
}

// Load STL for packing
async function loadSTLModelForPacking(stlData) {
    return new Promise((resolve, reject) => {
      try {
        const loader = new THREE.STLLoader();
        const geometry = loader.parse(stlData);
        resolve(geometry);
      } catch (error) {
        console.error("Error loading STL for packing:", error);
        reject(error);
      }
    });
}

// Helper function to format time
function formatPrintTime(seconds) {
    if (isNaN(seconds) || seconds === "N/A") return "N/A";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
}

// Implementing a cache for visualizations
const packingVisCache = new Map();

// Export functions for use in other modules
window.displayGeometry = displayGeometry;
window.changeOrientation = changeOrientation;
window.visualizePacking = visualizePacking;
window.applyOrientation = applyOrientation;
window.determineOptimalOrientation = determineOptimalOrientation;
window.initThreeJSViewer = initThreeJSViewer;
window.formatPrintTime = formatPrintTime;