# QueryCrest onboarding task  

## Architecture description  

The complete flow for this application works as follows: 
1. The user opens index.html in the browser. The page renders a login form and a sign-up form with no database 
connection of its own. 
2. When the user submits the sign-up form, the browser sends a POST request to your auth-handler edge function. The 
edge function validates all inputs, creates the user in Supabase Auth, saves the profile to the profiles table, and returns 
a success or error response. 
3. Upon successful sign-up, the browser redirects the user to the login section of index.html. 
4. When the user logs in, the browser again sends a POST request to auth-handler. The edge function checks for 
lockouts, attempts authentication via Supabase Auth, records the attempt, and on success returns a JWT session 
token. 
5. The browser stores the JWT token in sessionStorage and redirects to dashboard.html. 
6. Every request from dashboard.html to the applications-handler edge function includes the JWT token in the 
Authorization header. The edge function verifies the token before performing any database operation. 
7. When the edge function session verification fails, the user is redirected back to index.html. 

## Setup instructions  

### PHASE 1  Foundation 
Days 1 – 2  |  Database, secrets, and project setup 
1.  Create your Supabase project on the ***free tier*** at supabase.com. 
2.  Run all four SQL statements from Section 3 in the Supabase SQL Editor to create your tables. 
3.  Enable RLS on all four tables as specified in Section 3.5. 
4.  Add all four Supabase secrets from Section 4 in the Edge Functions settings panel. 
5.  Create the directory structure from Section 9 in your local repository. 
6.  Initialise a public GitHub repository named **qc-onboarding-task** and push the empty structure. 
7.  Invite ShogoleThomas (or <shogolethomas325@gmail.com>) as a **collaborator** on the repository before any other work begins.
8.  Test that you can connect to your Supabase project from a basic Deno script locally before writing any edge function logic.

### PHASE 2  Edge Functions 
Days 3 – 4  |  auth-handler and applications-handler 
1.  Write the auth-handler edge function starting with the CORS handler, then the signup action, then the login action with rate limiting. 
2.  Deploy auth-handler using the Supabase CLI: supabase functions deploy auth-handler. 
3.  Test the signup action using a REST client such as Postman or Insomnia before building any frontend. 
4.  Test the login action including all three lockout scenarios: first block, subsequent attempt during block, and long block after expiry. 
5.  Write the applications-handler edge function with JWT verification, then the load action, then the add action with institution validation. 
6.  Deploy applications-handler using the Supabase CLI. 
7.  Test load and add using a REST client with a valid JWT from a test login before building the dashboard. 
8.  Confirm all rate limiting logic works correctly and all four Supabase secrets are being read from environment variables, not hardcoded.

### PHASE 3  Frontend 
Days 5 – 6  |  index.html and dashboard.html 
1.  Build index.html with both login and sign-up forms. Wire the sign-up form to auth-handler and test the full sign-up flow end to end. 
2.  Wire the login form, store the returned token in sessionStorage, and confirm redirect to dashboard.html. 
3.  Build dashboard.html. Implement the session guard that redirects unauthenticated users back to index.html immediately. 
4.  Wire the load action on page load and render the returned applications in the UI. 
5.  Build the Add Application form with the institution dropdown populated from the approved list. 
6.  Wire the add action and confirm new applications appear in the list without a page reload. 
7.  Apply styling across both pages. Both pages must be responsive on mobile screen widths. 
8.  Test all error states: failed signup (duplicate email), wrong password with lockout progression, expired session, and invalid institution.

### PHASE 4  Polish & Submit 
Day 7  |  Final testing, documentation, and PR 
1.  Run a complete end-to-end test: sign up as a new user, log in, add three applications (two drafts, one submitted), log out, log in again and confirm they are still there. 
2.  Test the lockout progression manually: enter the wrong password three times and confirm the 10-minute lock. Wait for expiry and enter wrong password again to confirm the 1-hour lock. 
3.  Confirm no Supabase keys of any kind appear in any frontend JavaScript file. 
4.  Write the README.md with: project description, architecture overview, setup instructions, your Supabase project URL (not any keys), and screenshots of both pages working. 
5.  Push all final code to your repository on main branch. 
6.  Open a Pull Request from **submit/[your-firstname]** targeting main and add **ShogoleThomas as a reviewer**. 
7.  Send the PR link in your **14:00 report** on the final day and to <support@querycrest.com>. 



