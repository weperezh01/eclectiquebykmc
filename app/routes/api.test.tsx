import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ message: "API test endpoint working", timestamp: new Date().toISOString() });
}

export async function action({ request }: ActionFunctionArgs) {
  return json({ message: "API test action working", method: request.method });
}