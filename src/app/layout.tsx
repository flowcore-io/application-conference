import "@/styles/globals.css"

import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs"
import { Dongle, Inter, Lato } from "next/font/google"
import { cookies } from "next/headers"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TRPCReactProvider } from "@/trpc/react"

import ProtectedPage from "./protected-page"
import PublicPage from "./public-page"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const dongle = Dongle({
  subsets: ["latin"],
  variable: "--font-dongle",
  weight: "300",
})

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: "400",
})

export const metadata = {
  manifest: "/manifest.json",
  title: "Luttaka",
  description: "The open source event experience app from Flowcore",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`min-h-screen ${inter.variable} ${dongle.variable} ${lato.variable} font-inter`}>
        <ThemeProvider
          attribute={"class"}
          defaultTheme={"system"}
          disableTransitionOnChange
          enableSystem>
          <ClerkProvider>
            <SignedOut>
              <TRPCReactProvider cookies={cookies().toString()}>
                <PublicPage children={children} />
              </TRPCReactProvider>
            </SignedOut>
            <SignedIn>
              <TRPCReactProvider cookies={cookies().toString()}>
                <ProtectedPage children={children} />
                <Toaster richColors />
              </TRPCReactProvider>
            </SignedIn>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
