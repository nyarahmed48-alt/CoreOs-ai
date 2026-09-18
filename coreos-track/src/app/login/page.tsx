import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Sign in · CoreOs Track" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
