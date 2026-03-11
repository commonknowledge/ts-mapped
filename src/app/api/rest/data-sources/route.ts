import { NextResponse } from "next/server";
import { findOrganisationsByUserId } from "@/server/repositories/Organisation";
import { findUserByEmailAndPassword } from "@/server/repositories/User";
import { db } from "@/server/services/database";
import type { NextRequest } from "next/server";

/**
 * Authenticated REST API for listing readable data sources for a user.
 *
 * GET /api/rest/data-sources
 *
 * Authentication: Basic Auth (email:password)
 * Returns: List of readable data sources across all organisations the user belongs to.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const basicMatch = authHeader?.match(/^Basic\s+(.+)$/i);
  if (!basicMatch) {
    return new NextResponse(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Data Source API"',
          "Content-Type": "application/json",
        },
      },
    );
  }

  const base64Credentials = basicMatch[1]?.trim();
  if (!base64Credentials) {
    return new NextResponse(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Data Source API"',
          "Content-Type": "application/json",
        },
      },
    );
  }

  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8",
  );
  const separatorIndex = credentials.indexOf(":");
  const email =
    separatorIndex >= 0 ? credentials.slice(0, separatorIndex) : undefined;
  const password =
    separatorIndex >= 0 ? credentials.slice(separatorIndex + 1) : undefined;

  if (!email || !password) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid credentials format" }),
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Data Source API"',
          "Content-Type": "application/json",
        },
      },
    );
  }

  const user = await findUserByEmailAndPassword({ email, password });
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Data Source API"',
        "Content-Type": "application/json",
      },
    });
  }

  const organisations = await findOrganisationsByUserId(user.id);
  const organisationIds = organisations.map((organisation) => organisation.id);
  if (organisationIds.length === 0) {
    return NextResponse.json([]);
  }

  const dataSources = await db
    .selectFrom("dataSource")
    .innerJoin("organisation", "organisation.id", "dataSource.organisationId")
    .where("dataSource.organisationId", "in", organisationIds)
    .select([
      "dataSource.id as id",
      "dataSource.name as name",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
    ])
    .orderBy("organisation.name", "asc")
    .orderBy("dataSource.name", "asc")
    .execute();

  return NextResponse.json(
    dataSources.map((dataSource) => ({
      id: dataSource.id,
      name: dataSource.name,
      organisation: {
        id: dataSource.organisationId,
        name: dataSource.organisationName,
      },
    })),
  );
}
