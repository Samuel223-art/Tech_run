/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../../store';
import { LANE_WIDTH } from '../../../types';
import { Sky } from '@react-three/drei';
import { CrystalCaveParticles } from './SharedComponents';

const CHUNK_LENGTH_COASTAL = 400;

const WaterFloor = () => {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    useFrame((state) => {
        if (matRef.current && matRef.current.uniforms.uTime) {
            matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#00aaff') },
        uWaveSpeed: { value: 0.8 },
        uWaveFrequency: { value: new THREE.Vector2(6, 3) },
        uWaveHeight: { value: 0.1 },
    }), []);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -150]}>
            <planeGeometry args={[300, 400, 100, 100]} />
            <shaderMaterial
                ref={matRef}
                uniforms={uniforms}
                vertexShader={`
                    uniform float uTime;
                    uniform float uWaveSpeed;
                    uniform vec2 uWaveFrequency;
                    uniform float uWaveHeight;
                    varying float vElevation;
                    varying vec2 vUv;

                    void main() {
                        vUv = uv;
                        vec3 pos = position;
                        float wave1 = sin(pos.x * uWaveFrequency.x + uTime * uWaveSpeed);
                        float wave2 = cos(pos.y * uWaveFrequency.y + uTime * uWaveSpeed * 0.7);
                        float wave3 = sin(pos.x * uWaveFrequency.x * 2.1 + pos.y * uWaveFrequency.y * 1.5 + uTime * uWaveSpeed * 1.2);
                        float elevation = (wave1 + wave2 + wave3 * 0.5) * uWaveHeight;
                        pos.z += elevation;
                        vElevation = elevation;

                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform vec3 uColor;
                    uniform float uTime;
                    uniform float uWaveHeight;
                    varying float vElevation;
                    varying vec2 vUv;
                    
                    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                    float snoise(vec2 v) {
                        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                        vec2 i  = floor(v + dot(v, C.yy) );
                        vec2 x0 = v -   i + dot(i, C.xx);
                        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                        vec2 x1 = x0.xy + C.xx - i1;
                        vec2 x2 = x0.xy + C.zz;
                        i = mod(i, 289.0);
                        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
                        m = m*m ; m = m*m ;
                        vec3 x = 2.0 * fract(p * C.www) - 1.0;
                        vec3 h = abs(x) - 0.5;
                        vec3 ox = floor(x + 0.5);
                        vec3 a0 = x - ox;
                        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                        vec3 g;
                        g.x  = a0.x  * x0.x  + h.x  * x0.y;
                        g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
                        return 130.0 * dot(m, g);
                    }

                    void main() {
                        vec2 causticsUv1 = vUv * 6.0 + vec2(uTime * 0.2, uTime * 0.25);
                        vec2 causticsUv2 = vUv * 7.0 + vec2(-uTime * 0.3, uTime * 0.2);
                        float c1 = (snoise(causticsUv1) + 1.0) / 2.0;
                        float c2 = (snoise(causticsUv2) + 1.0) / 2.0;
                        float caustics = smoothstep(0.65, 1.0, c1) * smoothstep(0.7, 1.0, c2);
                        
                        vec3 finalColor = uColor + vec3(0.3, 0.5, 0.5) * caustics * 0.3;
                        float fresnel = 1.0 - abs(vElevation / uWaveHeight);
                        gl_FragColor = vec4(finalColor, 0.6 + fresnel * 0.2);
                    }
                `}
                transparent
            />
        </mesh>
    );
};

const BeachTerrain = () => {
    const { laneCount } = useStore.getState();
    const terrainGeo = useMemo(() => {
        const width = 160; const length = 400; const widthSegments = 60; const lengthSegments = 100;
        const geo = new THREE.PlaneGeometry(width, length, widthSegments, lengthSegments);
        const { position } = geo.attributes;
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i); const y = position.getY(i);
            const edgeFactor = 1 - Math.pow(Math.abs(x) / (width / 2), 2);
            const randomHeight = (Math.sin(y * 0.1 + x * 0.05) + Math.cos(y * 0.05)) * 1.5;
            position.setZ(i, (position.getZ(i) + randomHeight) * edgeFactor);
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    const terrainMaterial = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), []);

    useMemo(() => {
        const { position } = terrainGeo.attributes;
        const colors: number[] = [];
        const sandColor = new THREE.Color('#c2b280');
        const grassColor = new THREE.Color('#3A5F0B');
        for (let i = 0; i < position.count; i++) {
            const height = position.getZ(i);
            const t = THREE.MathUtils.smoothstep(height, 0, 2.5);
            const color = sandColor.clone().lerp(grassColor, t);
            colors.push(color.r, color.g, color.b);
        }
        terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }, [terrainGeo]);

    const baseOffset = (laneCount * LANE_WIDTH / 2) + 80;

    return (
        <group>
            <mesh receiveShadow geometry={terrainGeo} material={terrainMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[-baseOffset, -0.5, -150]} />
            <mesh receiveShadow geometry={terrainGeo} material={terrainMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[baseOffset, -0.5, -150]} />
        </group>
    );
};

const LowPolyTrees = () => {
    const { laneCount } = useStore.getState();
    const trees = useMemo(() => {
        const temp: { position: [number, number, number], scale: number }[] = [];
        const baseOffset = (laneCount * LANE_WIDTH / 2);
        for (let i = 0; i < 120; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * (baseOffset + 5 + Math.random() * 150);
            const z = -Math.random() * 400;
            const y = -0.5;
            temp.push({ position: [x, y, z], scale: 1.2 + Math.random() * 1.8 });
        }
        return temp;
    }, [laneCount]);

    const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.1, 0.2, 1.5, 5), []);
    const leavesGeo = useMemo(() => new THREE.IcosahedronGeometry(0.8, 0), []);
    const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6e4a2e' }), []);
    const leavesMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2E8B57', flatShading: true }), []);

    return (
        <group>
            {trees.map((tree, i) => (
                <group key={i} position={tree.position} scale={tree.scale}>
                    <mesh castShadow position={[0, 0.75, 0]} geometry={trunkGeo} material={trunkMat} />
                    <mesh castShadow position={[0, 1.8, 0]} geometry={leavesGeo} material={leavesMat} />
                </group>
            ))}
        </group>
    );
};

const CoastalParticles = () => <CrystalCaveParticles color="#00ffff" />;

const ParallaxMountains = React.forwardRef<THREE.Group, { position: [number, number, number] }>((props, ref) => {
    const mountains = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 12; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * (250 + Math.random() * 200);
            const z = -Math.random() * CHUNK_LENGTH_COASTAL;
            const s = 40 + Math.random() * 60;
            temp.push({ pos: [x, -20, z], scale: [s, s * 1.5, s] });
        }
        return temp;
    }, []);

    return (
        <group ref={ref} {...props}>
             {mountains.map((m, i) => (
                 <mesh key={i} position={m.pos as any} scale={m.scale as any}>
                     <coneGeometry args={[1, 1, 4]} />
                     <meshStandardMaterial color="#1e293b" roughness={0.9} fog={false} />
                 </mesh>
             ))}
        </group>
    );
});

const CoastalContent = React.forwardRef<THREE.Group, { position: [number, number, number] }>((props, ref) => {
    const { laneCount } = useStore();
    const separators = useMemo(() => {
        const lines: number[] = [];
        const startX = -(laneCount * LANE_WIDTH) / 2;
        for (let i = 0; i <= laneCount; i++) lines.push(startX + (i * LANE_WIDTH));
        return lines;
    }, [laneCount]);

    return (
        <group ref={ref} {...props}>
            <WaterFloor />
            <BeachTerrain />
            <LowPolyTrees />
            <group position={[0, 0.02, 0]}>
                 <mesh receiveShadow position={[0, -0.02, -150]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[laneCount * LANE_WIDTH, 400]} />
                    <meshStandardMaterial color={'#080808'} />
                </mesh>
                {separators.map((x, i) => (
                    <mesh key={`sep-${i}`} position={[x, 0, -150]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[0.05, 400]} />
                        <meshBasicMaterial color={'#00aaff'} transparent opacity={0.4} />
                    </mesh>
                ))}
            </group>
        </group>
    );
});

const CoastalRunEnvironment = () => {
    const speed = useStore(state => state.speed);
    const contentRef1 = useRef<THREE.Group>(null);
    const contentRef2 = useRef<THREE.Group>(null);
    const bgRef1 = useRef<THREE.Group>(null);
    const bgRef2 = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        const movement = speed * delta;
        // Foreground
        if (contentRef1.current) {
            contentRef1.current.position.z += movement;
            if (contentRef1.current.position.z > CHUNK_LENGTH_COASTAL) {
                contentRef1.current.position.z -= CHUNK_LENGTH_COASTAL * 2;
            }
        }
        if (contentRef2.current) {
            contentRef2.current.position.z += movement;
            if (contentRef2.current.position.z > CHUNK_LENGTH_COASTAL) {
                contentRef2.current.position.z -= CHUNK_LENGTH_COASTAL * 2;
            }
        }

        // Background Parallax (Slower)
        const bgMovement = movement * 0.1;
        if (bgRef1.current) {
            bgRef1.current.position.z += bgMovement;
            if (bgRef1.current.position.z > CHUNK_LENGTH_COASTAL) {
                bgRef1.current.position.z -= CHUNK_LENGTH_COASTAL * 2;
            }
        }
        if (bgRef2.current) {
            bgRef2.current.position.z += bgMovement;
            if (bgRef2.current.position.z > CHUNK_LENGTH_COASTAL) {
                bgRef2.current.position.z -= CHUNK_LENGTH_COASTAL * 2;
            }
        }
    });

    return (
        <>
            <fog attach="fog" args={['#87CEEB', 150, 350]} />
            <ambientLight intensity={0.7} color="#ffffff" />
            <directionalLight castShadow position={[50, 50, 20]} intensity={2.0} color="#ffffdd" shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-50, 20, -20]} intensity={0.5} color="#aaddff" />

            <Sky sunPosition={[100, 60, -100]} turbidity={3} rayleigh={1} mieCoefficient={0.005} mieDirectionalG={0.8} />

            <group>
                <ParallaxMountains ref={bgRef1} position={[0, 0, 0]} />
                <ParallaxMountains ref={bgRef2} position={[0, 0, -CHUNK_LENGTH_COASTAL]} />
            </group>

            <group>
                <CoastalContent ref={contentRef1} position={[0, 0, 0]} />
                <CoastalContent ref={contentRef2} position={[0, 0, -CHUNK_LENGTH_COASTAL]} />
            </group>
            <CoastalParticles />
        </>
    );
};

export default CoastalRunEnvironment;