import { useEffect, useState } from 'react'
import { subscribeGame } from '../lib/gameActions'
import type { GameState } from '../lib/types'

export function useGame(roomId: string | null) {
  const [game, setGame] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = subscribeGame(roomId, state => {
      setGame(state)
      setLoading(false)
    })

    return unsub
  }, [roomId])

  return { game, loading }
}
