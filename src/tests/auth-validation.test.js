import assert from "node:assert/strict";
import test from "node:test";

import { registerValidation } from "../application/auth/validation/user.validation.js";

const registration = {
  name: "Usuario de Teste",
  email: "usuario@example.com",
  password: "SenhaSegura@123",
  phone: "+55 11 99999-9999",
};

test("cadastro aceita o formulario sem foto de perfil", async () => {
  const validated = await registerValidation.validate(registration);

  assert.deepEqual(validated, registration);
});

test("cadastro aceita foto opcional nula ou em branco", async () => {
  for (const profilePhoto of [undefined, null, "", "   "]) {
    const validated = await registerValidation.validate({
      ...registration,
      profilePhoto,
    });

    assert.equal(
      validated.profilePhoto,
      typeof profilePhoto === "string" ? profilePhoto.trim() : profilePhoto,
    );
  }
});

test("cadastro aceita e normaliza foto com URL HTTPS", async () => {
  const validated = await registerValidation.validate({
    ...registration,
    profilePhoto: "  https://example.com/profile.jpg  ",
  });

  assert.equal(validated.profilePhoto, "https://example.com/profile.jpg");
});

test("cadastro rejeita foto preenchida com URL invalida ou sem HTTPS", async () => {
  for (const profilePhoto of [
    "foto-invalida",
    "http://example.com/profile.jpg",
    "ftp://example.com/profile.jpg",
    "//example.com/profile.jpg",
  ]) {
    await assert.rejects(
      registerValidation.validate({ ...registration, profilePhoto }),
      (error) =>
        error.name === "ValidationError" && error.path === "profilePhoto",
    );
  }
});
