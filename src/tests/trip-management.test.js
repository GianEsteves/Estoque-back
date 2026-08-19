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
 * Envia uma requisicao HTTP autenticada para o servidor de teste.
 */
async function request(port, method, path, token, body) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`http://localhost:${port}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const responseText = await response.text();

  return {
    status: response.status,
    body: responseText ? JSON.parse(responseText) : undefined,
  };
}

/**
 * Cria um usuario local verificado para o cenario de gerenciamento.
 */
function createUser(suffix, identifier, name) {
  return prisma.user.create({
    data: {
      firebaseUid: `management-${identifier}-${suffix}`,
      name,
      email: `management-${identifier}-${suffix}@example.com`,
      phone: "+55 11 99999-9999",
      profilePhoto: `https://example.com/${identifier}.jpg`,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
}

test("motorista gerencia solicitacoes, passageiros e ganhos", async () => {
  const suffix = Date.now();
  const owner = await createUser(suffix, "owner", "Motorista Principal");
  const otherDriver = await createUser(
    suffix,
    "other-driver",
    "Outro Motorista",
  );
  const passengerOne = await createUser(
    suffix,
    "passenger-one",
    "Passageiro Um",
  );
  const passengerTwo = await createUser(
    suffix,
    "passenger-two",
    "Passageiro Dois",
  );
  const passengerThree = await createUser(
    suffix,
    "passenger-three",
    "Passageiro Tres",
  );
  const passengerFour = await createUser(
    suffix,
    "passenger-four",
    "Passageiro Quatro",
  );
  const tokens = new Map([
    [
      "management-owner-token",
      { localId: owner.firebaseUid, emailVerified: true },
    ],
    [
      "management-other-token",
      { localId: otherDriver.firebaseUid, emailVerified: true },
    ],
  ]);

  setFirebaseAuthAdapter({
    getAccount(token) {
      return tokens.get(token);
    },
  });

  const ownerProfile = await prisma.driverProfile.create({
    data: {
      cnh: String(suffix).slice(-11),
      userId: owner.id,
      vehicles: {
        create: {
          model: "Honda Civic",
          plate: `MGT${suffix % 10}A${String(suffix % 100).padStart(2, "0")}`,
          color: "Preto",
          category: "SEDAN",
        },
      },
    },
    include: { vehicles: true },
  });
  await prisma.driverProfile.create({
    data: {
      cnh: String(BigInt(String(suffix).slice(-11)) + 1n).padStart(11, "0"),
      userId: otherDriver.id,
      vehicles: {
        create: {
          model: "Jeep Compass",
          plate: `OTH${suffix % 10}B${String(suffix % 100).padStart(2, "0")}`,
          color: "Branco",
          category: "SUV",
        },
      },
    },
  });

  const trip = await prisma.trip.create({
    data: {
      origin: "Sao Paulo - SP",
      destination: "Campinas - SP",
      departureAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      price: 50,
      maxPassengers: 2,
      availableSeats: 2,
      description: "Viagem para gerenciamento",
      driverProfileId: ownerProfile.id,
      vehicleId: ownerProfile.vehicles[0].id,
    },
  });
  const [firstRequest, secondRequest, thirdRequest] =
    await Promise.all([
      prisma.tripRequest.create({
        data: {
          tripId: trip.id,
          passengerId: passengerOne.id,
          amount: 50,
          paymentStatus: "PAID",
          pickupLocation: "Metro Tiete",
          dropoffLocation: "Centro de Campinas",
          requestedPickupLocation: "Shopping Center Norte",
        },
      }),
      prisma.tripRequest.create({
        data: {
          tripId: trip.id,
          passengerId: passengerTwo.id,
          amount: 50,
          paymentStatus: "PENDING",
          pickupLocation: "Metro Tiete",
          dropoffLocation: "Rodoviaria de Campinas",
        },
      }),
      prisma.tripRequest.create({
        data: {
          tripId: trip.id,
          passengerId: passengerThree.id,
          amount: 50,
          paymentStatus: "PAID",
          pickupLocation: "Barra Funda",
          dropoffLocation: "Centro de Campinas",
        },
      }),
    ]);
  const server = startServer(0);
  await waitForServer(server);
  const { port } = server.address();

  try {
    const foreignRequests = await request(
      port,
      "GET",
      `/trips/${trip.id}/requests`,
      "management-other-token",
    );
    assert.equal(foreignRequests.status, 404);
    assert.equal(foreignRequests.body.code, "TRIP_NOT_FOUND");

    const pendingRequests = await request(
      port,
      "GET",
      `/trips/${trip.id}/requests`,
      "management-owner-token",
    );
    assert.equal(pendingRequests.status, 200);
    assert.equal(pendingRequests.body.requests.length, 3);
    const passengerOneRequest = pendingRequests.body.requests.find(
      (tripRequest) => tripRequest.passenger.id === passengerOne.id,
    );
    assert.equal(
      passengerOneRequest.passenger.name,
      "Passageiro Um",
    );
    assert.equal(
      passengerOneRequest.requestedPickupLocation,
      "Shopping Center Norte",
    );

    const firstApproval = await request(
      port,
      "PATCH",
      `/trip-requests/${firstRequest.id}/approve`,
      "management-owner-token",
      {},
    );
    assert.equal(firstApproval.status, 200);
    assert.equal(firstApproval.body.request.status, "APPROVED");
    assert.equal(
      firstApproval.body.request.pickupLocation,
      "Shopping Center Norte",
    );
    assert.equal(firstApproval.body.availableSeats, 1);

    const secondApproval = await request(
      port,
      "PATCH",
      `/trip-requests/${secondRequest.id}/approve`,
      "management-owner-token",
      {},
    );
    assert.equal(secondApproval.status, 200);
    assert.equal(secondApproval.body.availableSeats, 0);

    const fullTripApproval = await request(
      port,
      "PATCH",
      `/trip-requests/${thirdRequest.id}/approve`,
      "management-owner-token",
      {},
    );
    assert.equal(fullTripApproval.status, 409);
    assert.equal(fullTripApproval.body.code, "TRIP_FULL");

    const rejection = await request(
      port,
      "PATCH",
      `/trip-requests/${thirdRequest.id}/reject`,
      "management-owner-token",
      {},
    );
    assert.equal(rejection.status, 200);
    assert.equal(rejection.body.request.status, "REJECTED");

    const tripAfterRejection = await prisma.trip.findUnique({
      where: { id: trip.id },
    });
    assert.equal(tripAfterRejection.availableSeats, 0);

    const passengers = await request(
      port,
      "GET",
      `/trips/${trip.id}/passengers`,
      "management-owner-token",
    );
    assert.equal(passengers.status, 200);
    assert.equal(passengers.body.passengers.length, 2);
    const approvedPassengerOne = passengers.body.passengers.find(
      (tripRequest) => tripRequest.passenger.id === passengerOne.id,
    );
    assert.equal(
      approvedPassengerOne.passenger.phone,
      "+55 11 99999-9999",
    );
    assert.equal(
      approvedPassengerOne.pickupLocation,
      "Shopping Center Norte",
    );

    const invalidCapacity = await request(
      port,
      "PATCH",
      `/trips/${trip.id}`,
      "management-owner-token",
      { maxPassengers: 1 },
    );
    assert.equal(invalidCapacity.status, 409);
    assert.equal(
      invalidCapacity.body.code,
      "MAX_PASSENGERS_BELOW_APPROVED",
    );

    const earnings = await request(
      port,
      "GET",
      "/drivers/me/earnings",
      "management-owner-token",
    );
    assert.equal(earnings.status, 200);
    assert.equal(earnings.body.totals.estimated, 100);
    assert.equal(earnings.body.totals.confirmed, 50);
    assert.equal(earnings.body.trips[0].approvedReservations, 2);
    assert.equal(earnings.body.trips[0].paidReservations, 1);

    const pendingAfterCapacity = await prisma.tripRequest.create({
      data: {
        tripId: trip.id,
        passengerId: passengerFour.id,
        amount: 50,
        pickupLocation: "Metro Tiete",
        dropoffLocation: "Campinas",
      },
    });
    const cancellation = await request(
      port,
      "PATCH",
      `/trips/${trip.id}/cancel`,
      "management-owner-token",
      {},
    );
    assert.equal(cancellation.status, 200);
    assert.equal(cancellation.body.trip.status, "CANCELLED");
    assert.equal(cancellation.body.passengersToNotify.length, 2);

    const earningsAfterCancellation = await request(
      port,
      "GET",
      "/drivers/me/earnings",
      "management-owner-token",
    );
    assert.equal(earningsAfterCancellation.status, 200);
    assert.equal(earningsAfterCancellation.body.totals.estimated, 0);
    assert.equal(earningsAfterCancellation.body.totals.confirmed, 0);

    const approvalAfterCancellation = await request(
      port,
      "PATCH",
      `/trip-requests/${pendingAfterCapacity.id}/approve`,
      "management-owner-token",
      {},
    );
    assert.equal(approvalAfterCancellation.status, 409);
    assert.equal(
      approvalAfterCancellation.body.code,
      "TRIP_NOT_AVAILABLE",
    );

    const persistedTrip = await prisma.trip.findUnique({
      where: { id: trip.id },
    });
    assert.ok(persistedTrip);
    assert.equal(persistedTrip.status, "CANCELLED");
  } finally {
    resetFirebaseAuthAdapter();
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            owner.id,
            otherDriver.id,
            passengerOne.id,
            passengerTwo.id,
            passengerThree.id,
            passengerFour.id,
          ],
        },
      },
    });
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
