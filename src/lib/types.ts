export type JobStatus = "pending" | "in-progress" | "awaiting-parts" | "completed" | "cancelled";
export type UrgentType = "emergency" | "breakdown" | "no-start" | "safety-issue";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  photo: string | null;
  skills: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  photo?: string;
  skills?: string;
  isActive?: boolean;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string | null;
  engine: string | null;
  mileage: number | null;
  licensePlate: string | null;
  vin: string | null;
  color: string | null;
  notes: string | null;
  customerId: string;
  customer?: Customer;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleFormData {
  make: string;
  model: string;
  year?: string;
  engine?: string;
  mileage?: number;
  licensePlate?: string;
  vin?: string;
  color?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  vehicles?: Vehicle[];
  jobs?: Job[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface Job {
  id: string;
  date: Date;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerAddress: string;
  vehicleInfo: string;
  serviceType: string;
  status: JobStatus;
  price: number | null;
  urgent: boolean;
  urgentType: UrgentType | null;
  customerId: string | null;
  customer: Customer | null;
  vehicleId: string | null;
  vehicle: Vehicle | null;
  employeeId: string | null;
  employee: Employee | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobFormData {
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerAddress: string;
  vehicleInfo: string;
  serviceType: string;
  status: JobStatus;
  price?: number;
  urgent?: boolean;
  urgentType?: UrgentType;
  employeeId?: string;
  customerId?: string;
  vehicleId?: string;
}

export type ReminderType = "customer" | "employee";
export type ReminderMethod = "email" | "sms" | "app";

export interface Reminder {
  id: string;
  jobId: string;
  job?: Job;
  type: ReminderType;
  method: ReminderMethod;
  daysBefore: number;
  message: string | null;
  sent: boolean;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderFormData {
  jobId: string;
  type: ReminderType;
  method: ReminderMethod;
  daysBefore: number;
  message?: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  description: string | null;
  duration: number | null;
  price: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceTemplateFormData {
  name: string;
  description?: string;
  duration?: number;
  price?: number;
  isActive?: boolean;
}

export interface Part {
  id: string;
  name: string;
  description: string | null;
  partNumber: string | null;
  vendor: string | null;
  quantity: number;
  minQuantity: number;
  unit: string | null;
  price: number | null;
  location: string | null;
  category: string | null;
  isActive: boolean;
  purchaseHistory?: PurchaseHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PartFormData {
  name: string;
  description?: string;
  partNumber?: string;
  vendor?: string;
  quantity?: number;
  minQuantity?: number;
  unit?: string;
  price?: number;
  location?: string;
  category?: string;
  isActive?: boolean;
}

export interface PurchaseHistory {
  id: string;
  partId: string;
  part?: Part;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  vendor: string | null;
  purchaseDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseHistoryFormData {
  partId: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  vendor?: string;
  purchaseDate?: string;
  notes?: string;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  quote?: Quote;
  partId: string | null;
  part?: Part;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteLineItemFormData {
  partId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string | null;
  customer?: Customer | null;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  vehicleInfo: string;
  laborHours: number;
  laborRate: number;
  laborTotal: number;
  partsTotal: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: QuoteStatus;
  notes: string | null;
  validUntil: Date | null;
  lineItems?: QuoteLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteFormData {
  customerId?: string;
  vehicleId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  vehicleInfo: string;
  laborHours?: number;
  laborRate?: number;
  lineItems?: QuoteLineItemFormData[];
  taxRate?: number;
  notes?: string;
  validUntil?: string;
  status?: QuoteStatus;
}

export type NoteCategory = "parts-pickup" | "callback" | "follow-up" | "business-buy" | "tools" | "daily-task";
export type NotePriority = "low" | "normal" | "high" | "urgent";

export interface Note {
  id: string;
  title: string;
  content: string | null;
  category: NoteCategory;
  priority: NotePriority;
  isCompleted: boolean;
  isDailyTask: boolean;
  dueDate: Date | null;
  relatedJobId: string | null;
  relatedCustomerId: string | null;
  relatedPartId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface NoteFormData {
  title: string;
  content?: string;
  category: NoteCategory;
  priority?: NotePriority;
  isDailyTask?: boolean;
  dueDate?: string;
  relatedJobId?: string;
  relatedCustomerId?: string;
  relatedPartId?: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  employee?: Employee;
  jobId: string | null;
  job?: Job | null;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  breakStart: Date | null;
  breakEnd: Date | null;
  breakMinutes: number;
  totalMinutes: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryFormData {
  employeeId: string;
  jobId?: string;
  date?: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
}

export type DiagnosticJobStatus = "pending" | "in-progress" | "completed" | "cancelled";

export interface DiagnosticJob {
  id: string;
  customerId: string;
  customer?: Customer;
  vehicleId: string;
  vehicle?: Vehicle;
  jobId: string | null;
  job?: Job | null;
  employeeId: string | null;
  employee?: Employee | null;
  diagnosticDate: Date;
  scanToolUsed: string | null;
  troubleCodes: string | null;
  freezeFrameData: string | null;
  liveDataNotes: string | null;
  diagnosticConclusion: string | null;
  recommendedRepairs: string | null;
  status: DiagnosticJobStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosticJobFormData {
  customerId: string;
  vehicleId: string;
  jobId?: string;
  employeeId?: string;
  diagnosticDate: string;
  scanToolUsed?: string;
  troubleCodes?: string;
  freezeFrameData?: string;
  liveDataNotes?: string;
  diagnosticConclusion?: string;
  recommendedRepairs?: string;
  status?: DiagnosticJobStatus;
  notes?: string;
}

export interface TorqueSpec {
  id: string;
  componentName: string;
  torqueValue: number;
  unit: string;
  sequence: string | null;
  notes: string | null;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  serviceTypeId: string | null;
  serviceType?: ServiceType | null;
  jobTemplateId: string | null;
  jobTemplate?: JobTemplate | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TorqueSpecFormData {
  componentName: string;
  torqueValue: number;
  unit: string;
  sequence?: string;
  notes?: string;
  vehicleId?: string;
  serviceTypeId?: string;
  jobTemplateId?: string;
  isActive?: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobTemplate {
  id: string;
  name: string;
  serviceType: string;
  duration: number | null;
  price: number | null;
  description: string | null;
  parts: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ReminderType = "oil-change" | "inspection-6month" | "brake-check" | "custom";
export type ReminderStatus = "pending" | "sent" | "completed" | "cancelled";

export interface MaintenanceReminder {
  id: string;
  customerId: string;
  customer?: Customer;
  vehicleId: string;
  vehicle?: Vehicle;
  reminderType: ReminderType;
  title: string;
  description: string | null;
  dueDate: Date;
  dueMileage: number | null;
  currentMileage: number | null;
  status: ReminderStatus;
  lastSentAt: Date | null;
  completedAt: Date | null;
  relatedMaintenanceId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceReminderFormData {
  customerId: string;
  vehicleId: string;
  reminderType: ReminderType;
  title: string;
  description?: string;
  dueDate: string;
  dueMileage?: number;
  currentMileage?: number;
  status?: ReminderStatus;
  notes?: string;
}

export type InvoiceStatus = "pending" | "partial" | "paid" | "overdue" | "cancelled";

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  invoice?: Invoice;
  partId: string | null;
  part?: Part;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItemFormData {
  partId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  jobId: string | null;
  job?: Job | null;
  customerId: string | null;
  customer?: Customer | null;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  vehicleInfo: string;
  laborHours: number;
  laborRate: number;
  laborTotal: number;
  partsTotal: number;
  shopSupplies: number;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date | null;
  paidDate: Date | null;
  paymentMethod: string | null;
  notes: string | null;
  lineItems?: InvoiceLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceFormData {
  jobId?: string;
  customerId?: string;
  vehicleId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  vehicleInfo: string;
  laborHours?: number;
  laborRate?: number;
  shopSupplies?: number;
  discountAmount?: number;
  discountPercent?: number;
  lineItems?: InvoiceLineItemFormData[];
  taxRate?: number;
  dueDate?: string;
  paymentMethod?: string;
  notes?: string;
  status?: InvoiceStatus;
}

export type PartOrderStatus = "needed" | "ordered" | "arrived" | "installed";
export type PartOrderVendor = "AutoZone" | "O'Reilly" | "Napa" | "RockAuto";

export interface PartOrder {
  id: string;
  partName: string;
  vendor: string;
  price: number | null;
  sku: string | null;
  deliveryETA: Date | null;
  jobId: string | null;
  job?: Job | null;
  partId: string | null;
  part?: Part | null;
  status: PartOrderStatus;
  quantity: number;
  notes: string | null;
  orderedDate: Date | null;
  arrivedDate: Date | null;
  installedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartOrderFormData {
  partName: string;
  vendor: string;
  price?: number;
  sku?: string;
  deliveryETA?: string;
  jobId?: string;
  partId?: string;
  status?: PartOrderStatus;
  quantity?: number;
  notes?: string;
  orderedDate?: string;
  arrivedDate?: string;
  installedDate?: string;
}

export type ToolType = "wrench" | "scanner" | "impact-gun" | "torque-wrench" | "jack" | "other";
export type ToolCondition = "excellent" | "good" | "fair" | "poor" | "needs-repair";

export interface Tool {
  id: string;
  name: string;
  toolType: ToolType;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  condition: ToolCondition;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  assignedToId: string | null;
  assignedTo?: Employee | null;
  calibrationDate: Date | null;
  calibrationDueDate: Date | null;
  calibrationInterval: number | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolFormData {
  name: string;
  toolType: ToolType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  condition?: ToolCondition;
  purchaseDate?: string;
  purchasePrice?: number;
  assignedToId?: string;
  calibrationDate?: string;
  calibrationDueDate?: string;
  calibrationInterval?: number;
  location?: string;
  notes?: string;
  isActive?: boolean;
}

export type MessageType = "quote" | "approval" | "note" | "follow-up" | "waiting-reply" | "general";
export type MessageDirection = "inbound" | "outbound";
export type MessageChannel = "sms" | "email" | "phone" | "facebook" | "in-person" | "app";
export type MessageStatus = "sent" | "delivered" | "read" | "waiting-reply" | "completed";

export interface CustomerMessage {
  id: string;
  customerId: string | null;
  customer?: Customer | null;
  jobId: string | null;
  job?: Job | null;
  quoteId: string | null;
  quote?: Quote | null;
  messageType: MessageType;
  subject: string | null;
  content: string;
  direction: MessageDirection;
  channel: MessageChannel;
  status: MessageStatus;
  isWaitingReply: boolean;
  followUpDate: Date | null;
  sentAt: Date;
  createdBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerMessageFormData {
  customerId?: string;
  jobId?: string;
  quoteId?: string;
  messageType: MessageType;
  subject?: string;
  content: string;
  direction?: MessageDirection;
  channel?: MessageChannel;
  status?: MessageStatus;
  isWaitingReply?: boolean;
  followUpDate?: string;
  sentAt?: string;
  createdBy?: string;
  notes?: string;
}

export interface VehicleMaintenanceHistory {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle | null;
  jobId: string | null;
  job?: Job | null;
  serviceType: string;
  serviceDate: Date;
  mileage: number;
  description: string | null;
  recommendations: string | null;
  photos: string | null; // JSON array of photo URLs
  cost: number | null;
  technician: string | null;
  notes: string | null;
  nextServiceDate: Date | null;
  nextServiceMileage: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleMaintenanceHistoryFormData {
  vehicleId: string;
  jobId?: string;
  serviceType: string;
  serviceDate: string;
  mileage: number;
  description?: string;
  recommendations?: string;
  photos?: string[]; // Array of photo URLs
  cost?: number;
  technician?: string;
  notes?: string;
  nextServiceDate?: string;
  nextServiceMileage?: number;
}

export interface JobTemplate {
  id: string;
  name: string;
  serviceType: string;
  duration: number | null;
  price: number | null;
  description: string | null;
  parts: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobTemplateFormData {
  name: string;
  serviceType: string;
  duration?: number;
  price?: number;
  description?: string;
  parts?: string;
  notes?: string;
  isActive?: boolean;
}

export type MaintenanceIntervalType = "oil-change" | "transmission" | "coolant" | "brake-fluid" | "differential";

export interface MaintenanceInterval {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  intervalType: MaintenanceIntervalType;
  intervalMileage: number | null;
  intervalMonths: number | null;
  lastServiceDate: Date | null;
  lastServiceMileage: number | null;
  nextDueDate: Date | null;
  nextDueMileage: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceIntervalFormData {
  vehicleId: string;
  intervalType: MaintenanceIntervalType;
  intervalMileage?: number;
  intervalMonths?: number;
  lastServiceDate?: string;
  lastServiceMileage?: number;
  notes?: string;
  isActive?: boolean;
}

export type InspectionItemStatus = "ok" | "needs-attention" | "immediate-repair";

export interface InspectionChecklist {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  jobId: string | null;
  job?: Job | null;
  employeeId: string | null;
  employee?: Employee | null;
  inspectionDate: Date;
  mileage: number | null;
  tiresStatus: InspectionItemStatus | null;
  tiresNotes: string | null;
  brakesStatus: InspectionItemStatus | null;
  brakesNotes: string | null;
  suspensionStatus: InspectionItemStatus | null;
  suspensionNotes: string | null;
  steeringStatus: InspectionItemStatus | null;
  steeringNotes: string | null;
  fluidsStatus: InspectionItemStatus | null;
  fluidsNotes: string | null;
  beltsHosesStatus: InspectionItemStatus | null;
  beltsHosesNotes: string | null;
  batteryStatus: InspectionItemStatus | null;
  batteryNotes: string | null;
  overallStatus: InspectionItemStatus | null;
  overallNotes: string | null;
  recommendations: string | null;
  customerSignature: string | null;
  inspectorSignature: string | null;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InspectionChecklistFormData {
  vehicleId: string;
  jobId?: string;
  employeeId?: string;
  inspectionDate: string;
  mileage?: number;
  tiresStatus?: InspectionItemStatus;
  tiresNotes?: string;
  brakesStatus?: InspectionItemStatus;
  brakesNotes?: string;
  suspensionStatus?: InspectionItemStatus;
  suspensionNotes?: string;
  steeringStatus?: InspectionItemStatus;
  steeringNotes?: string;
  fluidsStatus?: InspectionItemStatus;
  fluidsNotes?: string;
  beltsHosesStatus?: InspectionItemStatus;
  beltsHosesNotes?: string;
  batteryStatus?: InspectionItemStatus;
  batteryNotes?: string;
  overallStatus?: InspectionItemStatus;
  overallNotes?: string;
  recommendations?: string;
  customerSignature?: string;
  inspectorSignature?: string;
  isComplete?: boolean;
}

export type PhotoType = "vehicle-damage" | "old-parts" | "finished-work" | "diagnostic" | "general";

export interface JobPhoto {
  id: string;
  jobId: string;
  job?: Job | null;
  filename: string;
  filepath: string;
  photoType: PhotoType;
  description: string | null;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobPhotoFormData {
  jobId: string;
  photoType: PhotoType;
  description?: string;
  uploadedBy?: string;
}
