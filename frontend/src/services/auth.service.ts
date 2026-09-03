import { api } from "./api";
import type {
  LoginRequest,
  LoginResponse,
  User,
} from "../types/auth";

export async function login(
  credentials: LoginRequest
) {
  return api<LoginResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export async function getCurrentUser() {
  return api<{ user: User }>("/auth/me");
}