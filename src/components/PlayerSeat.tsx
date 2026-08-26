import { motion } from 'framer-motion'
import type { Card } from '../lib/types'
import CardSvg from './CardSvg'

interface PlayerSeatProps {
  name: string
  cardCount: number
  isCurrentTurn: boolean
  isMe: boolean
  isConnected: boolean
}

const DUMMY_CARD: Card = { id: '__back__', color: 'wild', type: 'wild' }

export default function PlayerSeat({ name, cardCount, isCurrentTurn, isMe, isConnected }: PlayerSeatProps) {
  return (
    <motion.div
      className={[
        'flex flex-col items-center gap-2 px-3 py-2 rounded-xl',
        isCurrentTurn ? 'bg-white/15 ring-2 ring-yellow-400' : 'bg-white/5',
        !isConnected ? 'opacity-40' : '',
      ].join(' ')}
      animate={isCurrentTurn ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1.5 }}
    >
      {/* Fan of face-down cards */}
      <div className="flex items-end" style={{ height: 48 }}>
        {Array.from({ length: Math.min(cardCount, 7) }).map((_, i, arr) => {
          const angle = (i - (arr.length - 1) / 2) * 8
          return (
            <div
              key={i}
              className="-mx-1"
              style={{ transform: `rotate(${angle}deg) translateY(${Math.abs(angle) * 0.3}px)` }}
            >
              <CardSvg card={DUMMY_CARD} faceDown small />
            </div>
          )
        })}
      </div>

      {/* Name + card count */}
      <div className="text-center">
        <p className={['text-sm font-bold', isMe ? 'text-yellow-300' : 'text-white'].join(' ')}>
          {name} {isMe ? '(You)' : ''}
        </p>
        <p className="text-white/60 text-xs">{cardCount} cards</p>
      </div>

      {/* Turn indicator */}
      {isCurrentTurn && (
        <motion.div
          className="text-yellow-400 text-xs font-bold"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          ▶ TURN
        </motion.div>
      )}
    </motion.div>
  )
}
