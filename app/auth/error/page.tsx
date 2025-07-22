'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AuthError() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'An authentication error occurred'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Authentication Failed</CardTitle>
          <CardDescription>
            We encountered an issue while trying to authenticate your GitHub account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/">Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/support">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}