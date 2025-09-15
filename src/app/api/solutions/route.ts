import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

const SOLUTIONS_QUERY = `*[_type == "solutions"] | order(_createdAt desc)`;

export async function GET() {
  try {
    const solutions = await client.fetch(SOLUTIONS_QUERY);
    return NextResponse.json(solutions);
  } catch (error) {
    console.error("Error fetching solutions:", error);
    return NextResponse.json([], { status: 500 });
  }
}
