import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Card, CardColor, GameState } from '../lib/types'
import { isPlayable } from '../lib/gameLogic'
import { callUno, catchUno, drawCard, passMultiPlay, playCard, resolveWild4Challenge } from '../lib/gameActions'
import Hand from '../components/Hand'
import DiscardPile from '../components/DiscardPile'
import DrawPile from '../components/DrawPile'
import PlayerSeat from '../components/PlayerSeat'
import UnoButton from '../components/UnoButton'
import WildColorPicker from '../components/WildColorPicker'
import RulesModal from '../components/RulesModal'

interface GameProps {
  game: GameState
  playerId: string
  onBack: () => void
}

export default function Game({ game, playerId, onBack }: GameProps) {
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null)
  const [unoCalled, setUnoCalled] = useState(false)
  const [showRules, setShowRules] = useState(false)

  const isMamak = game.gameMode === 'mamak'
  const myHand = game.hands[playerId] ?? []
  const topCard = game.discardPile[game.discardPile.length - 1] ?? null
  const currentPlayerId = game.playerOrder[game.currentPlayerIndex]
  const isMyTurn = currentPlayerId === playerId
  const isMultiPlay = isMamak && !!game.multiPlayType && isMyTurn

  // Wild4 challenge: is it my turn to decide?
  const myChallenge = isMamak && game.wild4Challenge?.victimId === playerId
    ? game.wild4Challenge
    : null

  // Other players (not me)
  const otherPlayers = game.playerOrder
    .filter(id => id !== playerId)
    .map(id => ({
      id,
      player: game.players[id],
      cardCount: (game.hands[id] ?? []).length,
      isCurrentTurn: game.playerOrder[game.currentPlayerIndex] === id,
      hasUnoPending: isMamak && game.unoPendingCall === id,
    }))

  function handlePlay(card: Card) {
    if (!isMyTurn) return
    if (myChallenge) return
    if (!isPlayable(card, topCard, game.currentColor, game.pendingStack, game.gameMode, game.multiPlayType)) return

    if (card.type === 'wild' || card.type === 'wild4') {
      setPendingWildCard(card)
      return
    }

    playCard(game.id, playerId, card)
  }

  function handleWildColor(color: CardColor) {
    if (!pendingWildCard) return
    playCard(game.id, playerId, pendingWildCard, color)
    setPendingWildCard(null)
  }

  function handleDraw() {
    if (!isMyTurn) return
    if (myChallenge) return
    if (isMultiPlay) return // must Selesai or play more
    drawCard(game.id, playerId)
  }

  function handleUno() {
    setUnoCalled(true)
    setTimeout(() => setUnoCalled(false), 3000)
    if (isMamak) callUno(game.id, playerId)
  }

  const canCallUno = myHand.length === 2 && isMyTurn && !unoCalled
  const showStackWarning = isMamak && game.pendingStack > 0 && isMyTurn && !myChallenge

  if (game.status === 'finished') {
    return <WinScreen game={game} playerId={playerId} onBack={onBack} />
  }

  return (
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
              background: {
                red: '#E8192C', blue: '#0066CC',
                green: '#1AAB56', yellow: '#FFCC00', wild: '#111',
              }[game.currentColor],
            }}
          />
          <span className="text-white/50 text-xs capitalize">{game.currentColor}</span>
          <span className="text-white/30 text-xs ml-2">
            {game.direction === 1 ? '→' : '←'} Room: {game.id}
          </span>
          {isMamak && (
            <span className="text-orange-400/70 text-xs ml-1">🥤</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unoCalled && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-red-400 font-black text-lg"
              style={{ fontFamily: 'Arial Black, sans-serif' }}
            >
              UNO!
            </motion.span>
          )}
          <button
            onClick={() => setShowRules(true)}
            className="text-white/30 hover:text-white/70 text-sm w-6 h-6 rounded-full border border-white/20 flex items-center justify-center transition"
          >
            ?
          </button>
        </div>
      </div>

      {/* Last action toast */}
      <AnimatePresence>
        {game.lastAction && (
          <motion.div
            key={game.lastAction}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-white/50 text-xs py-1 bg-white/5"
          >
            {game.lastAction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mamak stack warning */}
      <AnimatePresence>
        {showStackWarning && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-orange-300 text-xs py-1.5 bg-orange-900/30 font-bold"
          >
            ⚠️ Stack aktif! Kena main +2/+4 atau draw +{game.pendingStack} kad!
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
            🃏 Multi-play! Main lagi kad {game.multiPlayType} atau tekan Selesai.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Other players */}
      <div className="flex flex-wrap justify-center gap-3 p-3">
        {otherPlayers.map(({ id, player, cardCount, isCurrentTurn, hasUnoPending }) => (
          <div key={id} className="relative">
            <PlayerSeat
              name={player?.name ?? 'Player'}
              cardCount={cardCount}
              isCurrentTurn={isCurrentTurn}
              isMe={false}
              isConnected={player?.isConnected ?? false}
            />
            {/* Tangkap UNO button (mamak only) */}
            {hasUnoPending && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => catchUno(game.id, id)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-lg z-10"
              >
                Tangkap!
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Center area: draw pile + discard pile */}
      <div className="flex-1 flex items-center justify-center gap-8 px-4">
        <DrawPile
          count={game.deck.length}
          onDraw={handleDraw}
          canDraw={isMyTurn && !myChallenge}
        />
        <DiscardPile topCard={topCard} />
      </div>

      {/* My turn indicator */}
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
            Giliran {game.players[currentPlayerId]?.name ?? '...'}
          </p>
        )}
      </div>

      {/* My hand label */}
      <div className="flex items-center justify-between px-4 pb-1">
        <span className="text-white/40 text-xs">Kad kau ({myHand.length})</span>
        <div className="flex items-center gap-2">
          {isMultiPlay && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => passMultiPlay(game.id, playerId)}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
            >
              Selesai ✓
            </motion.button>
          )}
          <UnoButton onUno={handleUno} canCallUno={canCallUno} />
        </div>
      </div>

      {/* My hand */}
      <div className="pb-4 min-h-[120px]">
        <Hand
          cards={myHand}
          isMyTurn={isMyTurn && !myChallenge}
          topCard={topCard}
          currentColor={game.currentColor}
          pendingStack={game.pendingStack}
          gameMode={game.gameMode}
          multiPlayType={game.multiPlayType}
          onPlay={handlePlay}
        />
      </div>

      {/* Wild color picker */}
      <AnimatePresence>
        {pendingWildCard && (
          <WildColorPicker onPick={handleWildColor} />
        )}
      </AnimatePresence>

      {/* Wild +4 Challenge modal (mamak only) */}
      <AnimatePresence>
        {myChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              className="bg-[#16213e] border border-orange-500/30 rounded-2xl p-6 w-full max-w-xs text-center"
            >
              <div className="text-4xl mb-3">🃏</div>
              <h3 className="text-white font-black text-xl mb-1">Wild +4 Dimain!</h3>
              <p className="text-white/50 text-sm mb-1">
                {game.players[myChallenge.attackerId]?.name} main Wild +4
              </p>
              <p className="text-orange-300 text-sm mb-5">
                Challenge atau terima +{game.pendingStack} kad?
              </p>
              <div className="flex flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => resolveWild4Challenge(game.id, playerId, true)}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition"
                >
                  ⚔️ Challenge!
                  <span className="block text-xs font-normal text-orange-200 mt-0.5">
                    (Kalau dia ada kad warna {game.currentColor}, dia draw 4)
                  </span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => resolveWild4Challenge(game.id, playerId, false)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl transition"
                >
                  Terima (+{game.pendingStack} kad)
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} gameMode={game.gameMode} />}
    </div>
  )
}

function WinScreen({ game, playerId, onBack }: { game: GameState; playerId: string; onBack: () => void }) {
  const winner = game.winner ? game.players[game.winner] : null
  const iWon = game.winner === playerId

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
        <p className="text-white/60 text-lg mb-8">
          {iWon ? 'Tahniah, kau kosongkan tangan pertama!' : `${winner?.name ?? 'Someone'} menang!`}
        </p>
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.97 }}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-10 rounded-xl text-lg transition"
        >
          Main Balik
        </motion.button>
      </motion.div>
    </div>
  )
}
