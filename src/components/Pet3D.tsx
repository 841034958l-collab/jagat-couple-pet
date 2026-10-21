import { useEffect, useRef, useState, useId } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useGame } from "../store";
import { personality, phase } from "../domain/engine";
import { personalities } from "../domain/config";
/** Original procedural 3D meshes; never loads remote models, textures or tracking. */
export function Pet({
  action = "",
  size = 220,
}: {
  action?: string;
  size?: number;
}) {
  const { state: s } = useGame();
  const mount = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const labelId = useId();
  const color = s.pet
    ? phase(s.demoDay)
      ? personality(s).color
      : personalities[s.pet.birthColor].color
    : "#F7A8B8";
  const stage = phase(s.demoDay),
    hat = s.outfit.hat,
    accessory = s.outfit.accessory,
    clothing = s.outfit.clothing,
    mood = action || s.pet?.mood || "happy";
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(size, size * 0.95);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    // Local procedural light studio gives the glossy material real reflections.
    const studio = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(studio, 0.04, 0.1, 100, { size: 64 });
    scene.environment = environment.texture;
    studio.dispose();
    pmrem.dispose();
    const camera = new THREE.PerspectiveCamera(
      34,
      size / (size * 0.95),
      0.1,
      50,
    );
    camera.position.set(0, 1.5, 7);
    camera.lookAt(0, 0.15, 0);
    scene.add(new THREE.HemisphereLight(0xc9f9ff, 0x402764, 2.2));
    const light = new THREE.DirectionalLight(0xffffff, 3.2);
    light.position.set(-3, 5, 4);
    scene.add(light);
    const fill = new THREE.DirectionalLight(0xb56aff, 3.5);
    fill.position.set(3, 2, -1);
    scene.add(fill);
    const group = new THREE.Group();
    scene.add(group);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color).lerp(new THREE.Color("#8570ff"), 0.48),
      roughness: 0.2,
      metalness: 0.48,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      iridescence: 1,
      iridescenceIOR: 1.4,
      iridescenceThicknessRange: [180, 560],
      envMapIntensity: 1.3,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#14101f",
      roughness: 0.2,
    });
    const blush = new THREE.MeshStandardMaterial({
      color: "#ff73c9",
      roughness: 0.2,
    });
    const cream = new THREE.MeshStandardMaterial({
      color: "#f6fbff",
      roughness: 0.17,
    });
    function sphere(
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy = sx,
      sz = sx,
    ) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      group.add(m);
      return m;
    }
    sphere(material, 0, 0, 0, 0.98, 1.02 + stage * 0.045, 0.8);
    const belly = new THREE.MeshPhysicalMaterial({
      color: "#93ffe0",
      roughness: 0.16,
      metalness: 0.35,
      clearcoat: 1,
      iridescence: 0.6,
    });
    sphere(belly, 0, -0.43, 0.71, 0.43, 0.3, 0.12);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.29, 0.72, 32),
        material,
      );
      ear.position.set(side * 0.66, 1.02, 0);
      ear.rotation.z = side * -0.2;
      group.add(ear);
      sphere(blush, side * 0.66, 1.05, 0.15, 0.12, 0.23, 0.1);
      sphere(material, side * 0.83, -0.38, 0.1, 0.22, 0.32, 0.24);
      sphere(material, side * 0.43, -0.92, 0.3, 0.32, 0.18, 0.4);
      if (mood === "sleeping") {
        sphere(dark, side * 0.33, 0.21, 0.78, 0.16, 0.025, 0.04);
      } else {
        sphere(cream, side * 0.33, 0.26, 0.73, 0.255, 0.29, 0.18);
        sphere(dark, side * 0.29, 0.24, 0.897, 0.135, 0.16, 0.065);
        sphere(cream, side * 0.28 - 0.035, 0.3, 0.96, 0.045, 0.052, 0.022);
        sphere(cream, side * 0.3 + 0.04, 0.2, 0.954, 0.017);
      }
      if (mood === "cool") {
        const lens = new THREE.MeshPhysicalMaterial({
          color: "#161426",
          roughness: 0.1,
          metalness: 0.65,
          clearcoat: 1,
        });
        sphere(lens, side * 0.33, 0.25, 0.98, 0.29, 0.19, 0.065);
        sphere(cream, side * 0.37, 0.3, 1.04, 0.11, 0.012, 0.008);
      }
      sphere(blush, side * 0.52, -0.02, 0.68, 0.15, 0.085, 0.045);
    }
    sphere(blush, 0, 0.02, 0.8, 0.07, 0.045, 0.04);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, -0.08, 0.79),
      new THREE.Vector3(-0.07, -0.14, 0.82),
      new THREE.Vector3(0, -0.08, 0.84),
      new THREE.Vector3(0.07, -0.14, 0.82),
      new THREE.Vector3(0.14, -0.08, 0.79),
    ]);
    const mouth = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, 0.014, 8, false),
      dark,
    );
    mouth.visible = mood !== "feed" && mood !== "excited";
    group.add(mouth);
    if (mood === "feed" || mood === "excited") {
      sphere(dark, 0, -0.14, 0.8, 0.17, 0.2, 0.08);
      sphere(blush, 0, -0.24, 0.87, 0.105, 0.06, 0.025);
    }
    const chrome = new THREE.MeshPhysicalMaterial({
      color: "#e4d5ff",
      metalness: 0.9,
      roughness: 0.14,
      clearcoat: 1,
    });
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.035, 8, 48),
      chrome,
    );
    chain.rotation.x = Math.PI / 2.4;
    chain.position.set(0, -0.55, 0.45);
    group.add(chain);
    sphere(chrome, 0, -0.68, 0.88, 0.07, 0.095, 0.04);
    if (stage > 0) {
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.14),
        new THREE.MeshPhysicalMaterial({
          color: "#d6ff64",
          metalness: 0.5,
          roughness: 0.16,
          clearcoat: 1,
        }),
      );
      star.position.set(-1.18, 0.55, 0.25);
      group.add(star);
    }
    if (hat) {
      const hmat = new THREE.MeshStandardMaterial({
        color: "#e5ff69",
        metalness: 0.45,
        roughness: 0.2,
      });
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.54, 0.54, 0.08, 32),
        hmat,
      );
      brim.position.set(0, 1.2, 0.12);
      group.add(brim);
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.38, 0.34, 32),
        hmat,
      );
      top.position.set(0, 1.4, 0.12);
      group.add(top);
    }
    if (accessory) {
      for (const side of [-1, 1])
        sphere(blush, side * 0.12, -0.55, 0.83, 0.16, 0.12, 0.07);
      sphere(cream, 0, -0.55, 0.88, 0.07);
    }
    if (clothing) {
      const shirt = new THREE.Mesh(
        new THREE.SphereGeometry(
          1,
          32,
          20,
          0,
          Math.PI * 2,
          Math.PI * 0.48,
          Math.PI * 0.47,
        ),
        new THREE.MeshStandardMaterial({
          color: "#a289ff",
          roughness: 0.25,
          metalness: 0.35,
        }),
      );
      shirt.scale.set(1.005, 1.055, 0.82);
      group.add(shirt);
    }
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      new THREE.MeshBasicMaterial({
        color: "#9d63ff",
        transparent: true,
        opacity: 0.24,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -1.16, 0);
    shadow.scale.set(1.12, 0.65, 1);
    scene.add(shadow);
    const food = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 12),
      new THREE.MeshStandardMaterial({ color: "#f6d889" }),
    );
    food.position.set(0, -0.6, 1.15);
    food.visible = mood === "feed";
    group.add(food);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      lastPaint = -Infinity,
      inView = true,
      alive = true;
    const start = performance.now();
    function render(now: number) {
      if (!alive || document.hidden || !inView) return;
      if (!reduce.matches && now - lastPaint < 1000 / 30) {
        frame = requestAnimationFrame(render);
        return;
      }
      lastPaint = now;
      const t = (now - start) / 1000;
      if (!reduce.matches) {
        group.position.y = Math.sin(t * 2) * 0.035;
        group.rotation.y = Math.sin(t * 0.8) * 0.12;
        if (mood === "pet" || mood === "happy" || mood === "excited")
          group.rotation.z =
            Math.sin(t * 3) * (mood === "excited" ? 0.08 : 0.035);
        if (mood === "cool") group.rotation.z = -0.08;
        if (mood === "excited")
          group.position.y += Math.abs(Math.sin(t * 4)) * 0.1;
        if (mood === "feed") {
          food.position.y = -0.25 + Math.sin(t * 6) * 0.16;
          group.rotation.x = Math.sin(t * 6) * 0.045;
        }
      }
      renderer.render(scene, camera);
      if (!document.hidden && !reduce.matches)
        frame = requestAnimationFrame(render);
    }
    const visible = () => {
      cancelAnimationFrame(frame);
      render(performance.now());
    };
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            cancelAnimationFrame(frame);
            if (inView) {
              lastPaint = -Infinity;
              render(performance.now());
            }
          })
        : null;
    observer?.observe(host);
    document.addEventListener("visibilitychange", visible);
    const onLoss = (e: Event) => {
      e.preventDefault();
      setFallback(true);
      cancelAnimationFrame(frame);
    };
    renderer.domElement.addEventListener("webglcontextlost", onLoss);
    render(start);
    return () => {
      alive = false;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visible);
      renderer.domElement.removeEventListener("webglcontextlost", onLoss);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            m.dispose();
        }
      });
      environment.dispose();
      renderer.dispose();
      host.replaceChildren();
    };
  }, [size, color, stage, hat, accessory, clothing, mood]);
  return (
    <div
      className="pet-three"
      style={{ width: size, maxWidth: "100%" }}
      role="img"
      aria-labelledby={labelId}
    >
      <span id={labelId} className="sr-only">
        {s.pet?.name || "团子"} · {mood === "sleeping" ? "休息中" : "3D小动物"}
      </span>
      <div ref={mount} />
      {fallback && (
        <div className="pet-fallback">
          <i />
          <b>• ᴗ •</b>
          <small>团子正在这里等你</small>
        </div>
      )}
    </div>
  );
}
