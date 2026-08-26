import { motion } from 'framer-motion'
import type { Card } from '../lib/types'
import CardSvg from './CardSvg'

interface DiscardPileProps {
  topCard: Card | null
}

export default function DiscardPile({ topCard }: DiscardPileProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-white/50 text-xs uppercase tracking-wider">Discard</span>
      <div className="w-[70px] h-[100px] rounded-lg border-2 border-white/20 flex items-center justify-center">
        {topCard ? (
          <motion.div
            key={topCard.id}
            initial={{ rotateY: 90, scale: 0.8 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            <CardSvg card={topCard} />
          </motion.div>
        ) : (
          <span className="text-white/30 text-sm">Empty</span>
        )}
      </div>
    </div>
  )
}
