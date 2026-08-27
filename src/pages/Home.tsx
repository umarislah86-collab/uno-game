import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createGame, joinGame } from '../lib/gameActions'
import { usePlayer } from '../hooks/usePlayer'
import RulesModal from '../components/RulesModal'
import type { GameMode } from '../lib/types'

interface HomeProps {
  onEnterRoom: (roomId: string) => void
  onRejoin: () => void
  savedRoomId: string | null
}

export default function Home({ onEnterRoom, onRejoin, savedRoomId }: HomeProps) {
  const { playerId, playerName, setPlayerName } = usePlayer()
  const [nameInput, setNameInput] = useState(playerName)
  const [roomInput, setRoomInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRules, setShowRules] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>('standard')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = params.get('room')
    if (room) {
      setRoomInput(room.toUpperCase())
      // Clean URL so refresh doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  function genRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase()
  }

  async function handleCreate() {
    const name = nameInput.trim()
    if (!name) return setError('Masukkan nama kau dulu!')
    setLoading(true)
    setError('')
    const roomId = genRoomCode()
    setPlayerName(name)
    await createGame(roomId, playerId, name, gameMode)
    onEnterRoom(roomId)
    setLoading(false)
  }

  async function handleJoin() {
    const name = nameInput.trim()
    const room = roomInput.trim().toUpperCase()
    if (!name) return setError('Masukkan nama kau dulu!')
    if (!room) return setError('Masukkan room code!')
    setLoading(true)
    setError('')
    setPlayerName(name)
    const ok = await joinGame(room, playerId, name)
    if (!ok) {
      setError('Room tidak wujud atau dah penuh/started.')
      setLoading(false)
      return
    }
    onEnterRoom(room)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-4">
      {/* Title */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="mb-10 text-center"
      >
        <h1
          className="text-7xl font-black text-white tracking-tight select-none"
          style={{ fontFamily: 'Arial Black, sans-serif', textShadow: '0 4px 24px rgba(232,25,44,0.6)' }}
        >
          UNO
        </h1>
        <p className="text-white/40 text-sm mt-1 tracking-widest uppercase">Multiplayer</p>
      </motion.div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
      >
        {/* Rejoin banner */}
        {savedRoomId && (
          <motion.button
            onClick={onRejoin}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            <span>↩</span>
            <span>Sambung Game — Room <span className="tracking-widest">{savedRoomId}</span></span>
          </motion.button>
        )}
        {/* Name input */}
        <div>
          <label className="text-white/60 text-xs uppercase tracking-wider block mb-1">Nama kau</label>
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="e.g. Aiman"
            maxLength={20}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-red-500 transition"
          />
        </div>

        {/* Game mode picker */}
        <div>
          <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">Mod Permainan</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setGameMode('standard')}
              className={[
                'py-2.5 rounded-xl text-sm font-bold transition border',
                gameMode === 'standard'
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80',
              ].join(' ')}
            >
              Standard
            </button>
            <button
              onClick={() => setGameMode('mamak')}
              className={[
                'py-2.5 rounded-xl text-sm font-bold transition border',
                gameMode === 'mamak'
                  ? 'bg-orange-600 border-orange-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80',
              ].join(' ')}
            >
              🥤 Mamak Style
            </button>
          </div>
          {gameMode === 'mamak' && (
            <p className="text-orange-400/70 text-xs mt-1.5">
              Stack +2/+4 · Tangkap UNO · Multi-play
            </p>
          )}
        </div>

        {/* Create room */}
        <motion.button
          onClick={handleCreate}
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-lg"
        >
          {loading ? 'Loading...' : 'Buat Room Baru'}
        </motion.button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">atau</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Join room */}
        <div>
          <label className="text-white/60 text-xs uppercase tracking-wider block mb-1">Room Code</label>
          <input
            value={roomInput}
            onChange={e => setRoomInput(e.target.value.toUpperCase())}
            placeholder="e.g. AB3K"
            maxLength={6}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-blue-500 transition tracking-widest text-center text-lg font-bold"
          />
        </div>
        <motion.button
          onClick={handleJoin}
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-lg"
        >
          {loading ? 'Loading...' : 'Join Room'}
        </motion.button>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      <p className="text-white/20 text-xs mt-6">2–6 players · <span className="text-white/30">umartm</span></p>

      <button
        onClick={() => setShowRules(true)}
        className="mt-3 text-white/30 hover:text-white/60 text-xs underline underline-offset-2 transition"
      >
        ? Peraturan Permainan
      </button>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  )
}
