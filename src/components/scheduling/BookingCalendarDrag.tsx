
import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// Import refactored components
import { useAvailabilityData } from "./calendar/useAvailabilityData";
import { useDragSelection } from "./calendar/useDragSelection";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarDaysHeader } from "./calendar/CalendarDaysHeader";
import { TimeGrid } from "./calendar/TimeGrid";
import { SelectedTimeDisplay } from "./calendar/SelectedTimeDisplay";
import { NoAvailabilityDisplay } from "./calendar/NoAvailabilityDisplay";
import { LoadingDisplay } from "./calendar/LoadingDisplay";

interface BookingCalendarDragProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
}

export const BookingCalendarDrag = ({ tutor, onSelectSlot }: BookingCalendarDragProps) => {
  // Initialize state
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  // Hours to display in the calendar (24-hour format)
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
  
  // Custom hooks
  const { loading, availableSlots, hasAvailability, errorMessage, refreshAvailability } = useAvailabilityData(tutor, startDate);
  const { 
    isDragging, 
    selectedSlot, 
    calendarRef, 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp, 
    isInDragRange 
  } = useDragSelection(availableSlots, onSelectSlot);
  
  useEffect(() => {
    // Generate array of dates for the week
    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6)
    });
    setWeekDays(days);
  }, [startDate]);
  
  const handlePrevWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };
  
  const handleNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };
  
  // Function to get slot for a specific day and time
  const getSlotAt = (day: Date, timeString: string): BookingSlot | undefined => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return availableSlots.find(slot => 
      format(slot.day, 'yyyy-MM-dd') === dayStr && 
      slot.start === timeString
    );
  };

  console.log("BookingCalendarDrag render state:", { 
    tutorId: tutor?.id,
    loading, 
    hasAvailability, 
    availableSlotsCount: availableSlots.length, 
    errorMessage
  });

  if (loading) {
    return <LoadingDisplay message="Loading tutor's availability schedule..." />;
  }

  if (!hasAvailability) {
    return (
      <NoAvailabilityDisplay 
        reason={errorMessage || "This tutor hasn't set their availability yet."}
        onRetry={refreshAvailability}
      />
    );
  }

  // Display a message if there are no slots for the current week
  if (availableSlots.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <h3 className="text-lg font-medium mb-2">No Available Times</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              No availability for the selected week. Try another week or check back later.
            </p>
            <div className="flex space-x-4 mt-2">
              <Button onClick={handlePrevWeek} variant="outline">Previous Week</Button>
              <Button onClick={handleNextWeek} variant="outline">Next Week</Button>
              <Button onClick={refreshAvailability} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Book a Session</CardTitle>
        <CardDescription>
          Select a time slot for your tutoring session with {tutor.firstName || tutor.name.split(' ')[0]}.
          {!isDragging && " You can click and drag to select a range of time."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarHeader 
          startDate={startDate}
          weekDays={weekDays}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
        
        <div 
          className="border rounded-md overflow-x-auto"
          ref={calendarRef}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchEnd={handleMouseUp}
        >
          <CalendarDaysHeader weekDays={weekDays} />
          
          <TimeGrid 
            hours={hours}
            weekDays={weekDays}
            getSlotAt={getSlotAt}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            selectedSlot={selectedSlot}
            isInDragRange={isInDragRange}
          />
        </div>
        
        <SelectedTimeDisplay selectedSlot={selectedSlot} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Rate: ${tutor.hourlyRate?.toFixed(2) || "25.00"}/hour
        </p>
      </CardFooter>
    </Card>
  );
};
