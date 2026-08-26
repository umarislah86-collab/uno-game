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
import type { Card, CardColor, GameState, Player } from './types'
import { createDeck, dealHands } from './deck'
import { applyDrawCard, applyPlayCard } from './gameLogic'

const gamesCol = collection(db, 'uno_games')

export function gameRef(id: string) {
  return doc(gamesCol, id)
}

export function subscribeGame(id: string, cb: (state: GameState | null) => void) {
  return onSnapshot(gameRef(id), snap => {
    cb(snap.exists() ? (snap.data() as GameState) : null)
  })
}

export async function createGame(roomId: string, hostId: string, hostName: string): Promise<void> {
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

  // First non-wild card for discard pile start
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
