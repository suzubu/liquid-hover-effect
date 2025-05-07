"use client";

import { useEffect, useRef } from "react";
import { vertexShader, fragmentShader } from "./shaders.js";
import * as THREE from "three";

const BrushDistortionLens = ({ src, className }) => {
  // === DOM & Three.js Refs ===
  const containerRef = useRef(null); // DOM container for renderer
  const rendererRef = useRef(null); // Three.js WebGLRenderer
  const sceneRef = useRef(null); // Scene graph
  const cameraRef = useRef(null); // Perspective camera
  const uniformsRef = useRef(null); // GLSL uniforms
  const isSetupCompleteRef = useRef(false); // One-time setup guard

  // === Configurable Settings ===
  const config = {
    maskRadius: 0.15, // Brush size when active
    maskSpeed: 0.75, // Brush warp animation speed
    lerpFactor: 0.05, // Cursor smoothing factor
    radiusLerpSpeed: 0.1, // Fade-in/out for brush edge
    turbulenceIntensity: 0.075, // Strength of jaggedness
  };

  // === State Refs ===
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5)); // Actual mouse position
  const lerpedMouse = useRef(new THREE.Vector2(0.5, 0.5)); // Smoothed mouse
  const targetRadius = useRef(0.0); // Current brush radius
  const isInView = useRef(false); // Intersection observer status
  const isMouseInsideContainer = useRef(false); // Tracks hover
  const lastMouseX = useRef(0); // Last mouse X
  const lastMouseY = useRef(0); // Last mouse Y
  const animationFrameId = useRef(null); // Active animation frame

  useEffect(() => {
    if (typeof window === "undefined") return;

    const runSetup = () => {
      if (!containerRef.current || !src) {
        requestAnimationFrame(runSetup);
        return;
      }

      const loader = new THREE.TextureLoader();
      const brushLoader = new THREE.TextureLoader();

      // Load brush texture first, then main image
      brushLoader.load("/textures/soft_brush.png", (brushTexture) => {
        brushTexture.wrapS = THREE.ClampToEdgeWrapping;
        brushTexture.wrapT = THREE.ClampToEdgeWrapping;
        brushTexture.minFilter = THREE.LinearFilter;

        loader.load(src, (imageTexture) => {
          setupScene(imageTexture, brushTexture);
          setupEventListeners();
          animate();
          isSetupCompleteRef.current = true;

          console.log(
            "Image texture loaded:",
            imageTexture.image?.width,
            imageTexture.image?.height
          );
          console.log(
            "Brush texture loaded:",
            brushTexture.image?.width,
            brushTexture.image?.height
          );
        });
      });
    };

    runSetup();

    // Cleanup on unmount
    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current) {
          const canvas = containerRef.current.querySelector("canvas");
          if (canvas) containerRef.current.removeChild(canvas);
        }
      }
    };
  }, [src]);

  const setupScene = (texture, brushTexture) => {
    if (!containerRef.current) return;

    const imageAspect = texture.image.width / texture.image.height;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2;
    cameraRef.current = camera;

    const uniforms = {
      u_texture: { value: texture },
      u_brush: { value: brushTexture },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_radius: { value: 0.0 },
      u_speed: { value: config.maskSpeed },
      u_imageAspect: { value: imageAspect },
      u_turbulenceIntensity: { value: config.turbulenceIntensity },
    };
    uniformsRef.current = uniforms;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.capabilities.anisotropy = 16;
    renderer.setClearColor(0x333333, 1); // Debug background

    containerRef.current.appendChild(renderer.domElement);

    // Resize handler to update resolution uniform
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !uniformsRef.current)
        return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      uniformsRef.current.u_resolution.value.set(width, height);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  };

  const setupEventListeners = () => {
    const handleMouseMove = (e) => updateCursorState(e.clientX, e.clientY);
    const handleScroll = () =>
      updateCursorState(lastMouseX.current, lastMouseY.current);

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    // Observer disables effect when out of view
    let observer;
    if (containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isInView.current = entry.isIntersecting;
            if (!isInView.current) targetRadius.current = 0.0;
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      if (observer) observer.disconnect();
    };
  };

  const updateCursorState = (x, y) => {
    if (!containerRef.current) return;

    lastMouseX.current = x;
    lastMouseY.current = y;

    const rect = containerRef.current.getBoundingClientRect();
    const inside =
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    isMouseInsideContainer.current = inside;

    if (inside) {
      // Normalize mouse to [0,1] relative to component bounds
      targetMouse.current.x = (x - rect.left) / rect.width;
      targetMouse.current.y = 1.0 - (y - rect.top) / rect.height;
      targetRadius.current = config.maskRadius;
    } else {
      targetRadius.current = 0;
    }
  };

  const animate = () => {
    if (
      !uniformsRef.current ||
      !rendererRef.current ||
      !sceneRef.current ||
      !cameraRef.current
    ) {
      animationFrameId.current = requestAnimationFrame(animate);
      return;
    }

    // Smooth mouse movement and radius expansion
    lerpedMouse.current.lerp(targetMouse.current, config.lerpFactor);
    uniformsRef.current.u_mouse.value.copy(lerpedMouse.current);
    uniformsRef.current.u_time.value += 0.01;
    uniformsRef.current.u_radius.value +=
      (targetRadius.current - uniformsRef.current.u_radius.value) *
      config.radiusLerpSpeed;

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationFrameId.current = requestAnimationFrame(animate);
  };

  return (
    <div
      ref={containerRef}
      className={`brush-distortion-lens ${className || ""}`}
    ></div>
  );
};

export default BrushDistortionLens;
