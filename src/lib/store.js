// Single data-persistence layer for Tripflow.
//
// Persistence rule (AGENTS.md, section 2): all reads/writes to storage go
// through this file. No component should call localStorage directly, and no
// component should know this is backed by localStorage — if the project ever
// migrates to a real backend, only this file needs to be rewritten.

const TRIPS_KEY = 'tripflow_trips'
const EXPENSES_KEY = 'tripflow_expenses'

function readAll(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(key, items) {
  localStorage.setItem(key, JSON.stringify(items))
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// --- Trips ---------------------------------------------------------------

export function getTrips() {
  return readAll(TRIPS_KEY)
}

export function getTrip(id) {
  return getTrips().find((trip) => trip.id === id) ?? null
}

export function saveTrip(trip) {
  const trips = getTrips()
  const record = trip.id ? trip : { ...trip, id: generateId() }
  const index = trips.findIndex((t) => t.id === record.id)

  if (index === -1) {
    trips.push(record)
  } else {
    trips[index] = record
  }

  writeAll(TRIPS_KEY, trips)
  return record
}

export function deleteTrip(id) {
  writeAll(TRIPS_KEY, getTrips().filter((trip) => trip.id !== id))
  writeAll(EXPENSES_KEY, getExpensesAll().filter((expense) => expense.trip_id !== id))
}

// --- Expenses --------------------------------------------------------------

function getExpensesAll() {
  return readAll(EXPENSES_KEY)
}

export function getExpenses(tripId) {
  return getExpensesAll()
    .filter((expense) => expense.trip_id === tripId)
    .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
}

export function saveExpense(expense) {
  const expenses = getExpensesAll()
  const record = expense.id ? expense : { ...expense, id: generateId() }
  const index = expenses.findIndex((e) => e.id === record.id)

  if (index === -1) {
    expenses.push(record)
  } else {
    expenses[index] = record
  }

  writeAll(EXPENSES_KEY, expenses)
  return record
}

export function deleteExpense(id) {
  writeAll(EXPENSES_KEY, getExpensesAll().filter((expense) => expense.id !== id))
}

