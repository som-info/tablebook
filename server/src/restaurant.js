/** Restaurant configuration: opening hours, tables and booking rules. */
export const restaurant = {
  name: 'Ember & Olive',
  // 0 = Sunday … 6 = Saturday. Closed on Mondays.
  closedWeekdays: [1],
  services: [
    { name: 'Lunch', firstSeating: '12:00', lastSeating: '14:00' },
    { name: 'Dinner', firstSeating: '18:00', lastSeating: '21:30' },
  ],
  slotMinutes: 30,
  diningMinutes: 90,          // how long a table stays occupied
  maxPartySize: 8,
  maxDaysAhead: 60,
  minLeadMinutes: 60,         // same-day bookings need at least 1 hour notice
  tables: [
    { id: 'T1', seats: 2 }, { id: 'T2', seats: 2 }, { id: 'T3', seats: 2 }, { id: 'T4', seats: 2 },
    { id: 'T5', seats: 4 }, { id: 'T6', seats: 4 }, { id: 'T7', seats: 4 }, { id: 'T8', seats: 4 },
    { id: 'T9', seats: 6 }, { id: 'T10', seats: 6 },
    { id: 'T11', seats: 8 },
  ],
};
