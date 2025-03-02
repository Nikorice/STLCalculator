// stl-worker.js - Web Worker for STL processing (optional if you want to parse in a separate thread)
onmessage = function(e) {
  const arrayBuffer = e.data;
  try {
    const triangles = parseBinarySTL(arrayBuffer);
    const volumeCm3 = computeVolumeCm3(triangles);
    postMessage({ success: true, volumeCm3 });
  } catch (error) {
    postMessage({ success: false, error: error.message });
  }
};

function parseBinarySTL(arrayBuffer) {
  const data = new DataView(arrayBuffer);
  const numTriangles = data.getUint32(80, true);
  if (numTriangles > 1000000) {
    throw new Error("STL file too large (over 1 million triangles).");
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

function computeVolumeCm3(triangles) {
  let totalVolMm3 = 0;
  for (let i = 0; i < triangles.length; i++) {
    const [A, B, C] = triangles[i];
    const crossX = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]);
    const crossY = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
    const crossZ = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    const vol = (A[0] * crossX + A[1] * crossY + A[2] * crossZ) / 6.0;
    totalVolMm3 += vol;
  }
  return Math.abs(totalVolMm3) / 1000.0; // mm³ to cm³
}
