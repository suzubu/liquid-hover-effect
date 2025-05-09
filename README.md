# 🖌️ Liquid Hover Effect

> An interactive WebGL distortion shader using a soft brush alpha mask to locally warp an image. Built with Three.js, GLSL, and Next.js (App Router).

---

## 🖼 Preview

![Brush Lens Demo](media/brush-lens-preview.gif)

---

## ⚙️ Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/suzubu/liquid-hover-effect.git

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

---

## ✨ Features

- 🖱 Dynamic brush-based image distortion
- 🎨 Turbulence effect blends into soft edges using alpha masking
- ⚡ Smooth performance with animation loop + uniform updates
- 🌐 Responsive to screen size and mouse movement
- 🧱 Modular structure for Next.js and Three.js

---

## 🧠 Dev Notes

### Shaders
- The fragment shader uses a loaded brush texture (alpha-only) to modulate distortion intensity.
- Final UV coordinates are modified by `baseWarp` (subtle background motion) and `brushWarp` (active turbulence).
- Uses `u_texture`, `u_brush`, `u_mouse`, `u_radius`, `u_time`, and `u_resolution`.

### Component Behavior
- React + Three.js setup inside `BrushDistortionLens.jsx`.
- `IntersectionObserver` disables effect when off-screen.
- Image and brush are loaded asynchronously using `THREE.TextureLoader`.
- Mouse movement is smoothed using `lerp()` on a pair of Vector2 values.

---

## 📚 Inspiration / Credits

- [CodeGrid](https://www.youtube.com/watch?v=aE2cNoyrhZE)
- [The Book of Shaders](https://thebookofshaders.com)
- GLSL experimentation via [Shadertoy](https://shadertoy.com)
- [Milad Fakurian](https://unsplash.com/photos/a-blue-ribbon-curves-through-space-3-QTY22bQGQ)

---

## 📂 Folder Structure

```bash
project-root/
├── public/
│   └── textures/soft_brush.png 
│   └── img.jpeg 
├── src/
│   └── app/
│       └── global.css
│       └── layout.js
│       └── page.js
│   ├── components/
│       └── BrushDistortionLens.jsx
│       └── shaders.js
└── README.md
```

---

## 📜 License

MIT — free to use, remix, and learn from.

---

## 🙋‍♀️ Author

Made with ☕ + 🎧 by [suzubu](https://github.com/suzubu)
