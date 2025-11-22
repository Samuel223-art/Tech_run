/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, MapPin, Diamond, Anchor, ArrowUpCircle, Shield, Activity, PlusCircle, Play, Settings, X, User, CheckSquare, Package, Star } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, GEMINI_COLORS, ShopItem, RUN_SPEED_BASE } from '../../types';
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

    const title = "GEMINI";

    return (
        <div className="absolute inset-0 bg-[#020014] flex flex-col items-center justify-center z-[100] pointer-events-auto animate-in fade-in duration-1000">
            <div className="text-center">
                <h1 className="font-cyber text-5xl md:text-7xl font-black tracking-widest flex">
                    {title.split('').map((char, index) => (
                        <span 
                            key={index}
                            style={{ 
                                color: GEMINI_COLORS[index],
                                textShadow: `0 0 15px ${GEMINI_COLORS[index]}`,
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

const ShopScreen: React.FC = () => {
    const { score, buyItem, closeShop, hasDoubleJump, hasInvincibilityAbility } = useStore();
    const [items, setItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        // Select 3 random items, filtering out one-time items already bought
        let pool = SHOP_ITEMS.filter(item => {
            if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) return false;
            if (item.id === 'IMMORTAL' && hasInvincibilityAbility) return false;
            return true;
        });

        // Shuffle and pick 3
        pool = pool.sort(() => 0.5 - Math.random());
        setItems(pool.slice(0, 3));
    }, []);

    return (
        <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
             <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                 <h2 className="text-3xl md:text-4xl font-black text-green-300 mb-2 font-cyber tracking-widest text-center" style={{ textShadow: '0 0 10px #00ff88' }}>ABYSSAL FORGE</h2>
                 <div className="flex items-center text-yellow-400 mb-6 md:mb-8">
                     <span className="text-base md:text-lg mr-2">AVAILABLE CREDITS:</span>
                     <span className="text-xl md:text-2xl font-bold">{score.toLocaleString()}</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full mb-8">
                     {items.map(item => {
                         const Icon = item.icon;
                         const canAfford = score >= item.cost;
                         return (
                             <div key={item.id} className="bg-gray-900/80 border border-gray-700 p-4 md:p-6 rounded-xl flex flex-col items-center text-center hover:border-green-400 transition-colors">
                                 <div className="bg-gray-800 p-3 md:p-4 rounded-full mb-3 md:mb-4">
                                     <Icon className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
                                 </div>
                                 <h3 className="text-lg md:text-xl font-bold mb-2">{item.name}</h3>
                                 <p className="text-gray-400 text-xs md:text-sm mb-4 h-10 md:h-12 flex items-center justify-center">{item.description}</p>
                                 <button 
                                    onClick={() => buyItem(item.id as any, item.cost)}
                                    disabled={!canAfford}
                                    className={`px-4 md:px-6 py-2 rounded font-bold w-full text-sm md:text-base ${canAfford ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:brightness-110' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
                                 >
                                     {item.cost} PEARLS
                                 </button>
                             </div>
                         );
                     })}
                 </div>

                 <button 
                    onClick={closeShop}
                    className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,128,255,0.4)]"
                 >
                     CONTINUE DIVE <Play className="ml-2 w-5 h-5" fill="white" />
                 </button>
             </div>
        </div>
    );
};

const SettingsModal: React.FC = () => {
    const { score, setStatus, previousStatus } = useStore();
    const highScore = useStore(state => state.highScore);
    const isFromMenu = previousStatus === GameStatus.MENU;

    const handleClose = () => {
        const returnStatus = previousStatus || GameStatus.MENU;
        setStatus(returnStatus);
    };

    return (
      <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-full py-8 px-4 relative">
              
              <button 
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close settings"
              >
                  <X className="w-8 h-8" />
              </button>
              
              <h1 className="text-3xl md:text-5xl font-black text-cyan-400 mb-8 font-cyber tracking-widest drop-shadow-[0_0_10px_#00ffff]">
                  {isFromMenu ? 'SETTINGS' : 'DIVE PAUSED'}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl mb-10">
                  
                  {/* Left Column */}
                  <div className="space-y-6">
                      {/* Character Selection */}
                      <div className="bg-gray-900/80 border border-gray-700 p-4 rounded-xl">
                          <h3 className="flex items-center text-xl font-bold text-purple-400 mb-3"><User className="mr-2 w-5 h-5" /> DIVER</h3>
                          <div className="flex space-x-4">
                              <div className="border-2 border-cyan-400 p-2 rounded-lg text-center bg-black/50">
                                  <div className="w-20 h-20 bg-cyan-900 mb-2 rounded flex items-center justify-center font-bold text-3xl" aria-hidden="true">🤖</div>
                                  <p className="text-sm font-bold">AQUANAUT</p>
                                  <p className="text-xs text-cyan-400">SELECTED</p>
                              </div>
                              <div className="border-2 border-gray-600 p-2 rounded-lg text-center bg-black/50 opacity-60">
                                  <div className="w-20 h-20 bg-gray-800 mb-2 rounded flex items-center justify-center font-bold text-3xl" aria-hidden="true">🐙</div>
                                  <p className="text-sm font-bold">CEPHALO-BOT</p>
                                  <p className="text-xs text-gray-500">LOCKED</p>
                              </div>
                          </div>
                      </div>

                      {/* Daily Tasks */}
                      <div className="bg-gray-900/80 border border-gray-700 p-4 rounded-xl">
                          <h3 className="flex items-center text-xl font-bold text-purple-400 mb-3"><CheckSquare className="mr-2 w-5 h-5" /> BOUNTIES</h3>
                          <ul className="space-y-3 text-sm">
                              <li className="flex justify-between items-center"><span>Collect 250 Pearls</span> <span className="text-yellow-400">+500 Pearls</span></li>
                              <li className="flex justify-between items-center"><span>Dive 5,000m</span> <span className="text-yellow-400">+1000 Pearls</span></li>
                              <li className="flex justify-between items-center opacity-50"><span>Finish a zone without damage</span> <span className="text-yellow-400">+2500 Pearls</span></li>
                          </ul>
                      </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                      {/* Scores */}
                      <div className="bg-gray-900/80 border border-gray-700 p-4 rounded-xl text-center">
                          <h3 className="flex items-center justify-center text-xl font-bold text-purple-400 mb-3"><Trophy className="mr-2 w-5 h-5" /> SCORE</h3>
                          {!isFromMenu && (
                            <div className="mb-2">
                                <p className="text-sm text-gray-400">CURRENT</p>
                                <p className="text-3xl font-bold font-mono text-cyan-400">{score.toLocaleString()}</p>
                            </div>
                          )}
                          <div>
                              <p className="text-sm text-gray-400">BEST SCORE</p>
                              <p className="text-3xl font-bold font-mono text-yellow-400">{highScore.toLocaleString()}</p>
                          </div>
                      </div>
                      {/* Shop */}
                      <div className="bg-gray-900/80 border border-gray-700 p-4 rounded-xl">
                           <h3 className="flex items-center text-xl font-bold text-purple-400 mb-3"><Package className="mr-2 w-5 h-5" /> UPGRADES</h3>
                           <p className="text-gray-400 text-sm mb-4">Purchase permanent upgrades and consumables.</p>
                           <button onClick={() => setStatus(GameStatus.SHOP)} className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 font-bold rounded hover:brightness-110 transition-all">
                               ENTER ABYSSAL FORGE
                           </button>
                      </div>
                  </div>
              </div>

              <button 
                  onClick={handleClose}
                  className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,128,255,0.4)]"
              >
                  {isFromMenu ? 'BACK TO MENU' : 'RESUME DIVE'} <Play className="ml-2 w-5 h-5" fill="white" />
              </button>
          </div>
      </div>
    );
};

const THEME_COLORS = {
    1: { main: 'text-cyan-400', shadow: 'drop-shadow-[0_0_10px_#00ffff]', speed: 'text-cyan-500' },
    2: { main: 'text-fuchsia-400', shadow: 'drop-shadow-[0_0_10px_#ff00ff]', speed: 'text-fuchsia-500' },
    3: { main: 'text-orange-400', shadow: 'drop-shadow-[0_0_10px_#ffaa00]', speed: 'text-orange-500' },
};

export const HUD: React.FC = () => {
  const { score, lives, maxLives, collectedLetters, status, level, visualLevel, restartGame, startGame, gemsCollected, distance, isInvincible, isScoreMultiplierActive, speed, setStatus } = useStore();
  const target = ['G', 'E', 'M', 'I', 'N', 'I'];
  const theme = THEME_COLORS[visualLevel as keyof typeof THEME_COLORS] || THEME_COLORS[1];

  // Common container style
  const containerClass = "absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50";

  if (status === GameStatus.SPLASH) {
      return <SplashScreen />;
  }
  
  if (status === GameStatus.SHOP) {
      return <ShopScreen />;
  }

  if (status === GameStatus.PAUSED) {
      return <SettingsModal />;
  }

  if (status === GameStatus.MENU) {
    return (
        <div className="absolute inset-0 z-[100] pointer-events-auto p-4 md:p-8">
            <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <button onClick={() => setStatus(GameStatus.PAUSED)} className="pointer-events-auto p-2 bg-black/30 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm animate-in fade-in duration-500" aria-label="Open settings menu">
                    <Settings className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                </button>
            </div>
            <div className="absolute inset-x-0 bottom-20 flex justify-center">
                <button
                    onClick={() => { audio.init(); startGame(); }}
                    className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg md:text-xl rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)] animate-in fade-in slide-in-from-bottom-10 duration-500"
                >
                    START DIVE <Play className="ml-2 w-5 h-5 fill-white" />
                </button>
            </div>
        </div>
    );
  }

  if (status === GameStatus.GAME_OVER) {
      return (
          <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-sm overflow-y-auto">
              <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] font-cyber text-center">PRESSURE CRITICAL</h1>
                
                <div className="grid grid-cols-1 gap-3 md:gap-4 text-center mb-8 w-full max-w-md">
                    <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-yellow-400 text-sm md:text-base"><Trophy className="mr-2 w-4 h-4 md:w-5 md:h-5"/> ZONE</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{level} / 3</div>
                    </div>
                    <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-cyan-400 text-sm md:text-base"><Diamond className="mr-2 w-4 h-4 md:w-5 md:h-5"/> GEMS COLLECTED</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{gemsCollected}</div>
                    </div>
                    <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-purple-400 text-sm md:text-base"><MapPin className="mr-2 w-4 h-4 md:w-5 md:h-5"/> DEPTH</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{Math.floor(distance)} m</div>
                    </div>
                     <div className="bg-gray-800/50 p-3 md:p-4 rounded-lg flex items-center justify-between mt-2">
                        <div className="flex items-center text-white text-sm md:text-base">TOTAL SCORE</div>
                        <div className="text-2xl md:text-3xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{score.toLocaleString()}</div>
                    </div>
                </div>

                <button 
                  onClick={() => { audio.init(); restartGame(); }}
                  className="px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                >
                    DIVE AGAIN
                </button>
              </div>
          </div>
      );
  }

  if (status === GameStatus.VICTORY) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/90 to-black/95 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <Anchor className="w-16 h-16 md:w-24 md:h-24 text-yellow-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" />
                <h1 className="text-3xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-500 to-pink-500 mb-2 drop-shadow-[0_0_20px_rgba(255,165,0,0.6)] font-cyber text-center leading-tight">
                    SURFACE REACHED
                </h1>
                <p className="text-cyan-300 text-sm md:text-2xl font-mono mb-8 tracking-widest text-center">
                    YOU HAVE ESCAPED THE ABYSS
                </p>
                
                <div className="grid grid-cols-1 gap-4 text-center mb-8 w-full max-w-md">
                    <div className="bg-black/60 p-6 rounded-xl border border-yellow-500/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                        <div className="text-xs md:text-sm text-gray-400 mb-1 tracking-wider">FINAL SCORE</div>
                        <div className="text-3xl md:text-4xl font-bold font-cyber text-yellow-400">{score.toLocaleString()}</div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/60 p-4 rounded-lg border border-white/10">
                            <div className="text-xs text-gray-400">GEMS</div>
                            <div className="text-xl md:text-2xl font-bold text-cyan-400">{gemsCollected}</div>
                        </div>
                        <div className="bg-black/60 p-4 rounded-lg border border-white/10">
                             <div className="text-xs text-gray-400">DEPTH</div>
                            <div className="text-xl md:text-2xl font-bold text-purple-400">{Math.floor(distance)} m</div>
                        </div>
                     </div>
                </div>

                <button 
                  onClick={() => { audio.init(); restartGame(); }}
                  className="px-8 md:px-12 py-4 md:py-5 bg-white text-black font-black text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] tracking-widest"
                >
                    NEW DIVE
                </button>
            </div>
        </div>
    );
  }

  // Fallback for PLAYING state
  const isPlaying = status === GameStatus.PLAYING;
  
  if (!isPlaying) return null; // Should not happen due to checks above, but as a safeguard.

  return (
    <div className={containerClass}>
        {/* Top Bar */}
        <div className="flex justify-between items-start w-full">
            <div className={`text-3xl md:text-5xl font-bold ${theme.main} ${theme.shadow} font-cyber`}>
                {score.toLocaleString()}
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
                <div className="flex space-x-1 md:space-x-2">
                    {[...Array(maxLives)].map((_, i) => (
                        <Heart 
                            key={i} 
                            className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-800 fill-gray-800'} drop-shadow-[0_0_5px_#ff0000]`} 
                        />
                    ))}
                </div>
                 <button onClick={() => setStatus(GameStatus.PAUSED)} className="pointer-events-auto p-2 bg-black/30 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm" aria-label="Open settings menu">
                    <Settings className={`w-5 h-5 md:w-6 md:h-6 ${theme.main}`} />
                </button>
            </div>
        </div>
        
        {/* Level Indicator - Moved to Top Center aligned with Score/Hearts */}
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-sm md:text-lg text-purple-300 font-bold tracking-wider font-mono bg-black/50 px-3 py-1 rounded-full border border-purple-500/30 backdrop-blur-sm z-50">
            ZONE {level} <span className="text-gray-500 text-xs md:text-sm">/ 3</span>
        </div>

        {/* Active Powerup Indicators */}
         <div className="absolute top-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2">
            {isInvincible && (
                <div className="text-yellow-400 font-bold text-xl md:text-2xl animate-pulse flex items-center drop-shadow-[0_0_10px_gold] bg-black/50 px-3 py-1 rounded-full">
                    <Shield className="mr-2 fill-yellow-400" /> SHIELD ACTIVE
                </div>
            )}
            {isScoreMultiplierActive && (
                 <div className="text-green-300 font-bold text-xl md:text-2xl animate-pulse flex items-center drop-shadow-[0_0_10px_#00ff88] bg-black/50 px-3 py-1 rounded-full">
                    <Star className="mr-2 fill-green-400" /> SCORE x2
                 </div>
            )}
        </div>

        {/* Gemini Collection Status - Just below Top Bar */}
        <div className="absolute top-16 md:top-24 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3">
            {target.map((char, idx) => {
                const isCollected = collectedLetters.includes(idx);
                const color = GEMINI_COLORS[idx];

                return (
                    <div 
                        key={idx}
                        style={{
                            borderColor: isCollected ? color : 'rgba(55, 65, 81, 1)',
                            // Use dark text (almost black) when collected to contrast with neon background
                            color: isCollected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(55, 65, 81, 1)',
                            boxShadow: isCollected ? `0 0 20px ${color}` : 'none',
                            backgroundColor: isCollected ? color : 'rgba(0, 0, 0, 0.9)'
                        }}
                        className={`w-8 h-10 md:w-10 md:h-12 flex items-center justify-center border-2 font-black text-lg md:text-xl font-cyber rounded-lg transform transition-all duration-300`}
                    >
                        {char}
                    </div>
                );
            })}
        </div>

        {/* Bottom Overlay */}
        <div className="w-full flex justify-end items-end">
             <div className={`flex items-center space-x-2 ${theme.speed} opacity-70`}>
                 <Zap className="w-4 h-4 md:w-6 md:h-6 animate-pulse" />
                 <span className="font-mono text-base md:text-xl">SPEED {Math.round((speed / RUN_SPEED_BASE) * 100)}%</span>
             </div>
        </div>
    </div>
  );
};