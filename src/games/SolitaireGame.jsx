import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiPlay, FiRotateCcw, FiCoins, FiCheck, FiHome } = FiIcons;

// Card constants
const SUITS = ['♠', '♥', '♣', '♦'];
const COLORS = { '♠': 'black', '♥': 'red', '♣': 'black', '♦': 'red' };
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const SolitaireGame = () => {
  const { addPoints, updateGameStats, showRewardAd, showInterstitial } = useGame();
  const [gameState, setGameState] = useState('menu'); // menu, playing, won
  const [deck, setDeck] = useState([]);
  const [waste, setWaste] = useState([]);
  const [foundations, setFoundations] = useState([[], [], [], []]); // 4 suits
  const [tableau, setTableau] = useState([[], [], [], [], [], [], []]); // 7 columns
  const [score, setScore] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null); // {area, index, card}
  const [isDragging, setIsDragging] = useState(false);
  const lastClickTime = useRef(0);
  
  // Ad Timers
  const gameTimeRef = useRef(0);
  const adTriggeredRef = useRef({ t15: false, t40: false });

  // Initialize Game
  const initGame = () => {
    // Reset timers
    gameTimeRef.current = 0;
    adTriggeredRef.current = { t15: false, t40: false };

    // Create Deck
    let newDeck = [];
    SUITS.forEach(suit => {
      VALUES.forEach((value, index) => {
        newDeck.push({
          id: `${value}${suit}`,
          suit,
          value,
          numericValue: index + 1,
          color: COLORS[suit],
          faceUp: false
        });
      });
    });

    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    // Deal Tableau
    const newTableau = [[], [], [], [], [], [], []];
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = newDeck.pop();
        if (j === i) card.faceUp = true;
        newTableau[i].push(card);
      }
    }

    setDeck(newDeck);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setTableau(newTableau);
    setScore(0);
    setGameState('playing');
    setSelectedCard(null);
    showInterstitial(); // Ad on Start
  };

  const handleRestart = () => {
    // Confirm with an ad or simple restart
    if (window.confirm("Watch an ad to restart the game?")) {
        showRewardAd(0).then(res => {
            if (res === 'completed') {
                initGame();
            }
        });
    }
  };
  
  // Timer Effect for Ads
  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        gameTimeRef.current += 1;
        const t = gameTimeRef.current;
        
        // Ad at 15 seconds
        if (t >= 15 && !adTriggeredRef.current.t15) {
            adTriggeredRef.current.t15 = true;
            showInterstitial();
        }
        
        // Ad at 40 seconds
        if (t >= 40 && !adTriggeredRef.current.t40) {
            adTriggeredRef.current.t40 = true;
            showInterstitial();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const autoMoveToFoundation = (card, sourceArea, sourceIndex) => {
    for (let i = 0; i < 4; i++) {
      const foundation = foundations[i];
      const foundationCard = foundation.length > 0 ? foundation[foundation.length - 1] : null;

      let canMove = false;
      if (!foundationCard && card.value === 'A') {
        canMove = true;
      } else if (foundationCard && card.suit === foundationCard.suit && card.numericValue === foundationCard.numericValue + 1) {
        canMove = true;
      }

      if (canMove) {
        executeMove(
          { area: sourceArea, colIndex: sourceArea === 'tableau' ? sourceIndex : 0, cardIndex: sourceArea === 'tableau' ? sourceIndex : waste.length - 1, card },
          { area: 'foundation', colIndex: i, card: null },
          10
        );
        return true;
      }
    }
    return false;
  };

  const handleDeckClick = () => {
    if (deck.length > 0) {
      const card = deck[deck.length - 1];
      const newDeck = deck.slice(0, -1);
      const newWaste = [...waste, { ...card, faceUp: true }];
      setDeck(newDeck);
      setWaste(newWaste);
      setSelectedCard(null);
    } else {
      const newDeck = waste.map(c => ({ ...c, faceUp: false })).reverse();
      setDeck(newDeck);
      setWaste([]);
      setSelectedCard(null);
    }
  };

  const handleCardClick = (area, colIndex, cardIndex, card) => {
    if (!card || gameState !== 'playing') return;

    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime.current;

    if (timeDiff < 300) {
      if (card.faceUp) {
        let moved = false;
        if (area === 'waste') {
          moved = autoMoveToFoundation(card, 'waste', 0);
        } else if (area === 'tableau' && cardIndex === tableau[colIndex].length - 1) {
          moved = autoMoveToFoundation(card, 'tableau', colIndex);
        }
        if (moved) {
          setSelectedCard(null);
          return;
        }
      }
    }
    lastClickTime.current = currentTime;

    if (!card.faceUp) {
      if (area === 'tableau' && cardIndex === tableau[colIndex].length - 1) {
        const newTableau = [...tableau];
        newTableau[colIndex][cardIndex].faceUp = true;
        setTableau(newTableau);
        setScore(s => s + 5);
      }
      return;
    }

    if (!selectedCard) {
      setSelectedCard({ area, colIndex, cardIndex, card });
      return;
    }

    if (selectedCard.card.id === card.id) {
      setSelectedCard(null);
      return;
    }

    if (area === 'tableau') {
      attemptMove(selectedCard, { area, colIndex, cardIndex, card });
    } else if (area === 'foundation') {
      if (selectedCard.area !== 'tableau' || selectedCard.cardIndex === tableau[selectedCard.colIndex].length - 1) {
        attemptMove(selectedCard, { area, colIndex, cardIndex, card });
      }
    }
  };

  const handleEmptyTableauClick = (colIndex) => {
    if (selectedCard && selectedCard.card.value === 'K') {
      attemptMove(selectedCard, { area: 'tableau', colIndex, cardIndex: -1, card: null });
    }
  };

  const handleFoundationClick = (suitIndex) => {
    if (selectedCard) {
      if (selectedCard.area !== 'tableau' || selectedCard.cardIndex === tableau[selectedCard.colIndex].length - 1) {
        attemptMove(selectedCard, { area: 'foundation', colIndex: suitIndex, card: null });
      }
    }
  };

  const attemptMove = (source, target) => {
    let success = false;
    let points = 0;

    if (target.area === 'foundation') {
      const foundationPile = foundations[target.colIndex];
      const targetCard = foundationPile.length > 0 ? foundationPile[foundationPile.length - 1] : null;

      if (!targetCard) {
        if (source.card.value === 'A') success = true;
      } else {
        if (source.card.suit === targetCard.suit && source.card.numericValue === targetCard.numericValue + 1) {
          success = true;
        }
      }

      if (success) {
        points = 10;
        executeMove(source, target, points);
      }
    }
    else if (target.area === 'tableau') {
      const targetCard = target.card;

      if (!targetCard) {
        if (source.card.value === 'K') success = true;
      } else {
        if (source.card.color !== targetCard.color && source.card.numericValue === targetCard.numericValue - 1) {
          success = true;
        }
      }

      if (success) {
        if (source.area === 'waste') points = 5;
        executeMove(source, target, points);
      }
    }
  };

  const executeMove = (source, target, points) => {
    const newTableau = [...tableau];
    const newWaste = [...waste];
    const newFoundations = [...foundations];
    let cardsToMove = [];

    if (source.area === 'waste') {
      cardsToMove = [newWaste.pop()];
      setWaste(newWaste);
    } else if (source.area === 'tableau') {
      cardsToMove = newTableau[source.colIndex].splice(source.cardIndex);
      const colLen = newTableau[source.colIndex].length;
      if (colLen > 0 && !newTableau[source.colIndex][colLen-1].faceUp) {
        newTableau[source.colIndex][colLen-1].faceUp = true;
        points += 5;
      }
    } else if (source.area === 'foundation') {
      cardsToMove = [newFoundations[source.colIndex].pop()];
    }

    if (target.area === 'foundation') {
      newFoundations[target.colIndex].push(cardsToMove[0]);
    } else if (target.area === 'tableau') {
      newTableau[target.colIndex] = [...newTableau[target.colIndex], ...cardsToMove];
    }

    setTableau(newTableau);
    setWaste(newWaste);
    setFoundations(newFoundations);
    setScore(s => s + points);
    setSelectedCard(null);

    if (newFoundations.every(f => f.length === 13)) {
      setGameState('won');
    }
  };

  useEffect(() => {
    if (gameState === 'won') {
      showInterstitial();
      if (score > 0) {
        addPoints(Math.floor(score / 5));
        updateGameStats('solitaire', score);
      }
    }
  }, [gameState]);

  const renderCard = (card, area, colIndex, cardIndex) => {
    if (!card) return null;
    const isSelected = selectedCard && selectedCard.card.id === card.id;

    return (
      <div 
        onDoubleClick={() => {
          if (card.faceUp && gameState === 'playing') {
            if (area === 'waste') {
              autoMoveToFoundation(card, 'waste', 0);
            } else if (area === 'tableau' && cardIndex === tableau[colIndex].length - 1) {
              autoMoveToFoundation(card, 'tableau', colIndex);
            }
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleCardClick(area, colIndex, cardIndex, card);
        }}
        className={`
          relative w-12 h-16 md:w-16 md:h-24 rounded-lg flex items-center justify-center text-sm md:text-base cursor-pointer select-none transition-all
          ${card.faceUp ? 'bg-white' : 'bg-blue-800 border-2 border-white'}
          ${isSelected ? 'ring-4 ring-yellow-400 transform -translate-y-2' : ''}
          ${card.color === 'red' ? 'text-red-600' : 'text-black'}
          shadow-md hover:shadow-lg
          ${area === 'tableau' && cardIndex > 0 ? 'absolute' : ''}
        `}
        style={{
          marginTop: area === 'tableau' && cardIndex > 0 ? `${cardIndex * 20}px` : '0',
          zIndex: cardIndex + 1
        }}
      >
        {card.faceUp && (
          <div className="flex flex-col items-center leading-none">
            <span className="font-bold">{card.value}</span>
            <span className="text-lg">{card.suit}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-green-900 p-4"
    >
      <div className="flex justify-between items-center mb-4 pt-4">
        <Link to="/games" className="text-white hover:text-green-300">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <div className="text-white font-bold">Solitaire</div>
        <div className="flex items-center gap-2">
            <div className="text-yellow-400 font-bold">Score: {score}</div>
            {gameState === 'playing' && (
                <button 
                  onClick={handleRestart}
                  className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                  title="Restart (Watch Ad)"
                >
                  <SafeIcon icon={FiRotateCcw} className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {gameState === 'menu' && (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
          <div className="text-6xl">🃏</div>
          <h1 className="text-3xl font-bold text-white">Solitaire</h1>
          <button 
            onClick={initGame}
            className="px-8 py-3 bg-white text-green-900 rounded-full font-bold text-xl hover:scale-105 transition-transform"
          >
            Play Now
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between mb-8">
            <div className="flex space-x-2">
              <div 
                onClick={handleDeckClick}
                className="w-12 h-16 md:w-16 md:h-24 bg-blue-800 rounded-lg border-2 border-white/50 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
              >
                {deck.length > 0 ? '🎴' : '↺'}
              </div>
              <div className="w-12 h-16 md:w-16 md:h-24">
                {waste.length > 0 && renderCard(waste[waste.length - 1], 'waste', 0, waste.length - 1)}
              </div>
            </div>

            <div className="flex space-x-2">
              {foundations.map((pile, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleFoundationClick(idx)}
                  className="w-12 h-16 md:w-16 md:h-24 bg-green-800 rounded-lg border-2 border-white/30 flex items-center justify-center cursor-pointer hover:border-green-400 transition-colors"
                >
                  {pile.length > 0 ? renderCard(pile[pile.length - 1], 'foundation', idx, pile.length - 1) : <span className="text-white/30 text-2xl">{SUITS[idx]}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-4">
            {tableau.map((col, colIdx) => (
              <div 
                key={colIdx} 
                className="relative flex flex-col items-start min-h-[300px] md:min-h-[400px]"
                onClick={() => handleEmptyTableauClick(colIdx)}
              >
                {col.map((card, cardIdx) => (
                  <div key={card.id} className="absolute top-0 left-0">
                    {renderCard(card, 'tableau', colIdx, cardIdx)}
                  </div>
                ))}
                {col.length === 0 && <div className="w-12 h-16 md:w-16 md:h-24 rounded-lg border-2 border-dashed border-white/20"></div>}
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <p className="text-green-300 text-sm">
              💡 Double-click cards to auto-move to foundation
            </p>
          </div>
        </div>
      )}

      {gameState === 'won' && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-white mb-4">You Won!</h2>
          <p className="text-green-400 text-xl mb-8">Score: {score}</p>
          <div className="flex flex-col space-y-3 w-full max-w-xs">
            <button 
              onClick={() => showRewardAd(100)}
              className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold"
            >
              Watch Ad (+100 Bonus)
            </button>
            <button 
              onClick={initGame}
              className="px-6 py-3 bg-white text-black rounded-xl font-bold"
            >
              Play Again
            </button>
            <Link to="/" className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl flex items-center justify-center">
                 <SafeIcon icon={FiHome} className="w-5 h-5 mr-2" /> Home
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SolitaireGame;