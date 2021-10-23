import * as THREE from "three";
import React, { useRef, Suspense } from "react";
import { Canvas, extend, useFrame, useLoader } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import glsl from "babel-plugin-glsl/macro";
import "./App.css";

const WaveShaderMaterial = shaderMaterial(
  //**
  // Uniform
  // malé u snadnějí pomůže určit že jde o Uniform
  //Defaultni barva je black

  {
    uTime: 0,
    uColor: new THREE.Color(0.0, 0.0, 0.0),
    uTexture: new THREE.Texture(),
  },

  // **
  //vertex shader
  //vec4 ukladá do sebe color možnosti x y z + vec2 a vec3.
  //Varying umožňuje posilat data z vertex shaderu do našeho fragment shaderu.
  // málé vUv značí že jde o proměnou.
  //UV mapování je proces 3D modelování promítáním 2D obrazu na povrch 3D modelu pro mapování textur .
  //Písmena „U“ a „V“ označují osy 2D textury, protože „X“, „Y“ a „Z“ se již používají k označení os 3D objektu v modelovém prostoru,
  // zatímco „W“ (v sčítání k XYZ) se používá při výpočtu rotací čtveřice , wiki...
  //
  glsl`
    precision mediump float;

    varying vec2 vUv; 
    varying float vWave;

    uniform float uTime;

    #pragma glslify: snoise3 = require(glsl-noise/simplex/3d);
    
    void main() {
      vUv = uv;

      vec3 pos = position;
      float noiseFreq = 4.5;
      float noiseAmp = 0.15;
      vec3 noisePos = vec3(pos.x * noiseFreq + uTime, pos.y, pos.z);
      pos.z += snoise3(noisePos) * noiseAmp;
      vWave = pos.z;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  //**
  // Fragment Shader
  // vUv.x * Ucolor,1.0 vytvoří gradient ( zmeneno na sin(vUv.x + uTime ) který vytvoří animaci dík uTime v Uniform)
  // sin(vUv.x + uTime ) odstraneno na texture ktera nahradi obrazkem
  // znaky - * + / mění barvy x/y osy
  // precision vypocita jakou presnost gpu pouziva kdzy pocita float
  glsl` 
   precision mediump float;

   uniform vec3 uColor;
   uniform float uTime;
   uniform sampler2D uTexture; 

   varying vec2 vUv;
   varying float vWave;

   void main (){
     float wave = vWave * 0.1;
     vec3 texture = texture2D(uTexture, vUv + wave).rgb;
      gl_FragColor = vec4(texture, 1.0);
    }
  `
);

//v Jsx musí být málé první písmeno  waveShaderMaterial
//určuje barvu
extend({ WaveShaderMaterial });

const Wave = () => {
  const ref = useRef();
  useFrame(({ clock }) => (ref.current.uTime = clock.getElapsedTime()));

  const [image] = useLoader(THREE.TextureLoader, [
    "https://source.unsplash.com/random",
  ]);

  return (
    <mesh>
      {/* args= width height
     // wireframe nastaví mřížku a dodatečná čísla v args počet oken a tím "plynulost" **Dodělat
     //vertex shader float noiseFreq = 2.5 a float noiseAmp = 0.55; nastavují pohyb mřížky (naharzeno obrazkem = uTexture)
     //
     */}
      <planeBufferGeometry args={[0.4, 0.6, 16, 16]} />
      {/* uColor definuje barvu přes Fragment Shader ve4 kde uColor je rgb  v Uniform  a jednička určí opacitu */}
      <waveShaderMaterial uColor={"hotpink"} ref={ref} uTexture={image} />
    </mesh>
  );
};

const Scene = () => {
  /*fov učí ohnisko (velikost), position je zakladní. Při odstranění se nic nestane  pří změně se projeví natočení */
  return (
    <Canvas camera={{ fov: 10, position: [0, 0, 5] }}>
      <Suspense fallback={null}>
        <Wave />
      </Suspense>
    </Canvas>
  );
};

const App = () => {
  return (
    <>
      <a href="https://threejs.org/">
        <h1>Three.js</h1>
      </a>
      <Scene />;
    </>
  );
};

export default App;
