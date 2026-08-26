import { useState } from 'react'
import { useGame } from './hooks/useGame'
import { usePlayer } from './hooks/usePlayer'
import { leaveGame } from './lib/gameActions'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'
import './index.css'

const LAST_ROOM_KEY = 'uno_last_room'

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null)
  const { playerId } = usePlayer()
  const { game, loading } = useGame(roomId)

  function handleEnterRoom(id: string) {
    localStorage.setItem(LAST_ROOM_KEY, id)
    setRoomId(id)
  }

  async function handleBack() {
    if (roomId) {
      await leaveGame(roomId, playerId)
      // Only clear saved room if leaving from lobby (permanent leave)
      if (!game || game.status === 'lobby') {
        localStorage.removeItem(LAST_ROOM_KEY)
      }
    }
    setRoomId(null)
  }

  function handleRejoin() {
    const saved = localStorage.getItem(LAST_ROOM_KEY)
    if (saved) setRoomId(saved)
  }

  // Clear saved room when game finishes
  if (game?.status === 'finished') {
    localStorage.removeItem(LAST_ROOM_KEY)
  }

  const savedRoomId = localStorage.getItem(LAST_ROOM_KEY)

  if (!roomId) {
    return <Home onEnterRoom={handleEnterRoom} onRejoin={handleRejoin} savedRoomId={savedRoomId} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-white/50 text-lg animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4">
        <p className="text-white/60">Room tidak jumpa.</p>
        <button onClick={() => { localStorage.removeItem(LAST_ROOM_KEY); setRoomId(null) }} className="text-red-400 underline text-sm">
          Balik
        </button>
      </div>
    )
  }

  if (game.status === 'lobby') {
    return <Lobby game={game} playerId={playerId} onBack={handleBack} />
  }

  return <Game game={game} playerId={playerId} onBack={handleBack} />
}
