import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const PLAYER_ID_KEY = 'uno_player_id'
const PLAYER_NAME_KEY = 'uno_player_name'

export function usePlayer() {
  const [playerId] = useState<string>(() => {
    let id = localStorage.getItem(PLAYER_ID_KEY)
    if (!id) {
      id = uuidv4()
      localStorage.setItem(PLAYER_ID_KEY, id)
    }
    return id
  })

  const [playerName, setPlayerNameState] = useState<string>(
    () => localStorage.getItem(PLAYER_NAME_KEY) ?? ''
  )

  function setPlayerName(name: string) {
    localStorage.setItem(PLAYER_NAME_KEY, name)
    setPlayerNameState(name)
  }

  return { playerId, playerName, setPlayerName }
}
