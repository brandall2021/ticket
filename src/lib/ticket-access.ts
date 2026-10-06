export function canManageTickets(role: string) {
  return role === "ADMIN" || role === "AGENT"
}

export function canReadTicket(user: { id: string; role: string }, ticket: { clienteId: string }) {
  return canManageTickets(user.role) || ticket.clienteId === user.id
}

export function ticketCommentFilter(role: string) {
  return canManageTickets(role) ? {} : { internal: false }
}

export function withoutPassword<T extends { password: string }>(record: T): Omit<T, "password"> {
  const { password: _password, ...safe } = record
  void _password
  return safe
}
