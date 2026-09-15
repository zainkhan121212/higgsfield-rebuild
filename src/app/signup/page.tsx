import type { Metadata } from "next";
import { AuthPage } from "@/components/shell/auth-page";

export const metadata: Metadata = { title: "Sign up" };
export default function Signup() {
  return <AuthPage mode="signup" />;
}
