import type { Card, CardColor, GameState } from './types'
import { drawCards, reshuffleDeck } from './deck'

export function isPlayable(card: Card, topCard: Card, currentColor: CardColor): boolean {
  if (card.type === 'wild' || card.type === 'wild4') return true
  if (card.color === currentColor) return true
  if (card.type === topCard.type) return true
  return false
}

export function getNextPlayerIndex(
  state: Pick<GameState, 'currentPlayerIndex' | 'playerOrder' | 'direction'>
): number {
  const len = state.playerOrder.length
  return ((state.currentPlayerIndex + state.direction) + len) % len
}

export function applyPlayCard(
  state: GameState,
  playerId: string,
  card: Card,
  chosenColor?: CardColor
): GameState {
  const newState = deepClone(state)
  const hand = newState.hands[playerId]

  // Remove card from hand
  newState.hands[playerId] = hand.filter(c => c.id !== card.id)

  // Add to discard pile
  newState.discardPile.push(card)

  // Set current color
  newState.currentColor = (card.type === 'wild' || card.type === 'wild4')
    ? (chosenColor ?? 'red')
    : card.color

  // Check win
  if (newState.hands[playerId].length === 0) {
    newState.winner = playerId
    newState.status = 'finished'
    newState.lastAction = `${newState.players[playerId].name} wins!`
    return newState
  }

  const playerCount = newState.playerOrder.length

  switch (card.type) {
    case 'skip': {
      // Skip next player
      const skipped = getNextPlayerIndex(newState)
      newState.currentPlayerIndex = ((skipped + newState.direction) + playerCount) % playerCount
      newState.lastAction = `${newState.players[playerId].name} played Skip!`
      break
    }

    case 'reverse': {
      newState.direction = (newState.direction * -1) as 1 | -1
      if (playerCount === 2) {
        // In 2-player, reverse acts like skip
        newState.currentPlayerIndex = getNextPlayerIndex(newState)
      } else {
        newState.currentPlayerIndex = getNextPlayerIndex(newState)
      }
      newState.lastAction = `${newState.players[playerId].name} played Reverse!`
      break
    }

    case 'draw2': {
      const nextIdx = getNextPlayerIndex(newState)
      const nextId = newState.playerOrder[nextIdx]
      const { drawn, remaining } = ensureDeck(newState, 2)
      newState.deck = remaining
      newState.hands[nextId] = [...newState.hands[nextId], ...drawn]
      // Skip next player
      newState.currentPlayerIndex = ((nextIdx + newState.direction) + playerCount) % playerCount
      newState.lastAction = `${newState.players[playerId].name} played Draw Two!`
      break
    }

    case 'wild4': {
      const nextIdx = getNextPlayerIndex(newState)
      const nextId = newState.playerOrder[nextIdx]
      const { drawn, remaining } = ensureDeck(newState, 4)
      newState.deck = remaining
      newState.hands[nextId] = [...newState.hands[nextId], ...drawn]
      // Skip next player
      newState.currentPlayerIndex = ((nextIdx + newState.direction) + playerCount) % playerCount
      newState.lastAction = `${newState.players[playerId].name} played Wild Draw Four!`
      break
    }

    case 'wild': {
      newState.currentPlayerIndex = getNextPlayerIndex(newState)
      newState.lastAction = `${newState.players[playerId].name} played Wild!`
      break
    }

    default: {
      newState.currentPlayerIndex = getNextPlayerIndex(newState)
      newState.lastAction = `${newState.players[playerId].name} played ${card.color} ${card.type}`
      break
    }
  }

  return newState
}

export function applyDrawCard(state: GameState, playerId: string): GameState {
  const newState = deepClone(state)
  const { drawn, remaining } = ensureDeck(newState, 1)
  newState.deck = remaining
  newState.hands[playerId] = [...newState.hands[playerId], ...drawn]
  newState.currentPlayerIndex = getNextPlayerIndex(newState)
  newState.lastAction = `${newState.players[playerId].name} drew a card`
  return newState
}

function ensureDeck(
  state: GameState,
  need: number
): { drawn: Card[]; remaining: Card[] } {
  let deck = [...state.deck]

  if (deck.length < need) {
    const { deck: reshuffled } = reshuffleDeck(state.discardPile)
    deck = [...deck, ...reshuffled]
    state.discardPile = [state.discardPile[state.discardPile.length - 1]]
  }

  return drawCards(deck, need)
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
