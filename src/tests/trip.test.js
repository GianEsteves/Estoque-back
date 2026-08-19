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
 * Envia uma requisicao JSON para o backend iniciado durante o teste.
 */
async function request(port, path, body, token) {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:${port}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

/**
 * Envia uma requisicao PATCH JSON para alterar uma viagem.
 */
async function patchRequest(port, path, body, token) {
  const response = await fetch(`http://localhost:${port}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

/**
 * Formata uma data deslocada da data atual no padrao aceito pela API.
 */
function getDateWithOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Cria um usuario local verificado para os testes de viagem.
 */
function createTestUser(suffix, firebaseUid, role) {
  return prisma.user.create({
    data: {
      firebaseUid,
      name: `${role} ${suffix}`,
      email: `${role.toLowerCase()}-${suffix}@example.com`,
      phone: "+55 11 99999-9999",
      profilePhoto: "https://example.com/profile.jpg",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
}

test("cadastro de viagens aplica regras de motorista e validacoes", async () => {
  const suffix = Date.now();
  const driverUid = `trip-driver-${suffix}`;
  const passengerUid = `trip-passenger-${suffix}`;
  const tokens = new Map([
    ["trip-driver-token", { localId: driverUid, emailVerified: true }],
    [
      "trip-passenger-token",
      { localId: passengerUid, emailVerified: true },
    ],
  ]);

  setFirebaseAuthAdapter({
    getAccount(token) {
      return tokens.get(token);
    },
  });

  const driverUser = await createTestUser(suffix, driverUid, "Motorista");
  const passengerUser = await createTestUser(
    suffix,
    passengerUid,
    "Passageiro",
  );
  const cnh = String(suffix).slice(-11);
  const plateSuffix = String(suffix % 100).padStart(2, "0");
  const driverProfile = await prisma.driverProfile.create({
    data: {
      cnh,
      userId: driverUser.id,
      vehicles: {
        create: {
          model: "Honda Civic",
          plate: `TRP${suffix % 10}T${plateSuffix}`,
          color: "Preto",
          category: "SEDAN",
        },
      },
    },
    include: { vehicles: true },
  });
  const driverVehicle = driverProfile.vehicles[0];
  const server = startServer(0);
  await waitForServer(server);
  const { port } = server.address();
  const validTrip = {
    vehicleId: driverVehicle.id,
    origin: "Sao Paulo - SP",
    destination: "Campinas - SP",
    date: getDateWithOffset(2),
    time: "08:30",
    price: 35.5,
    maxPassengers: 3,
    description: "Uma parada rapida no caminho.",
    boardingPoints: ["Metro Tiete", "Shopping Center Norte"],
    dropoffPoints: ["Rodoviaria de Campinas"],
  };

  try {
    const unauthenticated = await request(
      port,
      "/trips",
      validTrip,
    );
    assert.equal(unauthenticated.status, 401);

    const passengerAttempt = await request(
      port,
      "/trips",
      validTrip,
      "trip-passenger-token",
    );
    assert.equal(passengerAttempt.status, 403);
    assert.equal(
      passengerAttempt.body.code,
      "DRIVER_PROFILE_REQUIRED",
    );

    const foreignDriverProfile = await prisma.driverProfile.create({
      data: {
        cnh: String(BigInt(cnh) + 1n).padStart(11, "0"),
        userId: passengerUser.id,
        vehicles: {
          create: {
            model: "Toyota Corolla",
            plate: `FOR${suffix % 10}G${plateSuffix}`,
            color: "Prata",
            category: "SEDAN",
          },
        },
      },
      include: { vehicles: true },
    });

    const foreignVehicleAttempt = await request(
      port,
      "/trips",
      {
        ...validTrip,
        vehicleId: foreignDriverProfile.vehicles[0].id,
      },
      "trip-driver-token",
    );
    assert.equal(foreignVehicleAttempt.status, 404);
    assert.equal(foreignVehicleAttempt.body.code, "VEHICLE_NOT_FOUND");

    const missingFields = await request(
      port,
      "/trips",
      { description: "Sem campos obrigatorios" },
      "trip-driver-token",
    );
    assert.equal(missingFields.status, 400);
    assert.equal(missingFields.body.code, "VALIDATION_ERROR");

    const pastTrip = await request(
      port,
      "/trips",
      {
        ...validTrip,
        date: getDateWithOffset(-2),
      },
      "trip-driver-token",
    );
    assert.equal(pastTrip.status, 400);
    assert.equal(pastTrip.body.code, "TRIP_DATE_IN_PAST");

    const negativePrice = await request(
      port,
      "/trips",
      {
        ...validTrip,
        price: -1,
      },
      "trip-driver-token",
    );
    assert.equal(negativePrice.status, 400);
    assert.equal(negativePrice.body.code, "VALIDATION_ERROR");

    const invalidPassengerLimit = await request(
      port,
      "/trips",
      {
        ...validTrip,
        maxPassengers: 0,
      },
      "trip-driver-token",
    );
    assert.equal(invalidPassengerLimit.status, 400);
    assert.equal(invalidPassengerLimit.body.code, "VALIDATION_ERROR");

    const created = await request(
      port,
      "/trips",
      validTrip,
      "trip-driver-token",
    );
    assert.equal(created.status, 201);
    assert.equal(created.body.trip.driverProfileId, driverProfile.id);
    assert.equal(created.body.trip.vehicleId, driverVehicle.id);
    assert.equal(created.body.trip.vehicle.model, "Honda Civic");
    assert.equal(created.body.trip.vehicle.plate, driverVehicle.plate);
    assert.equal(created.body.trip.status, "AVAILABLE");
    assert.equal(created.body.trip.price, 35.5);
    assert.equal(created.body.trip.maxPassengers, 3);
    assert.equal(created.body.trip.points.length, 3);
    assert.equal(created.body.trip.points[0].type, "PICKUP");
    assert.equal(created.body.trip.points[2].type, "DROPOFF");

    const storedTrip = await prisma.trip.findUnique({
      where: { id: created.body.trip.id },
      include: { points: true, vehicle: true },
    });
    assert.ok(storedTrip);
    assert.equal(storedTrip.status, "AVAILABLE");
    assert.equal(storedTrip.vehicleId, driverVehicle.id);
    assert.equal(storedTrip.vehicle.plate, driverVehicle.plate);
    assert.equal(storedTrip.points.length, 3);

    const foreignUpdate = await patchRequest(
      port,
      `/trips/${created.body.trip.id}`,
      { time: "10:45" },
      "trip-passenger-token",
    );
    assert.equal(foreignUpdate.status, 404);
    assert.equal(foreignUpdate.body.code, "TRIP_NOT_FOUND");

    const invalidUpdate = await patchRequest(
      port,
      `/trips/${created.body.trip.id}`,
      { time: "25:80" },
      "trip-driver-token",
    );
    assert.equal(invalidUpdate.status, 400);
    assert.equal(invalidUpdate.body.code, "VALIDATION_ERROR");

    const updated = await patchRequest(
      port,
      `/trips/${created.body.trip.id}`,
      {
        time: "10:45",
        price: 42,
        description: "Horario atualizado.",
        boardingPoints: ["Metro Tiete"],
      },
      "trip-driver-token",
    );
    assert.equal(updated.status, 200);
    assert.equal(updated.body.trip.price, 42);
    assert.equal(updated.body.trip.description, "Horario atualizado.");
    assert.equal(updated.body.trip.points.length, 2);
    assert.match(updated.body.trip.departureAt, /T13:45:00\.000Z$/);

    const cancelled = await patchRequest(
      port,
      `/trips/${created.body.trip.id}/cancel`,
      {},
      "trip-driver-token",
    );
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.trip.status, "CANCELLED");

    const persistedCancelledTrip = await prisma.trip.findUnique({
      where: { id: created.body.trip.id },
    });
    assert.ok(persistedCancelledTrip);
    assert.equal(persistedCancelledTrip.status, "CANCELLED");

    const updateAfterCancellation = await patchRequest(
      port,
      `/trips/${created.body.trip.id}`,
      { time: "11:00" },
      "trip-driver-token",
    );
    assert.equal(updateAfterCancellation.status, 409);
    assert.equal(
      updateAfterCancellation.body.code,
      "TRIP_NOT_EDITABLE",
    );

    const repeatedCancellation = await patchRequest(
      port,
      `/trips/${created.body.trip.id}/cancel`,
      {},
      "trip-driver-token",
    );
    assert.equal(repeatedCancellation.status, 409);
    assert.equal(
      repeatedCancellation.body.code,
      "TRIP_ALREADY_CANCELLED",
    );

    const vehicleDeletion = await fetch(
      `http://localhost:${port}/drivers/vehicles/${driverVehicle.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer trip-driver-token",
        },
      },
    );
    const vehicleDeletionBody = await vehicleDeletion.json();
    assert.equal(vehicleDeletion.status, 409);
    assert.equal(vehicleDeletionBody.code, "VEHICLE_HAS_TRIPS");
  } finally {
    resetFirebaseAuthAdapter();
    await prisma.user.deleteMany({
      where: { id: { in: [driverUser.id, passengerUser.id] } },
    });
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
