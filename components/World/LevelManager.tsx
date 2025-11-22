/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center, Float } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus, GEMINI_COLORS } from '../../types';
import { audio } from '../System/Audio';

// --- Level Themed Geometries ---
const OBSTACLE_GEOS = {
    1: new THREE.IcosahedronGeometry(0.8, 1),      // Sea Urchin
    2: new THREE.ConeGeometry(0.8, 2.5, 6),      // Crystal Stalagmite
    3: new THREE.DodecahedronGeometry(0.9, 0),     // Lava Rock
};
const OBSTACLE_GLOW_GEOS = {
    1: new THREE.IcosahedronGeometry(0.82, 1),
    2: new THREE.ConeGeometry(0.82, 2.52, 6),
    3: new THREE.DodecahedronGeometry(0.92, 0),
};
const GEM_GEOS = {
    1: new THREE.SphereGeometry(0.3, 16, 16),     // Pearl
    2: new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), // Ancient Coin
    3: new THREE.OctahedronGeometry(0.35, 0),   // Crystal
};

// --- Shared Geometries ---
const SQUID_BODY_GEO = new THREE.ConeGeometry(0.5, 1.2, 8);
const SQUID_EYE_GEO = new THREE.SphereGeometry(0.15);
const INK_BLAST_CORE_GEO = new THREE.SphereGeometry(0.3, 8, 8);
const POWERUP_SHIELD_GEO = new THREE.OctahedronGeometry(0.4, 0);
const POWERUP_MULTIPLIER_GEO = new THREE.TorusKnotGeometry(0.3, 0.05, 64, 8, 2, 3);
const SHADOW_LETTER_GEO = new THREE.PlaneGeometry(2, 0.6);
const SHADOW_GEM_GEO = new THREE.CircleGeometry(0.6, 32);
const SHADOW_SQUID_GEO = new THREE.CircleGeometry(0.8, 32);
const SHADOW_INK_BLAST_GEO = new THREE.CircleGeometry(0.5, 32);
const SHADOW_DEFAULT_GEO = new THREE.CircleGeometry(0.8, 6);
const WHIRLPOOL_GEO = new THREE.PlaneGeometry(1, 1, 64, 64);
const LAVA_WARNING_GEO = new THREE.CircleGeometry(1, 32);
const LAVA_BOMB_GEO = new THREE.SphereGeometry(0.8, 16, 16);

const PARTICLE_COUNT = 600;
const BASE_LETTER_INTERVAL = 150; 
const getLetterInterval = (level: number) => BASE_LETTER_INTERVAL * Math.pow(1.5, Math.max(0, level - 1));
const INK_BLAST_SPEED = 30;
const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

// --- Particle System ---
const ParticleSystem: React.FC = () => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => new Array(PARTICLE_COUNT).fill(0).map(() => ({
        life: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Vector3(),
        rotVel: new THREE.Vector3(), color: new THREE.Color()
    })), []);

    useEffect(() => {
        const handleExplosion = (e: CustomEvent) => {
            const { position, color, burstAmount } = e.detail;
            let spawned = 0;
            const finalBurstAmount = burstAmount || 40; 

            for(let i = 0; i < PARTICLE_COUNT; i++) {
                const p = particles[i];
                if (p.life <= 0) {
                    p.life = 1.0 + Math.random() * 0.5; p.pos.fromArray(position);
                    const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1);
                    const speed = 2 + Math.random() * 10;
                    p.vel.set(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)).multiplyScalar(speed);
                    p.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    p.rotVel.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(5);
                    p.color.set(color);
                    spawned++;
                    if (spawned >= finalBurstAmount) break;
                }
            }
        };
        
        window.addEventListener('particle-burst', handleExplosion as any);
        return () => window.removeEventListener('particle-burst', handleExplosion as any);
    }, [particles]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const safeDelta = Math.min(delta, 0.1);

        particles.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= safeDelta * 1.5; p.pos.addScaledVector(p.vel, safeDelta);
                p.vel.y -= safeDelta * 5; p.vel.multiplyScalar(0.98);
                p.rot.x += p.rotVel.x * safeDelta; p.rot.y += p.rotVel.y * safeDelta;
                dummy.position.copy(p.pos); const scale = Math.max(0, p.life * 0.25);
                dummy.scale.set(scale, scale, scale); dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
                dummy.updateMatrix(); mesh.current!.setMatrixAt(i, dummy.matrix);
                mesh.current!.setColorAt(i, p.color);
            } else {
                dummy.scale.set(0,0,0); dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLE_COUNT]}>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
        </instancedMesh>
    );
};


const getRandomLane = (laneCount: number) => {
    const max = Math.floor(laneCount / 2);
    return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

export const LevelManager: React.FC = () => {
  const { status, speed, collectGem, collectLetter, collectPowerUp, collectedLetters, laneCount, setDistance, openShop, level, visualLevel } = useStore();
  const objectsRef = useRef<GameObject[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const prevStatus = useRef(status);
  const prevLevel = useRef(level);
  const playerObjRef = useRef<THREE.Object3D | null>(null);
  const distanceTraveled = useRef(0);
  const nextLetterDistance = useRef(BASE_LETTER_INTERVAL);
  const eruptionTimer = useRef(5);

  useEffect(() => {
    const isRestart = status === GameStatus.PLAYING && prevStatus.current === GameStatus.GAME_OVER;
    const isMenuReset = status === GameStatus.MENU;
    const isLevelUp = level !== prevLevel.current && status === GameStatus.PLAYING;
    const isVictoryReset = status === GameStatus.PLAYING && prevStatus.current === GameStatus.VICTORY;

    if (isMenuReset || isRestart || isVictoryReset) {
        objectsRef.current = []; setRenderTrigger(t => t + 1);
        distanceTraveled.current = 0; nextLetterDistance.current = getLetterInterval(1);
    } else if (isLevelUp && level > 1) {
        objectsRef.current = objectsRef.current.filter(obj => obj.position[2] > -80);
        objectsRef.current.push({ id: uuidv4(), type: ObjectType.SHOP_PORTAL, position: [0, 0, -100], active: true });
        nextLetterDistance.current = distanceTraveled.current - SPAWN_DISTANCE + getLetterInterval(level);
        setRenderTrigger(t => t + 1);
    } else if (status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) {
        setDistance(Math.floor(distanceTraveled.current));
    }
    prevStatus.current = status; prevLevel.current = level;
  }, [status, level, setDistance]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) playerObjRef.current = group.children[0];
      }
  });

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    const safeDelta = Math.min(delta, 0.05); 
    const dist = speed * safeDelta;
    distanceTraveled.current += dist;
    let hasChanges = false;
    let playerPos = new THREE.Vector3(0, 0, 0);
    if (playerObjRef.current) playerObjRef.current.getWorldPosition(playerPos);

    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];
    const newSpawns: GameObject[] = [];

    for (const obj of currentObjects) {
        let moveAmount = dist;
        if (obj.type === ObjectType.MISSILE) moveAmount += INK_BLAST_SPEED * safeDelta;
        
        const prevZ = obj.position[2];
        obj.position[2] += moveAmount;

        if (obj.lifetime && obj.lifetime > 0) {
            obj.lifetime -= safeDelta;
            if(obj.lifetime <= 0) {
                if(obj.type === ObjectType.LAVA_WARNING) {
                    newSpawns.push({ id: uuidv4(), type: ObjectType.LAVA_BOMB, position: obj.position, active: true, color: '#ff6600' });
                }
                obj.active = false;
            }
        }
        
        if (obj.type === ObjectType.ALIEN && obj.active && !obj.hasFired) {
             if (obj.position[2] > -90) {
                 obj.hasFired = true;
                 newSpawns.push({ id: uuidv4(), type: ObjectType.MISSILE, position: [obj.position[0], 1.0, obj.position[2] + 2], active: true, color: '#111111' });
                 hasChanges = true;
                 window.dispatchEvent(new CustomEvent('particle-burst', { detail: { position: obj.position, color: '#aa00ff' } }));
             }
        }

        let keep = true;
        if (obj.active) {
            const zThreshold = 2.0; 
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            if (obj.type === ObjectType.SHOP_PORTAL) {
                if (Math.abs(obj.position[2] - playerPos.z) < 2) { 
                     openShop(); obj.active = false; hasChanges = true; keep = false; 
                }
            } else if (inZZone) {
                if (Math.abs(obj.position[0] - playerPos.x) < 0.9) {
                     const isDamageSource = obj.type === ObjectType.OBSTACLE || obj.type === ObjectType.ALIEN || obj.type === ObjectType.MISSILE || obj.type === ObjectType.LAVA_BOMB;
                     if (isDamageSource) {
                         const playerBottom = playerPos.y; const playerTop = playerPos.y + 1.8;
                         let objBottom = obj.position[1] - 0.5, objTop = obj.position[1] + 0.5;
                         if (obj.type === ObjectType.OBSTACLE) { objBottom = 0; objTop = 1.6; }
                         if (obj.type === ObjectType.LAVA_BOMB) { objBottom = 0; objTop = 1.0; }
                         if ((playerBottom < objTop) && (playerTop > objBottom)) { 
                             window.dispatchEvent(new Event('player-hit')); obj.active = false; hasChanges = true;
                             if (obj.type === ObjectType.MISSILE) window.dispatchEvent(new CustomEvent('particle-burst', { detail: { position: obj.position, color: '#330033', burstAmount: 60 } }));
                             if (obj.type === ObjectType.LAVA_BOMB) window.dispatchEvent(new CustomEvent('particle-burst', { detail: { position: obj.position, color: '#ff4400', burstAmount: 100 } }));
                         }
                     } else {
                         if (Math.abs(obj.position[1] - playerPos.y) < 2.5) {
                            let collected = false;
                            if (obj.type === ObjectType.GEM) { collectGem(obj.points || 50); audio.playGemCollect(); collected = true; }
                            if (obj.type === ObjectType.LETTER && obj.targetIndex !== undefined) { collectLetter(obj.targetIndex); audio.playLetterCollect(); collected = true; }
                            if (obj.powerUpType) { collectPowerUp(obj.powerUpType); audio.playLetterCollect(); collected = true; }
                            if (collected) {
                                window.dispatchEvent(new CustomEvent('particle-burst', { detail: { position: obj.position, color: obj.color || '#ffffff' } }));
                                obj.active = false; hasChanges = true;
                            }
                         }
                     }
                }
            }
        }

        if (obj.position[2] > REMOVE_DISTANCE) { keep = false; hasChanges = true; }
        if (keep) keptObjects.push(obj);
    }

    if (newSpawns.length > 0) keptObjects.push(...newSpawns);

    if (visualLevel === 3) {
        eruptionTimer.current -= safeDelta;
        if (eruptionTimer.current <= 0) {
            const lane = getRandomLane(laneCount);
            keptObjects.push({
                id: uuidv4(), type: ObjectType.LAVA_WARNING,
                position: [lane * LANE_WIDTH, 0.05, playerPos.z - 50],
                active: true, color: '#ff0000', lifetime: 1.5
            });
            eruptionTimer.current = 2 + Math.random() * 3;
            hasChanges = true;
        }
    }

    let furthestZ = Math.min(0, ...keptObjects.filter(o => o.type !== ObjectType.MISSILE).map(o => o.position[2]));

    if (furthestZ > -SPAWN_DISTANCE) {
         const minGap = 12 + (speed * 0.4); 
         const spawnZ = Math.min(furthestZ - minGap, -SPAWN_DISTANCE);
         const isLetterDue = distanceTraveled.current >= nextLetterDistance.current;

         if (isLetterDue) {
             const lane = getRandomLane(laneCount); const target = ['G','E','M','I','N','I'];
             const availableIndices = target.map((_, i) => i).filter(i => !collectedLetters.includes(i));
             if (availableIndices.length > 0) {
                 const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                 keptObjects.push({ id: uuidv4(), type: ObjectType.LETTER, position: [lane * LANE_WIDTH, 1.0, spawnZ], active: true, color: GEMINI_COLORS[chosenIndex], value: target[chosenIndex], targetIndex: chosenIndex });
                 nextLetterDistance.current += getLetterInterval(level); hasChanges = true;
             }
         } else if (Math.random() > 0.1) {
            const spawnLane = getRandomLane(laneCount); const p = Math.random();
            if (p < 0.05) {
                const isInvincibility = Math.random() > 0.5;
                keptObjects.push({ id: uuidv4(), active: true, position: [spawnLane * LANE_WIDTH, 1.2, spawnZ], type: isInvincibility ? ObjectType.POWERUP_INVINCIBILITY : ObjectType.POWERUP_SCORE_MULTIPLIER, powerUpType: isInvincibility ? 'INVINCIBILITY' : 'SCORE_MULTIPLIER', color: isInvincibility ? '#ffd700' : '#00ff88'});
            } else if (p < 0.80) {
                const spawnSquid = visualLevel === 2 && Math.random() < 0.2;
                if (spawnSquid) {
                    keptObjects.push({ id: uuidv4(), type: ObjectType.ALIEN, position: [spawnLane * LANE_WIDTH, 2.5, spawnZ], active: true, color: '#55ccaa', hasFired: false });
                } else {
                    const availableLanes = Array.from({length: laneCount}, (_, i) => i - Math.floor(laneCount/2)).sort(() => .5 - Math.random());
                    let countToSpawn = Math.random() > 0.8 ? 3 : Math.random() > 0.5 ? 2 : 1;
                    for (let i = 0; i < Math.min(countToSpawn, laneCount); i++) {
                        keptObjects.push({ id: uuidv4(), type: ObjectType.OBSTACLE, position: [availableLanes[i] * LANE_WIDTH, 0.8, spawnZ], active: true, color: '#ff4499' });
                    }
                }
            } else {
                keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [spawnLane * LANE_WIDTH, 1.2, spawnZ], active: true, color: '#ffffff', points: 50 });
            }
            hasChanges = true;
         }
    }

    if (hasChanges) {
        objectsRef.current = keptObjects;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      <ParticleSystem />
      {objectsRef.current.map(obj => obj.active ? <GameEntity key={obj.id} data={obj} visualLevel={visualLevel} /> : null)}
    </group>
  );
};

const GameEntity: React.FC<{ data: GameObject, visualLevel: number }> = React.memo(({ data, visualLevel }) => {
    const groupRef = useRef<THREE.Group>(null);
    const visualRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Mesh>(null);
    const whirlpoolMatRef = useRef<THREE.ShaderMaterial>(null);
    const lavaWarningMatRef = useRef<THREE.ShaderMaterial>(null);
    const { laneCount } = useStore();
    
    useFrame((state, delta) => {
        if (groupRef.current) groupRef.current.position.set(data.position[0], 0, data.position[2]);
        if (whirlpoolMatRef.current) whirlpoolMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        if (lavaWarningMatRef.current && data.lifetime) lavaWarningMatRef.current.uniforms.uProgress.value = 1.0 - (data.lifetime / 1.5);

        if (visualRef.current) {
            const baseHeight = data.position[1];
            if (data.type === ObjectType.ALIEN) {
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 3) * 0.3;
                 visualRef.current.rotation.y += delta * 0.5;
            } else if (data.type !== ObjectType.OBSTACLE && data.type !== ObjectType.SHOP_PORTAL && data.type !== ObjectType.LAVA_BOMB) {
                visualRef.current.rotation.y += delta * 2;
                const bobOffset = Math.sin(state.clock.elapsedTime * 4 + data.position[0]) * 0.1;
                visualRef.current.position.y = baseHeight + bobOffset;
                if (shadowRef.current) shadowRef.current.scale.setScalar(1 - bobOffset);
            } else {
                visualRef.current.position.y = baseHeight;
            }
        }
    });

    const shadowGeo = useMemo(() => {
        if (data.type === ObjectType.LETTER) return SHADOW_LETTER_GEO;
        if (data.type === ObjectType.GEM || data.powerUpType) return SHADOW_GEM_GEO;
        if (data.type === ObjectType.SHOP_PORTAL || data.type === ObjectType.LAVA_WARNING || data.type === ObjectType.LAVA_BOMB) return null;
        if (data.type === ObjectType.ALIEN) return SHADOW_SQUID_GEO;
        if (data.type === ObjectType.MISSILE) return SHADOW_INK_BLAST_GEO;
        return SHADOW_DEFAULT_GEO; 
    }, [data.type, data.powerUpType]);
    
    const colors = useMemo(() => ({
        obstacle: { 1: '#331122', 2: '#442266', 3: '#662211' }[visualLevel],
        obstacleGlow: { 1: '#ff4499', 2: '#ee82ee', 3: '#ff8800' }[visualLevel],
        gem: { 1: '#ffffff', 2: '#ffd700', 3: '#ff88ff' }[visualLevel],
        gemEmissive: { 1: '#dddddd', 2: '#ff88ff', 3: '#ff00ff' }[visualLevel],
    }), [visualLevel]);

    return (
        <group ref={groupRef}>
            {shadowGeo && <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} geometry={shadowGeo}><meshBasicMaterial color="#000000" opacity={0.3} transparent /></mesh>}
            <group ref={visualRef} position={[0, data.position[1], 0]}>
                {data.type === ObjectType.LAVA_WARNING && (
                    <mesh rotation={[-Math.PI/2, 0, 0]} geometry={LAVA_WARNING_GEO}>
                        <shaderMaterial ref={lavaWarningMatRef} transparent depthWrite={false}
                            uniforms={{ uProgress: { value: 0 }, uColor: { value: new THREE.Color('#ff2200') } }}
                            vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
                            fragmentShader={`uniform float uProgress; uniform vec3 uColor; varying vec2 vUv; void main() { float dist = distance(vUv, vec2(0.5)); float opacity = smoothstep(0.5, 0.4, dist); float ring = smoothstep(0.0, 0.1, abs(dist - uProgress * 0.5)); opacity *= ring; gl_FragColor = vec4(uColor, opacity * (1.0 - uProgress)); }`}
                        />
                    </mesh>
                )}
                {data.type === ObjectType.LAVA_BOMB && (<mesh geometry={LAVA_BOMB_GEO}><meshStandardMaterial color="#220500" emissive="#ff4400" emissiveIntensity={3} roughness={0.7} /></mesh>)}
                {data.type === ObjectType.SHOP_PORTAL && (<><Center position={[0, 5, 0.6]}><Text3D font={FONT_URL} size={1.2} height={0.2}>ABYSSAL FORGE<meshBasicMaterial color="#ffff00" /></Text3D></Center><mesh rotation={[-Math.PI/2, 0, 0]} scale={[laneCount * LANE_WIDTH * 1.5, laneCount * LANE_WIDTH * 1.5, 1]} geometry={WHIRLPOOL_GEO}><shaderMaterial ref={whirlpoolMatRef} transparent uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color('#00ffff') } }} vertexShader={`varying vec2 vUv; uniform float uTime; void main() { vUv = uv; vec2 c = vec2(0.5, 0.5); float d = distance(vUv, c); float a = atan(vUv.y - c.y, vUv.x - c.x); float r = d * (1.0 + 0.2 * sin(d * 10.0 - uTime * 2.0)); vec3 pos = position; pos.z += sin(d * 10.0 + uTime) * 0.2; gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0); }`} fragmentShader={`varying vec2 vUv; uniform float uTime; uniform vec3 uColor; void main() { vec2 c = vec2(0.5, 0.5); float d = distance(vUv, c); float a = atan(vUv.y - c.y, vUv.x - c.x) / (2.0 * 3.14159); float spiral = mod(a + d * 5.0 - uTime * 0.5, 0.2); float alpha = smoothstep(0.5, 0.0, d) * (1.0 - smoothstep(0.05, 0.0, spiral)); gl_FragColor = vec4(uColor, alpha); }`} /></mesh></>)}
                {data.type === ObjectType.OBSTACLE && (<group><mesh geometry={OBSTACLE_GEOS[visualLevel as keyof typeof OBSTACLE_GEOS]} castShadow><meshStandardMaterial color={colors.obstacle} roughness={0.6} metalness={0.2} flatShading /></mesh><mesh geometry={OBSTACLE_GLOW_GEOS[visualLevel as keyof typeof OBSTACLE_GLOW_GEOS]}><meshBasicMaterial color={colors.obstacleGlow} wireframe transparent opacity={0.3} /></mesh></group>)}
                {data.type === ObjectType.ALIEN && (<group><mesh castShadow geometry={SQUID_BODY_GEO} position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}><meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={0.5} roughness={0.5} metalness={0.8} /></mesh><mesh position={[0.3, 0.3, 0.3]} geometry={SQUID_EYE_GEO}><meshBasicMaterial color="#ffff00" /></mesh><mesh position={[-0.3, 0.3, 0.3]} geometry={SQUID_EYE_GEO}><meshBasicMaterial color="#ffff00" /></mesh></group>)}
                {data.type === ObjectType.MISSILE && (<mesh geometry={INK_BLAST_CORE_GEO}><meshStandardMaterial color="#110011" emissive="#330033" emissiveIntensity={2} transparent opacity={0.8} /></mesh>)}
                {data.type === ObjectType.GEM && (<mesh castShadow geometry={GEM_GEOS[visualLevel as keyof typeof GEM_GEOS]} rotation={visualLevel === 2 ? [Math.PI/2,0,0] : [0,0,0]}><meshStandardMaterial color={colors.gem} roughness={0.1} metalness={0.2} emissive={colors.gemEmissive} emissiveIntensity={0.2} /></mesh>)}
                {data.type === ObjectType.LETTER && (<group scale={[1.5, 1.5, 1.5]}><Center><Text3D font={FONT_URL} size={0.8} height={0.5} bevelEnabled bevelThickness={0.02} bevelSize={0.02} bevelSegments={5}>{data.value}<meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={1.5} /></Text3D></Center></group>)}
                {data.type === ObjectType.POWERUP_INVINCIBILITY && (<Float><mesh geometry={POWERUP_SHIELD_GEO}><meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={2} metalness={1} roughness={0.1} /></mesh></Float>)}
                {data.type === ObjectType.POWERUP_SCORE_MULTIPLIER && (<Float><mesh geometry={POWERUP_MULTIPLIER_GEO}><meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={2} metalness={1} roughness={0.1} /></mesh></Float>)}
            </group>
        </group>
    );
});