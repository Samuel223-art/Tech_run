/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH } from '../../types';

// ===================================
//      LEVEL 1: CORAL REEF
// ===================================
const CoralReefParticles = () => {
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 1000; i++) {
            const isBubble = Math.random() > 0.8;
            const isFish = !isBubble && Math.random() > 0.5;
            const z = -450 + Math.random() * 550;
            const parallaxFactor = isBubble ? (0.5 + Math.random() * 0.5) : (isFish ? (1.5 + Math.random() * 1.0) : (3.0 + Math.random() * 2.0));
            const scale = isBubble ? (0.3 + Math.random() * 0.5) : (isFish ? (0.1 + Math.random()*0.2) : (0.2 + Math.random()*0.3));
            temp.push({ x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 200 + 40, z, parallaxFactor, scale, isBubble, isFish });
        }
        return temp;
    }, []);

    return <BaseParticleField particles={particles} color="#aaffff" />;
};

const CoralReefFloor = () => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, -100]}>
        <planeGeometry args={[300, 400, 30, 40]} />
        <meshBasicMaterial color="#004466" wireframe transparent opacity={0.15} />
    </mesh>
);

const CoralReefEnvironment = () => (
    <>
      <color attach="background" args={['#020014']} />
      <fog attach="fog" args={['#020014', 40, 160]} />
      <ambientLight intensity={0.2} color="#002244" />
      <directionalLight position={[0, 20, -10]} intensity={1.5} color="#00ffff" />
      <pointLight position={[0, 25, -150]} intensity={2} color="#00ffaa" distance={200} decay={2} />
      <GiantJellyfish />
      <CoralReefParticles />
      <CoralReefFloor />
    </>
);

// ===================================
//      LEVEL 2: CRYSTAL CAVES
// ===================================
const CrystalCaveParticles = () => {
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

    return <BaseParticleField particles={particles} color="#ee82ee" />; // Violet color
};

const CrystalCaveFloor = () => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -100]}>
        <planeGeometry args={[300, 400, 30, 40]} />
        <meshBasicMaterial color="#330044" wireframe transparent opacity={0.2} />
    </mesh>
);

const CrystalFormations = () => {
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
                    <meshStandardMaterial color="#662299" emissive="#aa33ff" emissiveIntensity={0.3} roughness={0.2} />
                </mesh>
            ))}
            {/* Add some lights to the crystals */}
            <pointLight position={[40, 20, -100]} intensity={3} color="#aa33ff" distance={150} decay={2} />
            <pointLight position={[-40, 10, -250]} intensity={3} color="#aa33ff" distance={150} decay={2} />
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
    </>
);


// ===================================
//      LEVEL 3: VOLCANIC ABYSS
// ===================================
const VolcanicParticles = () => {
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 2000; i++) {
            const isEmber = Math.random() > 0.5;
            const z = -450 + Math.random() * 550;
            const parallaxFactor = isEmber ? (1.5 + Math.random() * 1.5) : (4.0 + Math.random() * 2.0);
            const scale = isEmber ? (0.3 + Math.random() * 0.4) : 0.25;
            temp.push({ x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 200 + 40, z, parallaxFactor, scale, isBubble: false, isFish: true }); // isFish makes it rise
        }
        return temp;
    }, []);
    return <BaseParticleField particles={particles} color="#ffaa00" />;
};

const VolcanicFloor = () => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -100]}>
        <planeGeometry args={[300, 400, 40, 50]} />
        <meshBasicMaterial color="#882200" wireframe transparent opacity={0.3} />
    </mesh>
);

const Volcano = () => {
    const volcanoRef = useRef<THREE.Group>(null);
    const meteorRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const meteors = useMemo(() => new Array(50).fill(0).map(() => ({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
    })), []);

    useFrame((state, delta) => {
        if(volcanoRef.current) {
            volcanoRef.current.position.y = -20 + Math.sin(state.clock.elapsedTime * 0.5) * 2;
        }

        if (Math.random() > 0.95) {
            let spawned = 0;
            for(const meteor of meteors) {
                if (meteor.life <= 0) {
                    meteor.pos.set(
                        (Math.random() - 0.5) * 80,
                        50 + Math.random() * 30,
                        -250
                    );
                    meteor.vel.set(
                        (Math.random() - 0.5) * 40,
                        -60 - Math.random() * 40,
                        (Math.random()) * 80
                    );
                    meteor.life = 1.0;
                    spawned++;
                    if (spawned > 2) break;
                }
            }
        }
        
        if (meteorRef.current) {
            meteors.forEach((m, i) => {
                if(m.life > 0) {
                    m.life -= delta * 0.5;
                    m.pos.addScaledVector(m.vel, delta);
                    dummy.position.copy(m.pos);
                    const scale = Math.max(0, m.life * 2.0);
                    dummy.scale.set(scale, scale * 3, scale);
                    dummy.lookAt(m.pos.clone().add(m.vel));
                } else {
                    dummy.scale.setScalar(0);
                }
                dummy.updateMatrix();
                meteorRef.current!.setMatrixAt(i, dummy.matrix);
            });
            meteorRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group position={[0, -20, -200]}>
            <mesh ref={volcanoRef}>
                <coneGeometry args={[60, 100, 32]} />
                <meshStandardMaterial color="#1a0500" emissive="#ff4400" emissiveIntensity={0.2} roughness={0.8} />
            </mesh>
            <pointLight position={[0, 60, -180]} intensity={20} color="#ff6600" distance={200} decay={2} />
             <instancedMesh ref={meteorRef} args={[undefined, undefined, meteors.length]}>
                <coneGeometry args={[0.5, 4, 8]} />
                <meshBasicMaterial color="white" emissive="#ffaa00" emissiveIntensity={5} toneMapped={false} />
            </instancedMesh>
        </group>
    );
};

const VolcanicAbyssEnvironment = () => (
     <>
      <color attach="background" args={['#100000']} />
      <fog attach="fog" args={['#100000', 20, 100]} />
      <ambientLight intensity={0.4} color="#551100" />
      <directionalLight position={[0, 10, 5]} intensity={1.0} color="#ff8800" />
      <VolcanicParticles />
      <VolcanicFloor />
      <Volcano />
    </>
);

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

const GiantJellyfish: React.FC = () => {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    const sunGroupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        if (sunGroupRef.current) {
            sunGroupRef.current.position.y = 30 + Math.sin(state.clock.elapsedTime * 0.2) * 2.0;
            sunGroupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color('#00ffaa') } }), []);

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

const LaneGuides: React.FC = () => {
    const { laneCount, visualLevel } = useStore();
    const colors = { 1: '#00ff88', 2: '#ff88ff', 3: '#ff6600' };
    
    const separators = useMemo(() => {
        const lines: number[] = [];
        const startX = -(laneCount * LANE_WIDTH) / 2;
        for (let i = 0; i <= laneCount; i++) {
            lines.push(startX + (i * LANE_WIDTH));
        }
        return lines;
    }, [laneCount]);

    const floorColor = useMemo(() => ({1: '#050c21', 2: '#1a0521', 3: '#200500'}[visualLevel] || '#050c21'), [visualLevel]);

    return (
        <group position={[0, 0.02, 0]}>
            <mesh position={[0, -0.02, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[laneCount * LANE_WIDTH, 200]} />
                <meshBasicMaterial color={floorColor} transparent opacity={0.9} />
            </mesh>
            {separators.map((x, i) => (
                <mesh key={`sep-${i}`} position={[x, 0, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.05, 200]} /> 
                    <meshBasicMaterial color={colors[visualLevel as keyof typeof colors]} transparent opacity={0.4} />
                </mesh>
            ))}
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
      {visualLevel === 1 && <CoralReefEnvironment />}
      {visualLevel === 2 && <CrystalCaveEnvironment />}
      {visualLevel === 3 && <VolcanicAbyssEnvironment />}
      <LaneGuides />
    </>
  );
};