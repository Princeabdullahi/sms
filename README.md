# School Management System

A comprehensive school management platform built with Next.js, Supabase, and shadcn/ui. This system provides role-based access control for different user types including Super Admin, Admin, Accountant, Teacher, Student, and Parent.

## Features

### Role-Based Access Control

- **Super Admin**: Delete any record, create any user account
- **Admin**: Manage classes, view marksheets, manage users, exams, subjects, noticeboard, settings, announcements, and payments
- **Accountant**: Manage payments, print receipts, confirm payment receipts
- **Teacher**: Manage own class/section, exam records, timetable, profile, upload study materials, and assignments
- **Student**: View teacher profile, class subjects, marks, timetable, payments, noticeboard, and manage profile
- **Parent**: View child's marksheet, timetable, payments, noticeboard, make school fees online, and manage profile

### Key Features

- **Authentication**: Secure login with role-based access control
- **User Management**: Create, edit, and delete user accounts
- **Class Management**: Manage classes and sections with class teachers
- **Subject Management**: Assign subjects to classes and teachers
- **Exam & Grade Management**: Create exams, manage grades, and view marksheets
- **Payment System**: Bank transfer with receipt upload, accountant confirmation workflow
- **Noticeboard**: School notices with calendar integration
- **Timetable**: Weekly class schedules with period management
- **Study Materials**: Upload and share educational resources
- **Profile Management**: Users can manage their personal information
- **Settings**: System-wide configuration for school information

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd school-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API to get your credentials
   - Copy the project URL and anon key

4. Configure environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Set up the database:
   - Go to your Supabase project's SQL Editor
   - Run the SQL commands from `supabase-schema.sql`
   - This will create all necessary tables, indexes, and RLS policies

6. Create storage buckets:
   - Go to Storage in Supabase dashboard
   - Create buckets: `avatars`, `payment-receipts`, `study-materials`
   - Make them public (or configure appropriate policies)

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Initial Setup

### Creating the First User (Super Admin)

Since there's no initial user, you'll need to create the first Super Admin manually:

1. Go to Supabase Authentication > Users
2. Click "Add User" and create a user with email/password
3. Go to the SQL Editor and run:
```sql
INSERT INTO profiles (id, email, full_name, role, phone)
VALUES ('user_uuid_from_auth', 'email@example.com', 'Admin Name', 'super_admin', '+1234567890');
```

Replace `user_uuid_from_auth` with the actual UUID from the Auth users table.

## Database Schema

The system uses the following main tables:

- `profiles`: User profiles with role information
- `classes`: Class and section management
- `students`: Student information linked to profiles
- `subjects`: Subject assignments
- `exams`: Exam schedules
- `grades`: Student grades for exams
- `payments`: Payment records and receipts
- `notices`: School notices and events
- `announcements`: System announcements
- `timetables`: Class schedules
- `study_materials`: Educational resources
- `assignments`: Student assignments
- `settings`: System configuration

See `supabase-schema.sql` for the complete schema with RLS policies.

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Dashboard pages for each feature
│   │   ├── classes/       # Class management
│   │   ├── subjects/      # Subject management
│   │   ├── exams/         # Exams and grades
│   │   ├── payments/      # Payment management
│   │   ├── noticeboard/   # School notices
│   │   ├── timetable/     # Class schedules
│   │   ├── materials/     # Study materials
│   │   ├── users/         # User management
│   │   ├── settings/      # System settings
│   │   ├── profile/       # User profile
│   │   └── page.tsx       # Dashboard home
│   ├── login/             # Login page
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page (redirects to login/dashboard)
├── components/
│   ├── dashboard/          # Dashboard layout component
│   └── ui/                # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx    # Authentication context
└── lib/
    ├── supabase.ts        # Supabase client and types
    └── auth.ts            # Authentication utilities
```

## Usage

### For Super Admins

1. Log in with your credentials
2. Navigate to Users to create new user accounts
3. Assign appropriate roles (Admin, Accountant, Teacher, Student, Parent)
4. Configure system settings
5. Manage all aspects of the school system

### For Admins

1. Create and manage classes and sections
2. Assign subjects to classes and teachers
3. Create exam schedules
4. Manage school notices
5. View and manage payments
6. Configure school settings

### For Accountants

1. View all payment records
2. Review uploaded payment receipts
3. Confirm or reject payments
4. Print payment receipts

### For Teachers

1. View assigned class timetable
2. Manage exam records for assigned subjects
3. Upload study materials for students
4. Create and manage assignments
5. Update student profiles

### For Students

1. View class timetable
2. View subjects and teachers
3. Check exam grades and marksheets
4. View payment status
5. Access study materials
6. Read school notices

### For Parents

1. View child's marksheets
2. View child's timetable
3. Check child's payment status
4. Make online fee payments
5. Upload payment receipts
6. Read school notices

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

This Next.js app can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- Digital Ocean App Platform
- AWS Amplify

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control enforced at database level
- Secure file upload with Supabase Storage policies
- Environment variables for sensitive data
- Input validation with Zod schemas

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.
