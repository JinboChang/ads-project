
"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSignupMutation } from "@/features/onboarding/hooks/useSignupMutation";
import {
  SignupRequestSchema,
  roleTypeValues,
  verificationMethodValues,
  type RoleType,
  type VerificationMethod,
} from "@/features/onboarding/lib/dto";

const signupFormSchema = SignupRequestSchema.extend({
  confirmPassword: z
    .string()
    .min(8, "Password must be at least 8 characters."),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    });
  }
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;

const defaultValues: SignupFormValues = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  roleType: roleTypeValues[0],
  verificationMethod: verificationMethodValues[0],
};

const REDIRECT_DELAY_MS = 1500;

const roleLabels: Record<RoleType, string> = {
  influencer: "Influencer",
  advertiser: "Advertiser",
};

const verificationLabels: Record<VerificationMethod, string> = {
  email: "Email verification",
  sms: "SMS verification",
};

export const SignupForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const {
    mutateAsync,
    isPending,
    isError,
    error,
  } = useSignupMutation();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues,
  });

  const redirectTarget = useMemo(
    () => searchParams.get("redirectedFrom") ?? null,
    [searchParams],
  );

  const handleSubmit = useCallback(
    async (values: SignupFormValues) => {
      setFeedbackMessage(null);

      try {
        const result = await mutateAsync({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          phone: values.phone,
          roleType: values.roleType,
          verificationMethod: values.verificationMethod,
        });

        const nextPath = redirectTarget ?? result.nextPath;

        setFeedbackMessage(
          "Sign-up complete. Please check your email to verify your account.",
        );

        await new Promise((resolve) => {
          setTimeout(resolve, REDIRECT_DELAY_MS);
        });

        router.replace(nextPath);
      } catch (submitError) {
        console.error(submitError);
        setFeedbackMessage(null);
      }
    },
    [mutateAsync, redirectTarget, router],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">Sign up</h1>
        <p className="text-slate-500">Enter your details and choose a role to start onboarding.</p>
      </header>
      <div className="grid w-full gap-8 md:grid-cols-2">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Full name
            <input
              type="text"
              autoComplete="name"
              {...form.register("fullName")}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              disabled={isPending}
            />
            {form.formState.errors.fullName ? (
              <span className="text-xs text-rose-500">
                {form.formState.errors.fullName.message}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Phone number
            <input
              type="tel"
              autoComplete="tel"
              {...form.register("phone")}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              disabled={isPending}
            />
            {form.formState.errors.phone ? (
              <span className="text-xs text-rose-500">
                {form.formState.errors.phone.message}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Email
            <input
              type="email"
              autoComplete="email"
              {...form.register("email")}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              disabled={isPending}
            />
            {form.formState.errors.email ? (
              <span className="text-xs text-rose-500">
                {form.formState.errors.email.message}
              </span>
            ) : null}
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Password
              <input
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
                className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                disabled={isPending}
              />
              {form.formState.errors.password ? (
                <span className="text-xs text-rose-500">
                  {form.formState.errors.password.message}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                {...form.register("confirmPassword")}
                className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                disabled={isPending}
              />
              {form.formState.errors.confirmPassword ? (
                <span className="text-xs text-rose-500">
                  {form.formState.errors.confirmPassword.message}
                </span>
              ) : null}
            </label>
          </div>
          <fieldset className="flex flex-col gap-3 rounded-md border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-700">
              Choose a role
            </legend>
            {roleTypeValues.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value={value}
                  {...form.register("roleType")}
                  disabled={isPending}
                  className="h-4 w-4"
                />
                <span>{roleLabels[value]}</span>
              </label>
            ))}
            {form.formState.errors.roleType ? (
              <span className="text-xs text-rose-500">
                {form.formState.errors.roleType.message}
              </span>
            ) : null}
          </fieldset>
          <fieldset className="flex flex-col gap-3 rounded-md border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-700">
              Verification method
            </legend>
            {verificationMethodValues.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value={value}
                  {...form.register("verificationMethod")}
                  disabled={isPending}
                  className="h-4 w-4"
                />
                <span>{verificationLabels[value]}</span>
              </label>
            ))}
            {form.formState.errors.verificationMethod ? (
              <span className="text-xs text-rose-500">
                {form.formState.errors.verificationMethod.message}
              </span>
            ) : null}
          </fieldset>
          {isError ? (
            <p className="text-sm text-rose-500">{error?.message}</p>
          ) : null}
          {feedbackMessage ? (
            <p className="text-sm text-emerald-600">{feedbackMessage}</p>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? "Signing you up..." : "Sign up"}
          </button>
        </form>
        <figure className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
          <Image
            src="https://picsum.photos/seed/onboarding-signup/640/640"
            alt="Sign-up illustration"
            width={640}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>
    </div>
  );
};




