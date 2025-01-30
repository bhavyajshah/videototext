"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileVideo, Settings, Moon, Sun, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileVideo, label: "My Videos", href: "/videos" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card text-card-foreground shadow-lg transition-transform duration-300 ease-in-out transform",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold">Video Insights</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="flex items-center p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4">
            <Button variant="outline" className="w-full" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "light" ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-semibold">Video Insights Dashboard</h1>
            <div className="w-8" /> {/* Spacer for alignment */}
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-accent bg-opacity-50 p-6">{children}</main>
      </div>
    </div>
  )
}

