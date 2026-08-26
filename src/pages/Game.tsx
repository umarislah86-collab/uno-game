import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Card, CardColor, GameState } from '../lib/types'
import { isPlayable } from '../lib/gameLogic'
import { drawCard, playCard } from '../lib/gameActions'
import Hand from '../components/Hand'
import DiscardPile from '../components/DiscardPile'
import DrawPile from '../components/DrawPile'
import PlayerSeat from '../components/PlayerSeat'
import UnoButton from '../components/UnoButton'
import WildColorPicker from '../components/WildColorPicker'

interface GameProps {
  game: GameState
  playerId: string
  onBack: () => void
}

export default function Game({ game, playerId, onBack }: GameProps) {
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null)
  const [unoCalled, setUnoCalled] = useState(false)

  const myHand = game.hands[playerId] ?? []
  const topCard = game.discardPile[game.discardPile.length - 1] ?? null
  const currentPlayerId = game.playerOrder[game.currentPlayerIndex]
  const isMyTurn = currentPlayerId === playerId

  // Other players (not me)
  const otherPlayers = game.playerOrder
    .filter(id => id !== playerId)
    .map(id => ({
      id,
      player: game.players[id],
      cardCount: (game.hands[id] ?? []).length,
      isCurrentTurn: game.playerOrder[game.currentPlayerIndex] === id,
    }))

  function handlePlay(card: Card) {
    if (!isMyTurn) return
    if (!isPlayable(card, topCard, game.currentColor)) return

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
    drawCard(game.id, playerId)
  }

  function handleUno() {
    setUnoCalled(true)
    setTimeout(() => setUnoCalled(false), 3000)
  }

  const canCallUno = myHand.length === 2 && isMyTurn && !unoCalled

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
        </div>
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
        {!unoCalled && <div className="w-16" />}
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

      {/* Other players */}
      <div className="flex flex-wrap justify-center gap-3 p-3">
        {otherPlayers.map(({ id, player, cardCount, isCurrentTurn }) => (
          <PlayerSeat
            key={id}
            name={player?.name ?? 'Player'}
            cardCount={cardCount}
            isCurrentTurn={isCurrentTurn}
            isMe={false}
            isConnected={player?.isConnected ?? false}
          />
        ))}
      </div>

      {/* Center area: draw pile + discard pile */}
      <div className="flex-1 flex items-center justify-center gap-8 px-4">
        <DrawPile
          count={game.deck.length}
          onDraw={handleDraw}
          canDraw={isMyTurn}
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
        <UnoButton onUno={handleUno} canCallUno={canCallUno} />
      </div>

      {/* My hand */}
      <div className="pb-4 min-h-[120px]">
        <Hand
          cards={myHand}
          isMyTurn={isMyTurn}
          topCard={topCard}
          currentColor={game.currentColor}
          onPlay={handlePlay}
        />
      </div>

      {/* Wild color picker */}
      <AnimatePresence>
        {pendingWildCard && (
          <WildColorPicker onPick={handleWildColor} />
        )}
      </AnimatePresence>
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
