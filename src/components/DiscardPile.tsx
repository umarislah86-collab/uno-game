import { AnimatePresence, motion } from 'framer-motion'
import type { Card } from '../lib/types'
import CardSvg from './CardSvg'

interface DiscardPileProps {
  topCard: Card | null
}

export default function DiscardPile({ topCard }: DiscardPileProps) {
  // Deterministic small rotation per card so the pile looks natural
  const rotation = topCard
    ? ((topCard.id.charCodeAt(0) + topCard.id.charCodeAt(1)) % 22) - 11
    : 0

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-white/50 text-xs uppercase tracking-wider">Discard</span>
      <div className="w-[70px] h-[100px] rounded-lg border-2 border-white/20 flex items-center justify-center overflow-visible relative">
        <AnimatePresence mode="popLayout">
          {topCard ? (
            <motion.div
              key={topCard.id}
              initial={{ y: -60, scale: 1.2, rotate: rotation + 20, opacity: 0.7 }}
              animate={{ y: 0, scale: 1, rotate: rotation, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              style={{ position: 'absolute' }}
            >
              <CardSvg card={topCard} />
            </motion.div>
          ) : (
            <span className="text-white/30 text-sm">Empty</span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
