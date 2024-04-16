import { Loader, PenIcon, Trash } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { UpdateEventForm } from "@/app/admin/events/update-event.form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { api } from "@/trpc/react"

export interface EventProps {
  event: {
    id: string
    name: string
    slug: string | null
    imageBase64: string | null
    description: string | null
    ticketDescription: string | null
    startDate: string
    endDate: string
  }
  refetch: () => Promise<void>
}

export function Event({ event, refetch }: EventProps) {
  const [loading, setLoading] = useState(false)

  const apiArchiveEvent = api.event.archive.useMutation()
  const archiveEvent = useCallback(async () => {
    setLoading(true)
    const success = await apiArchiveEvent.mutateAsync({
      id: event.id,
    })
    if (success) {
      await refetch()
      toast.success("Event deleted")
    } else {
      toast.error("Delete event failed")
    }
    setLoading(false)
  }, [event.id])

  const [updateEventDialogOpened, setUpdateEventDialogOpened] = useState(false)

  return (
    <>
      <div
        key={event.id}
        className="mb-2 flex cursor-pointer items-center rounded-lg border p-4 shadow transition hover:scale-101 hover:shadow-lg">
        <div className={"flex-1 self-stretch"}>
          <div className={"pb-2 font-bold"}>{event.name}</div>
          <div className={"text-sm text-gray-500"}>{event.description}</div>
          <div className={"text-sm text-gray-500"}>Event ID: {event.id}</div>
          <div className={"text-sm text-gray-500"}>
            Start: {event.startDate}
          </div>
          <div className={"text-sm text-gray-500"}>End: {event.endDate}</div>
        </div>
        <div className={"text-right"}>
          <Button
            size={"sm"}
            onClick={() => setUpdateEventDialogOpened(true)}
            disabled={loading}>
            {loading ? <Loader className={"animate-spin"} /> : <PenIcon />}
          </Button>
          <Button
            className={"ml-2"}
            size={"sm"}
            onClick={(e) => {
              e.stopPropagation()
              return archiveEvent()
            }}
            disabled={loading}>
            {loading ? <Loader className={"animate-spin"} /> : <Trash />}
          </Button>
        </div>
        <Dialog
          open={updateEventDialogOpened}
          onOpenChange={(open) => {
            !open && setUpdateEventDialogOpened(open)
          }}>
          <DialogContent className={"max-w-4xl"}>
            <DialogHeader>Edit event</DialogHeader>
            <UpdateEventForm
              event={{
                ...event,
                slug: event.slug ?? "",
                imageBase64: event.imageBase64 ?? "",
                ticketDescription: event.ticketDescription ?? "",
                description: event.description ?? "",
              }}
              close={() => setUpdateEventDialogOpened(false)}
              refetch={() => refetch()}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
