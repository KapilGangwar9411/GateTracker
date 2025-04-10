# GATE Prep Tracker

A comprehensive application for tracking and managing GATE exam preparation. This tool helps students manage lecture notes, track progress, schedule study sessions, and analyze performance.

## Features

- **Lecture Management**: Add, edit, and organize lectures by subject
- **Progress Tracking**: Track completion status for all your study materials
- **Revision Marking**: Mark lectures for revision and track revision history
- **Subject Organization**: Categorize lectures by subjects and topics
- **User Authentication**: Secure login and user-specific data storage
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- React with TypeScript
- Vite as build tool
- Tailwind CSS for styling
- Shadcn UI component library
- Supabase for backend and authentication
- React Query for data fetching

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/gate-prep-tracker.git
   cd gate-prep-tracker
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

## Database Setup

The application uses Supabase for data storage. To set up the database:

1. Navigate to the SQL Editor in your Supabase project
2. Run the migration scripts in the following order:
   - `supabase/migrations/20230816000000_create_tables.sql`
   - `supabase/migrations/20230816000001_add_lecture_id_to_notes.sql`
   - `supabase/migrations/20230816000002_update_lectures_table.sql`
   - `supabase/migrations/20230816000003_add_subject_name_to_lectures.sql`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f3d18ebd-3d0e-40db-96cd-35ff5d447d67) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
