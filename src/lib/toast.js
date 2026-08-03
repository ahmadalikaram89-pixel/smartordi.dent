import toast, { Toaster } from 'react-hot-toast'

export { Toaster }

const options = {
  style: {
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
  },
}

export default {
  success: (message) => toast.success(message, options),
  error: (message) => toast.error(message, options),
  info: (message) => toast(message, options),
}
