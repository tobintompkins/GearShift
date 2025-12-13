# Database Schema Documentation

## Overview
This document describes the complete database schema for TNT Apex Elite AutoCare, including all models and their relationships.

## Models & Relationships

### Core Models

#### 1. Customer
**Purpose:** Store customer information

**Fields:**
- `id` (String, Primary Key)
- `firstName` (String)
- `lastName` (String)
- `phone` (String, Indexed)
- `email` (String, Optional)
- `address` (String, Optional)
- `notes` (String, Optional)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Has many `Vehicle[]`
- Has many `Job[]`
- Has many `Quote[]`
- Has many `Invoice[]`

**Indexes:**
- `phone`
- `lastName, firstName` (composite)

---

#### 2. Vehicle
**Purpose:** Track customer vehicles

**Fields:**
- `id` (String, Primary Key)
- `make` (String)
- `model` (String)
- `year` (String, Optional)
- `engine` (String, Optional) - e.g., "3.5L V6"
- `mileage` (Int, Optional) - Current mileage in miles
- `licensePlate` (String, Optional, Indexed)
- `vin` (String, Optional, Indexed)
- `color` (String, Optional)
- `notes` (String, Optional)
- `customerId` (String, Foreign Key)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `Customer` (many-to-one)
- Has many `Job[]`
- Has many `Quote[]`
- Has many `Invoice[]`

**Indexes:**
- `customerId`
- `licensePlate`
- `vin`

---

#### 3. Employee
**Purpose:** Manage team members/technicians

**Fields:**
- `id` (String, Primary Key)
- `firstName` (String)
- `lastName` (String)
- `email` (String, Optional)
- `phone` (String, Optional)
- `photo` (String, Optional) - URL or path to photo
- `skills` (String, Optional) - Comma-separated list
- `isActive` (Boolean, Default: true)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Has many `Job[]`
- Has many `Schedule[]` - Employee availability

---

#### 4. Job
**Purpose:** Track service jobs/appointments

**Fields:**
- `id` (String, Primary Key)
- `date` (DateTime, Indexed)
- `startTime` (String)
- `endTime` (String, Optional)
- `duration` (Int, Optional) - Duration in minutes
- `customerFirstName`, `customerLastName`, `customerPhone`, `customerAddress` (String) - Backward compatibility
- `vehicleInfo` (String) - Backward compatibility
- `serviceType` (String)
- `status` (String, Default: "pending") - pending, in-progress, awaiting-parts, completed, cancelled
- `price` (Float, Optional) - Job price/revenue
- `urgent` (Boolean, Default: false, Indexed)
- `customerId` (String, Optional, Foreign Key, Indexed)
- `vehicleId` (String, Optional, Foreign Key, Indexed)
- `employeeId` (String, Optional, Foreign Key, Indexed)
- `serviceTypeId` (String, Optional, Foreign Key, Indexed)
- `quoteId` (String, Optional, Foreign Key, Indexed)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `Customer?` (many-to-one, optional)
- Belongs to `Vehicle?` (many-to-one, optional)
- Belongs to `Employee?` (many-to-one, optional)
- Belongs to `ServiceType?` (many-to-one, optional)
- Belongs to `Quote?` (many-to-one, optional) - Job created from quote
- Has one `Invoice?` (one-to-one, optional) - Invoice for this job
- Has many `Reminder[]`
- Has many `JobNote[]`

**Indexes:**
- `date`
- `status`
- `employeeId`
- `customerId`
- `vehicleId`
- `urgent`
- `serviceTypeId`
- `quoteId`

---

#### 5. ServiceType
**Purpose:** Categorize services (e.g., Brakes, Engine, AC)

**Fields:**
- `id` (String, Primary Key)
- `name` (String, Indexed) - e.g., "Brakes", "Engine"
- `description` (String, Optional)
- `icon` (String, Optional) - Icon name or emoji
- `color` (String, Optional) - Color code for UI
- `isActive` (Boolean, Default: true, Indexed)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Has many `ServiceTemplate[]`
- Has many `Job[]`

**Indexes:**
- `isActive`
- `name`

---

#### 6. ServiceTemplate
**Purpose:** Reusable service templates for quick job creation

**Fields:**
- `id` (String, Primary Key)
- `name` (String, Indexed)
- `description` (String, Optional)
- `duration` (Int, Optional) - Duration in minutes
- `price` (Float, Optional)
- `isActive` (Boolean, Default: true, Indexed)
- `serviceTypeId` (String, Optional, Foreign Key, Indexed)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `ServiceType?` (many-to-one, optional)

**Indexes:**
- `isActive`
- `name`
- `serviceTypeId`

---

#### 7. Schedule
**Purpose:** Track employee availability and schedule blocks

**Fields:**
- `id` (String, Primary Key)
- `employeeId` (String, Foreign Key, Indexed)
- `dayOfWeek` (Int, Indexed) - 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- `startTime` (String) - e.g., "09:00"
- `endTime` (String) - e.g., "17:00"
- `isAvailable` (Boolean, Default: true) - false = blocked/unavailable
- `notes` (String, Optional) - Reason for unavailability
- `date` (DateTime, Optional, Indexed) - Specific date for one-time changes
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `Employee` (many-to-one)

**Indexes:**
- `employeeId`
- `dayOfWeek`
- `date`

---

#### 8. JobNote
**Purpose:** Store notes specific to individual jobs

**Fields:**
- `id` (String, Primary Key)
- `jobId` (String, Foreign Key, Indexed)
- `content` (String)
- `noteType` (String, Default: "general", Indexed) - general, issue, solution, customer-request, internal
- `isInternal` (Boolean, Default: false) - true = internal only
- `createdBy` (String, Optional) - Employee name or system
- `createdAt` (DateTime, Indexed)
- `updatedAt` (DateTime)

**Relations:**
- Belongs to `Job` (many-to-one)

**Indexes:**
- `jobId`
- `noteType`
- `createdAt`

---

### Inventory & Parts

#### 9. Part
**Purpose:** Track parts inventory

**Fields:**
- `id` (String, Primary Key)
- `name` (String, Indexed)
- `description` (String, Optional)
- `partNumber` (String, Optional) - Manufacturer part number
- `vendor` (String, Optional, Indexed) - e.g., "AutoZone", "NAPA"
- `quantity` (Int, Default: 0) - Current stock
- `minQuantity` (Int, Default: 0) - Restock alert threshold
- `unit` (String, Optional) - e.g., "each", "box"
- `price` (Float, Optional) - Current price per unit
- `location` (String, Optional) - Storage location
- `category` (String, Optional, Indexed) - e.g., "Brakes", "Engine"
- `isActive` (Boolean, Default: true, Indexed)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Has many `PurchaseHistory[]`
- Has many `QuoteLineItem[]`
- Has many `InvoiceLineItem[]`

**Indexes:**
- `isActive`
- `name`
- `category`
- `vendor`

---

#### 10. PurchaseHistory
**Purpose:** Track part purchase history

**Fields:**
- `id` (String, Primary Key)
- `partId` (String, Foreign Key, Indexed)
- `quantity` (Int)
- `unitPrice` (Float, Optional)
- `totalPrice` (Float, Optional)
- `vendor` (String, Optional)
- `purchaseDate` (DateTime, Default: now(), Indexed)
- `notes` (String, Optional)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `Part` (many-to-one)

**Indexes:**
- `partId`
- `purchaseDate`

---

### Quotes & Invoicing

#### 11. Quote
**Purpose:** Store customer quotes/estimates

**Fields:**
- `id` (String, Primary Key)
- `quoteNumber` (String, Indexed) - Unique quote number
- `customerId` (String, Optional, Foreign Key, Indexed)
- `vehicleId` (String, Optional, Foreign Key, Indexed)
- `customerName`, `customerPhone`, `customerEmail` (String, Optional) - Stored for reference
- `vehicleInfo` (String) - Stored for reference
- `laborHours`, `laborRate`, `laborTotal` (Float)
- `partsTotal`, `subtotal`, `taxRate`, `taxAmount`, `total` (Float)
- `status` (String, Default: "draft", Indexed) - draft, sent, accepted, rejected, expired
- `notes` (String, Optional)
- `validUntil` (DateTime, Optional)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `Customer?` (many-to-one, optional)
- Belongs to `Vehicle?` (many-to-one, optional)
- Has many `QuoteLineItem[]`
- Has many `Job[]` - Jobs created from this quote

**Indexes:**
- `customerId`
- `vehicleId`
- `status`
- `quoteNumber`

---

#### 12. QuoteLineItem
**Purpose:** Line items in quotes

**Fields:**
- `id` (String, Primary Key)
- `quoteId` (String, Foreign Key, Indexed)
- `partId` (String, Optional, Foreign Key, Indexed)
- `description` (String)
- `quantity` (Int, Default: 1)
- `unitPrice` (Float)
- `total` (Float) - quantity * unitPrice
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `Quote` (many-to-one)
- Belongs to `Part?` (many-to-one, optional)

**Indexes:**
- `quoteId`
- `partId`

---

#### 13. Invoice
**Purpose:** Store invoices for completed jobs

**Fields:**
- `id` (String, Primary Key)
- `invoiceNumber` (String, Indexed) - Unique invoice number
- `jobId` (String, Optional, Unique, Foreign Key) - One-to-one with Job
- `customerId` (String, Optional, Foreign Key, Indexed)
- `vehicleId` (String, Optional, Foreign Key, Indexed)
- `customerName`, `customerPhone`, `customerEmail`, `customerAddress` (String, Optional)
- `vehicleInfo` (String)
- `laborHours`, `laborRate`, `laborTotal` (Float)
- `partsTotal`, `subtotal`, `taxRate`, `taxAmount`, `total` (Float)
- `amountPaid` (Float, Default: 0)
- `balanceDue` (Float, Default: 0) - total - amountPaid
- `status` (String, Default: "pending", Indexed) - pending, partial, paid, overdue, cancelled
- `issueDate` (DateTime, Default: now())
- `dueDate` (DateTime, Optional, Indexed)
- `paidDate` (DateTime, Optional)
- `paymentMethod` (String, Optional) - cash, check, card, transfer
- `notes` (String, Optional)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `Job?` (one-to-one, optional)
- Belongs to `Customer?` (many-to-one, optional)
- Belongs to `Vehicle?` (many-to-one, optional)
- Has many `InvoiceLineItem[]`

**Indexes:**
- `customerId`
- `vehicleId`
- `jobId`
- `status`
- `invoiceNumber`
- `dueDate`

---

#### 14. InvoiceLineItem
**Purpose:** Line items in invoices

**Fields:**
- `id` (String, Primary Key)
- `invoiceId` (String, Foreign Key, Indexed)
- `partId` (String, Optional, Foreign Key, Indexed)
- `description` (String)
- `quantity` (Int, Default: 1)
- `unitPrice` (Float)
- `total` (Float) - quantity * unitPrice
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `Invoice` (many-to-one)
- Belongs to `Part?` (many-to-one, optional)

**Indexes:**
- `invoiceId`
- `partId`

---

### Reminders & Notes

#### 15. Reminder
**Purpose:** Automated reminders for jobs

**Fields:**
- `id` (String, Primary Key)
- `jobId` (String, Foreign Key, Indexed)
- `type` (String) - "customer" or "employee"
- `method` (String) - "email", "sms", "app"
- `daysBefore` (Int) - Days before appointment
- `message` (String, Optional)
- `sent` (Boolean, Default: false, Indexed)
- `sentAt` (DateTime, Optional)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- Belongs to `Job` (many-to-one)

**Indexes:**
- `jobId`
- `sent`

---

#### 16. Note
**Purpose:** General notes and to-do items

**Fields:**
- `id` (String, Primary Key)
- `title` (String)
- `content` (String, Optional)
- `category` (String, Indexed) - parts-pickup, callback, follow-up, business-buy, tools
- `priority` (String, Default: "normal", Indexed) - low, normal, high, urgent
- `isCompleted` (Boolean, Default: false, Indexed)
- `dueDate` (DateTime, Optional, Indexed)
- `relatedJobId` (String, Optional)
- `relatedCustomerId` (String, Optional)
- `relatedPartId` (String, Optional)
- `createdAt`, `updatedAt` (DateTime)
- `completedAt` (DateTime, Optional)

**Relations:**
- None (standalone model with optional references)

**Indexes:**
- `category`
- `isCompleted`
- `priority`
- `dueDate`

---

## Relationship Summary

```
Customer
  ├── Vehicle[] (1-to-many)
  ├── Job[] (1-to-many)
  ├── Quote[] (1-to-many)
  └── Invoice[] (1-to-many)

Vehicle
  ├── Customer (many-to-1)
  ├── Job[] (1-to-many)
  ├── Quote[] (1-to-many)
  └── Invoice[] (1-to-many)

Employee
  ├── Job[] (1-to-many)
  └── Schedule[] (1-to-many)

Job
  ├── Customer (many-to-1, optional)
  ├── Vehicle (many-to-1, optional)
  ├── Employee (many-to-1, optional)
  ├── ServiceType (many-to-1, optional)
  ├── Quote (many-to-1, optional)
  ├── Invoice (1-to-1, optional)
  ├── Reminder[] (1-to-many)
  └── JobNote[] (1-to-many)

ServiceType
  ├── ServiceTemplate[] (1-to-many)
  └── Job[] (1-to-many)

ServiceTemplate
  └── ServiceType (many-to-1, optional)

Schedule
  └── Employee (many-to-1)

JobNote
  └── Job (many-to-1)

Part
  ├── PurchaseHistory[] (1-to-many)
  ├── QuoteLineItem[] (1-to-many)
  └── InvoiceLineItem[] (1-to-many)

PurchaseHistory
  └── Part (many-to-1)

Quote
  ├── Customer (many-to-1, optional)
  ├── Vehicle (many-to-1, optional)
  ├── QuoteLineItem[] (1-to-many)
  └── Job[] (1-to-many)

QuoteLineItem
  ├── Quote (many-to-1)
  └── Part (many-to-1, optional)

Invoice
  ├── Job (1-to-1, optional)
  ├── Customer (many-to-1, optional)
  ├── Vehicle (many-to-1, optional)
  └── InvoiceLineItem[] (1-to-many)

InvoiceLineItem
  ├── Invoice (many-to-1)
  └── Part (many-to-1, optional)

Reminder
  └── Job (many-to-1)

Note
  └── (Standalone with optional references)
```

## Key Features Supported

✅ **Customer Management** - Full CRUD with vehicles and job history  
✅ **Vehicle Tracking** - Detailed vehicle info with job history  
✅ **Job Scheduling** - Complete job management with status tracking  
✅ **Employee Management** - Team members with skills and schedules  
✅ **Service Templates** - Quick-add services with pricing  
✅ **Service Types** - Categorization of services  
✅ **Parts Inventory** - Stock tracking with restock alerts  
✅ **Purchase History** - Track all part purchases  
✅ **Quotes/Estimates** - Professional quote generation  
✅ **Invoices** - Invoice management for completed jobs  
✅ **Reminders** - Automated notifications  
✅ **Job Notes** - Internal and customer-facing notes  
✅ **Schedule Management** - Employee availability tracking  
✅ **General Notes** - To-do lists and reminders  

## Next Steps

1. **Restart your development server** to load the new Prisma models:
   ```bash
   npm run dev
   ```

2. **All models are ready** for use in your application!


