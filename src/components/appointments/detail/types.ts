export type AppointmentFormState = {
  id: number | string;
  title: string;
  description: string;
  status: string;
  job_type: string;
  appointment_date: string;
  appointment_time: string;
  end_time: string;
  assigned_to: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  customer_email: string;
  customer_company_name: string;
  location_building: string;
  location_unit: string;
  location_full_address: string;
  location_instructions: string;
};

export type UpdateField = <K extends keyof AppointmentFormState>(
  field: K,
  value: AppointmentFormState[K],
) => void;
