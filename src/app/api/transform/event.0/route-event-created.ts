import { eq } from "drizzle-orm"

import { EventEventCreatedPayload } from "@/contracts/events/event"
import { db } from "@/database"
import { events } from "@/database/schemas"
import { createProduct } from "@/lib/stripe/product"

export default async function eventCreated(payload: unknown) {
  console.log("Got created event", payload)
  const parsedPayload = EventEventCreatedPayload.parse(payload)
  const exists = await db.query.events.findFirst({
    where: eq(events.id, parsedPayload.id),
  })
  if (exists) {
    return
  }

  await createProduct({
    id: parsedPayload.stripeId,
    eventId: parsedPayload.id,
    name: parsedPayload.name,
    price: parsedPayload.ticketPrice,
    currency: parsedPayload.ticketCurrency,
    description: parsedPayload.ticketDescription,
  })

  await db.insert(events).values(parsedPayload)
}
