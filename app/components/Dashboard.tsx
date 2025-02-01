"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutDashboard,
  FileVideo,
  Settings,
  Moon,
  Sun,
  Menu,
  BarChart2,
  Search,
  Bell,
  ChevronDown,
  Users,
  FileText,
  Clock,
  Star,
  User,
  Share2,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import type React from "react" // Added import for React

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FileVideo, label: "My Videos", href: "/videos" },
  { icon: FileText, label: "Transcripts", href: "/transcripts" },
  { icon: Star, label: "Favorites", href: "/favorites" },
  { icon: BarChart2, label: "Analytics", href: "/analytics" },
  { icon: Share2, label: "Shared", href: "/shared" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

interface StatsCardProps {
  title: string
  value: string
  change: string
  isIncrease: boolean
  icon: React.ElementType
  iconColor: string
}

function StatsCard({ title, value, change, isIncrease, icon: Icon, iconColor }: StatsCardProps) {
  return (
    <Card className="stats-card" style={{ "--icon-color": iconColor } as React.CSSProperties}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", `text-${iconColor}`)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn("text-xs", isIncrease ? "text-green-500" : "text-red-500")}>
          {isIncrease ? "+" : "-"}
          {change}
        </p>
      </CardContent>
    </Card>
  )
}

const data = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 200 },
  { name: "Apr", value: 278 },
  { name: "May", value: 189 },
  { name: "Jun", value: 239 },
]

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulating fetching notifications and data loading
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate network delay
      setNotifications([
        "New comment on your video",
        "Transcription complete for 'Meeting_2023.mp4'",
        "You have a new shared transcript",
      ])
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg"
          >
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-1">
                    <FileVideo className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-lg font-semibold">VoxScribe</span>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <nav className="space-y-2 flex-1">
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href && "bg-accent text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>

              <Button
                variant="ghost"
                className="justify-start gap-3"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
              <div className="hidden lg:flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1">
                  <FileVideo className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-semibold">VoxScribe</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:flex items-center">
                <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search..." className="pl-8 w-[200px] lg:w-[300px]" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {notifications.map((notification, index) => (
                    <DropdownMenuItem key={index}>{notification}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-user.jpg" alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline">John Doe</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="container p-4 lg:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        <Skeleton className="h-4 w-[100px]" />
                      </CardTitle>
                      <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-7 w-[60px] mb-1" />
                      <Skeleton className="h-4 w-[100px]" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <StatsCard
                  title="Total Videos"
                  value="2,853"
                  change="12%"
                  isIncrease={true}
                  icon={FileVideo}
                  iconColor="blue-500"
                />
                <StatsCard
                  title="Total Transcripts"
                  value="1,725"
                  change="8%"
                  isIncrease={true}
                  icon={FileText}
                  iconColor="purple-500"
                />
                <StatsCard
                  title="Processing"
                  value="3"
                  change="5%"
                  isIncrease={false}
                  icon={Clock}
                  iconColor="yellow-500"
                />
                <StatsCard
                  title="Team Members"
                  value="12"
                  change="2"
                  isIncrease={true}
                  icon={Users}
                  iconColor="green-500"
                />
              </>
            )}
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Transcription Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

