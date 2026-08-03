import { forwardRef } from 'react'

const baseClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400 transition'

const Select = forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <select ref={ref} className={`${baseClass} ${className}`} {...props}>
      {children}
    </select>
  )
})

export default Select
