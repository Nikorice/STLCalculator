/* powder-calc-part2.js */
/* ====================== PERFORMANCE MONITORING ====================== */
// Simple performance monitoring
const perfMonitor = {
    start: function(label) {
      this.timers = this.timers || {};
      this.timers[label] = performance.now();
    },
    end: function(label) {
      if (!this.timers || !this.timers[label]) return 0;
      const time = performance.now() - this.timers[label];
      if (time > 1000) {
        console.warn(`Performance warning: ${label} took ${(time/1000).toFixed(2)}s`);
      }
      delete this.timers[label];
      return time;
    }
  };
  
  /* ====================== CONSTANTS & SETTINGS ====================== */
  // Default spacing settings
  let WALL_MARGIN = 10; // 1 cm from printer walls (only sides)
  let OBJECT_SPACING = 15; // 1.5 cm between objects (X, Y, Z)
  
  /* Material usage constants */
  const POWDER_KG_PER_CM3 = 0.002;  // 2g/1000 = 0.002 kg per cm³
  const BINDER_ML_PER_CM3 = 0.27;   // 270ml/1000 = 0.27 ml per cm³
  const SILICA_G_PER_CM3 = 0.55;    // 0.5*1.1 = 0.55 g per cm³
  
  // Show memory warning based on device
  if (navigator.deviceMemory && navigator.deviceMemory < 8) {
    document.querySelector('.memory-warning').style.display = 'block';
  }
  
  // Function to calculate glaze usage
  function calculateGlazeUsage(volumeCm3) {
    return 0.1615 * volumeCm3 + 31.76; // g
  }
  
  /* Printer specifications */
  const printer400 = {
    name: "Printer 400",
    width: 390,
    depth: 290,
    height: 200,
    layerTime: 45 // seconds per 0.1mm layer
  };
  
  const printer600 = {
    name: "Printer 600",
    width: 595,
    depth: 600,
    height: 250,
    layerTime: 35 // seconds per 0.1mm layer
  };
  
  /* Default pricing data */
  const pricing = {
    EUR: { powder: 92.857, binder: 0.085, silica: 0.069, glaze: 88/9000 },
    USD: { powder: 100, binder: 0.09, silica: 0.072, glaze: 91/9000 },
    JPY: { powder: 200000/14, binder: 250000/20000, silica: 11, glaze: 14000/9000 },
    SGD: { powder: 135, binder: 0.12, silica: 0.10, glaze: 0.01365 }
  };
  
  /* ====================== STL PARSING ====================== */
  // Parse binary STL file - generator function for chunked processing
  function* parseBinarySTLGenerator(arrayBuffer) {
    // Handle very large files by using a more memory-efficient approach
    const data = new DataView(arrayBuffer);
    const numTriangles = data.getUint32(80, true);
    
    // Safety check - very large files may cause browser to crash
    if (numTriangles > 1000000) {
      throw new Error("STL file too large (over 1 million triangles). Please use a decimated model.");
    }
    
    // For large files, we'll use a chunked processing approach to avoid memory spikes
    const CHUNK_SIZE = 10000; // Process 10k triangles at a time
    const triangles = [];
    let offset = 84;
    
    // Process in chunks
    for (let i = 0; i < numTriangles; i += CHUNK_SIZE) {
      const end = Math.min(i + CHUNK_SIZE, numTriangles);
      
      for (let j = i; j < end; j++) {
        offset += 12; // skip normal
        const v1 = [
          data.getFloat32(offset, true),
          data.getFloat32(offset + 4, true),
          data.getFloat32(offset + 8, true)
        ];
        offset += 12;
        
        const v2 = [
          data.getFloat32(offset, true),
          data.getFloat32(offset + 4, true),
          data.getFloat32(offset + 8, true)
        ];
        offset += 12;
        
        const v3 = [
          data.getFloat32(offset, true),
          data.getFloat32(offset + 4, true),
          data.getFloat32(offset + 8, true)
        ];
        offset += 12;
        
        offset += 2; // attribute
        triangles.push([v1, v2, v3]);
      }
      
      // Allow UI to update by yielding to the event loop occasionally
      if (i + CHUNK_SIZE < numTriangles) {
        yield;
      }
    }
    
    return triangles;
  }
  
  // Non-generator version
  function parseBinarySTL(arrayBuffer) {
    const data = new DataView(arrayBuffer);
    const numTriangles = data.getUint32(80, true);
    
    // Safety check
    if (numTriangles > 1000000) {
      throw new Error("STL file too large (over 1 million triangles). Please use a decimated model.");
    }
    
    const triangles = [];
    let offset = 84;
    
    for (let i = 0; i < numTriangles; i++) {
      offset += 12; // skip normal
      const v1 = [
        data.getFloat32(offset, true),
        data.getFloat32(offset + 4, true),
        data.getFloat32(offset + 8, true)
      ];
      offset += 12;
      
      const v2 = [
        data.getFloat32(offset, true),
        data.getFloat32(offset + 4, true),
        data.getFloat32(offset + 8, true)
      ];
      offset += 12;
      
      const v3 = [
        data.getFloat32(offset, true),
        data.getFloat32(offset + 4, true),
        data.getFloat32(offset + 8, true)
      ];
      offset += 12;
      
      offset += 2; // attribute
      triangles.push([v1, v2, v3]);
    }
    
    return triangles;
  }
  
  // Compute volume from triangles (in cm³) with memory-efficient approach
  function computeVolumeCm3(triangles) {
    let totalVolMm3 = 0;
    
    for (let i = 0; i < triangles.length; i++) {
      const [A, B, C] = triangles[i];
      // Calculate cross product directly
      const crossX = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]);
      const crossY = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
      const crossZ = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
      
      // Calculate dot product directly
      const vol = (A[0] * crossX + A[1] * crossY + A[2] * crossZ) / 6.0;
      totalVolMm3 += vol;
    }
    
    return Math.abs(totalVolMm3) / 1000.0; // mm³ to cm³
  }
  
  // Async version of parseBinarySTL for better UI responsiveness
  async function parseBinarySTLAsync(arrayBuffer) {
    perfMonitor.start('parseSTL');
    
    const data = new DataView(arrayBuffer);
    const numTriangles = data.getUint32(80, true);
    
    // Safety check - very large files may cause browser to crash
    if (numTriangles > 1000000) {
      throw new Error("STL file too large (over 1 million triangles). Please use a decimated model.");
    }
    
    // For large files, we'll use a chunked processing approach to avoid memory spikes
    const CHUNK_SIZE = 10000; // Process 10k triangles at a time
    const triangles = [];
    let offset = 84;
    
    // Process in chunks
    for (let i = 0; i < numTriangles; i += CHUNK_SIZE) {
      const end = Math.min(i + CHUNK_SIZE, numTriangles);
      
      for (let j = i; j < end; j++) {
        offset += 12; // skip normal
        const v1 = [
          data.getFloat32(offset, true),
          data.getFloat32(offset + 4, true),
          data.getFloat32(offset + 8, true)
        ];
        offset += 12;
        
        const v2 = [
          data.getFloat32(offset, true),
          data.getFloat32(offset + 4, true),
          data.getFloat32(offset + 8, true)
        ];
        offset += 12;
        
        const v3 = [
          data.getFloat32(offset, true),
          data.getFloat32(offset + 4, true),
          data.getFloat32(offset + 8, true)
        ];
        offset += 12;
        
        offset += 2; // attribute
        triangles.push([v1, v2, v3]);
      }
      
      // Allow UI to update by yielding to the event loop occasionally for large files
      if (i + CHUNK_SIZE < numTriangles && numTriangles > 50000) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    perfMonitor.end('parseSTL');
    return triangles;
  }
  
  // Async version of volume computation
  async function computeVolumeCm3Async(triangles) {
    perfMonitor.start('computeVolume');
    
    let totalVolMm3 = 0;
    const CHUNK_SIZE = 10000; // Process in chunks to avoid blocking UI
    
    // Calculate in chunks
    for (let i = 0; i < triangles.length; i += CHUNK_SIZE) {
      const end = Math.min(i + CHUNK_SIZE, triangles.length);
      
      for (let j = i; j < end; j++) {
        const [A, B, C] = triangles[j];
        // Calculate cross product directly
        const crossX = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]);
        const crossY = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
        const crossZ = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
        
        // Calculate dot product directly
        const vol = (A[0] * crossX + A[1] * crossY + A[2] * crossZ) / 6.0;
        totalVolMm3 += vol;
      }
      
      // For large models, yield to event loop occasionally
      if (i + CHUNK_SIZE < triangles.length && triangles.length > 50000) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    perfMonitor.end('computeVolume');
    return Math.abs(totalVolMm3) / 1000.0; // mm³ to cm³
  }
  
  /* ====================== OPTIMIZED 3D PACKING ALGORITHM ====================== */
  // Calculate optimal packing for a printer - uses improved positioning and orientation
  function calculateOptiPacking(objWidth, objDepth, objHeight, printer) {
    perfMonitor.start('calculatePacking');
    
    // Check if object fits in printer XY plane
    if (!objectFitsXYPrinter(objWidth, objDepth, printer)) {
      // Also try rotating the object 90 degrees in XY plane
      if (!objectFitsXYPrinter(objDepth, objWidth, printer)) {
        perfMonitor.end('calculatePacking');
        return {
          fitsInPrinter: false,
          xyCount: 0,
          zCount: 0,
          totalObjects: 0,
          arrangement: "N/A",
          totalHeight: 0,
          printTime: "N/A"
        };
      } else {
        // Object fits if rotated 90 degrees
        const temp = objWidth;
        objWidth = objDepth;
        objDepth = temp;
      }
    }
    
    // Calculate how many objects fit in XY plane with proper margins
    const availableWidth = printer.width - (2 * WALL_MARGIN);
    const availableDepth = printer.depth - (2 * WALL_MARGIN);
    
    const xCount = Math.floor((availableWidth + OBJECT_SPACING) / (objWidth + OBJECT_SPACING));
    const yCount = Math.floor((availableDepth + OBJECT_SPACING) / (objDepth + OBJECT_SPACING));
    const xyCount = xCount * yCount;
    
    // Calculate max Z stacking (as many as we can fit height-wise)
    const availableHeight = printer.height; // No top margin needed
    const zCount = Math.floor((availableHeight + OBJECT_SPACING) / (objHeight + OBJECT_SPACING));
    
    // Ensure at least 1 object (if it fits height-wise)
    const actualZCount = objHeight <= printer.height ? Math.max(1, zCount) : 0;
    
    // Calculate total printer height used
    const totalHeight = actualZCount > 0 ? 
      (objHeight + OBJECT_SPACING) * actualZCount - OBJECT_SPACING : 0;
    
    // If the total height exceeds printer height, it doesn't fit
    if (totalHeight > printer.height) {
      perfMonitor.end('calculatePacking');
      return {
        fitsInPrinter: false,
        xyCount: xyCount,
        zCount: 0,
        totalObjects: 0,
        arrangement: `${xCount} × ${yCount} × 0`,
        totalHeight: totalHeight,
        printTime: "N/A"
      };
    }
    
    // Calculate print time based on layers
    const layers = Math.ceil(totalHeight / 0.1); // 0.1mm layer height
    const printTimeSec = layers * printer.layerTime;
    
    perfMonitor.end('calculatePacking');
    return {
      fitsInPrinter: true,
      xyCount: xyCount,
      zCount: actualZCount,
      totalObjects: xyCount * actualZCount,
      arrangement: `${xCount} × ${yCount} × ${actualZCount}`,
      totalHeight: totalHeight,
      printTime: printTimeSec
    };
  }
  
  // Generate positions for objects in the print area with proper Z stacking
  function generatePackingPositions(objWidth, objDepth, objHeight, printer) {
    perfMonitor.start('generatePositions');
    
    // Check if object fits in printer XY plane or if rotation helps
    let rotated = false;
    if (!objectFitsXYPrinter(objWidth, objDepth, printer)) {
      if (objectFitsXYPrinter(objDepth, objWidth, printer)) {
        // Object fits if rotated 90 degrees
        const temp = objWidth;
        objWidth = objDepth;
        objDepth = temp;
        rotated = true;
      } else {
        perfMonitor.end('generatePositions');
        return []; // Doesn't fit at all
      }
    }
    
    const positions = [];
    
    // Calculate available space with margins
    const availableWidth = printer.width - (2 * WALL_MARGIN);
    const availableDepth = printer.depth - (2 * WALL_MARGIN);
    
    // Calculate number of objects in X and Y directions with proper spacing
    const xCount = Math.floor((availableWidth + OBJECT_SPACING) / (objWidth + OBJECT_SPACING));
    const yCount = Math.floor((availableDepth + OBJECT_SPACING) / (objDepth + OBJECT_SPACING));
    
    // Calculate max Z stacking
    const zCount = Math.floor((printer.height + OBJECT_SPACING) / (objHeight + OBJECT_SPACING));
    const actualZCount = objHeight <= printer.height ? Math.max(1, zCount) : 0;
    
    // Verify it fits the height
    const totalHeight = actualZCount > 0 ? 
      (objHeight + OBJECT_SPACING) * actualZCount - OBJECT_SPACING : 0;
    
    if (totalHeight > printer.height) {
      perfMonitor.end('generatePositions');
      return [];
    }
    
    // Generate positions for all objects with proper spacing
    for (let z = 0; z < actualZCount; z++) {
      // Start at 0 for Z and add proper spacing between layers
      const zPos = z * (objHeight + OBJECT_SPACING);
      
      for (let y = 0; y < yCount; y++) {
        // Start at wall margin for Y
        const yPos = WALL_MARGIN + y * (objDepth + OBJECT_SPACING);
        
        for (let x = 0; x < xCount; x++) {
          // Start at wall margin for X
          const xPos = WALL_MARGIN + x * (objWidth + OBJECT_SPACING);
          
          positions.push({
            x: xPos,
            y: yPos,
            z: zPos
          });
        }
      }
    }
    
    perfMonitor.end('generatePositions');
    return positions;
  }
  
  // Check if two boxes overlap in XY plane
  function boxesOverlapXY(x1, y1, w1, d1, x2, y2, w2, d2) {
    // Convert to min/max coordinates for easier comparison
    const minX1 = x1, maxX1 = x1 + w1;
    const minY1 = y1, maxY1 = y1 + d1;
    
    const minX2 = x2, maxX2 = x2 + w2;
    const minY2 = y2, maxY2 = y2 + d2;
    
    // Check for no overlap
    if (maxX1 <= minX2 || maxX2 <= minX1) return false;
    if (maxY1 <= minY2 || maxY2 <= minY1) return false;
    
    // Otherwise, boxes overlap
    return true;
  }
  
  // Check if an object fits in a printer (width and depth only) with margins
  function objectFitsXYPrinter(objWidth, objDepth, printer) {
    return (
      objWidth <= printer.width - (2 * WALL_MARGIN) &&
      objDepth <= printer.depth - (2 * WALL_MARGIN)
    );
  }