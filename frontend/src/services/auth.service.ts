import { api } from "./api";
import type {
  LoginRequest,
  LoginResponse,
} from "../types/auth";

export async function login(
  credentials: LoginRequest
) {
  return api<LoginResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  });
}