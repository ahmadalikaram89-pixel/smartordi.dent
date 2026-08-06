import { getToothType } from './toothTypes'

const CROWN_PATHS = {
  incisor: 'M10,34 L22,34 L24,72 Q24,84 16,84 Q8,84 8,72 Z',
  canine: 'M9,34 L23,34 L21,68 Q16,84 11,68 Z',
  premolar: 'M7,34 L25,34 L24,64 Q22,78 18,74 Q16,72 14,74 Q10,78 8,64 Z',
  molar: 'M4,34 L28,34 L27,60 Q26,76 21,74 Q18,72 16,76 Q14,72 11,74 Q6,76 5,60 Z',
}

const ROOT_PATHS = {
  incisor: 'M12,34 L20,34 L17,6 Q16,2 15,6 Z',
  canine: 'M11,34 L21,34 L17,4 Q16,0 15,4 Z',
  premolar: 'M10,34 L22,34 L18,8 L16,4 L14,8 Z',
  molar: 'M6,34 L14,34 L13,10 Q12,4 10,10 Z M18,34 L26,34 L22,10 Q20,4 19,10 Z',
}

const CONDITION_FILL = {
  gesund: '#ffffff',
  karies: '#fca5a5',
  gefuellt: '#93c5fd',
  krone: '#fcd34d',
  fehlt: null,
}

export default function ToothShape({
  toothNumber,
  arch,
  condition = 'gesund',
  hasBleeding = false,
  mobility = 0,
  selected = false,
  onClick,
}) {
  const type = getToothType(toothNumber)
  const isMissing = condition === 'fehlt'
  const crownFill = CONDITION_FILL[condition] ?? '#ffffff'
  const flip = arch === 'lower'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center rounded-lg transition ${
        selected ? 'bg-primary-50 ring-2 ring-primary-500' : 'hover:bg-gray-50'
      }`}
    >
      <svg viewBox="0 0 32 84" width="30" height="78" className={flip ? '-scale-y-100' : ''}>
        {isMissing ? (
          <rect x="6" y="2" width="20" height="80" rx="4" fill="#e5e7eb" stroke="#d1d5db" />
        ) : (
          <>
            <path d={ROOT_PATHS[type]} fill="#faf9f6" stroke="#c9c4ba" strokeWidth="1" />
            <path
              d={CROWN_PATHS[type]}
              fill={crownFill}
              stroke="#9ca3af"
              strokeWidth="1.2"
            />
          </>
        )}
      </svg>
      {hasBleeding && (
        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-danger-600" />
      )}
      {mobility > 0 && (
        <span className="absolute bottom-6 left-0 text-[9px] font-bold text-warning-600">
          {mobility}
        </span>
      )}
      <span className="text-[10px] text-gray-500 mt-0.5">{toothNumber}</span>
    </button>
  )
}
