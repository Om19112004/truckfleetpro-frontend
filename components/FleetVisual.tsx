import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { FleetVisualFallback } from './FleetVisualFallback';

type SceneHandle = { stop: () => void };

type FleetVisualProps = { compact?: boolean };

function createTruck(scene: THREE.Scene) {
  const truck = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0b7285, metalness: 0.45, roughness: 0.3 });
  const trailerMaterial = new THREE.MeshStandardMaterial({ color: 0x19434a, metalness: 0.35, roughness: 0.48 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x132126, metalness: 0.15, roughness: 0.8 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x15343e, metalness: 0.7, roughness: 0.16 });
  const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffe8a3, emissive: 0x9a6c24, emissiveIntensity: 1.4 });

  const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.22, 1.42), trailerMaterial);
  trailer.position.set(-0.72, 0.82, 0);
  truck.add(trailer);

  const trailerTop = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.035, 1.46), new THREE.MeshStandardMaterial({ color: 0x6bc7c0, metalness: 0.55, roughness: 0.26 }));
  trailerTop.position.set(-0.73, 1.45, 0);
  truck.add(trailerTop);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.38, 1.42), bodyMaterial);
  cabin.position.set(1.08, 0.84, 0);
  truck.add(cabin);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.55, 1.02), glassMaterial);
  windshield.position.set(1.58, 1.13, 0);
  windshield.rotation.z = -0.16;
  truck.add(windshield);

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 1.28), darkMaterial);
  bumper.position.set(1.58, 0.36, 0);
  truck.add(bumper);

  const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.17, 0.3), lightMaterial);
  headlight.position.set(1.67, 0.68, -0.43);
  truck.add(headlight);
  const secondHeadlight = headlight.clone();
  secondHeadlight.position.z = 0.43;
  truck.add(secondHeadlight);

  const wheelGeometry = new THREE.CylinderGeometry(0.31, 0.31, 0.18, 20);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x11191c, metalness: 0.2, roughness: 0.75 });
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x809296, metalness: 0.7, roughness: 0.28 });
  [-1.18, 0.82].forEach((x) => {
    [-0.76, 0.76].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.32, z);
      truck.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.19, 16), hubMaterial);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(x, 0.32, z);
      truck.add(hub);
    });
  });

  const underglow = new THREE.PointLight(0x35b8b0, 1.1, 4.5);
  underglow.position.set(0, 0.22, 0);
  truck.add(underglow);
  scene.add(truck);
  return truck;
}

function createScene(gl: ExpoWebGLRenderingContext): SceneHandle {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const renderer = new Renderer({ gl, width, height, pixelRatio: 1.5, antialias: true }) as unknown as THREE.WebGLRenderer;
  renderer.setSize(width, height);
  renderer.setClearColor(0x102126, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x102126, 7, 18);
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
  camera.position.set(4.7, 3.1, 6.3);
  camera.lookAt(0, 0.7, 0);

  scene.add(new THREE.HemisphereLight(0x9bd8d0, 0x122126, 2.1));
  const keyLight = new THREE.DirectionalLight(0xfff1c7, 3.2);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x3cc4c0, 2.4, 11);
  rimLight.position.set(-3, 2.5, -3);
  scene.add(rimLight);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 13),
    new THREE.MeshStandardMaterial({ color: 0x16272b, roughness: 0.92, metalness: 0.05 }),
  );
  road.rotation.x = -Math.PI / 2;
  scene.add(road);

  const laneMaterial = new THREE.MeshStandardMaterial({ color: 0xd6c681, emissive: 0x6b5b2e, emissiveIntensity: 0.35 });
  for (let x = -8; x <= 8; x += 2.1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.018, 0.065), laneMaterial);
    dash.position.set(x, 0.012, 1.6);
    scene.add(dash);
  }

  const truck = createTruck(scene);
  const start = Date.now();
  let frame = 0;
  const render = () => {
    const elapsed = (Date.now() - start) / 1000;
    truck.position.x = Math.sin(elapsed * 0.28) * 1.15;
    truck.position.y = Math.sin(elapsed * 1.8) * 0.025;
    truck.rotation.y = Math.sin(elapsed * 0.28) * 0.045;
    camera.position.x = 4.7 + Math.sin(elapsed * 0.22) * 0.2;
    camera.position.y = 3.1 + Math.sin(elapsed * 0.32) * 0.06;
    camera.lookAt(truck.position.x * 0.16, 0.72, 0);
    renderer.render(scene, camera);
    gl.endFrameEXP();
    frame = requestAnimationFrame(render);
  };
  render();

  return {
    stop: () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      scene.traverse((object: THREE.Object3D) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose?.();
        if (Array.isArray(mesh.material)) mesh.material.forEach((material: THREE.Material) => material.dispose());
        else mesh.material?.dispose?.();
      });
    },
  };
}

export function FleetVisual({ compact = false }: FleetVisualProps) {
  const sceneRef = useRef<SceneHandle | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => sceneRef.current?.stop(), []);

  if (failed) return <FleetVisualFallback compact={compact} />;

  return (
    <View style={[styles.stage, compact && styles.compact]} pointerEvents="none">
      <GLView
        style={StyleSheet.absoluteFill}
        msaaSamples={Platform.OS === 'web' ? 0 : 2}
        onContextCreate={(gl) => {
          try {
            sceneRef.current?.stop();
            sceneRef.current = createScene(gl);
          } catch (error) {
            console.warn('3D fleet scene unavailable, using fallback.', error);
            setFailed(true);
          }
        }}
      />
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: 330, height: 188, overflow: 'hidden', borderRadius: 18, backgroundColor: '#102126' },
  compact: { transform: [{ scale: 0.76 }] },
  vignette: { ...StyleSheet.absoluteFill, borderWidth: 1, borderColor: 'rgba(121,215,208,0.2)', borderRadius: 18 },
});
