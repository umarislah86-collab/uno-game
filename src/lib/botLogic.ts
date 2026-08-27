import type { Card, CardColor, GameMode, GameState } from './types'
import type { Player } from './types'
import { isPlayable, applyDrawCard, applyPassMultiPlay, applyPlayCard } from './gameLogic'
import { createDeck, dealHands } from './deck'

export type BotDifficulty = 'easy' | 'medium' | 'hard'

const BOT_NAMES = ['Azri Bot', 'Nani Bot', 'Faiz Bot']

function cardPriority(card: Card): number {
  if (card.type === 'wild4') return 5
  if (card.type === 'wild') return 4
  if (card.type === 'draw2') return 3
  if (card.type === 'skip' || card.type === 'reverse') return 2
  return 1
}

function bestColor(hand: Card[]): CardColor {
  const counts: Partial<Record<CardColor, number>> = {}
  for (const c of hand) {
    if (c.color !== 'wild') counts[c.color] = (counts[c.color] ?? 0) + 1
  }
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow']
  return colors.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0] ?? 'red'
}

function chooseCard(playable: Card[], difficulty: BotDifficulty): Card {
  if (difficulty === 'easy') return playable[Math.floor(Math.random() * playable.length)]
  return playable.slice().sort((a, b) => cardPriority(b) - cardPriority(a))[0]
}

function chooseColor(hand: Card[], difficulty: BotDifficulty): CardColor {
  if (difficulty === 'easy') {
    const colors: CardColor[] = ['red', 'blue', 'green', 'yellow']
    return colors[Math.floor(Math.random() * colors.length)]
  }
  return bestColor(hand)
}

export function createBotGameState(
  humanId: string,
  humanName: string,
  botCount: number,
  gameMode: GameMode
): GameState {
  const botIds = Array.from({ length: botCount }, (_, i) => `bot${i + 1}`)
  const players: Record<string, Player> = {
    [humanId]: { id: humanId, name: humanName, isConnected: true },
    ...Object.fromEntries(
      botIds.map((id, i) => [id, { id, name: BOT_NAMES[i], isConnected: true }])
    ),
  }
  const playerOrder = [humanId, ...botIds]
  const deck = createDeck()
  const { hands, remaining } = dealHands(deck, playerOrder)

  // Pick first discard card — skip wilds
  let firstIdx = remaining.findIndex(c => c.type !== 'wild' && c.type !== 'wild4')
  if (firstIdx < 0) firstIdx = 0
  const topCard = remaining[firstIdx]
  const deckRemaining = remaining.filter((_, i) => i !== firstIdx)

  return {
    id: 'local',
    status: 'playing',
    hostId: humanId,
    players,
    playerOrder,
    currentPlayerIndex: 0,
    direction: 1,
    deck: deckRemaining,
    discardPile: [topCard],
    hands,
    currentColor: topCard.color === 'wild' ? 'red' : topCard.color,
    pendingDraw: 0,
    winner: null,
    lastAction: 'Game dimulakan!',
    gameMode,
    pendingStack: 0,
    unoPendingCall: null,
    wild4Challenge: null,
    multiPlayType: null,
    mamakDrawPhase: null,
  }
}

export function runBotTurn(state: GameState, botId: string, difficulty: BotDifficulty): GameState {
  const hand = state.hands[botId]
  if (!hand || state.status !== 'playing') return state

  const topCard = state.discardPile[state.discardPile.length - 1]
  const isMamak = state.gameMode === 'mamak'

  // Mamak draw phase: play if possible, else draw another card
  if (isMamak && state.mamakDrawPhase === botId) {
    const playable = hand.filter(c => isPlayable(c, topCard, state.currentColor, 0, 'mamak', null))
    if (playable.length > 0) {
      const chosen = chooseCard(playable, difficulty)
      const color = (chosen.type === 'wild' || chosen.type === 'wild4') ? chooseColor(hand, difficulty) : undefined
      return applyPlayCard(state, botId, chosen, color)
    }
    return applyDrawCard(state, botId)
  }

  // Multi-play: decide whether to continue or pass
  if (isMamak && state.multiPlayType && state.playerOrder[state.currentPlayerIndex] === botId) {
    const playable = hand.filter(c =>
      isPlayable(c, topCard, state.currentColor, 0, 'mamak', state.multiPlayType)
    )
    const continuePlay =
      playable.length > 0 &&
      (difficulty === 'hard'
        ? true
        : difficulty === 'medium'
          ? Math.random() > 0.25
          : Math.random() > 0.5)
    if (continuePlay) {
      const chosen = chooseCard(playable, difficulty)
      const color = (chosen.type === 'wild' || chosen.type === 'wild4') ? chooseColor(hand, difficulty) : undefined
      return applyPlayCard(state, botId, chosen, color)
    }
    return applyPassMultiPlay(state)
  }

  // Normal turn: play or draw
  const playable = hand.filter(c =>
    isPlayable(c, topCard, state.currentColor, state.pendingStack, state.gameMode, state.multiPlayType)
  )
  if (playable.length > 0) {
    const chosen = chooseCard(playable, difficulty)
    const color = (chosen.type === 'wild' || chosen.type === 'wild4') ? chooseColor(hand, difficulty) : undefined
    return applyPlayCard(state, botId, chosen, color)
  }
  return applyDrawCard(state, botId)
}
