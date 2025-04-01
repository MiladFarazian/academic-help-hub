
import React, { useState, useEffect, useCallback } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { WeeklyAvailability } from "@/lib/scheduling/types";
import { WeeklyCalendarHeader } from './WeeklyCalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHelpText } from './CalendarHelpText';
import { useSelectionState } from './hooks/useSelectionState';

interface WeeklyAvailabilityCalendarProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
  readOnly?: boolean;
}

export const WeeklyAvailabilityCalendar = ({
  availability,
  onChange,
  readOnly = false
}: WeeklyAvailabilityCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(currentWeekStart, i);
    return {
      date: day,
      name: format(day, 'EEE').toLowerCase(),
      fullName: format(day, 'EEEE').toLowerCase(),
      displayDate: format(day, 'MMM d')
    };
  });

  const handlePrevWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 8);
  
  const { 
    isSelecting,
    selectionMode,
    selectionStart,
    selectionEnd,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp,
    isInCurrentSelection,
    isCellAvailable,
    updateAvailabilityFromSelection
  } = useSelectionState(availability, onChange, weekDays, readOnly);

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isSelecting, handleMouseUp]);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <WeeklyCalendarHeader 
          currentWeekStart={currentWeekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
        
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <CalendarGrid 
              weekDays={weekDays}
              hours={hours}
              readOnly={readOnly}
              isCellAvailable={isCellAvailable}
              isInCurrentSelection={isInCurrentSelection}
              selectionMode={selectionMode}
              onCellMouseDown={handleCellMouseDown}
              onCellMouseEnter={handleCellMouseEnter}
            />
          </div>
        </div>
        
        <CalendarHelpText readOnly={readOnly} />
      </CardContent>
    </Card>
  );
};
