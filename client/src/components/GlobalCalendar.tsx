import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import "react-day-picker/dist/style.css";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  sportId: number;
  sportName: string;
  level?: string;
  location?: string;
  homeTeam?: string;
  awayTeam?: string;
}

export default function GlobalCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedSport, setSelectedSport] = useState<string>("all");

  // Mock data for demonstration - in production, this would come from the calendar API
  const mockEvents: CalendarEvent[] = [
    {
      id: "1",
      title: "Grace vs Momence",
      start: new Date(2025, 7, 5, 19, 0), // August 5, 2025 7:00 PM
      end: new Date(2025, 7, 5, 21, 0),
      sportId: 3,
      sportName: "Volleyball",
      level: "Varsity",
      location: "Grace Christian Academy",
      homeTeam: "Grace",
      awayTeam: "Momence"
    },
    {
      id: "2", 
      title: "Central vs Beecher",
      start: new Date(2025, 7, 8, 18, 0), // August 8, 2025 6:00 PM
      end: new Date(2025, 7, 8, 20, 0),
      sportId: 2,
      sportName: "Basketball",
      level: "JV",
      location: "Central High School",
      homeTeam: "Central",
      awayTeam: "Beecher"
    },
    {
      id: "3",
      title: "Track Meet",
      start: new Date(2025, 7, 12, 16, 0), // August 12, 2025 4:00 PM
      end: new Date(2025, 7, 12, 18, 0),
      sportId: 7,
      sportName: "Track",
      level: "Varsity",
      location: "RVC Track Complex",
      homeTeam: "Multiple Teams",
      awayTeam: ""
    },
    {
      id: "4",
      title: "Soccer Tournament",
      start: new Date(2025, 7, 15, 10, 0), // August 15, 2025 10:00 AM
      end: new Date(2025, 7, 15, 16, 0),
      sportId: 4,
      sportName: "Soccer",
      level: "Both",
      location: "Grant Park Soccer Fields",
      homeTeam: "Tournament",
      awayTeam: ""
    }
  ];

  const { data: sports } = useQuery({
    queryKey: ["/api/sports"],
    initialData: [
      { id: 1, name: "Football", season: "fall" },
      { id: 2, name: "Basketball", season: "winter" },
      { id: 3, name: "Volleyball", season: "fall" },
      { id: 4, name: "Soccer", season: "fall" },
      { id: 5, name: "Baseball", season: "spring" },
      { id: 6, name: "Softball", season: "spring" },
      { id: 7, name: "Track", season: "spring" },
      { id: 8, name: "Scholastic Bowl", season: "winter" }
    ]
  });

  // Filter events based on selected sport and month
  const filteredEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.start);
    const monthMatch = eventDate.getMonth() === selectedMonth.getMonth() && 
                      eventDate.getFullYear() === selectedMonth.getFullYear();
    const sportMatch = selectedSport === "all" || event.sportId.toString() === selectedSport;
    return monthMatch && sportMatch;
  });

  // Get events for selected date
  const selectedDateEvents = selectedDate ? 
    filteredEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === selectedDate.toDateString();
    }) : [];

  // Get dates that have events for the calendar
  const eventDates = filteredEvents.map(event => new Date(event.start));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSportColor = (sportId: number) => {
    const colors = {
      1: "bg-red-100 text-red-800", // Football
      2: "bg-orange-100 text-orange-800", // Basketball  
      3: "bg-purple-100 text-purple-800", // Volleyball
      4: "bg-green-100 text-green-800", // Soccer
      5: "bg-blue-100 text-blue-800", // Baseball
      6: "bg-pink-100 text-pink-800", // Softball
      7: "bg-yellow-100 text-yellow-800", // Track
      8: "bg-indigo-100 text-indigo-800", // Scholastic Bowl
    };
    return colors[sportId as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              RVC Conference Calendar
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sports?.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id.toString()}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="calendar-container">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              modifiers={{
                hasEvents: eventDates
              }}
              modifiersClassNames={{
                hasEvents: "bg-conference-navy text-white font-semibold rounded-full"
              }}
              className="rounded-md border w-full"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full",
                head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 flex-1",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md mx-auto",
                day_selected: "bg-conference-navy text-white hover:bg-blue-700 hover:text-white focus:bg-conference-navy focus:text-white",
                day_today: "bg-gray-100 text-gray-900",
                day_outside: "text-gray-400 opacity-50",
                day_disabled: "text-gray-400 opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? formatDate(selectedDate) : "Select a Date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-4">
              {selectedDateEvents.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge className={getSportColor(event.sportId)}>
                      {event.sportName}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Time:</strong> {formatTime(event.start)} - {formatTime(event.end)}</p>
                    {event.level && <p><strong>Level:</strong> {event.level}</p>}
                    {event.location && <p><strong>Location:</strong> {event.location}</p>}
                    {event.homeTeam && event.awayTeam && (
                      <p><strong>Teams:</strong> {event.homeTeam} vs {event.awayTeam}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No events scheduled for this date</p>
              {selectedDate && (
                <p className="text-sm text-gray-400 mt-1">
                  Try selecting a different date or sport filter
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}