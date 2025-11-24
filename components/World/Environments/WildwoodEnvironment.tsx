/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../../store';
import { LANE_WIDTH } from '../../../types';

const CHUNK_LENGTH_WILDWOOD = 400;

const SporeParticles = () => {
    const speed = useStore(state => state.speed);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 2000; i++) {
            temp.push({ 
                x: (Math.random() - 0.5) * 400, 
                y: Math.random() * 200, 
                z: -450 + Math.random() * 550, 
                parallaxFactor: (0.4 + Math.random() * 0.5), 
                scale: (0.05 + Math.random() * 0.1), 
                drift: (Math.random() - 0.5) * 1.0,
                initialX: 0
            });
        }
        temp.forEach(p => p.initialX = p.x);
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (!instancedMeshRef.current) return;
        const activeSpeed = speed > 0 ? speed : 2;
        
        particles.forEach((p, i) => {
            p.z += activeSpeed * delta * p.parallaxFactor;
            p.y -= delta * (0.5 + p.parallaxFactor * 1); // Fall slowly
            p.x = p.initialX + p.drift * Math.sin(state.clock.elapsedTime * 0.3 + p.z * 0.25);

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
            <meshBasicMaterial color={'#ffffaa'} transparent opacity={0.4} />
        </instancedMesh>
    );
};

const WildwoodFloor = () => {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    useFrame((state) => {
        if (matRef.current?.uniforms.uTime) {
            matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -CHUNK_LENGTH_WILDWOOD / 2]}>
            <planeGeometry args={[300, CHUNK_LENGTH_WILDWOOD, 1, 1]} />
             <shaderMaterial
                ref={matRef}
                uniforms={uniforms}
                vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
                fragmentShader={`
                    uniform float uTime; varying vec2 vUv;
                    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                    float snoise(vec2 v) {
                        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                        vec2 i  = floor(v + dot(v, C.yy) ); vec2 x0 = v - i + dot(i, C.xx);
                        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                        vec2 x1 = x0.xy + C.xx - i1; vec2 x2 = x0.xy + C.zz;
                        i = mod(i, 289.0);
                        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
                        m = m*m; m = m*m;
                        vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5;
                        vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
                        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                        vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
                        return 130.0 * dot(m, g);
                    }
                    void main() {
                        vec2 mossUv = vUv * 10.0;
                        float mossNoise = snoise(mossUv);
                        vec3 mossColor = mix(vec3(0.1, 0.2, 0.05), vec3(0.3, 0.5, 0.1), smoothstep(-0.2, 0.2, mossNoise));
                        vec2 lightUv = vUv * vec2(20.0, 5.0) + vec2(sin(uTime*0.2)*2.0, -uTime*0.4);
                        float lightNoise = snoise(lightUv);
                        float lightPatch = smoothstep(0.4, 0.6, lightNoise);
                        vec3 finalColor = mix(mossColor, vec3(0.6, 0.8, 0.2), lightPatch*0.4);
                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `}
            />
        </mesh>
    );
};

const ForestTrees = () => {
    const { laneCount } = useStore.getState();
    const trees = useMemo(() => {
        const temp: { position: [number, number, number], scale: number }[] = [];
        const baseOffset = (laneCount * LANE_WIDTH / 2);
        for (let i = 0; i < 150; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * (baseOffset + 10 + Math.random() * 150);
            const z = -Math.random() * CHUNK_LENGTH_WILDWOOD;
            const y = -0.5;
            temp.push({ position: [x, y, z], scale: 2.0 + Math.random() * 3.5 });
        }
        return temp;
    }, [laneCount]);

    const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.3, 3.5, 8), []);
    const leavesGeo = useMemo(() => new THREE.IcosahedronGeometry(1.8, 0), []);
    const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5C4033' }), []);
    const leavesMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#228B22', flatShading: true }), []);

    return (
        <group>
            {trees.map((tree, i) => (
                <group key={i} position={tree.position} scale={tree.scale}>
                    <mesh castShadow position={[0, 1.75, 0]} geometry={trunkGeo} material={trunkMat} />
                    <mesh castShadow position={[0, 4.0, 0]} geometry={leavesGeo} material={leavesMat} />
                </group>
            ))}
        </group>
    );
};

const WildwoodTerrain = () => {
    const { laneCount } = useStore.getState();
    const terrainGeo = useMemo(() => {
        const width = 160; const length = 400; const widthSegments = 60; const lengthSegments = 100;
        const geo = new THREE.PlaneGeometry(width, length, widthSegments, lengthSegments);
        const { position } = geo.attributes;
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i); const y = position.getY(i);
            const edgeFactor = 1 - Math.pow(Math.abs(x) / (width / 2), 2);
            const randomHeight = (Math.sin(y * 0.08 + x * 0.04) + Math.cos(y * 0.06)) * 3.0;
            position.setZ(i, (position.getZ(i) + randomHeight) * edgeFactor);
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    const terrainMaterial = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), []);

    useMemo(() => {
        const { position } = terrainGeo.attributes;
        const colors: number[] = [];
        const soilColor = new THREE.Color('#3A2B2F');
        const grassColor = new THREE.Color('#2A402A');
        for (let i = 0; i < position.count; i++) {
            const height = position.getZ(i);
            const t = THREE.MathUtils.smoothstep(height, 0, 4.0);
            const color = soilColor.clone().lerp(grassColor, t);
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

const WildwoodContent = React.forwardRef<THREE.Group, { position: [number, number, number] }>((props, ref) => {
    const { laneCount } = useStore();
    const separators = useMemo(() => {
        const lines: number[] = [];
        const startX = -(laneCount * LANE_WIDTH) / 2;
        for (let i = 0; i <= laneCount; i++) lines.push(startX + (i * LANE_WIDTH));
        return lines;
    }, [laneCount]);

    return (
        <group ref={ref} {...props}>
            <WildwoodFloor />
            <WildwoodTerrain />
            <ForestTrees />
            <group position={[0, 0.02, 0]}>
                 <mesh receiveShadow position={[0, -0.02, -CHUNK_LENGTH_WILDWOOD / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[laneCount * LANE_WIDTH, CHUNK_LENGTH_WILDWOOD]} />
                    <meshStandardMaterial color={'#102410'} />
                </mesh>
                {separators.map((x, i) => (
                    <mesh key={`sep-${i}`} position={[x, 0, -CHUNK_LENGTH_WILDWOOD / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[0.05, CHUNK_LENGTH_WILDWOOD]} />
                        <meshBasicMaterial color={'#8fbc8f'} transparent opacity={0.3} />
                    </mesh>
                ))}
            </group>
        </group>
    );
});

const WildwoodEnvironment = () => {
    const speed = useStore(state => state.speed);
    const contentRef1 = useRef<THREE.Group>(null);
    const contentRef2 = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        const movement = speed * delta;
        if (contentRef1.current) {
            contentRef1.current.position.z += movement;
            if (contentRef1.current.position.z > CHUNK_LENGTH_WILDWOOD) {
                contentRef1.current.position.z -= CHUNK_LENGTH_WILDWOOD * 2;
            }
        }
        if (contentRef2.current) {
            contentRef2.current.position.z += movement;
            if (contentRef2.current.position.z > CHUNK_LENGTH_WILDWOOD) {
                contentRef2.current.position.z -= CHUNK_LENGTH_WILDWOOD * 2;
            }
        }
    });

    return (
        <>
            <color attach="background" args={['#112211']} />
            <fog attach="fog" args={['#112211', 50, 200]} />
            <ambientLight intensity={0.5} color="#bbf7d0" />
            <directionalLight 
                castShadow 
                position={[50, 80, 20]} 
                intensity={1.5} 
                color="#fef3c7" 
                shadow-mapSize={[1024, 1024]}
            />
            <group>
                <WildwoodContent ref={contentRef1} position={[0, 0, 0]} />
                <WildwoodContent ref={contentRef2} position={[0, 0, -CHUNK_LENGTH_WILDWOOD]} />
            </group>
            <SporeParticles />
        </>
    );
};

export default WildwoodEnvironment;
