import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addWeeks, differenceInDays, differenceInWeeks, eachHourOfInterval, endOfDay, format, isSameMonth, isToday, startOfDay, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import useUserTimetable from '@/hooks/contexts/useUserTimetable';
import { createContext, useContext, useEffect, useState } from 'react';
import { FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { Separator } from '@/components/ui/separator';
import { CalendarEvent } from './calendar.types';
import { CalendarProvider, useCalendar } from './calendar_hook';
import { WeekSelector } from './WeekSelector';
import { AddEventButton } from './AddEventButton';
import { CurrentTimePointer } from './CurrentTimePointer';
import { getWeek } from './calendar_utils';
import {eventsToDisplay} from '@/app/[lang]/(mods-pages)/today/calendar_utils';
import { adjustLuminance, getBrightness } from '@/helpers/colors';
import { EventPopover } from './EventPopover';
import { timetableToCalendarEvent } from './timetableToCalendarEvent';
import { useRxCollection, useRxQuery } from 'rxdb-hooks';
import { v4 as uuidv4 } from 'uuid';

const CalendarContent = () => {
    const { timetableData } = useUserTimetable();
    const [displayWeek, setDisplayWeek] = useState<Date[]>(getWeek(new Date()));
    const { events, addEvent, weekContainer, HOUR_HEIGHT } = useCalendar();

    const hours = eachHourOfInterval({
        start: new Date(2024, 2, 3, 0),
        end: new Date(2024, 2, 3, 23)
    });

    //week movers
    const moveBackward = () => {
        setDisplayWeek(displayWeek.map(d => subWeeks(d, 1)))
    }

    const moveForward = () => {
        setDisplayWeek(displayWeek.map(d => addWeeks(d, 1)))
    }

    const backToToday = () => {
        setDisplayWeek(getWeek(new Date()));
    }

    const handleAddEvent = (data: CalendarEvent) => {
        addEvent(data)
    }

    const renderEventsInDay = (day: Date) => {
        const dayEvents = eventsToDisplay(events, startOfDay(day), endOfDay(day)).filter(e => {
            return !e.allDay;
        }).map(event => {
            //Determine the text color
            const brightness = getBrightness(event.color);
            //From the brightness, using the adjustBrightness function, create a complementary color that is legible
            const textColor = adjustLuminance(event.color, brightness > 186 ? 0.2 : 0.95);
            return {...event, textColor}
        })
        return dayEvents.map((event, index) => (
            <EventPopover key={index} event={event}>
                <div
                    className="absolute left-0 w-full pr-1 "
                    style={{
                        top: (event.start.getHours() * HOUR_HEIGHT) + (event.start.getMinutes() * HOUR_HEIGHT / 60),
                        height: (event.end.getHours() - event.start.getHours()) * HOUR_HEIGHT + (event.end.getMinutes() - event.start.getMinutes()) * HOUR_HEIGHT / 60,
                    }}>
                    <div className="bg-nthu-500 rounded-md h-full p-2 flex flex-col gap-1 hover:shadow-md cursor-pointer transition-shadow select-none" style={{ background: event.color, color: event.textColor }}>
                        <div className="text-sm leading-none">{event.title}</div>
                        <div className="text-xs font-normal leading-none">{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</div>
                    </div>
                </div>
            </EventPopover>
        ))
    }

    const renderAllDayEvents = () => {
        const dayEvents = eventsToDisplay(events, startOfDay(displayWeek[0]), endOfDay(displayWeek[6])).filter(e => {
            return e.allDay;
        }).map(event => {
            //Determine the text color
            const brightness = getBrightness(event.color);
            //From the brightness, using the adjustBrightness function, create a complementary color that is legible
            const textColor = adjustLuminance(event.color, brightness > 186 ? 0.2 : 0.95);
            const span = differenceInDays(endOfDay(event.end), startOfDay(event.start)) + 1;
            const gridColumnStart = differenceInDays(event.start, displayWeek[0]) + 1;
            return {...event, textColor, span, gridColumnStart}
        })

        return dayEvents.map((event, index) => (
            <EventPopover key={index} event={event}>
                <div style={{ gridColumn: `span ${event.span} / span ${event.span}`, gridColumnStart: event.gridColumnStart }}>
                    <div className="bg-nthu-500 rounded-md h-full p-2 flex flex-col gap-1 hover:shadow-md cursor-pointer transition-shadow select-none" style={{ background: event.color, color: event.textColor }}>
                        <div className="text-sm leading-none">{event.title}</div>
                    </div>
                </div>
            </EventPopover>
        ))
    }


    return (
            <div className="flex flex-col gap-6 flex-1">
                <div className="flex flex-col md:flex-row gap-2 justify-evenly">
                    <div className="flex-1 w-full">
                        <WeekSelector date={displayWeek[0]} setDate={d => setDisplayWeek(getWeek(d))} />
                    </div>
                    <div className="flex flex-row items-center gap-2">
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Display" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">Week</SelectItem>
                                <SelectItem value="month">Month</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={backToToday}>Today</Button>
                        <Button variant="outline" onClick={moveBackward}><ChevronLeft /></Button>
                        <Button variant="outline" onClick={moveForward}><ChevronRight /></Button>
                        <AddEventButton onEventAdded={handleAddEvent} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <div className="flex flex-col min-w-[580px] md:min-w-0">
                        <div className="flex flex-row justify-evenly h-16">
                            <div className="w-12"></div>
                            {displayWeek.map((day, index) => (
                                <div key={day.getTime()} className="flex flex-col flex-1 items-center justify-center h-full select-none">
                                    <div className="text-slate-900 text-lg font-semibold">{format(day, 'E')}</div>
                                    <div className={cn("text-slate-500 text-sm text-center align-baseline", isToday(day) ? "w-6 h-6 rounded-full bg-nthu-500 text-white" : "")}>{format(day, isSameMonth(day, new Date()) ? 'd' : 'MMM d')}</div>
                                </div>)
                            )}
                        </div>
                        <div className="flex flex-row justify-evenly">
                            <div className="w-12"></div>
                            <div className='grid grid-cols-7 flex-1'>
                                {renderAllDayEvents()}
                            </div>
                        </div>
                        <Separator orientation="horizontal" />
                        <div className="h-[70vh] w-full flex flex-row overflow-y-auto scrollbar-none" ref={weekContainer}>
                            <div className="flex flex-row w-full h-max">
                                <div className="flex flex-col w-12" style={{ paddingTop: 20 / 2 }}>
                                    {[...hours].splice(1).map((hour, index) => (
                                        <div key={hour.getTime()} style={{ paddingTop: HOUR_HEIGHT - 20 }}>
                                            <div className="text-slate-500 text-sm select-none">{format(hour, 'HH:mm')}</div>
                                        </div>
                                    ))}
                                </div>
                                <Separator orientation="vertical" />
                                <div className="flex-1 relative h-full">
                                    <div className="flex flex-row">
                                        {displayWeek.map((day, index) => (
                                            <div key={day.getTime()} className="relative flex-1">
                                                <div className="flex flex-col border-r border-slate-200 flex-1">
                                                    {hours.map((hour, index) => (
                                                        <div key={hour.getTime()} className="border-b border-slate-200" style={{ height: HOUR_HEIGHT }}></div>
                                                    ))}
                                                </div>
                                                {renderEventsInDay(day)}
                                            </div>
                                        ))}
                                    </div>
                                    <CurrentTimePointer />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    )
}

const Calendar = () => {
    return  <CalendarContent/>
    
}

export default Calendar;