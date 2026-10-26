import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Loader2,
  Save,
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '../../api/appointments';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { DatePicker } from '../../components/ui/DatePicker';
import type { AppointmentDetail, AppointmentStatus } from '../../types';

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  quoted: 'bg-teal-100 text-teal-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-orange-100 text-orange-800',
};

const jobTypeColors: Record<string, string> = {
  measurement: 'bg-cyan-100 text-cyan-800',
  installation: 'bg-indigo-100 text-indigo-800',
  consultation: 'bg-pink-100 text-pink-800',
  repair: 'bg-lime-100 text-lime-800',
};

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<AppointmentDetail> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: appointmentRes, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.get(id!),
    enabled: !!id,
  });

  const appointment = appointmentRes?.data;

  // Debug logging
  useEffect(() => {
    if (appointmentRes) {
      console.log('Appointment Response:', appointmentRes);
      console.log('Appointment Data:', appointment);
      console.log('Customer Data:', appointment?.customer);
    }
    if (error) {
      console.error('Appointment Fetch Error:', error);
    }
  }, [appointmentRes, appointment, error]);

  // Initialize form when appointment loads
  const handleEditClick = () => {
    if (appointment) {
      setFormData({ ...appointment });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(null);
  };

  const handleInputChange = (
    field: string,
    value: string | number | null
  ) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    if (!appointment || !formData) return;

    setIsSaving(true);
    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        end_time: formData.end_time,
        job_type: formData.job_type,
        assigned_to: formData.assigned_to || undefined,
      };

      await appointmentsApi.update(appointment.id, updateData);
      showToast('Appointment updated successfully', 'success');
      setIsEditing(false);
      refetch();
    } catch (err: any) {
      showToast(
        err?.response?.data?.detail || 'Failed to update appointment',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;

    try {
      await appointmentsApi.delete(appointment.id);
      showToast('Appointment deleted successfully', 'success');
      navigate('/appointments');
    } catch (err: any) {
      showToast(
        err?.response?.data?.detail || 'Failed to delete appointment',
        'error'
      );
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/appointments')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Appointments
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-800">Failed to load appointment details</p>
          </div>
        </div>
      </div>
    );
  }

  const displayData = formData || appointment;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/appointments')}
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <div className="flex gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={handleEditClick}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Status and Job Type */}
            <div className="flex gap-3 mb-6">
              <span
                className={`px-4 py-2 rounded-full font-medium text-sm ${
                  statusColors[displayData.status as AppointmentStatus]
                }`}
              >
                {displayData.status.charAt(0).toUpperCase() +
                  displayData.status.slice(1)}
              </span>
              <span
                className={`px-4 py-2 rounded-full font-medium text-sm ${
                  jobTypeColors[displayData.job_type] ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {displayData.job_type.charAt(0).toUpperCase() +
                  displayData.job_type.slice(1)}
              </span>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={displayData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <h2 className="text-3xl font-bold text-gray-900">
                  {displayData.title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={displayData.description || ''}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              ) : (
                <p className="text-gray-600">
                  {displayData.description || 'No description'}
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date
                </label>
                {isEditing ? (
                  <DatePicker
                    value={displayData.appointment_date || ''}
                    onChange={(event) =>
                      handleInputChange('appointment_date', event.target.value)
                    }
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">
                    {new Date(displayData.appointment_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  Time
                </label>
                {isEditing ? (
                  <input
                    type="time"
                    value={displayData.appointment_time || ''}
                    onChange={(e) =>
                      handleInputChange('appointment_time', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">
                    {displayData.appointment_time}
                  </p>
                )}
              </div>
            </div>

            {/* End Time */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              {isEditing ? (
                <input
                  type="time"
                  value={displayData.end_time || ''}
                  onChange={(e) =>
                    handleInputChange('end_time', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 font-medium">
                  {displayData.end_time}
                </p>
              )}
            </div>

            {/* Job Type Selection (Edit mode) */}
            {isEditing && (
              <div className="mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Job Type
                </label>
                <select
                  value={displayData.job_type || 'consultation'}
                  onChange={(e) =>
                    handleInputChange('job_type', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="measurement">Measurement</option>
                  <option value="installation">Installation</option>
                  <option value="consultation">Consultation</option>
                  <option value="repair">Repair</option>
                </select>
              </div>
            )}

            {/* Status Selection (Edit mode) */}
            {isEditing && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={displayData.status || 'scheduled'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="quoted">Quoted</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {/* Location */}
            {appointment.location && (
              <div className="border-t pt-6">
                <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-gray-900 font-medium">
                      {appointment.location.full_address}
                    </p>
                  </div>
                  {appointment.location.building_name && (
                    <div>
                      <p className="text-sm text-gray-600">Building</p>
                      <p className="text-gray-900">
                        {appointment.location.building_name}
                      </p>
                    </div>
                  )}
                  {appointment.location.unit_number && (
                    <div>
                      <p className="text-sm text-gray-600">Unit</p>
                      <p className="text-gray-900">
                        {appointment.location.unit_number}
                      </p>
                    </div>
                  )}
                  {appointment.location.additional_instructions && (
                    <div>
                      <p className="text-sm text-gray-600">Instructions</p>
                      <p className="text-gray-900">
                        {appointment.location.additional_instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Customer & Assignee */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
              <User className="w-5 h-5 mr-2" />
              Customer
            </h3>
            {appointment.customer ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-gray-900 font-medium">
                    {appointment.customer.full_name || 'Unknown'}
                  </p>
                </div>
                {(appointment.customer.phone || appointment.customer.phone_number) && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a
                      href={`tel:${appointment.customer.phone || appointment.customer.phone_number}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {appointment.customer.phone || appointment.customer.phone_number}
                    </a>
                  </div>
                )}
                {appointment.customer.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a
                      href={`mailto:${appointment.customer.email}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {appointment.customer.email}
                    </a>
                  </div>
                )}
                {appointment.customer.company_name && (
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="text-gray-900">
                      {appointment.customer.company_name}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No customer information available</p>
            )}
          </div>

          {/* Assignee Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assigned To
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Salesman</p>
                <p className="text-gray-900 font-medium">
                  {displayData.assigned_to_name || 'Unassigned'}
                </p>
              </div>
              {displayData.assigned_to_username && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-600 text-sm">
                    {displayData.assigned_to_username}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Created</p>
                <p className="text-gray-900">
                  {new Date(appointment.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Last Updated</p>
                <p className="text-gray-900">
                  {new Date(appointment.updated_at).toLocaleString()}
                </p>
              </div>
              {appointment.created_by_name && (
                <div>
                  <p className="text-gray-600">Created By</p>
                  <p className="text-gray-900">{appointment.created_by_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Appointment"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this appointment? This action cannot
            be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
