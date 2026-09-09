# SDG Connect

## Run locally

1. Install Node.js and PostgreSQL.
2. From this directory, install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in this directory (or copy from `.env.example`) and set your PostgreSQL password:

   ```sh
   DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/sdg_connect
   ```

4. Start the server:

   ```sh
   npm start
   ```

The server creates the `sdg_connect` database and its `app_state` table on first run, then seeds the existing demo data. Open `http://localhost:3000`.

Demo accounts use password `password123`:

- Student: `1RV22CS045`
- Faculty: `sarah.johnson@campus.edu`

## College workspaces

The platform supports separate college workspaces, similar to Google Classroom. Faculty can join an existing workspace with its join code or select **Create a new college workspace** during registration. Students register or sign in with the join code provided by their college faculty.

The seeded demo workspace uses join code `CAMPUS001`. Users, tasks, quizzes, submissions, points, and leaderboards are scoped to the active college workspace.

Faculty can create separate classes from the Faculty Portal. Each class has its own join code, roster, activities, projects, quizzes, submissions, and progress view. The seeded demo class uses join code `CLASS001`.

Class codes are now optional during initial login and registration. Users first enter the college workspace, then students join a class from their dashboard and faculty create classes from the Faculty Portal.

## Claude task suggestions

Automatic task assignment calls the Node endpoint `/api/ai/task-suggestion`, which sends the student's skills, interests, SDG coverage, and the SDG catalogue to Claude. The API key stays on the server; it is never included in browser code. Configure `ANTHROPIC_API_KEY` and optionally `ANTHROPIC_MODEL` before starting the server. If the key is missing or the provider is unavailable, the existing local task generator is used.# AI_SDG
