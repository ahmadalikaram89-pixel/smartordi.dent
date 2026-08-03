export function Table({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-card overflow-hidden ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function THead({ children }) {
  return <thead className="bg-gray-50 text-gray-500 text-left">{children}</thead>
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>
}

export function TR({ children, className = '', ...props }) {
  return (
    <tr className={`hover:bg-gray-50 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  )
}

export function TH({ children, className = '' }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>
}

export function TD({ children, className = '', ...props }) {
  return (
    <td className={`px-4 py-3 text-gray-600 ${className}`} {...props}>
      {children}
    </td>
  )
}
