import api from './api';

export const getAppointmentPatientId = (appointment) => {
  const patient = appointment?.patient;
  if (patient == null) return null;
  return typeof patient === 'object' && patient._id != null ? String(patient._id) : String(patient);
};

export const filterAppointmentsByPatient = (appointments, patientId) => {
  if (patientId == null) return [];
  const pid = String(patientId);
  return appointments.filter((appointment) => getAppointmentPatientId(appointment) === pid);
};

export const countUpcomingAppointments = (appointments) => {
  const now = new Date();
  return appointments.filter(
    (appointment) =>
      ['pending', 'confirmed'].includes(appointment.status) &&
      new Date(appointment.appointmentDate) >= now
  ).length;
};

export const appointmentService = {
  create: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/appointments');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  update: async (id, appointmentData) => {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },
};

