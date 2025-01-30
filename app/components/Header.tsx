import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          VideoToText
        </Link>
        <div>
          <Button variant="ghost" asChild>
            <Link href="#">How it works</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="#">Pricing</Link>
          </Button>
          <Button asChild>
            <Link href="#">Sign up</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}

