import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { pool } from "../lib/db";

interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, name, email, message, created_at, read_at 
       FROM contact_submissions 
       ORDER BY created_at DESC`
    );
    
    return json({ submissions: result.rows });
  } catch (error) {
    console.error('Error loading contact submissions:', error);
    return json({ submissions: [], error: 'Failed to load submissions' });
  } finally {
    client.release();
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action");
  const submissionId = formData.get("submissionId");

  if (action === "markAsRead" && submissionId) {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE contact_submissions SET read_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [submissionId]
      );
      
      return json({ success: "Marked as read" });
    } catch (error) {
      console.error('Error marking submission as read:', error);
      return json({ error: "Failed to mark as read" }, { status: 500 });
    } finally {
      client.release();
    }
  }

  if (action === "delete" && submissionId) {
    const client = await pool.connect();
    try {
      await client.query(
        `DELETE FROM contact_submissions WHERE id = $1`,
        [submissionId]
      );
      
      return json({ success: "Submission deleted" });
    } catch (error) {
      console.error('Error deleting submission:', error);
      return json({ error: "Failed to delete submission" }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function AdminContact() {
  const { submissions, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ success?: string; error?: string }>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contact Submissions</h1>
          <p className="mt-2 text-gray-600">Manage and view contact form submissions</p>
        </div>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Contact Page
        </a>
      </div>

      {actionData?.success && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-green-800">{actionData.success}</p>
        </div>
      )}

      {actionData?.error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-red-800">{actionData.error}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contact submissions</h3>
            <p className="mt-1 text-sm text-gray-500">No one has submitted the contact form yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {submissions.map((submission: ContactSubmission) => (
              <li key={submission.id} className={`px-6 py-4 ${!submission.read_at ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {submission.name}
                        </h3>
                        {!submission.read_at && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!submission.read_at && (
                          <Form method="post" className="inline">
                            <input type="hidden" name="action" value="markAsRead" />
                            <input type="hidden" name="submissionId" value={submission.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                            >
                              Mark as Read
                            </button>
                          </Form>
                        )}
                        <Form method="post" className="inline">
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="submissionId" value={submission.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                            onClick={(e) => {
                              if (!confirm('Are you sure you want to delete this submission?')) {
                                e.preventDefault();
                              }
                            }}
                          >
                            Delete
                          </button>
                        </Form>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <a href={`mailto:${submission.email}`} className="hover:underline">
                        {submission.email}
                      </a>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(submission.created_at)}
                      {submission.read_at && (
                        <span className="ml-4 text-gray-400">
                          • Read on {formatDate(submission.read_at)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {submission.message}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}