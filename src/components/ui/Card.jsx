export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white rounded-xl shadow-card ${className}`} {...props}>
      {children}
    </div>
  )
}
