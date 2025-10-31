import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { pool } from "../lib/db";

interface NewsletterSubscription {
  id: number;
  email: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  is_active: boolean;
  source: string;
  created_at: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if user is authenticated and is admin
  let isAdmin = false;
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');

    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'http://eclectique-backend:8020'
      : 'http://localhost:8020';

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const response = await fetch(`${backendUrl}/api/auth/me`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const userData = await response.json();
      isAdmin = userData?.is_admin === true;
    }
  } catch (error) {
    console.log('Auth check failed:', error);
  }

  if (!isAdmin) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, email, subscribed_at, unsubscribed_at, is_active, source, created_at 
       FROM newsletter_subscriptions 
       ORDER BY created_at DESC`
    );
    
    // Get stats
    const statsResult = await client.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE is_active = true) as active,
         COUNT(*) FILTER (WHERE is_active = false) as unsubscribed,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days
       FROM newsletter_subscriptions`
    );
    
    return json({ 
      subscriptions: result.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error loading newsletter subscriptions:', error);
    return json({ subscriptions: [], stats: { total: 0, active: 0, unsubscribed: 0, last_30_days: 0 }, error: 'Failed to load subscriptions' });
  } finally {
    client.release();
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action");
  const subscriptionId = formData.get("subscriptionId");

  if (action === "unsubscribe" && subscriptionId) {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE newsletter_subscriptions 
         SET is_active = false, unsubscribed_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [subscriptionId]
      );
      
      return json({ success: "Subscription deactivated" });
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      return json({ error: "Failed to unsubscribe user" }, { status: 500 });
    } finally {
      client.release();
    }
  }

  if (action === "resubscribe" && subscriptionId) {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE newsletter_subscriptions 
         SET is_active = true, subscribed_at = CURRENT_TIMESTAMP, unsubscribed_at = NULL 
         WHERE id = $1`,
        [subscriptionId]
      );
      
      return json({ success: "Subscription reactivated" });
    } catch (error) {
      console.error('Error resubscribing user:', error);
      return json({ error: "Failed to resubscribe user" }, { status: 500 });
    } finally {
      client.release();
    }
  }

  if (action === "delete" && subscriptionId) {
    const client = await pool.connect();
    try {
      await client.query(
        `DELETE FROM newsletter_subscriptions WHERE id = $1`,
        [subscriptionId]
      );
      
      return json({ success: "Subscription deleted permanently" });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return json({ error: "Failed to delete subscription" }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function AdminNewsletter() {
  const { subscriptions, stats, error } = useLoaderData<typeof loader>();
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

  const exportCSV = () => {
    const csvContent = [
      ['Email', 'Status', 'Subscribed Date', 'Source', 'Unsubscribed Date'].join(','),
      ...subscriptions.map((sub: NewsletterSubscription) => [
        sub.email,
        sub.is_active ? 'Active' : 'Unsubscribed',
        new Date(sub.subscribed_at).toLocaleDateString(),
        sub.source,
        sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Subscriptions</h1>
          <p className="mt-2 text-gray-600">Manage newsletter subscribers and view statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Homepage
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Subscriptions</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active Subscribers</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold text-red-600">{stats.unsubscribed}</div>
          <div className="text-sm text-gray-600">Unsubscribed</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.last_30_days}</div>
          <div className="text-sm text-gray-600">Last 30 Days</div>
        </div>
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
        {subscriptions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No newsletter subscriptions</h3>
            <p className="mt-1 text-sm text-gray-500">No one has subscribed to the newsletter yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {subscriptions.map((subscription: NewsletterSubscription) => (
              <li key={subscription.id} className={`px-6 py-4 ${subscription.is_active ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {subscription.email}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscription.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.is_active ? 'Active' : 'Unsubscribed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {subscription.is_active ? (
                          <Form method="post" className="inline">
                            <input type="hidden" name="action" value="unsubscribe" />
                            <input type="hidden" name="subscriptionId" value={subscription.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                              onClick={(e) => {
                                if (!confirm('Are you sure you want to unsubscribe this user?')) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              Unsubscribe
                            </button>
                          </Form>
                        ) : (
                          <Form method="post" className="inline">
                            <input type="hidden" name="action" value="resubscribe" />
                            <input type="hidden" name="subscriptionId" value={subscription.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                            >
                              Resubscribe
                            </button>
                          </Form>
                        )}
                        <Form method="post" className="inline">
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="subscriptionId" value={subscription.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
                            onClick={(e) => {
                              if (!confirm('Are you sure you want to permanently delete this subscription?')) {
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Subscribed: {formatDate(subscription.subscribed_at)}
                      {subscription.unsubscribed_at && (
                        <span className="ml-4 text-red-500">
                          • Unsubscribed: {formatDate(subscription.unsubscribed_at)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Source: {subscription.source} • Created: {formatDate(subscription.created_at)}
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