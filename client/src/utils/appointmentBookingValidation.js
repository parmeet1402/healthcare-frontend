const BUSINESS_START = 9 * 60;
const BUSINESS_END = 17 * 60;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isWithinBusinessHours(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return false;
  const m = TIME_RE.exec(timeStr.trim());
  if (!m) return false;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  const total = hours * 60 + minutes;
  return total >= BUSINESS_START && total <= BUSINESS_END;
}

export function validateAppointmentBooking(formData, now = new Date()) {
  const errors = {
    doctor: undefined,
    appointmentDate: undefined,
    appointmentTime: undefined,
    reason: undefined,
  };

  if (!formData.doctor?.trim()) {
    errors.doctor = 'Please select a doctor';
  }

  const reasonTrim = (formData.reason ?? '').trim();
  if (reasonTrim.length < 10) {
    errors.reason = 'Reason must be at least 10 characters';
  }

  const dateStr = formData.appointmentDate?.trim() ?? '';
  const timeStr = formData.appointmentTime?.trim() ?? '';

  if (!dateStr) {
    errors.appointmentDate = 'Date is required';
  }
  if (!timeStr) {
    errors.appointmentTime = 'Time is required';
  }

  if (timeStr && !isWithinBusinessHours(timeStr)) {
    errors.appointmentTime = 'Time must be between 9:00 AM and 5:00 PM';
  }

  if (dateStr && timeStr && isWithinBusinessHours(timeStr)) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
      errors.appointmentDate = 'Invalid date';
    } else {
      const [y, mo, d] = parts;
      const [hh, mm] = timeStr.split(':').map(Number);
      const slot = new Date(y, mo - 1, d, hh, mm, 0, 0);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const slotDay = new Date(y, mo - 1, d);

      if (slot.getTime() <= now.getTime()) {
        if (slotDay < startOfToday) {
          errors.appointmentDate = 'Date must be in the future';
        } else {
          errors.appointmentTime = 'Choose a time in the future';
        }
      }
    }
  }

  const isValid = Object.values(errors).every((e) => e === undefined);
  return { errors, isValid };
}
