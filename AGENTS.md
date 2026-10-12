<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# The backend is read-only

The site reads its data from the Finzy backend (`finzygit/finzy-backend`, API at `https://console.finzyapp.com/api`). Verify every endpoint, field, and sort order against the real thing before you write site code: read the backend repository and send `GET` requests to the API. Changes to the backend belong to its own team, so report a needed change to the user and keep your edits inside this repository.
