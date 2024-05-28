'use client'

import { ChevronRight, ChevronLeft, HelpCircle } from "lucide-react"
import useDictionary from "@/dictionaries/useDictionary"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import Intro from './Intro'
import Courses from './Courses'
import Dashboard from './Dashboard'
import Bus from './Bus'
import Tools from './Tools'
import Dev from './Dev'
import { useLocalStorage } from "usehooks-ts"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {LoginPage} from '@/components/Forms/LoginPage';

type ProgressDisplayProps = { max: number, current: number }
const ProgressDisplay = ({ current, max }: ProgressDisplayProps) => {
  return <div className="w-44 h-1.5 justify-center items-center gap-1.5 inline-flex">
      {Array.from({length: max}, (_, i) => i).map((i) =>
        <div className={cn("flex-1 h-1.5 relative rounded-md", current >= i + 1 ? "bg-nthu-600": "bg-zinc-100")} />
      )}
    </div>
}

const Help = () => {
  const dict = useDictionary();

  const content = [
    {
      img: "/images/friendship.gif",
      title: dict.help.intro.title,
      description: dict.help.intro.description
    },
    {
      img: "/images/list.gif",
      title: dict.help.courses.title,
      description: dict.help.courses.description
    },
    {
      img: "/images/upcoming.gif",
      title: dict.help.dashboard.title,
      description: dict.help.dashboard.description
    },
    {
      img: "/images/bus.gif",
      title: dict.help.bus.title,
      description: dict.help.bus.description
    },
    {
      img: "/images/toolbox.gif",
      title: dict.help.tools.title,
      description: dict.help.tools.description
    }
  ]

  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasVisitedBefore, setHasVisitedBefore] = useLocalStorage("hasVisitedBefore", false);


  useEffect(() => {
    if(!hasVisitedBefore) {
      setOpen(true);
    }
  }, [hasVisitedBefore])

  useEffect(() => {
    if(open) {
      setPage(0);
    } else {
      setHasVisitedBefore(true);
    } 
  }, [open])

  const [loginOpen, setLoginOpen] = useState(false);



  return (
    <Dialog open={open} onOpenChange={setOpen}>  
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex gap-1" onClick={() => setOpen(true)}>
          <HelpCircle size="16" />
          <span className="hidden md:inline-block">Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="h-screen p-0 lg:h-[calc(100vh-48px)]">
        <div className="flex flex-col items-center gap-8 px-4 py-8 max-h-screen">
          <div className="flex-1 grid place-items-center">
            <div className="w-[254px] h-[254px] max-h-full">
              <Image src={content[page].img} alt={content[page].title} width={254} height={254} />
            </div>
          </div>
          <div className="flex flex-row justify-center">
            <ProgressDisplay current={page + 1} max={content.length} />
          </div>
          <div className="flex flex-col gap-2 h-max">
            <h1 className="font-bold text-3xl">{content[page].title}</h1>
            <p>{content[page].description}</p>
          </div>
          {page < content.length - 1 ? <Button className="w-full" onClick={() => {setPage(page + 1)}}>
            繼續
          </Button>:
          <div className="flex flex-col gap-2 w-full">
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">登入</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] h-screen">
                <LoginPage onClose={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
            <Button variant='outline' className="w-full">略過</Button>
          </div>}
          
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Help;