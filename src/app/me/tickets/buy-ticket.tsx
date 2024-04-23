"use client"

import { DialogTitle } from "@radix-ui/react-dialog"
import { type inferRouterOutputs } from "@trpc/server"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { RestrictedToRole } from "@/components/restricted-to-role"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { UserRole } from "@/contracts/user/user-role"
import { makePayment } from "@/modules/payment-stripe/react"
import { type appRouter } from "@/server/api/root"
import { api } from "@/trpc/react"

type RouterOutput = inferRouterOutputs<typeof appRouter>

interface EventProps {
  event: RouterOutput["event"]["list"][0]
}

export default function BuyTicket({ event }: EventProps) {
  const [purchaseTicketDialogOpened, setPurchaseTicketDialogOpened] =
    useState(false)
  const [ticketQuantity, setTicketQuantity] = useState(1)
  const [ticketNote, setTicketNote] = useState("")
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const router = useRouter()

  const formatCurrency = (value: number, currency: string, locale = "da-DK") =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(value)

  const apiCreateTicket = api.ticket.create.useMutation()
  const generateTicket = useCallback(async () => {
    setPurchaseLoading(true)
    try {
      await apiCreateTicket.mutateAsync({
        eventId: event.id,
        quantity: ticketQuantity,
        note: ticketNote,
      })
      toast.success("Ticket(s) created")
      router.push("/me/tickets")
    } catch (error) {
      const title =
        error instanceof Error ? error.message : "Ticket create failed"
      toast.error(title)
    }
    setPurchaseLoading(false)
    setTicketNote("") // reset
  }, [ticketQuantity, event.id, ticketNote])

  const purchaseTicket = useCallback(async () => {
    setPurchaseLoading(true)

    const result = await makePayment({
      eventId: event.id,
      quantity: ticketQuantity,
      note: ticketNote,
    })

    setPurchaseLoading(false)
    setTicketNote("") // reset
    if (!result.success) {
      toast.error("Failed to redirect to checkout")
    }
  }, [ticketQuantity, event.id, ticketNote])

  return (
    <div key={event.id} className={`mb-6 p-2`}>
      <div>
        <Card className="w-full sm:w-80">
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>{event.ticketDescription}</CardDescription>
            <CardDescription>
              {dayjs(event.startDate).format("MMMM D, YYYY")}
              {" - "}
              {dayjs(event.endDate).format("MMMM D, YYYY")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 font-bold">Price:</div>
            <div>{formatCurrency(event.ticketPrice, event.ticketCurrency)}</div>
          </CardContent>
          <CardFooter className="space-x-2">
            <Button
              type="button"
              className="flex-1"
              onClick={() => setPurchaseTicketDialogOpened(true)}>
              Buy
            </Button>
          </CardFooter>
        </Card>
        <Dialog
          open={purchaseTicketDialogOpened}
          onOpenChange={(open) => {
            !open && setPurchaseTicketDialogOpened(open)
          }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase ticket(s) for {event?.name}</DialogTitle>
              <DialogDescription>
                Price: {formatCurrency(event.ticketPrice, event.ticketCurrency)}
              </DialogDescription>
            </DialogHeader>
            <div className={"space-y-3"}>
              <Input
                type={"number"}
                min={1}
                value={ticketQuantity}
                disabled={purchaseLoading}
                onChange={(e) =>
                  setTicketQuantity(parseInt(e.currentTarget.value, 10))
                }
              />
              <Input
                type={"text"}
                value={ticketNote}
                placeholder={"A note attached to the ticket(s)"}
                disabled={purchaseLoading}
                onChange={(e) => setTicketNote(e.currentTarget.value)}
              />
            </div>
            <DialogFooter>
              <RestrictedToRole role={UserRole.admin}>
                <Button
                  variant={"outline"}
                  onClick={() => generateTicket()}
                  disabled={purchaseLoading}>
                  Generate {ticketQuantity} ticket
                  {ticketQuantity > 1 ? "s" : ""}
                </Button>
              </RestrictedToRole>
              <Button
                onClick={() => purchaseTicket()}
                disabled={purchaseLoading}>
                Purchase {ticketQuantity} ticket{ticketQuantity > 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
