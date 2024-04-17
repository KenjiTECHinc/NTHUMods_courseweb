'use server';
	
export type BusesSchedules = {
    time: string;
    description: string;
    route: "校園公車";
    dep_stop: string;
    line: string;
} | {
    time: string;
    description: string;
    route: "南大區間車";
}

export const getBusesSchedules = async (bus_type: 'all'|'main'|'nanda', day: 'all'|'weekday'|'weekend'|'current', direction: 'up' | 'down') => {
    const res = await fetch(`https://api.nthusa.tw/buses/schedules/?bus_type=${bus_type}&day=${day}&direction=${direction}`);
    const data = await res.json();
    return data as BusesSchedules[];
}
  
export type GetStopBusAPIResponse = {
    bus_info: {
        time: string;
        description: string;
        route: string;
    };
    arrive_time: string;
}[]

export const getStopBus = async (stop_name: string, bus_type: 'all'|'main'|'nanda', day: 'all'|'weekday'|'weekend'|'current', direction: 'up' | 'down') => {
    const res = await fetch(`https://api.nthusa.tw/buses/stops/${stop_name}?bus_type=${bus_type}&day=${day}&direction=${direction}`);
    const data = await res.json();
    return data as GetStopBusAPIResponse;
}