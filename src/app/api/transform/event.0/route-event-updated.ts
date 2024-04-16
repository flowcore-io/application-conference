import { eq } from "drizzle-orm"

import { EventEventUpdatedPayload } from "@/contracts/events/event"
import { db } from "@/database"
import { events } from "@/database/schemas"
import { updateProduct } from "@/lib/stripe/product"

export default async function eventUpdated(payload: unknown) {
  console.log("Got updated event", payload)
  const parsedPayload = EventEventUpdatedPayload.parse(payload)
  const exists = await db.query.events.findFirst({
    where: eq(events.id, parsedPayload.id),
  })
  if (!exists) {
    return
  }

  await updateProduct({
    id: exists.stripeId,
    name: parsedPayload.name,
    description: parsedPayload.ticketDescription,
    price: parsedPayload.ticketPrice,
    currency: parsedPayload.ticketCurrency,
  })

  await db
    .update(events)
    .set(parsedPayload)
    .where(eq(events.id, parsedPayload.id))
}
