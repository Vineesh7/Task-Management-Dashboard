import { useState, useCallback, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { useFormValidation } from "../hooks/useFormValidation.ts";
import { FormInput } from "../components/ui/FormInput.tsx";
import { ErrorAlert } from "../components/ui/ErrorAlert.tsx";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const validateRegister = (values: RegisterForm) => {
  const errors: Partial<Record<keyof RegisterForm, string>> = {};

  if (!values.name.trim()) {
    errors.name = "Name is required";
  } else if (values.name.trim().length > 100) {
    errors.name = "Name cannot exceed 100 characters";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { errors, validate, clearField } = useFormValidation(validateRegister);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setServerError(null);

      if (!validate({ name, email, password, confirmPassword })) return;

      setIsSubmitting(true);
      try {
        await register({ name: name.trim(), email, password });
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Registration failed"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, email, password, confirmPassword, register, navigate, validate]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Start managing your projects today
          </p>
        </div>

        {/* ── Server error ─────────────────────────────────────────── */}
        {serverError && <ErrorAlert message={serverError} />}

        {/* ── Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormInput
            id="name"
            label="Full name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            value={name}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              clearField("name");
            }}
          />

          <FormInput
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearField("email");
            }}
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            error={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearField("password");
            }}
          />

          <FormInput
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearField("confirmPassword");
            }}
          />

          {/* ── Password strength hint ─────────────────────────────── */}
          {password.length > 0 && password.length < 6 && !errors.password && (
            <p className="text-xs text-amber-600">
              {6 - password.length} more character{6 - password.length !== 1 ? "s" : ""} needed
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* ── Footer link ──────────────────────────────────────────── */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
