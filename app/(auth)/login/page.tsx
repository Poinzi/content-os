import { Suspense } from "react";
import { authEnabled } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm authEnabled={authEnabled()} />
    </Suspense>
  );
}
