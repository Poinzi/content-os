import { Suspense } from "react";
import { gateEnabled } from "@/lib/auth-gate";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  // Näytetään gateEnabled-tila propina, jotta client tietää onko portti päällä.
  // Ei paljasta itse salasanaa.
  return (
    <Suspense fallback={null}>
      <LoginForm gateEnabled={gateEnabled()} />
    </Suspense>
  );
}
