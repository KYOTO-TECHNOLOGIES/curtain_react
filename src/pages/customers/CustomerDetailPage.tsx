import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Loader2,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../api/customers';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import type { Customer, UpdateCustomerRequest } from '../../types';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: customerRes, isLoading, error, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(Number(id)),
    enabled: !!id,
  });

  // Log for debugging
  useEffect(() => {
    if (customerRes) {
      console.log('Customer Response:', customerRes);
      console.log('Customer Data:', customerRes.data);
    }
    if (error) {
      console.error('Customer Fetch Error:', error);
    }
  }, [customerRes, error]);

  const customer = customerRes?.data;

  const handleEditClick = () => {
    if (customer) {
      setFormData({ ...customer });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    if (!customer || !formData) return;

    setIsSaving(true);
    try {
      const updateData: UpdateCustomerRequest = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        company_name: formData.company_name,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        notes: formData.notes,
      };

      await customersApi.update(customer.id, updateData);
      showToast('Customer updated successfully', 'success');
      setIsEditing(false);
      refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update customer', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    try {
      await customersApi.delete(customer.id);
      showToast('Customer deleted successfully', 'success');
      navigate('/customers');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete customer', 'error');
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

  if (error || !customer) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Customers
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-red-800 font-semibold">Failed to load customer details</p>
              {error && (
                <p className="text-red-700 text-sm mt-1">
                  {(error as any)?.message || 'Unknown error'}
                </p>
              )}
              {!error && !customer && (
                <p className="text-red-700 text-sm mt-1">Customer data not available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayData = formData || customer;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/customers')}
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
            {/* Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">First Name</label>
                    <input
                      type="text"
                      value={displayData.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={displayData.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <h2 className="text-3xl font-bold text-gray-900">
                  {customer.full_name}
                </h2>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={displayData.phone_number || ''}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <a
                    href={`tel:${customer.phone_number}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {customer.phone_number}
                  </a>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={displayData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {customer.email}
                  </a>
                )}
              </div>
            </div>

            {/* Company */}
            {(displayData.company_name || isEditing) && (
              <div className="mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 mr-2" />
                  Company
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={displayData.company_name || ''}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{displayData.company_name}</p>
                )}
              </div>
            )}

            {/* Address */}
            <div className="border-t pt-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.address_line_1 || ''}
                      onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{displayData.address_line_1 || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.address_line_2 || ''}
                      onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{displayData.address_line_2 || 'N/A'}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{displayData.city || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{displayData.country || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-6 mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              {isEditing ? (
                <textarea
                  value={displayData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              ) : (
                <p className="text-gray-600">{displayData.notes || 'No notes'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <User className="w-5 h-5 inline mr-2" />
              Account Status
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-gray-900 font-medium">
                  {customer.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-gray-900 text-sm">
                  {new Date(customer.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-gray-900 text-sm">
                  {new Date(customer.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Customer"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this customer? This action cannot be undone.
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
