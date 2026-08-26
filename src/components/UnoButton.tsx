import { motion } from 'framer-motion'

interface UnoButtonProps {
  onUno: () => void
  canCallUno: boolean
}

export default function UnoButton({ onUno, canCallUno }: UnoButtonProps) {
  return (
    <motion.button
      onClick={canCallUno ? onUno : undefined}
      disabled={!canCallUno}
      className={[
        'font-black text-2xl rounded-full px-8 py-3 shadow-lg border-4 select-none',
        canCallUno
          ? 'bg-red-600 border-red-300 text-white cursor-pointer'
          : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed opacity-50',
      ].join(' ')}
      animate={canCallUno ? {
        scale: [1, 1.08, 1],
        boxShadow: [
          '0 0 0px rgba(239,68,68,0)',
          '0 0 24px rgba(239,68,68,0.8)',
          '0 0 0px rgba(239,68,68,0)',
        ],
      } : {}}
      transition={{ repeat: Infinity, duration: 0.9 }}
      whileTap={canCallUno ? { scale: 0.9 } : {}}
      style={{ fontFamily: 'Arial Black, sans-serif' }}
    >
      UNO!
    </motion.button>
  )
}
