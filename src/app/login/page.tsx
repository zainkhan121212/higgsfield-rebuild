import type { Metadata } from "next";
import { AuthPage } from "@/components/shell/auth-page";

export const metadata: Metadata = { title: "Log in" };
export default function Login() {
  return <AuthPage mode="login" />;
}
