/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH } from '../../types';
import { Sky, Clouds, Cloud } from '@react-three/drei';

// ===================================
//      LEVEL 1: VOLCANIC REALM
// ===================================

const CHUNK_LENGTH = 400;

const VolcanicParticles = () => {
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 1000; i++) {
            const isEmber = Math.random() > 0.8;
            const z = -450 + Math.random() * 550;
            const parallaxFactor = isEmber ? (0.5 + Math.random() * 0.5) : (3.0 + Math.random() * 2.0);
            const scale = isEmber ? (0.3 + Math.random() * 0.5) : (0.2 + Math.random()*0.3);
            temp.push({ x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 200 + 40, z, parallaxFactor, scale, isBubble: false, isFish: isEmber });
        }
        return temp;
    }, []);

    return <BaseParticleField particles={particles} color="#ff8c00" />;
};

const LavaFloor = () => {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    useFrame((state) => {
        if (matRef.current) {
            matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
    }), []);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, -CHUNK_LENGTH / 2]}>
            <planeGeometry args={[300, CHUNK_LENGTH, 1, 1]} />
            <shaderMaterial
                ref={matRef}
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform float uTime;
                    varying vec2 vUv;
                    
                    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

                    float snoise(vec2 v) {
                        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                        vec2 i  = floor(v + dot(v, C.yy) );
                        vec2 x0 = v -   i + dot(i, C.xx);
                        vec2 i1;
                        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                        vec2 x1 = x0.xy + C.xx - i1;
                        vec2 x2 = x0.xy + C.zz;
                        i = mod(i, 289.0);
                        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
                        m = m*m ;
                        m = m*m ;
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
                        vec2 uv = vUv * vec2(5.0, 8.0);
                        float time = uTime * 0.2;
                        
                        float noise1 = snoise(uv + vec2(time, time * 0.8));
                        float noise2 = snoise(uv * 2.0 + vec2(-time * 0.7, time * 0.5));
                        
                        float combinedNoise = (noise1 * 0.7 + noise2 * 0.3);
                        
                        float colorVal = smoothstep(0.1, 0.6, combinedNoise);
                        
                        vec3 lavaColor = mix(vec3(0.8, 0.2, 0.0), vec3(1.0, 0.8, 0.0), colorVal);
                        
                        float cracks = snoise(uv * 1.5 + vec2(0, time * 0.1));
                        
                        if(cracks > 0.8) {
                            lavaColor = mix(lavaColor, vec3(0.1, 0.0, 0.0), smoothstep(0.8, 0.85, cracks));
                        }

                        // Enhanced Boiling effect
                        // Fast, small bubbles
                        float boilNoise1 = snoise(uv * 4.0 + vec2(0.0, uTime * 2.5));
                        float boilMask1 = smoothstep(0.6, 0.8, boilNoise1);

                        // Slower, larger swells
                        float boilNoise2 = snoise(uv * 1.5 + vec2(uTime * 0.3, uTime * 0.5));
                        float boilMask2 = smoothstep(0.3, 0.6, boilNoise2);

                        vec3 boilColor = vec3(1.0, 1.0, 0.1);
                        lavaColor = mix(lavaColor, boilColor * 1.5, boilMask1 * 0.6); // smaller bubbles are brighter
                        lavaColor = mix(lavaColor, boilColor, boilMask2 * 0.3); // larger swells are less intense
                        
                        gl_FragColor = vec4(lavaColor, 1.0);
                    }
                `}
            />
        </mesh>
    );
};

const VolcanicRocks = () => {
    const { laneCount } = useStore.getState();
    const rocks = useMemo(() => {
        const temp: { position: [number, number, number], scale: number, rotation: [number, number, number] }[] = [];
        const baseOffset = (laneCount * LANE_WIDTH / 2);
        for (let i = 0; i < 80; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * (baseOffset + 5 + Math.random() * 80);
            const z = -Math.random() * CHUNK_LENGTH;
            const scale = 2 + Math.random() * 6;
            const y = -4 + Math.random();
            temp.push({ 
                position: [x, y, z], 
                scale,
                rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
            });
        }
        return temp;
    }, [laneCount]);

    const rockGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
    const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.8 }), []);

    return (
        <group>
            {rocks.map((rock, i) => (
                <mesh 
                    key={i} 
                    position={rock.position} 
                    scale={rock.scale}
                    rotation={rock.rotation}
                    geometry={rockGeo}
                    material={rockMat}
                />
            ))}
        </group>
    );
};

const LavaSplashes = () => {
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const splashCount = 20;
    
    const splashes = useMemo(() => new Array(splashCount).fill(0).map(() => ({
        active: false,
        life: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
    })), []);

    const { laneCount } = useStore.getState();

    useFrame((state, delta) => {
        if (!instancedMeshRef.current) return;
        
        if (Math.random() < 0.08) {
            const splash = splashes.find(s => !s.active);
            if (splash) {
                splash.active = true;
                splash.life = 1.0;
                
                const side = Math.random() > 0.5 ? 1 : -1;
                const baseOffset = (laneCount * LANE_WIDTH / 2);
                const x = side * (baseOffset + 2 + Math.random() * 10);
                const z = -Math.random() * CHUNK_LENGTH;

                splash.pos.set(x, -4.5, z);
                splash.vel.set((Math.random() - 0.5) * 5, 12 + Math.random() * 12, (Math.random() - 0.5) * 5);
            }
        }
        
        splashes.forEach((s, i) => {
            if (s.active) {
                s.life -= delta * 1.5;
                if (s.life <= 0) {
                    s.active = false;
                    dummy.scale.set(0, 0, 0);
                } else {
                    s.pos.addScaledVector(s.vel, delta);
                    s.vel.y -= 25 * delta;
                    
                    dummy.position.copy(s.pos);
                    const scale = Math.sin(Math.PI * (1.0 - s.life)) * (0.5 + Math.random() * 0.8);
                    dummy.scale.set(scale, scale, scale);
                }
            } else {
                dummy.scale.set(0, 0, 0);
            }
            dummy.updateMatrix();
            instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, splashCount]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color="#ffcc00" toneMapped={false} />
        </instancedMesh>
    );
};

const Level1LaneGuides: React.FC = () => {
    const { laneCount } = useStore();
    const separators = useMemo(() => {
        const lines: number[] = [];
        const startX = -(laneCount * LANE_WIDTH) / 2;
        for (let i = 0; i <= laneCount; i++) lines.push(startX + (i * LANE_WIDTH));
        return lines;
    }, [laneCount]);

    return (
        <group position={[0, 0.02, 0]}>
            <mesh receiveShadow position={[0, -0.02, -CHUNK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[laneCount * LANE_WIDTH, CHUNK_LENGTH]} />
                <meshStandardMaterial color={'#180800'} />
            </mesh>
            {separators.map((x, i) => (
                <mesh key={`sep-${i}`} position={[x, 0, -CHUNK_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.05, CHUNK_LENGTH]} />
                    <meshBasicMaterial color={'#ff8c00'} transparent opacity={0.4} />
                </mesh>
            ))}
        </group>
    );
};

const VolcanicContent = React.forwardRef<THREE.Group, { position: [number, number, number] }>((props, ref) => {
    return (
        <group ref={ref} {...props}>
            <LavaFloor />
            <Level1LaneGuides />
            <VolcanicRocks />
            <LavaSplashes />
        </group>
    );
});

const VolcanicRealmEnvironment = () => {
    const speed = useStore(state => state.speed);
    const contentRef1 = useRef<THREE.Group>(null);
    const contentRef2 = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        const movement = speed * delta;
        if (contentRef1.current) {
            contentRef1.current.position.z += movement;
            if (contentRef1.current.position.z > CHUNK_LENGTH) {
                contentRef1.current.position.z -= CHUNK_LENGTH * 2;
            }
        }
        if (contentRef2.current) {
            contentRef2.current.position.z += movement;
            if (contentRef2.current.position.z > CHUNK_LENGTH) {
                contentRef2.current.position.z -= CHUNK_LENGTH * 2;
            }
        }
    });

    return (
        <>
            <color attach="background" args={['#200000']} />
            <fog attach="fog" args={['#200000', 40, 160]} />
            <ambientLight intensity={0.2} color="#401000" />
            <directionalLight position={[0, 20, -10]} intensity={1.5} color="#ff8c00" />
            <pointLight position={[0, 25, -150]} intensity={2} color="#ff4500" distance={200} decay={2} />
            <GiantJellyfish color='#ff4500' />
            <VolcanicParticles />

            <group>
                <VolcanicContent ref={contentRef1} position={[0, 0, 0]} />
                <VolcanicContent ref={contentRef2} position={[0, 0, -CHUNK_LENGTH]} />
            </group>
        </>
    );
};

// ===================================
//      LEVEL 2: CRYSTAL CAVES
// ===================================
const CrystalCaveParticles: React.FC<{color?: string}> = ({ color = "#ee82ee" }) => {
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 1500; i++) {
            const isSpore = Math.random() > 0.9;
            const z = -450 + Math.random() * 550;
            const parallaxFactor = isSpore ? (0.7 + Math.random() * 0.7) : (2.5 + Math.random() * 2.0);
            const scale = isSpore ? (0.2 + Math.random() * 0.3) : 0.15;
            temp.push({ x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 200 + 40, z, parallaxFactor, scale, isBubble: false, isFish: false });
        }
        return temp;
    }, []);

    return <BaseParticleField particles={particles} color={color} />;
};

const CrystalCaveFloor: React.FC<{color?: string}> = ({ color = "#330044" }) => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -100]}>
        <planeGeometry args={[300, 400, 30, 40]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.2} />
    </mesh>
);

const Level2LaneGuides: React.FC = () => {
    const { laneCount } = useStore();
    const separators = useMemo(() => {
        const lines: number[] = [];
        const startX = -(laneCount * LANE_WIDTH) / 2;
        for (let i = 0; i <= laneCount; i++) lines.push(startX + (i * LANE_WIDTH));
        return lines;
    }, [laneCount]);

    return (
        <group position={[0, 0.02, 0]}>
            <mesh receiveShadow position={[0, -0.02, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[laneCount * LANE_WIDTH, 200]} />
                <meshStandardMaterial color={'#1a0521'} />
            </mesh>
            {separators.map((x, i) => (
                <mesh key={`sep-${i}`} position={[x, 0, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.05, 200]} />
                    <meshBasicMaterial color={'#ff88ff'} transparent opacity={0.4} />
                </mesh>
            ))}
        </group>
    );
};

const CrystalFormations: React.FC<{crystalColor?: string, emissiveColor?: string, lightColor?: string}> = ({
    crystalColor = "#662299",
    emissiveColor = "#aa33ff",
    lightColor = "#aa33ff"
}) => {
    const crystals = useMemo(() => Array.from({ length: 60 }, () => {
        const side = Math.random() > 0.5 ? 1 : -1;
        return {
            position: new THREE.Vector3(
                side * (20 + Math.random() * 80), // Place them far out to the sides
                (Math.random() - 0.2) * 50, // Vary height
                -Math.random() * 350 // Scatter along Z axis
            ),
            rotation: new THREE.Euler(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            ),
            scale: 2 + Math.random() * 8,
        }
    }), []);
    
    return (
        <group>
            {crystals.map((c, i) => (
                <mesh key={i} position={c.position} rotation={c.rotation}>
                    <coneGeometry args={[c.scale * 0.5, c.scale * 2, 6]} />
                    <meshStandardMaterial color={crystalColor} emissive={emissiveColor} emissiveIntensity={0.3} roughness={0.2} />
                </mesh>
            ))}
            {/* Add some lights to the crystals */}
            <pointLight position={[40, 20, -100]} intensity={3} color={lightColor} distance={150} decay={2} />
            <pointLight position={[-40, 10, -250]} intensity={3} color={lightColor} distance={150} decay={2} />
        </group>
    );
};

const CrystalCaveEnvironment = () => (
    <>
      <color attach="background" args={['#0a001a']} />
      <fog attach="fog" args={['#0a001a', 30, 180]} />
      <ambientLight intensity={0.3} color="#551188" />
      <directionalLight position={[0, 30, -20]} intensity={1.0} color="#ff88ff" />
      <CrystalCaveParticles />
      <CrystalCaveFloor />
      <CrystalFormations />
      <Level2LaneGuides />
    </>
);


// ===================================
//      LEVEL 3: COASTAL RUN
// ===================================
const WaterFloor = () => {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    useFrame((state) => {
        if (matRef.current) {
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

                    void main() {
                        vec3 pos = position;
                        float wave1 = sin(pos.x * uWaveFrequency.x + uTime * uWaveSpeed);
                        float wave2 = cos(pos.y * uWaveFrequency.y + uTime * uWaveSpeed * 0.7);
                        float elevation = (wave1 + wave2) * uWaveHeight;
                        pos.z += elevation;
                        vElevation = elevation;

                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform vec3 uColor;
                    uniform float uWaveHeight;
                    varying float vElevation;

                    void main() {
                        float fresnel = 1.0 - abs(vElevation / uWaveHeight);
                        gl_FragColor = vec4(uColor, 0.6 + fresnel * 0.2);
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
    const CHUNK_LENGTH_COASTAL = 400;

    useFrame((state, delta) => {
        const movement = speed * delta;
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
    });

    return (
        <>
            <fog attach="fog" args={['#87CEEB', 150, 350]} />
            <ambientLight intensity={0.7} color="#ffffff" />
            <directionalLight castShadow position={[50, 50, 20]} intensity={2.0} color="#ffffdd" shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-50, 20, -20]} intensity={0.5} color="#aaddff" />

            <Sky sunPosition={[100, 60, -100]} turbidity={3} rayleigh={1} mieCoefficient={0.005} mieDirectionalG={0.8} />
             <Clouds material={THREE.MeshBasicMaterial}>
                <Cloud position={[-100, 40, -150]} speed={0.2} opacity={0.4} segments={80} bounds={[150, 20, 50]} volume={15} color="white" />
                <Cloud position={[100, 30, -250]} speed={0.3} opacity={0.3} segments={60} bounds={[100, 15, 40]} volume={10} color="white" />
            </Clouds>

            <group>
                <CoastalContent ref={contentRef1} position={[0, 0, 0]} />
                <CoastalContent ref={contentRef2} position={[0, 0, -CHUNK_LENGTH_COASTAL]} />
            </group>
            <CoastalParticles />
        </>
    );
};

// ===================================
//      SHARED COMPONENTS
// ===================================
const BaseParticleField: React.FC<{particles: any[], color: string}> = ({ particles, color }) => {
    const speed = useStore(state => state.speed);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    useFrame((state, delta) => {
        if (!instancedMeshRef.current) return;
        
        const activeSpeed = speed > 0 ? speed : 2;

        particles.forEach((p, i) => {
            let { x, y, z, scale } = p;
            z += activeSpeed * delta * p.parallaxFactor;
            
            if (p.isBubble || p.isFish) { // isFish used for embers rising
                y += delta * 2.0 * p.parallaxFactor;
                if (y > 150) y = -50 - Math.random() * 50;
            }

            if (z > 100) {
                z = -550 - Math.random() * 50;
                y = (p.isBubble || p.isFish) ? -50 - Math.random() * 50 : (Math.random() - 0.5) * 200 + 40;
                x = (Math.random() - 0.5) * 400;
            }

            p.x = x; p.y = y; p.z = z;
            
            dummy.position.set(x, y, z);
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, particles.length]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
        </instancedMesh>
    );
};

const GiantJellyfish: React.FC<{ color?: string }> = ({ color = '#00ffaa' }) => {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    const sunGroupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        if (sunGroupRef.current) {
            sunGroupRef.current.position.y = 30 + Math.sin(state.clock.elapsedTime * 0.2) * 2.0;
            sunGroupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } }), [color]);

    return (
        <group ref={sunGroupRef} position={[0, 30, -180]}>
            <mesh>
                <sphereGeometry args={[35, 32, 32]} />
                <shaderMaterial ref={matRef} uniforms={uniforms} transparent side={THREE.FrontSide} blending={THREE.AdditiveBlending} depthWrite={false}
                    vertexShader={`varying vec3 vNormal; varying vec3 vPosition; void main() { vNormal = normalize(normalMatrix * normal); vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
                    fragmentShader={`uniform float uTime; uniform vec3 uColor; varying vec3 vNormal; varying vec3 vPosition; void main() { float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0); float pulse = 0.6 + 0.4 * sin(uTime * 2.0); float bands = sin(vPosition.y * 0.5 + uTime); vec3 finalColor = uColor * intensity * pulse; finalColor += uColor * 0.2 * smoothstep(0.8, 0.9, bands); gl_FragColor = vec4(finalColor, 1.0); }`}
                />
            </mesh>
        </group>
    );
};

// ===================================
//      MAIN EXPORT
// ===================================
export const Environment: React.FC = () => {
  const visualLevel = useStore(state => state.visualLevel);
  
  return (
    <>
      {visualLevel === 1 && <VolcanicRealmEnvironment />}
      {visualLevel === 2 && <CrystalCaveEnvironment />}
      {visualLevel === 3 && <CoastalRunEnvironment />}
    </>
  );
};
