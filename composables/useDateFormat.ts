export function useDateFormat() {
  function parseLocalDate(iso: string): Date {
    return new Date(iso + 'T00:00:00')
  }

  function getToday(): Date {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }

  function getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return s[(v - 20) % 10] ?? s[v] ?? s[0]
  }

  function formatDueDate(iso: string | null | undefined): string | null {
    if (!iso) return null
    const date = parseLocalDate(iso)
    const today = getToday()
    const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'

    const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' })
    const day = date.getDate()
    const month = date.toLocaleDateString('en-GB', { month: 'long' })
    return `${dayName} ${day}${getOrdinal(day)} ${month}`
  }

  function isPastDue(iso: string): boolean {
    return parseLocalDate(iso).getTime() < getToday().getTime()
  }

  return { formatDueDate, isPastDue }
}
