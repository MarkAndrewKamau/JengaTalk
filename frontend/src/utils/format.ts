export const formatCurrency = (amount: number, currency = 'KES') =>
  `${currency} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export const formatPhone = (phone: string) => {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('254')) return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`
  if (clean.startsWith('0')) return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`
  return phone
}

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export const truncate = (str: string, length: number) =>
  str.length > length ? `${str.slice(0, length)}…` : str

export const maskPhone = (phone: string) =>
  phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4)
