import { and, eq } from "drizzle-orm"
import shortUuid from "short-uuid"

import { CreateActivityInputDto } from "@/contracts/activity/activity"
import {
  sendActivityArchivedEvent,
  sendActivityCreatedEvent,
} from "@/contracts/events/activity"
import { db } from "@/database"
import { activities } from "@/database/schemas"
import waitForPredicate from "@/lib/wait-for-predicate"
import { adminsOnlyMiddleware } from "@/server/api/routers/middlewares/admins-only.middleware"
import { protectedProcedure } from "@/server/api/trpc"

export const createActivityProcedure = protectedProcedure
  .input(CreateActivityInputDto)
  .use(adminsOnlyMiddleware)
  .mutation(async ({ input }) => {
    if (
      await db.query.activities.findFirst({
        where: and(
          eq(activities.title, input.title),
          eq(activities.archived, false),
        ),
      })
    ) {
      throw new Error("Activity with that name already exists")
    }

    const id = shortUuid.generate()

    await sendActivityCreatedEvent({
      ...input,
      id,
      imageBase64: input.imageBase64 ?? "",
      description: input.description ?? "",
      stageName: input.stageName ?? "",
    })
    try {
      await waitForPredicate(
        () =>
          db.query.activities.findFirst({
            where: eq(activities.id, id),
          }),
        (result) => {
          console.log("result", result)
          return !!result
        },
      )
    } catch (error) {
      await sendActivityArchivedEvent({
        id: id,
        _reason: "rollback",
      })
      throw new Error("Activity creation failed, rolling back")
    }
    return id
  })
