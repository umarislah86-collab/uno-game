import {
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Card, CardColor, GameMode, GameState, Player } from './types'
import { createDeck, dealHands, drawCards, reshuffleDeck } from './deck'
import { applyDrawCard, applyPassDraw, applyPassMultiPlay, applyPlayCard, applyWild4Challenge } from './gameLogic'

const gamesCol = collection(db, 'uno_games')

export function gameRef(id: string) {
  return doc(gamesCol, id)
}

export function subscribeGame(id: string, cb: (state: GameState | null) => void) {
  return onSnapshot(gameRef(id), snap => {
    cb(snap.exists() ? (snap.data() as GameState) : null)
  })
}

export async function createGame(
  roomId: string,
  hostId: string,
  hostName: string,
  gameMode: GameMode = 'standard',
  timeLimitSecs: number | null = null
): Promise<void> {
  const player: Player = { id: hostId, name: hostName, isConnected: true }
  const state: GameState = {
    id: roomId,
    status: 'lobby',
    hostId,
    players: { [hostId]: player },
    playerOrder: [hostId],
    currentPlayerIndex: 0,
    direction: 1,
    deck: [],
    discardPile: [],
    hands: {},
    currentColor: 'red',
    pendingDraw: 0,
    winner: null,
    lastAction: null,
    gameMode,
    pendingStack: 0,
    unoPendingCall: null,
    wild4Challenge: null,
    multiPlayType: null,
    mamakDrawPhase: null,
    rankings: [],
    timeLimitSecs,
    startedAt: null,
  }
  await setDoc(gameRef(roomId), state)
}

export async function joinGame(roomId: string, playerId: string, playerName: string): Promise<boolean> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return false
  const state = snap.data() as GameState
  if (state.status !== 'lobby') return false
  if (Object.keys(state.players).length >= 6) return false

  await updateDoc(gameRef(roomId), {
    [`players.${playerId}`]: { id: playerId, name: playerName, isConnected: true },
    playerOrder: [...state.playerOrder, playerId],
  })
  return true
}

export async function startGame(roomId: string): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState

  const deck = createDeck()
  const { hands, remaining } = dealHands(deck, state.playerOrder)

  let startCardIdx = remaining.findIndex(c => c.color !== 'wild')
  if (startCardIdx === -1) startCardIdx = 0
  const [startCard] = remaining.splice(startCardIdx, 1)

  await updateDoc(gameRef(roomId), {
    status: 'playing',
    deck: remaining,
    discardPile: [startCard],
    hands,
    currentColor: startCard.color,
    currentPlayerIndex: 0,
    direction: 1,
    winner: null,
    lastAction: 'Game started!',
    pendingStack: 0,
    unoPendingCall: null,
    wild4Challenge: null,
    multiPlayType: null,
    mamakDrawPhase: null,
    rankings: [],
    startedAt: Date.now(),
  })
}

export async function playCard(
  roomId: string,
  playerId: string,
  card: Card,
  chosenColor?: CardColor
): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState
  const newState = applyPlayCard(state, playerId, card, chosenColor)
  await updateDoc(gameRef(roomId), newState as unknown as Record<string, unknown>)
}

export async function drawCard(roomId: string, playerId: string): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState
  const newState = applyDrawCard(state, playerId)
  await updateDoc(gameRef(roomId), newState as unknown as Record<string, unknown>)
}

export async function callUno(roomId: string, playerId: string): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState
  if (state.unoPendingCall === playerId) {
    await updateDoc(gameRef(roomId), { unoPendingCall: null })
  }
}

export async function catchUno(roomId: string, targetId: string): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState
  if (state.unoPendingCall !== targetId) return

  let deck = [...state.deck]
  let discardPile = [...state.discardPile]
  if (deck.length < 2) {
    const { deck: reshuffled, topCard } = reshuffleDeck(discardPile)
    deck = reshuffled
    discardPile = [topCard]
  }
  const { drawn, remaining } = drawCards(deck, 2)

  await updateDoc(gameRef(roomId), {
    [`hands.${targetId}`]: [...(state.hands[targetId] ?? []), ...drawn],
    deck: remaining,
    discardPile,
    unoPendingCall: null,
    lastAction: `${state.players[targetId]?.name} kena tangkap! Draw 2 penalty!`,
  })
}

export async function resolveWild4Challenge(
  roomId: string,
  victimId: string,
  doChallenge: boolean
): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState
  if (!state.wild4Challenge || state.wild4Challenge.victimId !== victimId) return
  const newState = applyWild4Challenge(state, victimId, doChallenge)
  await updateDoc(gameRef(roomId), newState as unknown as Record<string, unknown>)
}

export async function passMultiPlay(roomId: string, playerId: string): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState
  if (state.playerOrder[state.currentPlayerIndex] !== playerId) return
  if (!state.multiPlayType) return
  const newState = applyPassMultiPlay(state)
  await updateDoc(gameRef(roomId), newState as unknown as Record<string, unknown>)
}

export async function passDraw(roomId: string, playerId: string): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState
  if (state.playerOrder[state.currentPlayerIndex] !== playerId) return
  if (!state.mamakDrawPhase) return
  const newState = applyPassDraw(state)
  await updateDoc(gameRef(roomId), newState as unknown as Record<string, unknown>)
}

export async function reshuffleDraw(roomId: string): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState
  if (state.deck.length < 2) return
  const deck = [...state.deck]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  await updateDoc(gameRef(roomId), { deck, lastAction: '🔀 Deck dikocok semula!' })
}

export async function triggerTimeout(roomId: string): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState
  if (state.status !== 'playing') return

  // Sort active players by card count ascending (fewest cards wins)
  const sorted = [...state.playerOrder].sort(
    (a, b) => (state.hands[a]?.length ?? 0) - (state.hands[b]?.length ?? 0)
  )
  const winner = sorted[0]
  const rankings = [...sorted, ...(state.rankings ?? [])]

  await updateDoc(gameRef(roomId), {
    status: 'finished',
    winner,
    rankings,
    lastAction: '⏰ Masa tamat! Pemenang: kad paling sikit!',
  })
}

export async function leaveGame(roomId: string, playerId: string): Promise<void> {
  const snap = await getDoc(gameRef(roomId))
  if (!snap.exists()) return
  const state = snap.data() as GameState

  if (state.status === 'lobby') {
    const newOrder = state.playerOrder.filter(id => id !== playerId)
    await updateDoc(gameRef(roomId), {
      [`players.${playerId}`]: deleteField(),
      playerOrder: newOrder,
    })
  } else {
    await updateDoc(gameRef(roomId), {
      [`players.${playerId}.isConnected`]: false,
    })
  }
}
