import { and, eq } from "drizzle-orm"
import shortUuid from "short-uuid"

import {
  sendNewsitemArchivedEvent,
  sendNewsitemCreatedEvent,
} from "@/contracts/events/newsitem"
import { CreateNewsitemInputDto } from "@/contracts/newsitem/newsitem"
import { db } from "@/database"
import { newsitems } from "@/database/schemas"
import waitForPredicate from "@/lib/wait-for-predicate"
import { adminsOnlyMiddleware } from "@/server/api/routers/middlewares/admins-only.middleware"
import { protectedProcedure } from "@/server/api/trpc"

export const createNewsitemProcedure = protectedProcedure
  .input(CreateNewsitemInputDto)
  .use(adminsOnlyMiddleware)
  .mutation(async ({ input }) => {
    if (
      await db.query.newsitems.findFirst({
        where: and(
          eq(newsitems.title, input.title),
          eq(newsitems.archived, false),
        ),
      })
    ) {
      throw new Error("Newsitem with that name already exists")
    }

    const id = shortUuid.generate()

    await sendNewsitemCreatedEvent({
      ...input,
      id,
      imageBase64: input.imageBase64 ?? "",
      introText: input.introText ?? "",
      fullText: input.fullText ?? "",
    })
    try {
      await waitForPredicate(
        () =>
          db.query.newsitems.findFirst({
            where: eq(newsitems.id, id),
          }),
        (result) => {
          console.log("result", result)
          return !!result
        },
      )
    } catch (error) {
      await sendNewsitemArchivedEvent({
        id: id,
        _reason: "rollback",
      })
      throw new Error("Newsitem creation failed, rolling back")
    }
    return id
  })
