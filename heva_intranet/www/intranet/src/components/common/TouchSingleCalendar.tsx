import React, { useState } from 'react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, parseISO, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface TouchSingleCalendarProps {
    date?: string;
    onChange: (date: string) => void;
}

export default function TouchSingleCalendar({ date, onChange }: TouchSingleCalendarProps) {
    const initialMonth = date ? parseISO(date) : new Date();
    const [currentMonth, setCurrentMonth] = useState(initialMonth);

    const handleDayClick = (day: Date) => {
        onChange(format(day, 'yyyy-MM-dd'));
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
            const closureDay = new Date(day);

            const isSelected = date && isSameDay(day, parseISO(date));
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
                        color: !isCurrentMonth ? '#cbd5e1' : (isSelected ? 'white' : 'inherit'),
                        backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                        boxShadow: isSelected ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none',
                        margin: '2px',
                        transition: 'all 0.2s ease-in-out'
                    }}
                >
                    {formattedDate}
                </div>
            );
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
        <div style={{ userSelect: 'none', padding: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer' }}>&lt;</button>
                <span style={{ fontWeight: 600 }}>{format(currentMonth, 'MMMM yyyy', { locale: de })}</span>
                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer' }}>&gt;</button>
            </div>

            <div style={{ display: 'flex', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                {weekDays.map(d => (
                    <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {d}
                    </div>
                ))}
            </div>

            <div>{rows}</div>

            {date && (
                <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: 500 }}>
                    Ausgewählt: {format(parseISO(date), 'dd.MM.yyyy')}
                </div>
            )}
        </div>
    );
}
