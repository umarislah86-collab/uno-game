import { v4 as uuidv4 } from 'uuid'
import type { Card, CardColor, CardType } from './types'

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow']
const NUMBERS: CardType[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const ACTIONS: CardType[] = ['skip', 'reverse', 'draw2']

export function createDeck(): Card[] {
  const cards: Card[] = []

  for (const color of COLORS) {
    // One '0' per color
    cards.push({ id: uuidv4(), color, type: '0' })

    // Two of each 1-9 and action per color
    for (const type of [...NUMBERS.slice(1), ...ACTIONS]) {
      cards.push({ id: uuidv4(), color, type })
      cards.push({ id: uuidv4(), color, type })
    }
  }

  // 4 wild + 4 wild draw four
  for (let i = 0; i < 4; i++) {
    cards.push({ id: uuidv4(), color: 'wild', type: 'wild' })
    cards.push({ id: uuidv4(), color: 'wild', type: 'wild4' })
  }

  return shuffle(cards)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function dealHands(
  deck: Card[],
  playerIds: string[],
  cardsEach = 7
): { hands: Record<string, Card[]>; remaining: Card[] } {
  const remaining = [...deck]
  const hands: Record<string, Card[]> = {}

  for (const id of playerIds) {
    hands[id] = remaining.splice(0, cardsEach)
  }

  return { hands, remaining }
}

export function drawCards(deck: Card[], count: number): { drawn: Card[]; remaining: Card[] } {
  const remaining = [...deck]
  const drawn = remaining.splice(0, count)
  return { drawn, remaining }
}

// Reshuffle discard pile back into deck when deck is empty
export function reshuffleDeck(discardPile: Card[]): { deck: Card[]; topCard: Card } {
  const topCard = discardPile[discardPile.length - 1]
  const rest = discardPile.slice(0, -1)
  return { deck: shuffle(rest), topCard }
}
