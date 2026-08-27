import type { Card, CardColor, CardType, GameMode, GameState } from './types'
import { drawCards, reshuffleDeck } from './deck'

export function isPlayable(
  card: Card,
  topCard: Card,
  currentColor: CardColor,
  pendingStack = 0,
  gameMode: GameMode = 'standard',
  multiPlayType: CardType | null = null
): boolean {
  // Multi-play active: only same-type cards allowed
  if (multiPlayType !== null) {
    return card.type === multiPlayType
  }
  // Mamak stacking: only draw cards playable when stack pending
  if (gameMode === 'mamak' && pendingStack > 0) {
    return card.type === 'draw2' || card.type === 'wild4'
  }
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
  const isMamak = newState.gameMode === 'mamak'

  // Check if attacker had a matching color card (for wild4 challenge)
  const attackerHadMatchingColor = isMamak && card.type === 'wild4'
    ? hand.filter(c => c.id !== card.id).some(c => c.color === state.currentColor)
    : false

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
    newState.unoPendingCall = null
    newState.pendingStack = 0
    newState.wild4Challenge = null
    newState.multiPlayType = null
    return newState
  }

  // UNO penalty tracking (mamak only)
  if (isMamak && newState.hands[playerId].length === 1) {
    newState.unoPendingCall = playerId
  } else {
    // If someone else is pending and a new card is played, clear the window
    if (newState.unoPendingCall !== playerId) {
      newState.unoPendingCall = null
    }
  }

  const playerCount = newState.playerOrder.length

  switch (card.type) {
    case 'skip': {
      const skipped = getNextPlayerIndex(newState)
      newState.currentPlayerIndex = ((skipped + newState.direction) + playerCount) % playerCount
      newState.lastAction = `${newState.players[playerId].name} played Skip!`
      break
    }

    case 'reverse': {
      newState.direction = (newState.direction * -1) as 1 | -1
      newState.currentPlayerIndex = getNextPlayerIndex(newState)
      newState.lastAction = `${newState.players[playerId].name} played Reverse!`
      break
    }

    case 'draw2': {
      if (isMamak) {
        // Stacking: add to pendingStack, next player must stack or draw all
        newState.pendingStack += 2
        newState.currentPlayerIndex = getNextPlayerIndex(newState)
        newState.lastAction = `${newState.players[playerId].name} stacked +2! (Total: +${newState.pendingStack})`
      } else {
        const nextIdx = getNextPlayerIndex(newState)
        const nextId = newState.playerOrder[nextIdx]
        const { drawn, remaining } = ensureDeck(newState, 2)
        newState.deck = remaining
        newState.hands[nextId] = [...newState.hands[nextId], ...drawn]
        newState.currentPlayerIndex = ((nextIdx + newState.direction) + playerCount) % playerCount
        newState.lastAction = `${newState.players[playerId].name} played Draw Two!`
      }
      break
    }

    case 'wild4': {
      if (isMamak) {
        const nextIdx = getNextPlayerIndex(newState)
        const nextId = newState.playerOrder[nextIdx]
        if (newState.pendingStack === 0) {
          // First draw card in chain: offer challenge, don't advance yet
          newState.pendingStack = 4
          newState.wild4Challenge = {
            attackerId: playerId,
            victimId: nextId,
            attackerHadMatchingColor,
          }
          newState.currentPlayerIndex = nextIdx
          newState.lastAction = `${newState.players[playerId].name} played Wild +4! Challenge?`
        } else {
          // Stacking on existing chain: no challenge
          newState.pendingStack += 4
          newState.currentPlayerIndex = nextIdx
          newState.lastAction = `${newState.players[playerId].name} stacked +4! (Total: +${newState.pendingStack})`
        }
      } else {
        const nextIdx = getNextPlayerIndex(newState)
        const nextId = newState.playerOrder[nextIdx]
        const { drawn, remaining } = ensureDeck(newState, 4)
        newState.deck = remaining
        newState.hands[nextId] = [...newState.hands[nextId], ...drawn]
        newState.currentPlayerIndex = ((nextIdx + newState.direction) + playerCount) % playerCount
        newState.lastAction = `${newState.players[playerId].name} played Wild Draw Four!`
      }
      break
    }

    case 'wild': {
      newState.currentPlayerIndex = getNextPlayerIndex(newState)
      newState.lastAction = `${newState.players[playerId].name} played Wild!`
      break
    }

    default: {
      if (isMamak) {
        // Multi-play: if player still has same-type cards, keep their turn
        const sameTypeLeft = newState.hands[playerId].filter(c => c.type === card.type)
        if (sameTypeLeft.length > 0) {
          newState.multiPlayType = card.type
          newState.lastAction = `${newState.players[playerId].name} played ${card.color} ${card.type} — ada lagi!`
          break
        }
      }
      newState.multiPlayType = null
      newState.currentPlayerIndex = getNextPlayerIndex(newState)
      newState.lastAction = `${newState.players[playerId].name} played ${card.color} ${card.type}`
      break
    }
  }

  return newState
}

export function applyDrawCard(state: GameState, playerId: string): GameState {
  const newState = deepClone(state)
  const isMamak = newState.gameMode === 'mamak'

  // Can't draw during multi-play (shouldn't happen, but guard anyway)
  newState.multiPlayType = null

  if (isMamak && newState.pendingStack > 0) {
    // Draw the full accumulated penalty
    const amount = newState.pendingStack
    const { drawn, remaining } = ensureDeck(newState, amount)
    newState.deck = remaining
    newState.hands[playerId] = [...newState.hands[playerId], ...drawn]
    newState.pendingStack = 0
    newState.currentPlayerIndex = getNextPlayerIndex(newState)
    newState.lastAction = `${newState.players[playerId].name} drew ${amount} cards!`
  } else {
    const { drawn, remaining } = ensureDeck(newState, 1)
    newState.deck = remaining
    newState.hands[playerId] = [...newState.hands[playerId], ...drawn]
    newState.currentPlayerIndex = getNextPlayerIndex(newState)
    newState.lastAction = `${newState.players[playerId].name} drew a card`
  }

  // Drawing clears UNO pending for others
  newState.unoPendingCall = null
  return newState
}

export function applyWild4Challenge(
  state: GameState,
  victimId: string,
  doChallenge: boolean
): GameState {
  const newState = deepClone(state)
  const challenge = newState.wild4Challenge
  if (!challenge) return newState

  const playerCount = newState.playerOrder.length

  if (doChallenge) {
    if (challenge.attackerHadMatchingColor) {
      // Challenge SUCCESS: attacker had a legal card — attacker draws 4
      const { drawn, remaining } = ensureDeck(newState, 4)
      newState.deck = remaining
      newState.hands[challenge.attackerId] = [...newState.hands[challenge.attackerId], ...drawn]
      newState.pendingStack = 0
      // Victim's turn continues (no draw, no skip)
      newState.lastAction = `Challenge berjaya! ${newState.players[challenge.attackerId].name} kena draw 4!`
    } else {
      // Challenge FAIL: victim draws pendingStack + 2 penalty
      const amount = newState.pendingStack + 2
      const { drawn, remaining } = ensureDeck(newState, amount)
      newState.deck = remaining
      newState.hands[victimId] = [...newState.hands[victimId], ...drawn]
      newState.pendingStack = 0
      newState.currentPlayerIndex = ((newState.currentPlayerIndex + newState.direction) + playerCount) % playerCount
      newState.lastAction = `Challenge gagal! ${newState.players[victimId].name} draw ${amount} kad!`
    }
  } else {
    // Accept: victim draws pendingStack
    const amount = newState.pendingStack
    const { drawn, remaining } = ensureDeck(newState, amount)
    newState.deck = remaining
    newState.hands[victimId] = [...newState.hands[victimId], ...drawn]
    newState.pendingStack = 0
    newState.currentPlayerIndex = ((newState.currentPlayerIndex + newState.direction) + playerCount) % playerCount
    newState.lastAction = `${newState.players[victimId].name} accepts +4, draw ${amount} kad.`
  }

  newState.wild4Challenge = null
  newState.unoPendingCall = null
  return newState
}

export function applyPassMultiPlay(state: GameState): GameState {
  const newState = deepClone(state)
  const playerId = newState.playerOrder[newState.currentPlayerIndex]
  newState.multiPlayType = null
  newState.currentPlayerIndex = getNextPlayerIndex(newState)
  newState.lastAction = `${newState.players[playerId].name} selesai main.`
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
