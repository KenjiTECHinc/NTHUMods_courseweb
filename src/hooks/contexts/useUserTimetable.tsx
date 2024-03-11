'use client';;
import {useState, useEffect, useCallback, createContext, useContext, useMemo, useLayoutEffect} from 'react';
import supabase, { CourseSyllabusView } from "@/config/supabase";
import { createTimetableFromCourses } from "@/helpers/timetable";
import { CourseTimeslotData } from "@/types/timetable";
import { MinimalCourse, RawCourseID } from '@/types/courses';
import { useLocalStorage } from 'usehooks-ts';
import { lastSemester, currentSemester } from "@/const/semester";
import { getSemesterFromID } from '@/helpers/courses';
import { event } from "@/lib/gtag";
import {timetableColors} from '@/const/timetableColors';
import { useQuery } from "@tanstack/react-query";

type CourseLocalStorage = { [sem: string]: RawCourseID[] };

const userTimetableContext = createContext<ReturnType<typeof useUserTimetableProvider>>({
    timetableData: [],
    displayCourseData: [],
    semesterCourseData: [],
    semesterCourses: [],
    timetableTheme: Object.keys(timetableColors)[0],
    currentColors: [],
    userDefinedColors: {},
    courses: {},
    colorMap: {},
    setCourses: () => { },
    clearCourses: () => { },
    deleteCourse: () => { },
    setColorMap: () => { },
    addCourse: () => { },
    setTimetableTheme: () => { },
    setUserDefinedColors: () => {},
    setColor: () => {},
    isCourseSelected: () => false,
    isLoading: true,
    error: null,
    semester: lastSemester.id,
    isCoursesEmpty: true,
    setSemester: () => { }
});

const useUserTimetableProvider = (loadCourse = true) => {
    const [courses, setCourses] = useLocalStorage<CourseLocalStorage>("courses", {});
    const [colorMap, setColorMap] = useLocalStorage<{ [courseID: string]: string }>("course_color_map", {}); //map from courseID to color
    const [timetableTheme, _setTimetableTheme] = useLocalStorage<string>("timetable_theme", "pastelColors");
    const [userDefinedColors, setUserDefinedColors] = useLocalStorage<{[theme_name: string]: string[]}>("user_defined_colors", {});
    const [semester, setSemester] = useState<string>(lastSemester.id);
    const [timetableData, setTimetableData] = useState<CourseTimeslotData[]>([]);

    const setTimetableTheme = useCallback((theme: string) => {
        //if theme updated, remap colors and override all
        const newColors = timetableColors[theme];
        const newColorMap: { [courseID: string]: string } = {};

        Object.keys(courses).forEach(sem => {
            courses[sem].forEach((courseID, i) => {
                newColorMap[courseID] = newColors[i % newColors.length];
            });
        });
        setColorMap(newColorMap);
        setUserDefinedColors({})
        console.log('colorMap updated')
        _setTimetableTheme(theme);
    }, [courses]);

    //fix timetableTheme if it is not in timetableColors
    useLayoutEffect(() => {
        if(typeof window  == "undefined") return ;
        const themes = [...Object.keys(timetableColors), ...Object.keys(userDefinedColors)];
        if(!themes.includes(timetableTheme)) {
            setTimetableTheme(themes[0]);
        }
        console.log("timetable theme", timetableTheme);
        event({
            action: "selected_theme",
            category: "theme",
            label: !themes.includes(timetableTheme) ? themes[0] : timetableTheme
        });
    }, [timetableTheme, Object.keys(userDefinedColors).length]);

    //check if number of courses in each semester is the same as number of colors
    useEffect(() => {
        const semesters = Object.keys(courses);
        const numCourses = Object.values(courses).flat().length;
        const numColors = Object.keys(colorMap).length;
        if(numCourses == numColors) return;
        //if not the same, reset colorMap
        const newColorMap: { [courseID: string]: string } = {};
        semesters.forEach(sem => {
            courses[sem].forEach((courseID, i) => {
                newColorMap[courseID] = currentColors[i % currentColors.length];
            });
        });
        setColorMap(newColorMap);
    }, [courses, colorMap]);


    //sort courses[semester]： string[] and put as key_display_ids
    const key_display_ids = useMemo(() => [...(courses[semester] ?? [])].sort(), [courses, semester]);

    const { data: displayCourseData = [], error, isLoading } = useQuery({
        queryKey: ['courses', key_display_ids], 
        queryFn: async () => {
            if(!key_display_ids) return [];
            const { data = [], error } = await supabase.rpc('search_courses_with_syllabus', { keyword: "" }).in('raw_id', key_display_ids);
            if (error) throw error;
            if (!data) throw new Error('No data');
            return data as unknown as CourseSyllabusView[];
        },
        placeholderData: (prev) => prev?.filter(c => key_display_ids.includes(c.raw_id)),
        select: (data) => (courses[semester] ?? []).map(courseID => data.find(c => c.raw_id == courseID)!).filter(c => c)
    });
    
    //rewrite semesterCourseData like displayCourseData
    const key_semester_ids = useMemo(() => [...(currentSemester ? (courses[currentSemester.id] ?? []) : null ?? [])].sort(), [courses, currentSemester]);
    const { data: semesterCourseData = [], error: semesterError, isLoading: semesterLoading } = useQuery({
        queryKey: ['courses', key_semester_ids], 
        queryFn: async () => {
            if(!key_semester_ids) return [];
            const { data = [], error } = await supabase.rpc('search_courses_with_syllabus', { keyword: "" }).in('raw_id', key_semester_ids);
            if (error) throw error;
            if (!data) throw new Error('No data');
            return data as unknown as CourseSyllabusView[];
        },
        placeholderData: (prev) => prev?.filter(c => key_semester_ids.includes(c.raw_id)),
        select: (data) => (currentSemester ? (courses[currentSemester.id] ?? []) : []).map(courseID => data.find(c => c.raw_id == courseID)!).filter(c => c)
    });

    //migration from old localStorage key "semester_1121"
    useEffect(() => {
        //check if the old localStorage key "semester_1121" exists
        if (typeof window == "undefined") return;
        const oldCourses = window.localStorage.getItem("semester_1121");
        if (!oldCourses) return;

        //migrate old data to new data format
        const oldCoursesArray = JSON.parse(oldCourses) as RawCourseID[];
        oldCoursesArray.forEach(addCourse);

        setCourses(courses => {
            const newCourses = { ...courses };
            delete newCourses['11210'];
            return newCourses;
        });

        //remove old data
        window.localStorage.removeItem("semester_1121");
    }, []);

    useEffect(() => {
        if (!loadCourse) return;
        if (semesterError) {
            console.error(error);
            return;
        }
        if (semesterLoading) {
            console.log('loading')
            return;
        }
        setTimetableData(createTimetableFromCourses(semesterCourseData! as MinimalCourse[], colorMap));
    }, [semesterCourseData, semesterLoading, semesterError, colorMap]);

    //handlers for courses
    const addCourse = (courseID: string | string[]) => {
        const courseIDs = Array.isArray(courseID) ? courseID : [courseID];
        setCourses(courses => {
            //get first 5 characters of courseID
            let oldCourses = { ...courses };
            courseIDs.forEach(courseID => {
                const semester = getSemesterFromID(courseID);
                if (!semester) throw new Error("Invalid courseID");
                const oldSemesterCourses = oldCourses[semester] ?? [];

                //check if courseID already exists
                if (oldSemesterCourses.includes(courseID)) return;

                setColorMap(colorMap => {
                    return {
                        ...colorMap,
                        [courseID]: currentColors[oldSemesterCourses.length % currentColors.length]
                    }
                });
                oldCourses = {
                    ...oldCourses,
                    [semester]: [...oldSemesterCourses, courseID]
                }
                event({
                    action: "add_course",
                    category: "timetable",
                    label: courseID,
                })
            });
            return oldCourses;
            
        });
    }

    const deleteCourse = (courseID: string | string[]) => {
        const courseIDs = Array.isArray(courseID) ? courseID : [courseID];
        setCourses(courses => {
            //get first 5 characters of courseID
            let oldCourses = { ...courses };
            courseIDs.forEach(courseID => {
                const semester = getSemesterFromID(courseID);
                if (!semester) throw new Error("Invalid courseID");
                const oldSemesterCourses = oldCourses[semester] ?? [];

                //check if courseID already exists
                if (!oldSemesterCourses.includes(courseID)) return;

                //remove color from colorMap
                setColorMap(colorMap => {
                    const newColorMap = { ...colorMap };
                    delete newColorMap[courseID];
                    return newColorMap;
                });

                oldCourses = {
                    ...oldCourses,
                    [semester]: oldSemesterCourses.filter(c => c != courseID)
                }
                event({
                    action: "delete_course",
                    category: "timetable",
                    label: courseID,
                })
            })
            return oldCourses;
        });
        
    }

    const setColor = (courseID: string, color: string) => {
        setColorMap(colorMap => {
            return {
                ...colorMap,
                [courseID]: color
            }
        });
    }

    const isCourseSelected = useCallback((courseID: string) => {
        const semester = getSemesterFromID(courseID);
        if (!semester) throw new Error("Invalid courseID");
        const oldSemesterCourses = courses[semester] ?? [];

        //check if courseID already exists
        return oldSemesterCourses.includes(courseID);
    }, [courses]);

    const semesterCourses = courses[semester] ?? [];

    const clearCourses = () => {
        setCourses({});
    }

    
    const currentColors = useMemo(() => {
        //merge default colors with user defined colors
        const colors = {...timetableColors, ...userDefinedColors};
        //check if timetableTheme exists in colors
        if(!Object.keys(colors).includes(timetableTheme)) {
            return colors[Object.keys(colors)[0]];
        }
        return colors[timetableTheme];
    }, [timetableTheme, userDefinedColors]);

    const isCoursesEmpty = useMemo(() => {
        return Object.keys(courses).length == 0;
    }, [courses]);


    return {
        timetableData, 
        displayCourseData, 
        semesterCourseData,
        colorMap,
        semester, 
        timetableTheme,
        currentColors,
        userDefinedColors,
        setSemester, 
        semesterCourses, 
        setCourses,
        setColorMap,
        addCourse, 
        deleteCourse, 
        clearCourses, 
        isCourseSelected, 
        setTimetableTheme,
        setUserDefinedColors,
        setColor,
        isLoading, 
        isCoursesEmpty,
        error, 
        courses
    };
}

const useUserTimetable = () => useContext(userTimetableContext);

export const UserTimetableProvider = ({ children }: { children: React.ReactNode }) => {
    const value = useUserTimetableProvider();
    return <userTimetableContext.Provider value={value}>{children}</userTimetableContext.Provider>
}

export default useUserTimetable;

