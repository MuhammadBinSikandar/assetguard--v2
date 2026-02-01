import { redirect } from "next/navigation"

export default function RegisterIndexPage() {
  // Redirect to new user registration page
  redirect("/auth/register")
}
