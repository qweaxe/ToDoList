"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string // HH:mm format
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export function TimePicker({ value, onChange, className, disabled }: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // 解析小时和分钟
  const [hours, minutes] = value.split(':').map(Number)

  // 生成小时选项 (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i)
  // 生成分钟选项 (0, 5, 10, ..., 55)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5)

  const handleSelect = (hour: number, minute: number) => {
    onChange(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "min-w-[100px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "00:00"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2">
          <div className="flex gap-2">
            {/* 小时选择 */}
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
              <div className="text-xs text-muted-foreground text-center pb-1">时</div>
              {hourOptions.map((hour) => (
                <button
                  key={hour}
                  onClick={() => handleSelect(hour, minutes)}
                  className={cn(
                    "px-3 py-1 text-sm rounded hover:bg-accent",
                    hour === hours && "bg-primary text-primary-foreground"
                  )}
                >
                  {hour.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
            {/* 分钟选择 */}
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
              <div className="text-xs text-muted-foreground text-center pb-1">分</div>
              {minuteOptions.map((minute) => (
                <button
                  key={minute}
                  onClick={() => handleSelect(hours, minute)}
                  className={cn(
                    "px-3 py-1 text-sm rounded hover:bg-accent",
                    minute === minutes && "bg-primary text-primary-foreground"
                  )}
                >
                  {minute.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
