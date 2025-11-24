/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, MapPin, Diamond, ArrowUpCircle, Shield, Activity, PlusCircle, Play, Settings, X, User, CheckSquare, Package, Star, Waves, Flame, Leaf } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, LEVEL_COLORS, LEVEL_TARGETS, ShopItem, RUN_SPEED_BASE } from '../../types';
import { audio } from '../System/Audio';

// Available Shop Items
const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'DOUBLE_JUMP',
        name: 'HYDRO JETS',
        description: 'Propel again in mid-water. Essential for high obstacles.',
        cost: 1000,
        icon: ArrowUpCircle,
        oneTime: true
    },
    {
        id: 'MAX_LIFE',
        name: 'HULL UPGRADE',
        description: 'Permanently adds a hull integrity slot and repairs one.',
        cost: 1500,
        icon: Activity
    },
    {
        id: 'HEAL',
        name: 'REPAIR DRONE',
        description: 'Restores 1 Hull Integrity point instantly.',
        cost: 1000,
        icon: PlusCircle
    },
    {
        id: 'IMMORTAL',
        name: 'ENERGY SHIELD',
        description: 'Unlock Ability: Press Space/Tap for a 5s shield.',
        cost: 3000,
        icon: Shield,
        oneTime: true
    }
];

const SplashScreen: React.FC = () => {
    const showMenu = useStore(state => state.showMenu);

    useEffect(() => {
        const timer = setTimeout(() => {
            showMenu();
        }, 3000); // 3-second splash screen

        return () => clearTimeout(timer);
    }, [showMenu]);

    const title = "NEON";

    return (
        <div className="absolute inset-0 bg-[#020014] flex flex-col items-center justify-center z-[100] pointer-events-auto animate-in fade-in duration-1000">
            <div className="text-center">
                <h1 className="font-cyber text-5xl md:text-7xl font-black tracking-widest flex">
                    {title.split('').map((char, index) => (
                        <span 
                            key={index}
                            style={{ 
                                color: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'][index],
                                textShadow: `0 0 15px ${['#00ffff', '#ff00ff', '#ffff00', '#00ff00'][index]}`,
                                animation: `fadeInUp 0.5s ${index * 0.1}s both`
                            }}
                        >
                            {char}
                        </span>
                    ))}
                </h1>
                <h2 
                    className="font-cyber text-5xl md:text-7xl font-black tracking-[0.3em] text-cyan-400"
                    style={{
                        textShadow: `0 0 15px #00ffff`,
                        animation: `fadeInUp 0.5s 0.6s both`
                    }}
                >
                    DIVER
                </h2>
            </div>
            <div className="absolute bottom-10 text-cyan-400/50 text-sm font-mono tracking-widest animate-pulse">
                PRESSURIZING...
            </div>
            {/* Inline style for keyframes to avoid needing a CSS file */}
            <style>
                {`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                `}
            </style>
        </div>
    );
};

const ZONES = [
    { name: 'Coastal Run', icon: Waves, color: 'text-cyan-400' },
    { name: 'Volcanic Realm', icon: Flame, color: 'text-orange-400' },
    { name: 'Snowy Wonderland', icon: Star, color: 'text-blue-300' },
    { name: 'Wildwood', icon: Leaf, color: 'text-green-400' }
];

interface ZoneSelectorModalProps {
    onSelectZone: (level: number) => void;
    onClose: () => void;
}

const ZoneSelectorModal: React.FC<ZoneSelectorModalProps> = ({ onSelectZone, onClose }) => {
    return (
        <div className="absolute inset-0 bg-black/90 z-[110] text-white pointer-events-auto animate-in fade-in-25 flex flex-col items-center justify-center font-cyber">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                <X size={32} />
            </button>
            <h2 className="text-4xl font-bold tracking-widest mb-10" style={{ textShadow: '0 0 10px #ffffff' }}>ZONE SELECT</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {ZONES.map((zone, index) => (
                    <button 
                        key={zone.name} 
                        onClick={() => onSelectZone(index + 1)}
                        className={`group flex flex-col items-center justify-center p-6 rounded-lg border-2 border-white/20 hover:border-white hover:bg-white/10 transition-all duration-300 w-40 h-40 ${zone.color}`}
                    >
                        <zone.icon size={48} className="mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-lg font-bold text-white tracking-wider text-center">{zone.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Main Menu
const MainMenu: React.FC = () => {
    const { startGame, highScore } = useStore();
    const [isZoneSelectorOpen, setIsZoneSelectorOpen] = useState(false);

    const handleStart = () => {
        audio.init();
        startGame();
    };

    const selectZone = (level: number) => {
        audio.init();
        startGame(level);
        setIsZoneSelectorOpen(false);
    };

    return (
        <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center text-white pointer-events-auto animate-in fade-in-25">
            {isZoneSelectorOpen && <ZoneSelectorModal onSelectZone={selectZone} onClose={() => setIsZoneSelectorOpen(false)} />}
            <div className="text-center font-cyber">
                <h1 className="text-8xl font-black tracking-widest" style={{ color: '#00ffff', textShadow: '0 0 20px #00ffff' }}>
                    NEON DIVER
                </h1>
                <p className="text-xl tracking-[0.2em] mt-2 text-cyan-300/80">A SUB-AQUATIC ENDLESS RUNNER</p>
            </div>
            <div className="mt-12 flex flex-col items-center gap-4">
                 <button 
                    onClick={handleStart} 
                    className="group relative font-cyber text-2xl font-bold tracking-widest bg-cyan-500/80 hover:bg-cyan-400 text-black px-10 py-4 rounded-md transition-all duration-300 flex items-center gap-3"
                    style={{ boxShadow: '0 0 20px #00ffff, inset 0 0 10px #ffffff' }}
                >
                    <Play className="group-hover:scale-125 transition-transform" />
                    START DIVE
                </button>
                 <button 
                    onClick={() => setIsZoneSelectorOpen(true)} 
                    className="font-cyber text-lg tracking-widest text-cyan-300 hover:text-white hover:underline transition-colors"
                >
                    Zone Select
                </button>
            </div>
            <div className="absolute bottom-8 font-mono text-cyan-400/60 text-lg">
                <p>HIGH SCORE: {highScore}</p>
                <p className="text-sm text-center mt-4">Move: Arrow Keys/Swipe | Jump: Up Arrow/Swipe Up | Ability: Space/Tap</p>
            </div>
        </div>
    );
};

// Game Over Screen
const GameOverScreen: React.FC = () => {
    const { score, distance, restartGame, showMenu } = useStore();
    
    return (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-white pointer-events-auto animate-in fade-in-25">
            <h1 className="font-cyber text-7xl font-black tracking-widest text-red-500" style={{ textShadow: '0 0 15px #ff0000' }}>
                HULL BREACHED
            </h1>
            <div className="font-mono text-2xl mt-8 text-center text-gray-300">
                <p>FINAL SCORE: <span className="text-white font-bold">{score}</span></p>
                <p>DISTANCE: <span className="text-white font-bold">{distance}m</span></p>
            </div>
            <div className="mt-10 flex gap-6">
                <button 
                    onClick={restartGame}
                    className="font-cyber text-xl font-bold tracking-widest bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-3 rounded-md transition-colors"
                >
                    RETRY
                </button>
                <button 
                    onClick={showMenu}
                    className="font-cyber text-xl font-bold tracking-widest bg-gray-600 hover:bg-gray-500 text-white px-8 py-3 rounded-md transition-colors"
                >
                    MAIN MENU
                </button>
            </div>
        </div>
    );
};

const VictoryScreen: React.FC = () => {
    const { score, restartGame, showMenu } = useStore();
    
    return (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-white pointer-events-auto animate-in fade-in-25">
            <h1 className="font-cyber text-7xl font-black tracking-widest text-yellow-400" style={{ textShadow: '0 0 15px #ffff00' }}>
                VICTORY!
            </h1>
            <Trophy size={80} className="my-6 text-yellow-400" />
            <p className="font-mono text-3xl text-center text-gray-300">
                FINAL SCORE: <span className="text-white font-bold">{score}</span>
            </p>
            <div className="mt-10 flex gap-6">
                <button 
                    onClick={restartGame}
                    className="font-cyber text-xl font-bold tracking-widest bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-3 rounded-md transition-colors"
                >
                    NEW RUN
                </button>
                <button 
                    onClick={showMenu}
                    className="font-cyber text-xl font-bold tracking-widest bg-gray-600 hover:bg-gray-500 text-white px-8 py-3 rounded-md transition-colors"
                >
                    MAIN MENU
                </button>
            </div>
        </div>
    );
};

const ShopModal: React.FC = () => {
    const { score, buyItem, closeShop, hasDoubleJump, hasInvincibilityAbility } = useStore();
    const [purchased, setPurchased] = useState<string[]>([]);
    
    const handleBuy = (item: ShopItem) => {
        if (buyItem(item.id as any, item.cost)) {
            // Success
            if (item.oneTime) {
                setPurchased(p => [...p, item.id]);
            }
        } else {
            // Failure (not enough score)
            // Can add feedback here, e.g. a shake animation
        }
    };
    
    return (
        <div className="absolute inset-0 bg-black/90 z-[110] text-white pointer-events-auto animate-in fade-in-25 flex flex-col items-center justify-center font-cyber">
            <h2 className="text-5xl font-bold tracking-widest mb-2" style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>ABYSSAL FORGE</h2>
            <div className="flex items-center gap-2 mb-8 text-2xl text-yellow-400">
                <Diamond size={24} />
                <span>{score}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {SHOP_ITEMS.map(item => {
                    const isSoldOut = purchased.includes(item.id) || (item.id === 'DOUBLE_JUMP' && hasDoubleJump) || (item.id === 'IMMORTAL' && hasInvincibilityAbility);
                    const canAfford = score >= item.cost;

                    return (
                        <div key={item.id} className={`relative flex flex-col items-center p-6 rounded-lg border-2 w-64 h-72 transition-all ${isSoldOut ? 'border-gray-600 bg-gray-800 text-gray-500' : 'border-cyan-400/50 bg-cyan-900/20'}`}>
                            {isSoldOut && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-3xl font-bold text-red-500 tracking-widest">SOLD OUT</div>}
                            <item.icon size={48} className="mb-3 text-cyan-300" />
                            <h3 className="text-2xl font-bold text-white text-center tracking-wider">{item.name}</h3>
                            <p className="text-sm text-cyan-200/80 text-center flex-grow my-3">{item.description}</p>
                            <button 
                                onClick={() => handleBuy(item)}
                                disabled={isSoldOut || !canAfford}
                                className={`w-full py-2 rounded-md font-bold text-xl tracking-wider transition-colors ${
                                    isSoldOut ? 'bg-gray-700 text-gray-500' : 
                                    canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-red-800 text-red-300 cursor-not-allowed'
                                }`}
                            >
                                {item.cost} <Diamond size={16} className="inline -mt-1" />
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <button 
                onClick={closeShop}
                className="mt-10 font-cyber text-2xl font-bold tracking-widest bg-cyan-500 hover:bg-cyan-400 text-black px-10 py-4 rounded-md transition-all duration-300 flex items-center gap-3"
            >
                CONTINUE DIVE
            </button>
        </div>
    );
};


// Main HUD Component
export const HUD: React.FC = () => {
    const { status, score, lives, maxLives, collectedLetters, level, hasInvincibilityAbility, isInvincible, isScoreMultiplierActive } = useStore();
    
    if (status === GameStatus.SPLASH) {
        return <SplashScreen />;
    }
    if (status === GameStatus.MENU) {
        return <MainMenu />;
    }
    if (status === GameStatus.GAME_OVER) {
        return <GameOverScreen />;
    }
     if (status === GameStatus.VICTORY) {
        return <VictoryScreen />;
    }
    if (status === GameStatus.SHOP) {
        return <ShopModal />;
    }

    const currentTarget = LEVEL_TARGETS[level - 1];
    const activeColor = LEVEL_COLORS[level - 1][0];

    return (
        <div className="absolute top-0 left-0 right-0 p-4 text-white font-mono z-10 pointer-events-none text-2xl"
             style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            
            {/* Top Left - Score & Multiplier */}
            <div className="absolute top-4 left-4 flex flex-col items-start">
                 <div className="flex items-center gap-2">
                    <Diamond />
                    <span>{score}</span>
                </div>
                 {isScoreMultiplierActive && (
                    <div className="mt-1 text-sm font-bold text-green-400 animate-pulse flex items-center gap-1">
                       <Zap size={16}/> 2X SCORE
                    </div>
                )}
            </div>

            {/* Top Right - Health */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                {Array(maxLives).fill(0).map((_, i) => (
                    <Heart key={i} size={32} className={i < lives ? 'text-red-500 fill-current' : 'text-gray-600'} />
                ))}
            </div>
            
            {/* Top Center - Target Word */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3">
                {currentTarget.map((char, index) => {
                    const isCollected = collectedLetters.includes(index);
                    const color = isCollected ? '#ffffff' : activeColor;
                    return (
                        <div key={index} 
                             className={`w-12 h-14 flex items-center justify-center rounded-md font-cyber font-black text-4xl transition-all duration-300`}
                             style={{
                                 backgroundColor: isCollected ? activeColor : 'rgba(0,0,0,0.5)',
                                 color: isCollected ? '#000' : color,
                                 border: `2px solid ${color}`,
                                 boxShadow: isCollected ? `0 0 15px ${activeColor}` : 'none'
                             }}
                        >
                            {char}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Center - Ability Indicator */}
            {hasInvincibilityAbility && (
                <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 transition-opacity duration-300 ${isInvincible ? 'opacity-100' : 'opacity-40'}`}>
                    <Shield size={40} className={`transition-colors ${isInvincible ? 'text-yellow-400 animate-pulse' : 'text-white'}`} />
                    <span className="text-sm tracking-widest">{isInvincible ? 'ACTIVE' : 'READY'}</span>
                </div>
            )}
        </div>
    );
};