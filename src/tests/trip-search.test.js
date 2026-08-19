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
 * Cria um usuario local verificado para os cenarios de busca.
 */
function createUser(suffix, identifier, name) {
  return prisma.user.create({
    data: {
      firebaseUid: `search-${identifier}-${suffix}`,
      name,
      email: `search-${identifier}-${suffix}@example.com`,
      phone: "+55 11 99999-9999",
      profilePhoto: `https://example.com/${identifier}.jpg`,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
}

/**
 * Cria um perfil de motorista com um veiculo para os testes.
 */
function createDriverProfile(userId, cnh, plate, model = "Honda Civic") {
  return prisma.driverProfile.create({
    data: {
      userId,
      cnh,
      vehicles: {
        create: {
          model,
          plate,
          color: "Preto",
          category: "SEDAN",
        },
      },
    },
    include: { vehicles: true },
  });
}

/**
 * Formata a data no calendario de Sao Paulo para usar no filtro.
 */
function getSaoPauloDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Envia uma busca autenticada para o backend.
 */
async function search(port, query, token = "search-passenger-token") {
  const response = await fetch(
    `http://localhost:${port}/trips${query}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return {
    status: response.status,
    body: await response.json(),
  };
}

test("passageiro busca somente viagens disponiveis com filtros", async () => {
  const suffix = Date.now();
  const passenger = await createUser(
    suffix,
    "passenger",
    "Passageiro Busca",
  );
  const existingDriverProfiles = await prisma.driverProfile.findMany({
    select: { userId: true },
  });

  if (existingDriverProfiles.length) {
    await prisma.userBlock.createMany({
      data: existingDriverProfiles.map(({ userId }) => ({
        blockerId: passenger.id,
        blockedId: userId,
      })),
      skipDuplicates: true,
    });
  }

  const visibleDriver = await createUser(
    suffix,
    "visible-driver",
    "Motorista Visivel",
  );
  const blockedDriver = await createUser(
    suffix,
    "blocked-driver",
    "Motorista Bloqueado",
  );
  const passengerUid = passenger.firebaseUid;

  setFirebaseAuthAdapter({
    getAccount(token) {
      if (token === "search-passenger-token") {
        return { localId: passengerUid, emailVerified: true };
      }

      return undefined;
    },
  });

  const cnhBase = BigInt(String(suffix).slice(-11));
  const visibleProfile = await createDriverProfile(
    visibleDriver.id,
    String(cnhBase).padStart(11, "0"),
    `VIS${suffix % 10}A${String(suffix % 100).padStart(2, "0")}`,
  );
  const blockedProfile = await createDriverProfile(
    blockedDriver.id,
    String(cnhBase + 1n).padStart(11, "0"),
    `BLK${suffix % 10}B${String(suffix % 100).padStart(2, "0")}`,
  );
  const ownProfile = await createDriverProfile(
    passenger.id,
    String(cnhBase + 2n).padStart(11, "0"),
    `OWN${suffix % 10}C${String(suffix % 100).padStart(2, "0")}`,
  );
  await prisma.userBlock.create({
    data: {
      blockerId: passenger.id,
      blockedId: blockedDriver.id,
    },
  });

  const firstDeparture = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const secondDeparture = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const thirdDeparture = new Date(Date.now() + 96 * 60 * 60 * 1000);
  const commonData = {
    price: 40,
    maxPassengers: 3,
    availableSeats: 3,
    driverProfileId: visibleProfile.id,
    vehicleId: visibleProfile.vehicles[0].id,
  };
  const firstTrip = await prisma.trip.create({
    data: {
      ...commonData,
      origin: "Sao Paulo Centro",
      destination: "Campinas",
      departureAt: firstDeparture,
    },
  });
  const secondTrip = await prisma.trip.create({
    data: {
      ...commonData,
      origin: "Santos",
      destination: "Campinas",
      departureAt: secondDeparture,
      points: {
        create: {
          location: "Metro Tiete",
          type: "PICKUP",
          order: 0,
        },
      },
    },
  });
  const thirdTrip = await prisma.trip.create({
    data: {
      ...commonData,
      origin: "Sao Paulo Zona Sul",
      destination: "Sorocaba",
      departureAt: thirdDeparture,
    },
  });
  await prisma.trip.createMany({
    data: [
      {
        ...commonData,
        origin: "Sao Paulo",
        destination: "Campinas",
        departureAt: new Date(Date.now() + 50 * 60 * 60 * 1000),
        status: "CANCELLED",
      },
      {
        ...commonData,
        origin: "Sao Paulo",
        destination: "Campinas",
        departureAt: new Date(Date.now() + 51 * 60 * 60 * 1000),
        availableSeats: 0,
      },
      {
        ...commonData,
        origin: "Sao Paulo",
        destination: "Campinas",
        departureAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        origin: "Sao Paulo",
        destination: "Campinas",
        departureAt: new Date(Date.now() + 52 * 60 * 60 * 1000),
        price: 40,
        maxPassengers: 3,
        availableSeats: 3,
        driverProfileId: blockedProfile.id,
        vehicleId: blockedProfile.vehicles[0].id,
      },
      {
        origin: "Sao Paulo",
        destination: "Campinas",
        departureAt: new Date(Date.now() + 53 * 60 * 60 * 1000),
        price: 40,
        maxPassengers: 3,
        availableSeats: 3,
        driverProfileId: ownProfile.id,
        vehicleId: ownProfile.vehicles[0].id,
      },
    ],
  });

  const server = startServer(0);
  await waitForServer(server);
  const { port } = server.address();

  try {
    const allTrips = await search(port, "");
    assert.equal(allTrips.status, 200);
    assert.equal(allTrips.body.trips.length, 3);
    assert.deepEqual(
      allTrips.body.trips.map((trip) => trip.id),
      [firstTrip.id, secondTrip.id, thirdTrip.id],
    );
    assert.equal(allTrips.body.pagination.total, 3);
    assert.equal(allTrips.body.trips[0].driver.name, "Motorista Visivel");
    assert.equal(allTrips.body.trips[0].vehicle.model, "Honda Civic");
    assert.equal(allTrips.body.trips[0].price, 40);

    const byDestination = await search(
      port,
      "?destination=campinas",
    );
    assert.equal(byDestination.status, 200);
    assert.equal(byDestination.body.trips.length, 2);

    const byDate = await search(
      port,
      `?date=${getSaoPauloDate(firstDeparture)}`,
    );
    assert.equal(byDate.status, 200);
    assert.equal(byDate.body.trips.length, 1);
    assert.equal(byDate.body.trips[0].id, firstTrip.id);

    const byOrigin = await search(port, "?origin=tiete");
    assert.equal(byOrigin.status, 200);
    assert.equal(byOrigin.body.trips.length, 1);
    assert.equal(byOrigin.body.trips[0].id, secondTrip.id);

    const combined = await search(
      port,
      `?destination=campinas&origin=tiete&date=${getSaoPauloDate(secondDeparture)}`,
    );
    assert.equal(combined.status, 200);
    assert.equal(combined.body.trips.length, 1);
    assert.equal(combined.body.trips[0].id, secondTrip.id);

    const empty = await search(port, "?destination=Curitiba");
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body.trips, []);
    assert.equal(empty.body.pagination.total, 0);

    const paginated = await search(port, "?page=2&limit=1");
    assert.equal(paginated.status, 200);
    assert.equal(paginated.body.trips.length, 1);
    assert.equal(paginated.body.trips[0].id, secondTrip.id);
    assert.equal(paginated.body.pagination.page, 2);
    assert.equal(paginated.body.pagination.totalPages, 3);
    assert.equal(paginated.body.pagination.hasPreviousPage, true);
    assert.equal(paginated.body.pagination.hasNextPage, true);
  } finally {
    resetFirebaseAuthAdapter();
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [passenger.id, visibleDriver.id, blockedDriver.id],
        },
      },
    });
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
