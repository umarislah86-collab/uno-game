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
  timeLimitSecs: number | null
  onBack: () => void
}

const BOT_DELAY: Record<BotDifficulty, number> = { easy: 1200, medium: 800, hard: 450 }
const DIFFICULTY_LABELS: Record<BotDifficulty, string> = { easy: 'Senang', medium: 'Sederhana', hard: 'Susah' }
const MEDALS = ['🥇', '🥈', '🥉', '#4', '#5', '#6']
const CONFETTI_COLORS = ['#E8192C', '#0066CC', '#1AAB56', '#FFCC00', '#FF6B35', '#7C3AED', '#EC4899']

function Confetti() {
  const particles = Array.from({ length: 36 }, (_, i) => ({
    x: `${(i / 36) * 100 + Math.sin(i) * 5}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: (i * 0.07) % 1.4,
    duration: 1.8 + (i % 5) * 0.3,
    rotate: i * 47,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-3 rounded-sm"
          style={{ left: p.x, top: -12, backgroundColor: p.color, rotate: p.rotate }}
          animate={{ y: typeof window !== 'undefined' ? window.innerHeight + 20 : 900, rotate: p.rotate + 540, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function BotGame({ humanId, humanName, botCount, difficulty, gameMode, timeLimitSecs, onBack }: BotGameProps) {
  const [state, setState] = useState<GameState>(() =>
    createBotGameState(humanId, humanName, botCount, gameMode, timeLimitSecs)
  )
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

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
  const canCallUno = myHand.length === 1 && state.unoPendingCall === humanId

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

  // Local countdown timer
  useEffect(() => {
    if (!state.timeLimitSecs || !state.startedAt) return
    const startedAt = state.startedAt
    const limit = state.timeLimitSecs
    const tick = () => {
      const left = Math.max(0, limit - Math.floor((Date.now() - startedAt) / 1000))
      setTimeLeft(left)
      if (left === 0) {
        setState(prev => {
          if (prev.status !== 'playing') return prev
          const sorted = [...prev.playerOrder].sort(
            (a, b) => (prev.hands[a]?.length ?? 0) - (prev.hands[b]?.length ?? 0)
          )
          const winner = sorted[0]
          const rankings = [...sorted, ...(prev.rankings ?? [])]
          return { ...prev, status: 'finished', winner, rankings, lastAction: '⏰ Masa tamat! Pemenang: kad paling sikit!' }
        })
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [state.timeLimitSecs, state.startedAt])

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

  function handleRestart() {
    setPendingWildCard(null)
    hasInitRef.current = false
    prevHandIdsRef.current = []
    setTimeLeft(null)
    setState(createBotGameState(humanId, humanName, botCount, gameMode, timeLimitSecs))
  }

  const showStackWarning = isMamak && state.pendingStack > 0 && isMyTurn

  const otherPlayers = state.playerOrder
    .filter(id => id !== humanId)
    .map(id => ({
      id,
      player: state.players[id],
      cardCount: (state.hands[id] ?? []).length,
      isCurrentTurn: state.playerOrder[state.currentPlayerIndex] === id,
    }))

  // Result screen
  if (state.status === 'finished') {
    const rankings = state.rankings ?? []
    const myRank = rankings.indexOf(humanId)
    const iWon = myRank === 0

    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-4 relative">
        {iWon && <Confetti />}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative z-20 w-full max-w-sm"
        >
          <div className="text-center mb-4">
            <motion.div
              className="text-7xl"
              animate={iWon ? { rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.15, 1] } : {}}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              {iWon ? '🏆' : myRank === 1 ? '🥈' : myRank === 2 ? '🥉' : '🃏'}
            </motion.div>
            <h1
              className={['text-4xl font-black mt-2', iWon ? 'text-yellow-400' : 'text-white'].join(' ')}
              style={{ fontFamily: 'Arial Black, sans-serif', textShadow: iWon ? '0 0 30px rgba(250,204,21,0.6)' : 'none' }}
            >
              {iWon ? 'KAU MENANG! 🎉' : myRank === -1 ? 'TAMAT!' : `KEDUDUKAN #${myRank + 1}`}
            </h1>
            <p className="text-white/40 text-xs mt-1">Kesukaran: {DIFFICULTY_LABELS[difficulty]}</p>
          </div>

          {rankings.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 flex flex-col gap-2">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Kedudukan Akhir</p>
              {rankings.map((id, i) => {
                const isMe = id === humanId
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className={[
                      'flex items-center gap-3 px-3 py-2 rounded-xl',
                      i === 0 ? 'bg-yellow-500/15 border border-yellow-500/30' : 'bg-white/5',
                    ].join(' ')}
                  >
                    <span className="text-lg w-6 text-center">{MEDALS[i] ?? `#${i + 1}`}</span>
                    <span className={['font-bold flex-1', isMe ? 'text-yellow-300' : 'text-white'].join(' ')}>
                      {state.players[id]?.name ?? id}
                    </span>
                    {isMe && <span className="text-yellow-400/60 text-xs">← kau</span>}
                    {i === 0 && !isMe && <span className="text-yellow-500 text-xs font-bold">WINNER</span>}
                  </motion.div>
                )
              })}
            </div>
          )}

          <div className="flex gap-3">
            <motion.button
              onClick={handleRestart}
              whileTap={{ scale: 0.97 }}
              className={[
                'flex-1 font-bold py-3 rounded-xl text-lg transition',
                iWon ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-red-600 hover:bg-red-500 text-white',
              ].join(' ')}
            >
              Main Balik
            </motion.button>
            <motion.button
              onClick={onBack}
              whileTap={{ scale: 0.97 }}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 rounded-xl text-lg transition"
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
          {timeLeft !== null && (
            <motion.span
              className={['text-xs font-bold ml-1 tabular-nums', timeLeft < 30 ? 'text-red-400' : 'text-white/50'].join(' ')}
              animate={timeLeft < 30 && timeLeft > 0 ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              ⏱ {formatTime(timeLeft)}
            </motion.span>
          )}
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
            onUno={() => setState(prev => ({ ...prev, unoPendingCall: null }))}
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
