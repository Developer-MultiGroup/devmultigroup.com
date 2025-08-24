"use client";

import React, { useEffect, useRef, useState } from "react";

export type AsciiCubeProps = {
  imageSrc?: string;
  cols?: number;
  rows?: number;
  charRamp?: string;
  edgeChar?: string;
  autorotate?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function AsciiCube({
  imageSrc = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
  cols = 160,
  rows = 80,
  charRamp = "█▓▒░ ",
  edgeChar = "█",
  autorotate = true,
  className,
  style
}: AsciiCubeProps) {
  type Vec3 = [number, number, number];
  type Vec2 = [number, number];

  const preRef = useRef<HTMLPreElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera settings - fixed zoom, no scroll scaling
  const distRef = useRef(2.8);
  const zoom = 48; // Fixed zoom level - much larger

  // Rotation state
  const rxRef = useRef(20 * Math.PI / 180);
  const ryRef = useRef(-30 * Math.PI / 180);
  const rzRef = useRef(0);
  const vxRef = useRef(0);
  const vyRef = useRef(0);
  const autoRef = useRef(autorotate);

  // Texture data
  const texRef = useRef<string[][] | null>(null);

  // Math helpers
  const dot = (a: Vec3, b: Vec3) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  const cross = (a: Vec3, b: Vec3): Vec3 => [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ];
  
  const rotX = ([x,y,z]: Vec3, a: number): Vec3 => [
    x, 
    Math.cos(a)*y - Math.sin(a)*z, 
    Math.sin(a)*y + Math.cos(a)*z
  ];
  
  const rotY = ([x,y,z]: Vec3, a: number): Vec3 => [
    Math.cos(a)*x + Math.sin(a)*z, 
    y, 
    -Math.sin(a)*x + Math.cos(a)*z
  ];
  
  const rotZ = ([x,y,z]: Vec3, a: number): Vec3 => [
    Math.cos(a)*x - Math.sin(a)*y, 
    Math.sin(a)*x + Math.cos(a)*y, 
    z
  ];

  const project = ([x,y,z]: Vec3): { sx: number; sy: number; invD: number; depth: number } => {
    const depth = distRef.current + z;
    const f = zoom / Math.max(0.1, depth);
    const sx = cols/2 + x*f;
    const sy = rows/2 - y*f * 0.6; // Aspect ratio adjustment
    return { sx, sy, invD: 1/depth, depth };
  };

  // Cube geometry - proper unit cube
  const V: Vec3[] = [
    [-1, -1, -1], // 0: back-bottom-left
    [ 1, -1, -1], // 1: back-bottom-right  
    [ 1,  1, -1], // 2: back-top-right
    [-1,  1, -1], // 3: back-top-left
    [-1, -1,  1], // 4: front-bottom-left
    [ 1, -1,  1], // 5: front-bottom-right
    [ 1,  1,  1], // 6: front-top-right
    [-1,  1,  1], // 7: front-top-left
  ];

  // Fixed face definitions with proper winding order
  const faces = [
    { idx: [0,1,2,3], uv: [[0,0],[1,0],[1,1],[0,1]] as Vec2[], name: "back" },   // back face (z=-1)
    { idx: [5,4,7,6], uv: [[0,0],[1,0],[1,1],[0,1]] as Vec2[], name: "front" },  // front face (z=+1)
    { idx: [4,5,1,0], uv: [[0,0],[1,0],[1,1],[0,1]] as Vec2[], name: "bottom" }, // bottom face (y=-1)
    { idx: [3,2,6,7], uv: [[0,0],[1,0],[1,1],[0,1]] as Vec2[], name: "top" },    // top face (y=+1)
    { idx: [1,5,6,2], uv: [[0,0],[1,0],[1,1],[0,1]] as Vec2[], name: "right" },  // right face (x=+1)
    { idx: [4,0,3,7], uv: [[0,0],[1,0],[1,1],[0,1]] as Vec2[], name: "left" },   // left face (x=-1)
  ];

  // Convert image to ASCII with proper centering
  useEffect(() => {
    let mounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      if (!mounted) return;
      
      const size = 64; // Square texture size
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);

      // Calculate scaling to fit image in center while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      let drawWidth = size;
      let drawHeight = size;
      let offsetX = 0;
      let offsetY = 0;

      if (imgAspect > 1) {
        // Image is wider - fit to width, center vertically
        drawHeight = size / imgAspect;
        offsetY = (size - drawHeight) / 2;
      } else {
        // Image is taller - fit to height, center horizontally  
        drawWidth = size * imgAspect;
        offsetX = (size - drawWidth) / 2;
      }

      // Draw centered image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      const ramp = charRamp;
      const ascii: string[][] = [];

      for (let y = 0; y < size; y++) {
        const row: string[] = [];
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const r = data[i];
          const g = data[i + 1];  
          const b = data[i + 2];
          const a = data[i + 3] / 255;
          
          // Calculate luminance
          const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const finalLuma = luma * a + (1 - a); // Alpha blend with white
          
          // Map to character (higher contrast)
          const charIndex = Math.floor((1 - finalLuma) * (ramp.length - 1));
          const clampedIndex = Math.max(0, Math.min(ramp.length - 1, charIndex));
          row.push(ramp[clampedIndex]);
        }
        ascii.push(row);
      }
      
      texRef.current = ascii;
    };
    
    img.onerror = () => {
      if (!mounted) return;
      // Fallback pattern
      const fallback: string[][] = [];
      const size = 32;
      for (let y = 0; y < size; y++) {
        const row: string[] = [];
        for (let x = 0; x < size; x++) {
          const dx = x - size/2;
          const dy = y - size/2;
          const dist = Math.sqrt(dx*dx + dy*dy);
          row.push(dist < size/4 ? "█" : " ");
        }
        fallback.push(row);
      }
      texRef.current = fallback;
    };
    
    img.src = imageSrc;
    return () => { mounted = false; };
  }, [imageSrc, charRamp]);

  // Triangle rasterization
  function drawTriangle(
    buffer: string[],
    zbuffer: number[],
    p0: {x: number; y: number; invD: number; u: number; v: number},
    p1: {x: number; y: number; invD: number; u: number; v: number},
    p2: {x: number; y: number; invD: number; u: number; v: number}
  ) {
    const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x)));
    const maxX = Math.min(cols - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)));
    const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y)));
    const maxY = Math.min(rows - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)));

    const denom = (p1.y - p2.y) * (p0.x - p2.x) + (p2.x - p1.x) * (p0.y - p2.y);
    if (Math.abs(denom) < 0.001) return;

    const tex = texRef.current;
    if (!tex) return;
    
    const texSize = tex.length;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Barycentric coordinates
        const w0 = ((p1.y - p2.y) * (x + 0.5 - p2.x) + (p2.x - p1.x) * (y + 0.5 - p2.y)) / denom;
        const w1 = ((p2.y - p0.y) * (x + 0.5 - p2.x) + (p0.x - p2.x) * (y + 0.5 - p2.y)) / denom;
        const w2 = 1 - w0 - w1;

        if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
          const invD = w0 * p0.invD + w1 * p1.invD + w2 * p2.invD;
          
          const idx = y * cols + x;
          if (invD > zbuffer[idx]) {
            // Interpolate UV
            const u = (w0 * p0.u * p0.invD + w1 * p1.u * p1.invD + w2 * p2.u * p2.invD) / invD;
            const v = (w0 * p0.v * p0.invD + w1 * p1.v * p1.invD + w2 * p2.v * p2.invD) / invD;
            
            // Sample texture
            const tx = Math.max(0, Math.min(texSize - 1, Math.floor(u * texSize)));
            const ty = Math.max(0, Math.min(texSize - 1, Math.floor(v * texSize)));
            
            buffer[idx] = tex[ty][tx];
            zbuffer[idx] = invD;
          }
        }
      }
    }
  }

  // Main render loop
  useEffect(() => {
    let animationId = 0;

    const render = () => {
      const buffer = new Array(rows * cols).fill(" ");
      const zbuffer = new Array(rows * cols).fill(-Infinity);

      // Transform vertices
      const transformedVertices = V.map(v => 
        rotZ(rotY(rotX(v, rxRef.current), ryRef.current), rzRef.current)
      );

      // Project vertices
      const projectedVertices = transformedVertices.map(project);

      // Sort faces by average depth (back to front)
      const facesWithDepth = faces.map(face => {
        const avgDepth = face.idx.reduce((sum, idx) => 
          sum + projectedVertices[idx].depth, 0) / face.idx.length;
        return { face, avgDepth };
      });
      
      facesWithDepth.sort((a, b) => b.avgDepth - a.avgDepth);

      // Render faces with improved backface culling
      for (const { face } of facesWithDepth) {
        const [i0, i1, i2, i3] = face.idx;
        
        // Get transformed face vertices
        const v0 = transformedVertices[i0];
        const v1 = transformedVertices[i1];
        const v2 = transformedVertices[i2];

        // Calculate face normal in world space
        const edge1 = sub3(v1, v0);
        const edge2 = sub3(v2, v0);
        const normal = cross(edge1, edge2);
        
        // Calculate face center
        const center: Vec3 = [
          (v0[0] + v1[0] + v2[0] + transformedVertices[i3][0]) / 4,
          (v0[1] + v1[1] + v2[1] + transformedVertices[i3][1]) / 4,
          (v0[2] + v1[2] + v2[2] + transformedVertices[i3][2]) / 4
        ];
        
        // View direction from face center to camera
        const viewDir: Vec3 = [0 - center[0], 0 - center[1], distRef.current - center[2]];
        
        // Face is visible if normal and view direction are roughly aligned
        if (dot(normal, viewDir) <= 0) continue;

        const p0 = projectedVertices[i0];
        const p1 = projectedVertices[i1];
        const p2 = projectedVertices[i2];
        const p3 = projectedVertices[i3];

        // Draw quad as two triangles
        drawTriangle(buffer, zbuffer,
          { x: p0.sx, y: p0.sy, invD: p0.invD, u: face.uv[0][0], v: face.uv[0][1] },
          { x: p1.sx, y: p1.sy, invD: p1.invD, u: face.uv[1][0], v: face.uv[1][1] },
          { x: p2.sx, y: p2.sy, invD: p2.invD, u: face.uv[2][0], v: face.uv[2][1] }
        );
        
        drawTriangle(buffer, zbuffer,
          { x: p0.sx, y: p0.sy, invD: p0.invD, u: face.uv[0][0], v: face.uv[0][1] },
          { x: p2.sx, y: p2.sy, invD: p2.invD, u: face.uv[2][0], v: face.uv[2][1] },
          { x: p3.sx, y: p3.sy, invD: p3.invD, u: face.uv[3][0], v: face.uv[3][1] }
        );
      }

      // Update rotation
      if (autoRef.current) {
        ryRef.current += 0.005;
        rzRef.current += 0.001;
      } else {
        rxRef.current += vxRef.current;
        ryRef.current += vyRef.current;
        vxRef.current *= 0.95;
        vyRef.current *= 0.95;
      }

      // Convert buffer to string
      let output = "";
      for (let row = 0; row < rows; row++) {
        const start = row * cols;
        const end = start + cols;
        output += buffer.slice(start, end).join("") + (row < rows - 1 ? "\n" : "");
      }

      if (preRef.current) {
        preRef.current.textContent = output;
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [cols, rows]);

  // Event handlers - no scroll zoom
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    autoRef.current = false;
    setLastPos({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

     const handlePointerMove = (e: React.PointerEvent) => {
     if (!dragging) return;
     
     const dx = e.clientX - lastPos.x;
     const dy = e.clientY - lastPos.y;
     
     // Implement intuitive orbit camera controls
     // Horizontal movement rotates around Y-axis (left/right rotation)
     ryRef.current += dx * 0.015;
     // Vertical movement rotates around X-axis (up/down rotation)  
     rxRef.current += dy * 0.015;
     
     // Set velocity for smooth continuation after drag
     vxRef.current = dy * 0.003;
     vyRef.current = dx * 0.003;
     
     setLastPos({ x: e.clientX, y: e.clientY });
   };

     const handlePointerUp = (e: React.PointerEvent) => {
     setDragging(false);
     e.currentTarget.releasePointerCapture(e.pointerId);
     
     // Resume autorotation after drag ends
     autoRef.current = true;
   };

  return (
    <div
      className={`ascii-cube-container ${className || ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        fontFamily: "ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
        lineHeight: 1,
        userSelect: "none",
        cursor: dragging ? "grabbing" : "grab",
        display: "inline-block",
        padding: "16px",
        borderRadius: "8px",
        background: "rgba(0,0,0,0.02)",
        touchAction: "none",
        ...style
      }}
      aria-label="Interactive ASCII-rendered 3D cube"
    >
      <pre
        ref={preRef}
        style={{
          margin: 0,
          padding: 0,
          whiteSpace: "pre",
          letterSpacing: "-0.5px",
          fontSize: "8px",
          color: "#333",
          fontWeight: "normal",
        }}
      />
    </div>
  );
}