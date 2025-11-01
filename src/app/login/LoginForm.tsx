"use client";

import { useState } from "react";
import { login } from "./action";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, setState] = useState<{ errors?: Record<string, string[]> }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(state, formData);

    if (result?.errors) {
      setState(result);
    } else {
      setState({});
    }

    setLoading(false);
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-sm flex-col items-center justify-center",
        className,
      )}
      {...props}
    >
      <Card className="w-full rounded-2xl border border-gray-200 bg-white/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-md">
            DS
          </div>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Selamat Datang di Dunia Sembako
          </CardTitle>
          <CardDescription className="text-gray-500">
            Kepuasan dan kepercayaan pelanggan adalah prioritas kami
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              {/* Username */}
              <Field>
                <FieldLabel htmlFor="username" className="text-gray-700">
                  Username
                </FieldLabel>
                <Input
                  id="username"
                  name="username"
                  placeholder="Masukkan username"
                  className="rounded-2xl placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  disabled={loading}
                />
                {state?.errors?.username && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(state.errors.username)
                      ? state.errors.username[0]
                      : state.errors.username}
                  </p>
                )}
              </Field>

              {/* Password */}
              <Field className="relative">
                <FieldLabel htmlFor="password" className="text-gray-700">
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Masukkan password"
                  className="rounded-2xl pr-10 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  disabled={loading}
                />

                {state?.errors?.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(state.errors.password)
                      ? state.errors.password[0]
                      : state.errors.password}
                  </p>
                )}
              </Field>
            </FieldGroup>

            {/* Tombol Login */}
            <Field>
              <Button
                type="submit"
                className="w-full rounded-2xl bg-blue-600 text-white transition-colors duration-200 hover:cursor-pointer hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Login"}
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-white">
        © {new Date().getFullYear()} Dunia Sembako Mart
      </p>
    </div>
  );
}
