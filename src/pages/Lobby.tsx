import { useState } from 'react'
import { motion } from 'framer-motion'
import { startGame } from '../lib/gameActions'
import type { GameState } from '../lib/types'

interface LobbyProps {
  game: GameState
  playerId: string
  onBack: () => void
}

export default function Lobby({ game, playerId, onBack }: LobbyProps) {
  const isHost = game.hostId === playerId
  const playerList = game.playerOrder.map(id => game.players[id]).filter(Boolean)
  const [copied, setCopied] = useState(false)

  function handleCopyLink() {
    const url = `${window.location.origin}${window.location.pathname}?room=${game.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-black text-white"
            style={{ fontFamily: 'Arial Black, sans-serif' }}
          >
            UNO
          </h1>
          <div className="mt-3 inline-block bg-white/10 border border-white/20 rounded-xl px-6 py-2">
            <p className="text-white/50 text-xs uppercase tracking-widest">Room Code</p>
            <p className="text-white text-3xl font-black tracking-[0.3em]">{game.id}</p>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={[
              'text-xs font-bold px-3 py-1 rounded-full',
              game.gameMode === 'mamak'
                ? 'bg-orange-600/30 text-orange-300 border border-orange-500/30'
                : 'bg-white/10 text-white/50 border border-white/10',
            ].join(' ')}>
              {game.gameMode === 'mamak' ? '🥤 Mamak Style' : 'Standard'}
            </span>
          </div>
          <p className="text-white/40 text-sm mt-2">Kongsi code ni dengan kawan-kawan kau</p>
          <motion.button
            onClick={handleCopyLink}
            whileTap={{ scale: 0.95 }}
            className="mt-3 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 text-sm font-bold px-5 py-2 rounded-xl transition"
          >
            {copied ? '✓ Link disalin!' : '🔗 Copy Link'}
          </motion.button>
        </div>

        {/* Player list */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
            Players ({playerList.length}/6)
          </p>
          <div className="flex flex-col gap-2">
            {playerList.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5"
              >
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className={['font-medium', player.id === playerId ? 'text-yellow-300' : 'text-white'].join(' ')}>
                  {player.name}
                  {player.id === playerId && ' (kau)'}
                </span>
                {player.id === game.hostId && (
                  <span className="ml-auto text-yellow-400 text-xs">Host</span>
                )}
              </motion.div>
            ))}
          </div>

          {playerList.length < 2 && (
            <p className="text-white/30 text-sm text-center mt-3">
              Tunggu sekurang-kurangnya 2 orang...
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost ? (
            <motion.button
              onClick={() => startGame(game.id)}
              disabled={playerList.length < 2}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-lg transition"
            >
              Mula Game!
            </motion.button>
          ) : (
            <div className="text-center text-white/40 text-sm py-3">
              Tunggu host mula game...
            </div>
          )}

          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-medium py-2.5 rounded-xl transition"
          >
            Keluar Room
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
