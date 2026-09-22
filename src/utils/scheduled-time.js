function resolveScheduledFor({ scheduledFor, day, time }) {
  return scheduledFor ? new Date(scheduledFor) : new Date(`${day}T${time}:00`);
}

module.exports = { resolveScheduledFor };
