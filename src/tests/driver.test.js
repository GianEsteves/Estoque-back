import assert from "node:assert/strict";
import test from "node:test";

import { startServer } from "../../app.js";
import {
  resetFirebaseAuthAdapter,
  setFirebaseAuthAdapter,
} from "../service/firebase-auth.js";
import { prisma } from "../service/prisma.js";
import { waitForServer } from "./helpers/server.js";

/**
 * Envia uma requisicao HTTP JSON para o servidor de teste.
 */
async function request(port, method, path, body, token) {
  const headers = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const responseText = await response.text();

  return {
    status: response.status,
    body: responseText ? JSON.parse(responseText) : undefined,
  };
}

/**
 * Cria usuarios locais para os cenarios autenticados de motorista.
 */
async function createTestUser(suffix, firebaseUid) {
  return prisma.user.create({
    data: {
      firebaseUid,
      name: `Motorista ${suffix}`,
      email: `motorista-${suffix}@example.com`,
      phone: "+55 11 99999-9999",
      profilePhoto: "https://example.com/profile.jpg",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
}

test("cadastro de motorista com varios veiculos", async () => {
  const suffix = Date.now();
  const firstUid = `driver-firebase-${suffix}`;
  const secondUid = `driver-firebase-${suffix}-2`;
  const tokens = new Map([
    ["driver-token", { localId: firstUid, emailVerified: true }],
    ["second-driver-token", { localId: secondUid, emailVerified: true }],
  ]);

  setFirebaseAuthAdapter({
    getAccount(token) {
      return tokens.get(token);
    },
  });

  const firstUser = await createTestUser(suffix, firstUid);
  const secondUser = await createTestUser(`${suffix}-2`, secondUid);
  const server = startServer(0);
  await waitForServer(server);
  const { port } = server.address();
  const cnh = String(suffix).slice(-11);
  const secondCnh = String(BigInt(cnh) + 1n).padStart(11, "0");
  const plateSuffix = String(suffix % 100).padStart(2, "0");
  const firstPlate = `ABC${suffix % 10}D${plateSuffix}`;
  const secondPlate = `DEF${suffix % 10}G${plateSuffix}`;
  const driverData = {
    cnh,
    model: "Honda Civic",
    plate: firstPlate,
    color: "Preto",
    category: "sedan",
  };

  try {
    const unauthorized = await request(
      port,
      "POST",
      "/drivers",
      driverData,
    );
    assert.equal(unauthorized.status, 401);

    const invalid = await request(
      port,
      "POST",
      "/drivers",
      { cnh: "123", model: "Carro" },
      "driver-token",
    );
    assert.equal(invalid.status, 400);

    const created = await request(
      port,
      "POST",
      "/drivers",
      driverData,
      "driver-token",
    );
    assert.equal(created.status, 201);
    assert.equal(created.body.isDriver, true);
    assert.equal(created.body.driverProfile.userId, firstUser.id);
    assert.equal(created.body.driverProfile.vehicles.length, 1);
    assert.equal(created.body.driverProfile.vehicles[0].plate, firstPlate);
    assert.equal(created.body.driverProfile.vehicles[0].category, "SEDAN");

    const duplicateProfile = await request(
      port,
      "POST",
      "/drivers",
      {
        ...driverData,
        cnh: secondCnh,
        plate: secondPlate,
      },
      "driver-token",
    );
    assert.equal(duplicateProfile.status, 409);
    assert.equal(
      duplicateProfile.body.code,
      "DRIVER_PROFILE_ALREADY_EXISTS",
    );

    const duplicatePlate = await request(
      port,
      "POST",
      "/drivers",
      {
        ...driverData,
        cnh: secondCnh,
      },
      "second-driver-token",
    );
    assert.equal(duplicatePlate.status, 409);
    assert.equal(
      duplicatePlate.body.code,
      "VEHICLE_PLATE_ALREADY_EXISTS",
    );

    const secondVehicle = await request(
      port,
      "POST",
      "/drivers/vehicles",
      {
        model: "Jeep Compass",
        plate: secondPlate,
        color: "Branco",
        category: "SUV",
      },
      "driver-token",
    );
    assert.equal(secondVehicle.status, 201);
    assert.equal(secondVehicle.body.vehicle.plate, secondPlate);

    const vehicles = await request(
      port,
      "GET",
      "/drivers/vehicles",
      undefined,
      "driver-token",
    );
    assert.equal(vehicles.status, 200);
    assert.equal(vehicles.body.vehicles.length, 2);

    const unknownVehicle = await request(
      port,
      "DELETE",
      "/drivers/vehicles/vehicle-inexistente",
      undefined,
      "driver-token",
    );
    assert.equal(unknownVehicle.status, 404);
    assert.equal(unknownVehicle.body.code, "VEHICLE_NOT_FOUND");

    const deletedVehicle = await request(
      port,
      "DELETE",
      `/drivers/vehicles/${secondVehicle.body.vehicle.id}`,
      undefined,
      "driver-token",
    );
    assert.equal(deletedVehicle.status, 204);

    const vehiclesAfterDeletion = await request(
      port,
      "GET",
      "/drivers/vehicles",
      undefined,
      "driver-token",
    );
    assert.equal(vehiclesAfterDeletion.status, 200);
    assert.equal(vehiclesAfterDeletion.body.vehicles.length, 1);
    assert.equal(vehiclesAfterDeletion.body.vehicles[0].plate, firstPlate);

    const profile = await request(
      port,
      "GET",
      "/drivers/me",
      undefined,
      "driver-token",
    );
    assert.equal(profile.status, 200);
    assert.equal(profile.body.isDriver, true);
    assert.equal(profile.body.driverProfile.vehicles.length, 1);

    const nonDriver = await request(
      port,
      "GET",
      "/drivers/me",
      undefined,
      "second-driver-token",
    );
    assert.equal(nonDriver.status, 200);
    assert.equal(nonDriver.body.isDriver, false);
    assert.equal(nonDriver.body.driverProfile, null);
  } finally {
    resetFirebaseAuthAdapter();
    await prisma.user.deleteMany({
      where: { id: { in: [firstUser.id, secondUser.id] } },
    });
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
