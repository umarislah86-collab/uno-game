import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import type { Card, CardColor, GameState } from '../lib/types'
import { isPlayable, applyDrawCard, applyPassMultiPlay, applyPlayCard } from '../lib/gameLogic'
import { createBotGameState, runBotTurn, type BotDifficulty } from '../lib/botLogic'
import Hand from '../components/Hand'
import DiscardPile from '../components/DiscardPile'
import DrawPile from '../components/DrawPile'
import PlayerSeat from '../components/PlayerSeat'
import WildColorPicker from '../components/WildColorPicker'
import UnoButton from '../components/UnoButton'
import CardSvg from '../components/CardSvg'

interface BotGameProps {
  humanId: string
  humanName: string
  botCount: number
  difficulty: BotDifficulty
  gameMode: 'standard' | 'mamak'
  onBack: () => void
}

const BOT_DELAY: Record<BotDifficulty, number> = { easy: 1200, medium: 800, hard: 450 }
const DIFFICULTY_LABELS: Record<BotDifficulty, string> = { easy: 'Senang', medium: 'Sederhana', hard: 'Susah' }

export default function BotGame({ humanId, humanName, botCount, difficulty, gameMode, onBack }: BotGameProps) {
  const [state, setState] = useState<GameState>(() =>
    createBotGameState(humanId, humanName, botCount, gameMode)
  )
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null)
  const [unoCalled, setUnoCalled] = useState(false)

  // Draw animation overlay
  const deckAreaRef = useRef<HTMLDivElement>(null)
  const prevHandIdsRef = useRef<string[]>([])
  const hasInitRef = useRef(false)
  const [drawFly, setDrawFly] = useState<{ card: Card; fromX: number; fromY: number } | null>(null)

  const myHand = state.hands[humanId] ?? []
  const isMamak = state.gameMode === 'mamak'
  const topCard = state.discardPile[state.discardPile.length - 1] ?? null
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex]
  const isMyTurn = currentPlayerId === humanId
  const isMultiPlay = isMamak && !!state.multiPlayType && isMyTurn
  const isDrawPhase = isMamak && state.mamakDrawPhase === humanId && isMyTurn

  // Draw animation when human draws
  useEffect(() => {
    const currentIds = myHand.map(c => c.id)
    if (!hasInitRef.current) {
      hasInitRef.current = true
      prevHandIdsRef.current = currentIds
      return
    }
    const newCards = myHand.filter(c => !prevHandIdsRef.current.includes(c.id))
    prevHandIdsRef.current = currentIds
    if (newCards.length > 0 && deckAreaRef.current) {
      const rect = deckAreaRef.current.getBoundingClientRect()
      setDrawFly({
        card: newCards[newCards.length - 1],
        fromX: rect.left + rect.width / 2 - 35,
        fromY: rect.top + rect.height / 2 - 50,
      })
    }
  }, [myHand])

  // Bot auto-turn
  useEffect(() => {
    if (state.status !== 'playing') return
    const currentId = state.playerOrder[state.currentPlayerIndex]
    if (currentId === humanId) return
    const inDrawPhase = isMamak && state.mamakDrawPhase === currentId
    const delay = inDrawPhase ? 250 : BOT_DELAY[difficulty]
    const timer = setTimeout(() => {
      setState(prev => {
        const prevId = prev.playerOrder[prev.currentPlayerIndex]
        if (prevId !== currentId) return prev
        return runBotTurn(prev, currentId, difficulty)
      })
    }, delay)
    return () => clearTimeout(timer)
  }, [state, humanId, difficulty, isMamak])

  function handlePlay(card: Card) {
    if (!isMyTurn) return
    if (!isPlayable(card, topCard, state.currentColor, state.pendingStack, state.gameMode, state.multiPlayType)) return
    if (card.type === 'wild' || card.type === 'wild4') {
      setPendingWildCard(card)
      return
    }
    setState(prev => applyPlayCard(prev, humanId, card))
  }

  function handleWildColor(color: CardColor) {
    if (!pendingWildCard) return
    setState(prev => applyPlayCard(prev, humanId, pendingWildCard, color))
    setPendingWildCard(null)
  }

  function handleDraw() {
    if (!isMyTurn || isMultiPlay) return
    setState(prev => applyDrawCard(prev, humanId))
  }

  const canCallUno = myHand.length === 2 && isMyTurn && !unoCalled
  const showStackWarning = isMamak && state.pendingStack > 0 && isMyTurn
  const otherPlayers = state.playerOrder
    .filter(id => id !== humanId)
    .map(id => ({
      id,
      player: state.players[id],
      cardCount: (state.hands[id] ?? []).length,
      isCurrentTurn: state.playerOrder[state.currentPlayerIndex] === id,
    }))

  // Win screen
  if (state.status === 'finished') {
    const winner = state.winner ? state.players[state.winner] : null
    const iWon = state.winner === humanId
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">{iWon ? '🏆' : '😢'}</div>
          <h1
            className={['text-5xl font-black mb-2', iWon ? 'text-yellow-400' : 'text-white'].join(' ')}
            style={{ fontFamily: 'Arial Black, sans-serif' }}
          >
            {iWon ? 'KAU MENANG!' : 'TAMAT!'}
          </h1>
          <p className="text-white/60 text-lg mb-1">
            {iWon ? 'Tahniah, kau kalahkan bot!' : `${winner?.name ?? 'Bot'} menang!`}
          </p>
          <p className="text-white/30 text-sm mb-8">Kesukaran: {DIFFICULTY_LABELS[difficulty]}</p>
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={() => {
                setPendingWildCard(null)
                setUnoCalled(false)
                hasInitRef.current = false
                prevHandIdsRef.current = []
                setState(createBotGameState(humanId, humanName, botCount, gameMode))
              }}
              whileTap={{ scale: 0.97 }}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl text-lg transition"
            >
              Main Balik
            </motion.button>
            <motion.button
              onClick={onBack}
              whileTap={{ scale: 0.97 }}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-8 rounded-xl text-lg transition"
            >
              Menu
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <LayoutGroup id="bot-game-cards">
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20">
        <button onClick={onBack} className="text-white/40 hover:text-white/70 text-sm transition">
          ← Keluar
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border-2 border-white/30"
            style={{
              background: { red: '#E8192C', blue: '#0066CC', green: '#1AAB56', yellow: '#FFCC00', wild: '#111' }[state.currentColor],
            }}
          />
          <span className="text-white/50 text-xs capitalize">{state.currentColor}</span>
          <span className="text-white/30 text-xs ml-1">{state.direction === 1 ? '→' : '←'}</span>
          {isMamak && <span className="text-orange-400/70 text-xs ml-1">🥤</span>}
          <span className="text-yellow-500/60 text-xs ml-1 font-bold">🤖 {DIFFICULTY_LABELS[difficulty]}</span>
          <span className="text-white/15 text-[10px] ml-1">umartm</span>
        </div>
        <div className="w-12" />
      </div>

      {/* Last action */}
      <AnimatePresence>
        {state.lastAction && (
          <motion.div
            key={state.lastAction}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-white/50 text-xs py-1 bg-white/5"
          >
            {state.lastAction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stack warning */}
      <AnimatePresence>
        {showStackWarning && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-orange-300 text-xs py-1.5 bg-orange-900/30 font-bold"
          >
            ⚠️ Stack aktif! Kena main +2/+4 atau draw +{state.pendingStack} kad!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-play banner */}
      <AnimatePresence>
        {isMultiPlay && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-green-300 text-xs py-1.5 bg-green-900/30 font-bold"
          >
            🃏 Multi-play! Main lagi kad {state.multiPlayType} atau tekan Selesai.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draw phase banner */}
      <AnimatePresence>
        {isDrawPhase && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-blue-300 text-xs py-1.5 bg-blue-900/30 font-bold"
          >
            📥 Kena main sekurang-kurangnya 1 kad sebelum giliran bertukar!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bot player seats */}
      <div className="flex flex-wrap justify-center gap-3 p-3">
        {otherPlayers.map(({ id, player, cardCount, isCurrentTurn }) => (
          <PlayerSeat
            key={id}
            name={player?.name ?? 'Bot'}
            cardCount={cardCount}
            isCurrentTurn={isCurrentTurn}
            isMe={false}
            isConnected
          />
        ))}
      </div>

      {/* Center: deck + discard */}
      <div className="flex-1 flex items-center justify-center gap-8 px-4">
        <div ref={deckAreaRef}>
          <DrawPile count={state.deck.length} onDraw={handleDraw} canDraw={isMyTurn && !isMultiPlay} />
        </div>
        <DiscardPile topCard={topCard} />
      </div>

      {/* Turn indicator */}
      <div className="text-center pb-1">
        {isMyTurn ? (
          <motion.p
            className="text-yellow-400 text-sm font-bold"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            Giliran kau!
          </motion.p>
        ) : (
          <p className="text-white/30 text-sm">
            Giliran {state.players[currentPlayerId]?.name ?? '...'}
          </p>
        )}
      </div>

      {/* Hand label + controls */}
      <div className="flex items-center justify-between px-4 pb-1">
        <span className="text-white/40 text-xs">Kad kau ({myHand.length})</span>
        <div className="flex items-center gap-2">
          {isMultiPlay && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setState(prev => applyPassMultiPlay(prev))}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
            >
              Selesai ✓
            </motion.button>
          )}
          <UnoButton
            onUno={() => { setUnoCalled(true); setTimeout(() => setUnoCalled(false), 3000) }}
            canCallUno={canCallUno}
          />
        </div>
      </div>

      {/* My hand */}
      <div className="pb-4 min-h-[120px]">
        <Hand
          cards={myHand}
          isMyTurn={isMyTurn}
          topCard={topCard}
          currentColor={state.currentColor}
          pendingStack={state.pendingStack}
          gameMode={state.gameMode}
          multiPlayType={state.multiPlayType}
          onPlay={handlePlay}
        />
      </div>

      {/* Wild color picker */}
      <AnimatePresence>
        {pendingWildCard && <WildColorPicker onPick={handleWildColor} />}
      </AnimatePresence>

      {/* Draw animation overlay */}
      <AnimatePresence>
        {drawFly && (
          <motion.div
            className="fixed pointer-events-none z-[100]"
            style={{ left: 0, top: 0 }}
            initial={{ x: drawFly.fromX, y: drawFly.fromY, rotate: -15, scale: 1, opacity: 1 }}
            animate={{ x: window.innerWidth / 2 - 35, y: window.innerHeight - 120, rotate: 8, scale: 0.95, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            onAnimationComplete={() => setDrawFly(null)}
          >
            <CardSvg card={drawFly.card} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </LayoutGroup>
  )
}
