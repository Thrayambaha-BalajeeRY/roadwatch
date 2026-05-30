// Three.js powered "FF 91 VR Test Ride" — kid-friendly futuristic car drive scene.
import { useEffect, useRef } from "react";
import * as THREE from "three";

export function VRRide({ height = 520 }: { height?: number | string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = typeof height === "number" ? height : mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020810);
    scene.fog = new THREE.Fog(0x020810, 20, 90);

    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 200);
    camera.position.set(0, 3.2, 6);
    camera.lookAt(0, 1, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x4488ff, 0.4));
    const dir = new THREE.DirectionalLight(0x00d4ff, 1.1);
    dir.position.set(5, 10, 5);
    scene.add(dir);
    const pink = new THREE.PointLight(0xb060ff, 2, 30);
    pink.position.set(-6, 4, -10);
    scene.add(pink);

    // ROAD
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 400),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1c, roughness: 0.8 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = -180;
    scene.add(road);

    // Lane stripes (instanced)
    const stripeGeo = new THREE.PlaneGeometry(0.35, 3);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    const stripes: THREE.Mesh[] = [];
    for (let i = 0; i < 60; i++) {
      const s = new THREE.Mesh(stripeGeo, stripeMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.01, -i * 6);
      scene.add(s);
      stripes.push(s);
    }

    // Glowing edge tubes
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 400), edgeMat);
    left.position.set(-6.9, 0.1, -180);
    scene.add(left);
    const right = left.clone();
    right.position.x = 6.9;
    scene.add(right);

    // Floating arches (like sci-fi gates)
    const arches: THREE.Mesh[] = [];
    for (let i = 0; i < 20; i++) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(7, 0.18, 12, 40, Math.PI),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xb060ff : 0x00d4ff }),
      );
      arch.rotation.z = Math.PI;
      arch.position.set(0, 0, -i * 18 - 10);
      scene.add(arch);
      arches.push(arch);
    }

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 60 + 5;
      positions[i * 3 + 2] = -Math.random() * 300;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.85 }),
    );
    scene.add(stars);

    // FF 91 — stylized low-poly car
    const car = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.55, 4.4),
      new THREE.MeshStandardMaterial({ color: 0xf0f8ff, metalness: 0.9, roughness: 0.15, emissive: 0x002233 }),
    );
    body.position.y = 0.7;
    car.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.5, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.55, metalness: 1, roughness: 0.05, emissive: 0x00d4ff, emissiveIntensity: 0.3 }),
    );
    cabin.position.set(0, 1.15, -0.2);
    car.add(cabin);

    // Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    for (const x of [-0.6, 0.6]) {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), hlMat);
      hl.position.set(x, 0.7, -2.1);
      car.add(hl);
    }
    // Tail lights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
    for (const x of [-0.6, 0.6]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.06), tailMat);
      t.position.set(x, 0.85, 2.1);
      car.add(t);
    }
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wheelPositions = [
      [-1.0, 0.45, -1.4],
      [1.0, 0.45, -1.4],
      [-1.0, 0.45, 1.4],
      [1.0, 0.45, 1.4],
    ];
    const wheels: THREE.Mesh[] = [];
    wheelPositions.forEach((p) => {
      const wh = new THREE.Mesh(wheelGeo, wheelMat);
      wh.rotation.z = Math.PI / 2;
      wh.position.set(p[0], p[1], p[2]);
      car.add(wh);
      wheels.push(wh);
    });
    // Under-glow
    const glow = new THREE.PointLight(0x00d4ff, 4, 6);
    glow.position.set(0, 0.2, 0);
    car.add(glow);

    car.position.set(0, 0, 1);
    scene.add(car);

    // Animate
    let frameId = 0;
    let t = 0;
    const animate = () => {
      t += 0.016;
      // road illusion: move stripes & arches towards camera, recycle
      stripes.forEach((s) => {
        s.position.z += 1.4;
        if (s.position.z > 10) s.position.z -= 60 * 6;
      });
      arches.forEach((a) => {
        a.position.z += 1.4;
        if (a.position.z > 10) a.position.z -= 20 * 18;
      });
      // wheels spin
      wheels.forEach((wh) => (wh.rotation.x += 0.4));
      // gentle car sway
      car.position.x = Math.sin(t * 1.2) * 0.35;
      car.rotation.z = -Math.sin(t * 1.2) * 0.04;
      camera.position.x = Math.sin(t * 0.8) * 0.4;
      camera.position.y = 3.2 + Math.sin(t * 1.6) * 0.08;
      camera.lookAt(car.position.x, 1, -10);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = typeof height === "number" ? height : mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [height]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height, border: "1px solid var(--border)", boxShadow: "0 0 80px rgba(0,212,255,0.15)" }}>
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 font-mono text-[0.65rem] tracking-widest text-cyan px-3 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid var(--cyan)" }}>
        🚗 FF 91 · VR TEST RIDE
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[0.65rem] tracking-widest text-text-dim px-3 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid var(--border)" }}>
        powered by three.js
      </div>
    </div>
  );
}
