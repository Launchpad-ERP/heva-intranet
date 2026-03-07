import React, { useState } from 'react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isWithinInterval, parseISO, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface TouchRangeCalendarProps {
    startDate?: string;
    endDate?: string;
    onChange: (startDate: string, endDate: string) => void;
}

export default function TouchRangeCalendar({ startDate, endDate, onChange }: TouchRangeCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const handleDayClick = (day: Date) => {
        const formattedDay = format(day, 'yyyy-MM-dd');

        if (!startDate || (startDate && endDate)) {
            onChange(formattedDay, '');
        } else {
            if (new Date(formattedDay) < new Date(startDate)) {
                onChange(formattedDay, startDate);
            } else {
                onChange(startDate, formattedDay);
            }
        }
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateGrid = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDateGrid = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDateGrid;
    let formattedDate = "";

    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    // Generate Days
    while (day <= endDateGrid) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);
            // Create a completely new Date object for the closure to capture
            const closureDay = new Date(day);

            const isStart = startDate && isSameDay(day, parseISO(startDate));
            const isEnd = endDate && isSameDay(day, parseISO(endDate));
            const inRange = startDate && endDate && isWithinInterval(day, { start: parseISO(startDate), end: parseISO(endDate) });
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

            days.push(
                <div
                    key={day.toString()}
                    onClick={() => handleDayClick(closureDay)}
                    style={{
                        flex: 1,
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: !isCurrentMonth ? '#cbd5e1' : (isStart || isEnd ? 'white' : 'inherit'),
                        backgroundColor: (isStart || isEnd) ? '#10b981' : (inRange ? '#d1fae5' : 'transparent'),
                        margin: '2px'
                    }}
                >
                    {formattedDate}
                </div>
            );
            // Use addDays to create a NEW object for the next iteration
            day = addDays(day, 1);
        }
        rows.push(
            <div key={day.toString()} style={{ display: 'flex', marginBottom: '0.5rem' }}>
                {days}
            </div>
        );
        days = [];
    }

    return (
        <div style={{ userSelect: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', fontSize: '1.2rem', padding: '0.5rem' }}>&lt;</button>
                <span style={{ fontWeight: 600 }}>{format(currentMonth, 'MMMM yyyy', { locale: de })}</span>
                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', fontSize: '1.2rem', padding: '0.5rem' }}>&gt;</button>
            </div>

            <div style={{ display: 'flex', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                {weekDays.map(d => (
                    <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {d}
                    </div>
                ))}
            </div>

            <div>{rows}</div>

            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {!startDate && "Startdatum wählen"}
                {startDate && !endDate && "Enddatum wählen"}
                {startDate && endDate && `${format(parseISO(startDate), 'dd.MM.')} - ${format(parseISO(endDate), 'dd.MM.yyyy')}`}
            </div>
        </div>
    );
}
