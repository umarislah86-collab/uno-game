import { motion } from 'framer-motion'
import type { Card } from '../lib/types'
import CardSvg from './CardSvg'

interface DrawPileProps {
  count: number
  onDraw: () => void
  canDraw: boolean
}

const DUMMY_CARD: Card = { id: '__deck__', color: 'wild', type: 'wild' }

export default function DrawPile({ count, onDraw, canDraw }: DrawPileProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-white/50 text-xs uppercase tracking-wider">Deck ({count})</span>
      <motion.div
        whileHover={canDraw ? { scale: 1.08 } : {}}
        whileTap={canDraw ? { scale: 0.95 } : {}}
        className={canDraw ? 'cursor-pointer' : 'opacity-50'}
        onClick={canDraw ? onDraw : undefined}
      >
        {/* Stack effect */}
        <div className="relative">
          {[4, 3, 2, 1, 0].map(offset => (
            <div
              key={offset}
              className="absolute"
              style={{ top: -offset * 1.5, left: offset * 0.5 }}
            >
              <CardSvg card={DUMMY_CARD} faceDown />
            </div>
          ))}
          <div className="relative">
            <CardSvg card={DUMMY_CARD} faceDown />
          </div>
        </div>
      </motion.div>
      {canDraw && (
        <motion.span
          className="text-white/70 text-xs"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Tap to draw
        </motion.span>
      )}
    </div>
  )
}
