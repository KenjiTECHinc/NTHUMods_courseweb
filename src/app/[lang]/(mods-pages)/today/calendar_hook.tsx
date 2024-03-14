'use client';
import {useContext, useState, createContext, FC, PropsWithChildren, useRef, useMemo} from 'react';
import {CalendarEvent} from '@/app/[lang]/(mods-pages)/today/calendar.types';
import useUserTimetable from '@/hooks/contexts/useUserTimetable';
import {useRxCollection, useRxQuery} from 'rxdb-hooks';
import { timetableToCalendarEvent } from './timetableToCalendarEvent';
import { createTimetableFromCourses } from '@/helpers/timetable';
import supabase from '@/config/supabase';
import { MinimalCourse } from '@/types/courses';
import { RxDocument } from 'rxdb';
import { toast } from '@/components/ui/use-toast';

export const calendarContext = createContext<ReturnType<typeof useCalendarProvider>>({} as any);

export const useCalendar = () => useContext(calendarContext);

export const useCalendarProvider = () => {
    const HOUR_HEIGHT = 48;

    const eventsCol = useRxCollection('events')
    const { result: eventStore } = useRxQuery(eventsCol?.find());
    const events = useMemo(() => {
        return eventStore.map((e) => {
            const event = e.toJSON() as CalendarEvent;
            return {
                ...event,
                start: new Date(event.start),
                end: new Date(event.end),
                repeat: event.repeat ? {
                    ...event.repeat,
                    ...('date' in event.repeat ? {date: new Date(event.repeat.date)} : {})
                } : null
            }
        })
    }, [eventStore])
    console.log(events)
    

    const { courses, colorMap } = useUserTimetable();

    const weekContainer = useRef<HTMLDivElement>(null);

    const addEvent = async (event: CalendarEvent) => {
        await eventsCol!.upsert({
            ...event,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            repeat: event.repeat ? {
                ...event.repeat,
                ...('date' in event.repeat ? {date: event.repeat.date.toISOString()} : {})
            } : null
        });
    }

    const removeEvent = async (event: CalendarEvent) => {
        const docs = await eventsCol!.findOne(event.id).exec();
        if(docs) {
            await docs.remove();
            toast({ title: '行程已刪除' })
        }
    }


    useMemo(() => {
        if(!eventsCol)  return;
        (async () => {
            if (courses) {
                const timetable = [];
                for (const semester in courses) {
                    const { data: coursesData, error } = await supabase.from('courses').select('*').in('raw_id', courses[semester]);
                    if (error) console.error(error);
                    if(coursesData) timetable.push(timetableToCalendarEvent(createTimetableFromCourses(coursesData as unknown as MinimalCourse[], colorMap)))
                }
                for (const event of timetable.flat()) {
                    addEvent(event);
                }
                console.log('sync timetable to events complete')
            }
        })()
    }, [courses, colorMap, eventsCol])


    return {
        events,
        addEvent,
        removeEvent,
        weekContainer,
        HOUR_HEIGHT
    }

}

export const CalendarProvider: FC<PropsWithChildren> = ({children}) => {
    const value = useCalendarProvider();
    return <calendarContext.Provider value={value}>
        {children}
    </calendarContext.Provider>
}
