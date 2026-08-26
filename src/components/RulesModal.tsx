import { motion, AnimatePresence } from 'framer-motion'

interface RulesModalProps {
  onClose: () => void
}

const COLOR_DOT: Record<string, string> = {
  red: '#E8192C',
  blue: '#0066CC',
  green: '#1AAB56',
  yellow: '#FFCC00',
}

const rules = [
  {
    title: 'Cara Main',
    items: [
      'Padankan warna ATAU jenis kad dengan kad atas timbunan buang.',
      'Jika tak ada kad yang boleh dimain, tarik 1 kad dari timbunan.',
      'Pemain pertama yang habis kad menang!',
    ],
  },
  {
    title: 'Kad Khas',
    cards: [
      { symbol: '⊘', label: 'Skip', desc: 'Pemain seterusnya hilang giliran.' },
      { symbol: '⇄', label: 'Reverse', desc: 'Tukar arah pusingan. (2 pemain = Skip)' },
      { symbol: '+2', label: 'Draw Two', desc: 'Pemain seterusnya tarik 2 kad & hilang giliran.' },
    ],
  },
  {
    title: 'Kad Wild',
    cards: [
      { symbol: 'W', label: 'Wild', desc: 'Pilih warna mana-mana. Boleh dimain bila-bila masa.' },
      { symbol: '+4', label: 'Wild Draw Four', desc: 'Pilih warna + pemain seterusnya tarik 4 kad & hilang giliran.' },
    ],
  },
  {
    title: 'UNO!',
    items: [
      'Tekan butang UNO! apabila tangan kau ada 2 kad dan giliran kau.',
      'Ini amaran kepada pemain lain bahawa kau hampir menang.',
    ],
  },
]

export default function RulesModal({ onClose }: RulesModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="rules-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="bg-[#16213e] border border-white/10 rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-white font-black text-2xl"
              style={{ fontFamily: 'Arial Black, sans-serif' }}
            >
              Peraturan UNO
            </h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white text-xl leading-none transition"
            >
              ✕
            </button>
          </div>

          {/* Color legend */}
          <div className="flex gap-2 mb-4">
            {Object.entries(COLOR_DOT).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-white/50 text-xs capitalize">{name}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {rules.map(section => (
              <div key={section.title}>
                <h3 className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">
                  {section.title}
                </h3>

                {section.items && (
                  <ul className="flex flex-col gap-1">
                    {section.items.map(item => (
                      <li key={item} className="text-white/70 text-sm flex gap-2">
                        <span className="text-white/30 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.cards && (
                  <div className="flex flex-col gap-2">
                    {section.cards.map(card => (
                      <div key={card.label} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-black text-xs shrink-0">
                          {card.symbol}
                        </div>
                        <div>
                          <span className="text-white text-sm font-bold">{card.label}</span>
                          <span className="text-white/50 text-xs block">{card.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Playable card rules summary */}
            <div>
              <h3 className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">
                Kad Yang Boleh Dimain
              </h3>
              <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1.5 text-sm text-white/70">
                <p>✅ Warna sama dengan kad atas</p>
                <p>✅ Jenis/nombor sama (contoh: Skip atas Skip)</p>
                <p>✅ Wild / Wild +4 — boleh dimain bila-bila masa</p>
                <p className="text-white/30 text-xs mt-1">Kad highlighted (menyala) = boleh dimain sekarang</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-5 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition text-sm"
          >
            Faham!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
