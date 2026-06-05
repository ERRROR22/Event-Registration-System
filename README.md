# EventHub - Event Registration & Management System

A premium, production-ready event management platform built with **React 19**, **Tailwind CSS 4**, **Express**, **tRPC**, and **MongoDB**. EventHub enables hosts to create and manage events while attendees can discover, register for, and track their event attendance.

---

## 🎯 Features

### Host Features
- **OAuth Authentication**: Secure host login via Manus OAuth
- **Event Management**: Create, edit, close, and delete events with full control
- **Event Dashboard**: View all created events with status indicators and attendee counts
- **Attendee Management**: View complete attendee lists with names and emails
- **CSV Export**: Download attendee lists as CSV files for external use
- **Protected Access**: All host features are behind authentication

### Attendee Features
- **Event Discovery**: Browse all upcoming events with search and filtering
- **Event Registration**: Register for events with name, email, and password
- **Registration Management**: View registered events and cancel registrations anytime
- **Capacity Awareness**: See real-time attendee counts and remaining capacity
- **Cutoff Enforcement**: Registration automatically closes at the specified cutoff date

### Core Capabilities
- **Real-time Capacity Tracking**: Prevent over-registration with automatic capacity enforcement
- **Registration Cutoff Dates**: Control when registrations close for each event
- **Duplicate Prevention**: Prevent the same email from registering twice for the same event
- **Responsive Design**: Fully mobile-first UI that works seamlessly on all devices
- **Professional UI**: Built with shadcn/ui components and Tailwind CSS for a polished experience

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui, Wouter (routing)
- **Backend**: Express 4, tRPC 11, Node.js
- **Database**: MongoDB with Drizzle ORM
- **Authentication**: Manus OAuth (hosts), localStorage (attendees)
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Testing**: Vitest with 26+ passing tests

### Database Schema

**Events Table**
```
- id: number (primary key)
- title: string
- description: text
- location: string
- date: timestamp
- registrationCutoffDate: timestamp
- capacity: number
- category: string (optional)
- isClosed: boolean
- hostId: number (foreign key)
- createdAt: timestamp
- updatedAt: timestamp
```

**Attendees Table**
```
- id: number (primary key)
- name: string
- email: string (unique)
- passwordHash: string (bcrypt hashed)
- createdAt: timestamp
- updatedAt: timestamp
```

**Registrations Table**
```
- id: number (primary key)
- eventId: number (foreign key)
- attendeeId: number (foreign key)
- registeredAt: timestamp
- unique constraint: (eventId, attendeeId)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22.13.0+
- pnpm 10.4.1+
- MongoDB connection string

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-registration-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   The following environment variables are automatically provided by Manus:
   - `DATABASE_URL`: MongoDB connection string
   - `JWT_SECRET`: Session signing secret
   - `VITE_APP_ID`: Manus OAuth application ID
   - `OAUTH_SERVER_URL`: Manus OAuth backend URL
   - `VITE_OAUTH_PORTAL_URL`: Manus OAuth portal URL

4. **Run database migrations**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

### Build for Production
```bash
pnpm build
pnpm start
```

---

## 📁 Project Structure

```
event-registration-system/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── EventsListing.tsx   # Public event discovery
│   │   │   ├── EventDetail.tsx     # Event information & registration
│   │   │   ├── AttendeeRegister.tsx # Attendee signup
│   │   │   ├── AttendeeLogin.tsx   # Attendee login
│   │   │   ├── AttendeeDashboard.tsx # Attendee's registered events
│   │   │   ├── HostDashboard.tsx   # Host's event management
│   │   │   ├── CreateEvent.tsx     # Event creation form
│   │   │   ├── EditEvent.tsx       # Event editing form
│   │   │   └── HostEventDetail.tsx # Attendee list & CSV export
│   │   ├── components/             # Reusable UI components
│   │   ├── lib/trpc.ts            # tRPC client configuration
│   │   ├── App.tsx                # Routes and layout
│   │   ├── index.css              # Global styles and design tokens
│   │   └── main.tsx               # React entry point
│   └── index.html
├── server/                          # Express backend
│   ├── routers.ts                 # tRPC procedure definitions
│   ├── db.ts                      # Database query helpers
│   ├── storage.ts                 # File storage helpers
│   ├── auth.logout.test.ts        # Authentication tests
│   ├── registration.test.ts       # Registration system tests
│   └── _core/                     # Framework infrastructure
├── drizzle/                         # Database schema & migrations
│   ├── schema.ts                  # Table definitions
│   ├── relations.ts               # Table relationships
│   └── migrations/                # Migration files
├── shared/                          # Shared types and constants
└── package.json
```

---

## 🔄 User Flows

### Host Flow
1. **Login**: Click "Host Login" → OAuth authentication
2. **Create Event**: Navigate to dashboard → Click "Create Event" → Fill form → Submit
3. **Manage Events**: View all created events on dashboard
4. **View Attendees**: Click on event → See attendee list
5. **Export Data**: Click "Export CSV" to download attendee list
6. **Edit/Close Event**: Update event details or close registration

### Attendee Flow
1. **Browse Events**: Visit home page → Click "Browse Events" → Search/filter
2. **View Details**: Click event card to see full information
3. **Register**: Click "Register" → Create account (name, email, password) → Confirm
4. **Manage Registrations**: Login → View dashboard → See registered events
5. **Cancel Registration**: Click "Cancel" on any registered event

---

## 🧪 Testing

Run the test suite:
```bash
pnpm test
```

The project includes 26+ tests covering:
- Authentication flows
- Event creation and management
- Registration system and duplicate prevention
- Capacity enforcement
- CSV export functionality
- Attendee management

---

## 🎨 Design System

The application uses a refined, elegant design system built with Tailwind CSS 4:

### Color Palette
- **Primary**: Blue (#2563EB) - Actions and CTAs
- **Success**: Green (#16A34A) - Positive actions
- **Warning**: Orange (#EA580C) - Alerts
- **Danger**: Red (#DC2626) - Destructive actions
- **Neutral**: Slate (#64748B) - Text and borders

### Typography
- **Headings**: 18px - 32px with 600-700 weight
- **Body**: 14px - 16px with 400-500 weight
- **Mono**: 12px - 14px for code/data

### Spacing
- Consistent 4px grid system
- 8px, 12px, 16px, 24px, 32px, 48px standard increments

### Components
- **Buttons**: Primary, secondary, outline, and ghost variants
- **Cards**: Elevated with soft shadows and rounded corners
- **Forms**: Clean inputs with validation states
- **Tables**: Striped rows with hover effects
- **Modals**: Centered with backdrop blur

---

## 🔐 Security

- **Password Hashing**: bcryptjs with salt rounds for attendee passwords
- **Session Management**: Secure cookies for host authentication
- **CSRF Protection**: Built into tRPC and Express
- **Input Validation**: Zod schemas for all form inputs
- **SQL Injection Prevention**: Drizzle ORM parameterized queries
- **XSS Protection**: React's built-in sanitization

---

## 📊 API Documentation

### Host Procedures (Protected)
- `events.create(input)` - Create new event
- `events.update(input)` - Update event details
- `events.delete(eventId)` - Delete event
- `events.close(eventId)` - Close event registration
- `events.getByHost()` - Get all events created by host
- `registrations.getByEvent(eventId)` - Get attendees for event
- `registrations.exportCsv(eventId)` - Export attendee list as CSV

### Attendee Procedures (Public)
- `attendees.register(input)` - Create new attendee account
- `attendees.login(input)` - Authenticate attendee
- `events.getUpcoming(input)` - Get upcoming events
- `events.getById(eventId)` - Get event details
- `registrations.register(input)` - Register for event
- `registrations.cancel(registrationId)` - Cancel registration
- `registrations.getByAttendee(attendeeId)` - Get attendee's registrations

### Public Procedures
- `auth.me()` - Get current user info
- `auth.logout()` - Logout current user

---

## 🚢 Deployment

The application is ready for deployment to any Node.js hosting platform:

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Set environment variables** on your hosting platform:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `VITE_APP_ID`
   - `OAUTH_SERVER_URL`
   - `VITE_OAUTH_PORTAL_URL`

3. **Start the server**
   ```bash
   pnpm start
   ```

The application runs on the port specified by the `PORT` environment variable (default: 3000).

---

## 📝 Development Guidelines

### Adding New Features

1. **Update Database Schema**
   ```bash
   # Edit drizzle/schema.ts
   pnpm drizzle-kit generate
   pnpm db:push
   ```

2. **Add Database Helpers**
   - Add query functions to `server/db.ts`

3. **Create tRPC Procedures**
   - Add procedures to `server/routers.ts`

4. **Build Frontend UI**
   - Create page component in `client/src/pages/`
   - Use `trpc.*.useQuery/useMutation` hooks
   - Add route to `client/src/App.tsx`

5. **Write Tests**
   - Add tests to `server/*.test.ts`
   - Run `pnpm test` to verify

### Code Quality
- TypeScript for type safety
- ESLint for code style
- Prettier for formatting
- Vitest for unit testing

---

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set
- Check MongoDB connection string format
- Ensure database user has proper permissions

### Authentication Not Working
- Clear browser cookies
- Check OAuth configuration
- Verify `VITE_OAUTH_PORTAL_URL` is correct

### Build Errors
- Run `pnpm install` to ensure all dependencies are installed
- Clear `.next` and `dist` directories
- Check Node.js version (22.13.0+)

---

## 📄 License

This project is provided as-is for the Byamn internship program.

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the code comments and inline documentation
3. Consult the test files for usage examples
4. Check the tRPC and Drizzle documentation

---

## ✨ Features Implemented

### Core Features (100% Complete)
- ✅ Host authentication via Manus OAuth
- ✅ Event creation with full details (title, description, location, date, capacity, cutoff)
- ✅ Public event listing with search
- ✅ Event detail pages
- ✅ Attendee registration system
- ✅ Attendee authentication
- ✅ Host dashboard with event management
- ✅ CSV export for attendee lists
- ✅ Event capacity enforcement
- ✅ Registration cutoff date enforcement
- ✅ Duplicate registration prevention
- ✅ Mobile-first responsive UI

### Bonus Features (Partially Implemented)
- ✅ Event categories/tags
- ⏳ Event image uploads (ready for implementation)
- ⏳ Email notifications (ready for implementation)
- ⏳ Event analytics (ready for implementation)

---

**Built with ❤️ for the Byamn internship program**

  **Design and Develop by Ritik Sharma**
