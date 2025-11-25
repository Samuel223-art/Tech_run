/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../../store';
import { LANE_WIDTH } from '../../../types';
import { BaseParticleField, GiantJellyfish } from './SharedComponents';

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

const AshParticles = () => {
    const speed = useStore(state => state.speed);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 1500; i++) {
            temp.push({ 
                x: (Math.random() - 0.5) * 400, 
                y: Math.random() * 200, 
                z: -450 + Math.random() * 550, 
                parallaxFactor: (0.4 + Math.random() * 0.5), 
                scale: (0.1 + Math.random() * 0.2), 
                drift: (Math.random() - 0.5) * 1.5,
                initialX: 0
            });
        }
        // Initialize initialX after creation to use the randomized x value
        temp.forEach(p => p.initialX = p.x);
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (!instancedMeshRef.current) return;
        const activeSpeed = speed > 0 ? speed : 2;
        
        particles.forEach((p, i) => {
            p.z += activeSpeed * delta * p.parallaxFactor;
            p.y -= delta * (2.0 + p.parallaxFactor * 4); // Fall down
            p.x = p.initialX + p.drift * Math.sin(state.clock.elapsedTime + p.z * 0.2); // Sway

            if (p.y < -10) p.y = 150 + Math.random() * 50;
            if (p.z > 100) p.z = -550 - Math.random() * 50;
            
            dummy.position.set(p.x, p.y, p.z);
            dummy.scale.setScalar(p.scale);
            dummy.updateMatrix();
            instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, particles.length]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color={'#222222'} transparent opacity={0.6} />
        </instancedMesh>
    );
};

const LavaFloor = () => {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    useFrame((state) => {
        if (matRef.current && matRef.current.uniforms.uTime) {
            matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
    }), []);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, -CHUNK_LENGTH / 2]}>
            <planeGeometry args={[300, CHUNK_LENGTH, 64, 64]} />
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
                    
                    // Simplex 2D noise
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
                        vec2 uv = vUv * 8.0;
                        float t = uTime * 0.2;

                        // 1. Base Magma Flow (Low frequency)
                        float flow = snoise(uv * 0.5 + vec2(t * 0.5, t * 0.2));
                        
                        // 2. Crusting/Cracks (High frequency noise, thresholded)
                        float cracks = snoise(uv * 3.0 + vec2(t * 0.1, 0.0));
                        float crackMask = smoothstep(0.4, 0.45, abs(cracks)); // Sharp lines
                        
                        // 3. Boiling/Bubbling (Localized intense spots)
                        float boil = snoise(uv * 6.0 + vec2(0.0, uTime * 1.5));
                        float boilMask = smoothstep(0.6, 0.8, boil); // Only the peaks

                        // Color Palette
                        vec3 darkRock = vec3(0.1, 0.05, 0.05);
                        vec3 magmaDark = vec3(0.5, 0.0, 0.0);
                        vec3 magmaBright = vec3(1.0, 0.3, 0.0);
                        vec3 hotWhite = vec3(1.0, 1.0, 0.6);

                        // Mix base magma
                        vec3 color = mix(magmaDark, magmaBright, flow * 0.5 + 0.5);

                        // Apply Cracks (Darker veins)
                        color = mix(color, darkRock, crackMask);

                        // Apply Boiling (Brightest spots override cracks)
                        color = mix(color, hotWhite, boilMask);
                        
                        // Add overall glow/heat intensity pulse
                        color *= 1.0 + 0.2 * sin(uTime + uv.x);

                        gl_FragColor = vec4(color, 1.0);
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

const VolcanicLaneGuides: React.FC = () => {
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

const ParallaxVolcanoes = React.forwardRef<THREE.Group, { position: [number, number, number] }>((props, ref) => {
    const volcanoes = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 8; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * (250 + Math.random() * 150);
            const z = -Math.random() * CHUNK_LENGTH;
            const s = 60 + Math.random() * 60;
            temp.push({ pos: [x, -20, z], scale: [s, s * 0.8, s] });
        }
        return temp;
    }, []);

    return (
        <group ref={ref} {...props}>
             {volcanoes.map((m, i) => (
                 <mesh key={i} position={m.pos as any} scale={m.scale as any}>
                     <coneGeometry args={[1, 1, 4]} />
                     <meshStandardMaterial color="#3f0e04" roughness={0.9} fog={false} />
                 </mesh>
             ))}
        </group>
    );
});

const VolcanicContent = React.forwardRef<THREE.Group, { position: [number, number, number] }>((props, ref) => {
    return (
        <group ref={ref} {...props}>
            <LavaFloor />
            <VolcanicLaneGuides />
            <VolcanicRocks />
            <LavaSplashes />
        </group>
    );
});

const VolcanicRealmEnvironment = () => {
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

        // Parallax Background
        const bgMovement = movement * 0.1;
        if (bgRef1.current) {
            bgRef1.current.position.z += bgMovement;
            if (bgRef1.current.position.z > CHUNK_LENGTH) {
                bgRef1.current.position.z -= CHUNK_LENGTH * 2;
            }
        }
        if (bgRef2.current) {
            bgRef2.current.position.z += bgMovement;
            if (bgRef2.current.position.z > CHUNK_LENGTH) {
                bgRef2.current.position.z -= CHUNK_LENGTH * 2;
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
            <AshParticles />

            <group>
                <ParallaxVolcanoes ref={bgRef1} position={[0, 0, 0]} />
                <ParallaxVolcanoes ref={bgRef2} position={[0, 0, -CHUNK_LENGTH]} />
            </group>

            <group>
                <VolcanicContent ref={contentRef1} position={[0, 0, 0]} />
                <VolcanicContent ref={contentRef2} position={[0, 0, -CHUNK_LENGTH]} />
            </group>
        </>
    );
};

export default VolcanicRealmEnvironment;