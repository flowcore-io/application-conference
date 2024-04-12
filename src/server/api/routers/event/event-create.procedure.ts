import { and, eq } from "drizzle-orm"
import shortUuid from "short-uuid"

import { CreateEventInputDto } from "@/contracts/event/event"
import {
  sendEventArchivedEvent,
  sendEventCreatedEvent,
} from "@/contracts/events/event"
import { db } from "@/database"
import { events } from "@/database/schemas"
import waitForPredicate from "@/lib/wait-for-predicate"
import { protectedProcedure } from "@/server/api/trpc"

export const createEventProcedure = protectedProcedure
  .input(CreateEventInputDto)
  .mutation(async ({ input }) => {
    // TODO: make sure user has correct permissions

    if (
      await db.query.events.findFirst({
        where: and(eq(events.name, input.name), eq(events.archived, false)),
      })
    ) {
      throw new Error("Event with that name already exists")
    }

    const id = shortUuid.generate()

    await sendEventCreatedEvent({ ...input, id })
    try {
      await waitForPredicate(
        () =>
          db.query.events.findFirst({
            where: eq(events.id, id),
          }),
        (result) => {
          console.log("result", result)
          return !!result
        },
      )
    } catch (error) {
      await sendEventArchivedEvent({
        id: id,
        _reason: "rollback",
      })
      throw new Error("Event creation failed, rolling back")
    }
    return id
  })
