import { useEffect, useMemo, useState } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Label } from '../../components/Label';
import { format } from 'date-fns';
import { Calendar, Clock, User, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { validateAppointmentBooking } from '../../utils/appointmentBookingValidation';

export const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    symptoms: '',
  });
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    doctor: false,
    appointmentDate: false,
    appointmentTime: false,
    reason: false,
  });
  const { errors: fieldErrors, isValid: formIsValid } = useMemo(
    () => validateAppointmentBooking(formData),
    [formData]
  );

  const todayMin = format(new Date(), 'yyyy-MM-dd');

  const visibleFieldError = (field) => (touched[field] ? fieldErrors[field] : undefined);

  const markTouched = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!bookingSuccess) return undefined;
    const t = setTimeout(() => setBookingSuccess(null), 5000);
    return () => clearTimeout(t);
  }, [bookingSuccess]);

  const fetchAppointments = async () => {
    try {
      const { appointments: data } = await appointmentService.getAll();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { users } = await userService.getAll({ role: 'doctor' });
      setDoctors(users);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const resetBookingForm = () => {
    setFormData({
      doctor: '',
      appointmentDate: '',
      appointmentTime: '',
      reason: '',
      symptoms: '',
    });
    setBookingError(null);
    setTouched({
      doctor: false,
      appointmentDate: false,
      appointmentTime: false,
      reason: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formIsValid) return;
    setIsSubmitting(true);
    setBookingError(null);
    try {
      await appointmentService.create(formData);
      setShowForm(false);
      resetBookingForm();
      setBookingSuccess('Your appointment was booked successfully.');
      fetchAppointments();
    } catch (error) {
      setBookingError(error.response?.data?.message || 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentService.update(id, { status: 'cancelled' });
        fetchAppointments();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel appointment');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {bookingSuccess && (
        <div
          className="rounded-md border border-green-600 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100"
          role="status"
          aria-live="polite"
        >
          {bookingSuccess}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground mt-2">Manage your medical appointments</p>
        </div>
        <Button
          onClick={() => {
            setShowForm((open) => !open);
            if (!showForm) {
              setBookingSuccess(null);
              resetBookingForm();
            }
          }}
        >
          Book Appointment
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Book New Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {bookingError && (
                <div
                  className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-100"
                  role="alert"
                >
                  {bookingError}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctor">Doctor</Label>
                  <select
                    id="doctor"
                    aria-invalid={visibleFieldError('doctor') ? 'true' : 'false'}
                    aria-describedby={visibleFieldError('doctor') ? 'doctor-error' : undefined}
                    className={cn(
                      'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      visibleFieldError('doctor') ? 'border-red-500' : 'border-input'
                    )}
                    value={formData.doctor}
                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                    onBlur={markTouched('doctor')}
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name} {doctor.specialization && `- ${doctor.specialization}`}
                      </option>
                    ))}
                  </select>
                  {visibleFieldError('doctor') && (
                    <p id="doctor-error" className="text-sm text-red-600 dark:text-red-400">
                      {visibleFieldError('doctor')}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Date</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    aria-invalid={visibleFieldError('appointmentDate') ? 'true' : 'false'}
                    aria-describedby={visibleFieldError('appointmentDate') ? 'appointmentDate-error' : undefined}
                    className={visibleFieldError('appointmentDate') ? 'border-red-500' : undefined}
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    onBlur={markTouched('appointmentDate')}
                    min={todayMin}
                  />
                  {visibleFieldError('appointmentDate') && (
                    <p id="appointmentDate-error" className="text-sm text-red-600 dark:text-red-400">
                      {visibleFieldError('appointmentDate')}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">Time</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    aria-invalid={visibleFieldError('appointmentTime') ? 'true' : 'false'}
                    aria-describedby={visibleFieldError('appointmentTime') ? 'appointmentTime-error' : undefined}
                    className={visibleFieldError('appointmentTime') ? 'border-red-500' : undefined}
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    onBlur={markTouched('appointmentTime')}
                  />
                  {visibleFieldError('appointmentTime') && (
                    <p id="appointmentTime-error" className="text-sm text-red-600 dark:text-red-400">
                      {visibleFieldError('appointmentTime')}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    aria-invalid={visibleFieldError('reason') ? 'true' : 'false'}
                    aria-describedby={visibleFieldError('reason') ? 'reason-error' : undefined}
                    className={visibleFieldError('reason') ? 'border-red-500' : undefined}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    onBlur={markTouched('reason')}
                    placeholder="Brief reason for visit"
                  />
                  {visibleFieldError('reason') && (
                    <p id="reason-error" className="text-sm text-red-600 dark:text-red-400">
                      {visibleFieldError('reason')}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms (Optional)</Label>
                <textarea
                  id="symptoms"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Describe your symptoms..."
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={!formIsValid || isSubmitting}>
                  {isSubmitting ? 'Booking...' : 'Book Appointment'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetBookingForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No appointments found</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment._id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">
                        Dr. {appointment.doctor?.name}
                      </span>
                      {appointment.doctor?.specialization && (
                        <span className="text-sm text-muted-foreground">
                          - {appointment.doctor.specialization}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.appointmentTime}</span>
                      </div>
                    </div>
                    {appointment.reason && (
                      <p className="text-sm">{appointment.reason}</p>
                    )}
                    {appointment.symptoms && (
                      <p className="text-sm text-muted-foreground">
                        Symptoms: {appointment.symptoms}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(appointment._id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

