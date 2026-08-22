import { useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, KeyRound, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import "@/email-auth.css";

type AuthMode = "signIn" | "register";

export function EmailAuthScreen({ onAuthenticated, loading }: { onAuthenticated: () => void; loading: boolean }) {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [offerPasskey, setOfferPasskey] = useState(false);
  const utils = trpc.useUtils();
  const register = trpc.auth.register.useMutation();
  const signIn = trpc.auth.signIn.useMutation();
  const passkeyOptions = trpc.auth.passkeyAuthenticationOptions.useMutation();
  const passkeyVerify = trpc.auth.passkeyAuthenticationVerify.useMutation();
  const registrationOptions = trpc.auth.passkeyRegistrationOptions.useMutation();
  const registrationVerify = trpc.auth.passkeyRegistrationVerify.useMutation();
  const passkeySupported = typeof window !== "undefined" && "PublicKeyCredential" in window;
  const pending = loading || register.isPending || signIn.isPending || passkeyOptions.isPending || passkeyVerify.isPending || registrationOptions.isPending || registrationVerify.isPending;

  async function refreshAndContinue() {
    await utils.auth.me.invalidate();
    onAuthenticated();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "register" && password !== confirmPassword) return toast.error("Passwords do not match");
    if (mode === "register" && password.length < 12) return toast.error("Use at least 12 characters for your password");
    const result = mode === "register" ? await register.mutateAsync({ email, password }) : await signIn.mutateAsync({ email, password });
    if (!result.ok) return toast.error(result.code === "EMAIL_EXISTS" ? "An account already uses that email" : result.code === "TEMPORARILY_LOCKED" ? "Too many attempts. Please wait and try again." : "Email or password is incorrect");
    if (mode === "register" && passkeySupported) {
      setOfferPasskey(true);
      return;
    }
    await refreshAndContinue();
  }

  async function signInWithPasskey() {
    if (!email) return toast.error("Enter your account email first");
    try {
      const started = await passkeyOptions.mutateAsync({ email });
      if (!started.ok) return toast.error("No Face ID or passkey is set up for this email yet");
      const response = await startAuthentication({ optionsJSON: started.options });
      const finished = await passkeyVerify.mutateAsync({ email, response: response as unknown as { id: string } & Record<string, unknown> });
      if (!finished.ok) return toast.error("Face ID or passkey verification did not complete");
      await refreshAndContinue();
    } catch {
      toast.error("Face ID or device passkey was cancelled or unavailable");
    }
  }

  async function enrollPasskey() {
    try {
      const options = await registrationOptions.mutateAsync();
      const response = await startRegistration({ optionsJSON: options });
      const finished = await registrationVerify.mutateAsync({ response });
      if (!finished.ok) return toast.error("Could not save this device passkey");
      toast.success("Face ID / device passkey is ready");
      await refreshAndContinue();
    } catch {
      toast.error("Face ID or device passkey setup was cancelled or unavailable");
    }
  }

  if (offerPasskey) return <div className="email-auth-shell"><div className="email-auth-grid" /><main className="email-auth-card email-auth-success"><div className="email-auth-icon"><Fingerprint /></div><p className="pulse-kicker">Account created</p><h1>Use <em>Face ID</em><br />next time.</h1><p>Save a passkey on this device for quick, passwordless Gym Optimizer sign-in. Your device may use Face ID, Touch ID, or its secure screen lock.</p><button onClick={enrollPasskey} disabled={pending}><Fingerprint className="h-4 w-4" /> Enable Face ID / passkey</button><button className="email-auth-secondary" onClick={refreshAndContinue} disabled={pending}>Continue with email</button><a className="mt-6 block text-center text-[10px] font-bold uppercase tracking-[.08em] text-[#7894b1] hover:text-white" href="https://localforgeweb.com" target="_blank" rel="noreferrer">Built by Gabe Naim-LocalForgeWeb</a></main></div>;

  return <div className="email-auth-shell"><div className="email-auth-grid" /><header className="email-auth-brand"><img src="/manus-storage/gym-optimizer-logo_32341cfa.png" alt="Gym Optimizer logo" /><div><strong>Gym Optimizer</strong><span>Private athlete workspace</span></div></header><main className="email-auth-card"><p className="pulse-kicker">Athlete account / secure access</p><h1>{mode === "signIn" ? <>Train on your<br /><em>own account.</em></> : <>Start your<br /><em>training record.</em></>}</h1><p>Use your Gym Optimizer email account to keep plans, equipment settings, favorites, and workout history private to you.</p><form onSubmit={submit}><label><span>Email</span><div><Mail className="h-4 w-4" /><input autoComplete="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></div></label><label><span>Password</span><div><KeyRound className="h-4 w-4" /><input autoComplete={mode === "signIn" ? "current-password" : "new-password"} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 12 characters" : "Your password"} required /></div></label>{mode === "register" && <label><span>Confirm password</span><div><ShieldCheck className="h-4 w-4" /><input autoComplete="new-password" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Repeat password" required /></div></label>}<button type="submit" disabled={pending}>{mode === "signIn" ? "Sign in with email" : "Create email account"} <Sparkles className="h-4 w-4" /></button></form>{passkeySupported && <button className="email-auth-passkey" onClick={signInWithPasskey} disabled={pending}><Fingerprint className="h-4 w-4" /> Sign in with Face ID / passkey</button>}<button className="email-auth-switch" onClick={() => { setMode(mode === "signIn" ? "register" : "signIn"); setPassword(""); setConfirmPassword(""); }} disabled={pending}>{mode === "signIn" ? "Need an account? Create one" : "Already have an account? Sign in"}</button><small>Your password is stored as a secure one-way hash. Face ID stays on your device; Gym Optimizer receives only your passkey verification.</small><a className="mt-6 block text-center text-[10px] font-bold uppercase tracking-[.08em] text-[#7894b1] hover:text-white" href="https://localforgeweb.com" target="_blank" rel="noreferrer">Built by Gabe Naim-LocalForgeWeb</a></main></div>;
}
