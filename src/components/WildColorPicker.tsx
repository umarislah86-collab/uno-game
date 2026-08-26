import { motion } from 'framer-motion'
import type { CardColor } from '../lib/types'

interface WildColorPickerProps {
  onPick: (color: CardColor) => void
}

const COLORS: { color: CardColor; bg: string; label: string }[] = [
  { color: 'red', bg: '#E8192C', label: 'Red' },
  { color: 'blue', bg: '#0066CC', label: 'Blue' },
  { color: 'green', bg: '#1AAB56', label: 'Green' },
  { color: 'yellow', bg: '#FFCC00', label: 'Yellow' },
]

export default function WildColorPicker({ onPick }: WildColorPickerProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-gray-900 rounded-2xl p-6 shadow-2xl"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <h2 className="text-white text-xl font-bold text-center mb-5">Choose a color</h2>
        <div className="grid grid-cols-2 gap-4">
          {COLORS.map(({ color, bg, label }) => (
            <motion.button
              key={color}
              onClick={() => onPick(color)}
              className="w-24 h-24 rounded-xl font-bold text-white text-lg shadow-lg border-4 border-white/20"
              style={{ background: bg }}
              whileHover={{ scale: 1.1, borderColor: 'rgba(255,255,255,0.8)' }}
              whileTap={{ scale: 0.95 }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
