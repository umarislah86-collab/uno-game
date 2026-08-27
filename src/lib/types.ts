export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild'

export type CardType =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild4'

export type GameMode = 'standard' | 'mamak'

export interface Card {
  id: string
  color: CardColor
  type: CardType
}

export interface Player {
  id: string
  name: string
  isConnected: boolean
}

export type GameStatus = 'lobby' | 'playing' | 'finished'

export interface Wild4Challenge {
  attackerId: string
  victimId: string
  attackerHadMatchingColor: boolean
}

export interface GameState {
  id: string
  status: GameStatus
  hostId: string
  players: Record<string, Player>
  playerOrder: string[]
  currentPlayerIndex: number
  direction: 1 | -1
  deck: Card[]
  discardPile: Card[]
  hands: Record<string, Card[]>
  currentColor: CardColor
  pendingDraw: number
  winner: string | null
  lastAction: string | null
  // mamak / mode fields
  gameMode: GameMode
  pendingStack: number
  unoPendingCall: string | null
  wild4Challenge: Wild4Challenge | null
  multiPlayType: CardType | null
  mamakDrawPhase: string | null  // playerId drawing one-by-one until playable found
}
