"use server";

import { redirect } from "next/navigation";
import { registerSchema, loginSchema } from "@/lib/validators/auth";
import { fieldErrors, readForm } from "@/lib/validators/helpers";
import { registerUser, loginUser, destroyUserSession } from "@/lib/mysql-auth";
import { getCurrentPanitia, getOwnerGroup } from "@/lib/auth";

function failure(message, values = {}, errors = {}) {
  return { ok: false, message, errors, values };
}

function safeNext(value) {
  return typeof value === "string" && value.startsWith("/join?token=") ? value : null;
}

export async function register(prevState, formData) {
  const raw = readForm(formData, ["email", "password", "confirmPassword", "next"]);
  const values = { email: raw.email };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return failure("Periksa kembali isian Anda.", values, fieldErrors(parsed.error));
  }

  try {
    const result = await registerUser(parsed.data.email, parsed.data.password);
    if (!result.ok && result.reason === "email_exists") {
      return failure("Email ini sudah terdaftar. Silakan masuk.", values);
    }
  } catch (error) {
    console.error("[register]", error.code, error.message);
    return failure("Pendaftaran gagal. Silakan coba lagi.", values);
  }

  redirect(safeNext(raw.next) ?? "/onboarding");
}

export async function login(prevState, formData) {
  const raw = readForm(formData, ["email", "password", "next"]);
  const values = { email: raw.email };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return failure("Periksa kembali isian Anda.", values, fieldErrors(parsed.error));
  }

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    if (!result.ok) return failure("Email atau password salah.", values);
  } catch (error) {
    console.error("[login]", error.code, error.message);
    return failure("Login gagal. Silakan coba lagi.", values);
  }

  const next = safeNext(raw.next);
  if (next) redirect(next);
  const panitia = await getCurrentPanitia();
  if (panitia) redirect("/panitia");
  const group = await getOwnerGroup();
  redirect(group ? "/dashboard" : "/onboarding");
}

export async function logout() {
  await destroyUserSession();
  redirect("/login");
}
