import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MapLeaflet from "@/components/MapLeaflet";
import CompassNavigation from "@/components/CompassNavigation";

interface EventRow { id: string; title: string; description: string | null; start_time: string; grouping_lead_minutes: number }

const AttendeeSpot = () => {
  const { id, attendeeId } = useParams();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [assignment, setAssignment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id || !attendeeId) return;
      const { data: e } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      setEvent(e as any);

      const { data: asg } = await supabase
        .from("assignments")
        .select("*, meeting_spots:spot_id(id,label,latitude,longitude)")
        .eq("event_id", id)
        .eq("attendee_id", attendeeId)
        .maybeSingle();

      setAssignment(asg);
      setLoading(false);
    };
    load();
  }, [id, attendeeId]);

  const revealTime = useMemo(() => {
    if (!event) return null;
    const start = new Date(event.start_time).getTime();
    const lead = (event.grouping_lead_minutes ?? 10) * 60 * 1000;
    return new Date(start - lead);
  }, [event]);

  if (loading) return <div className="container py-10">Loading...</div>;

  if (!event) return (
    <div className="container py-10">
      <Card>
        <CardHeader><CardTitle>Event not found</CardTitle></CardHeader>
        <CardContent>
          <Link className="underline" to="/">Back to home</Link>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <main className="container py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <p className="text-muted-foreground">{event.description}</p>
      </header>

      {!assignment ? (
        <Card>
          <CardHeader>
            <CardTitle>Spot not revealed yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your meeting spot will be revealed around {revealTime?.toLocaleString()}.</p>
            <p className="mt-2">Refresh this page when it’s time.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your meeting spot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Label</div>
              <div className="font-medium">{assignment.meeting_spots?.label || 'Assigned spot'}</div>
            </div>
            <MapLeaflet target={{ lat: assignment.meeting_spots.latitude, lng: assignment.meeting_spots.longitude }} />
            <CompassNavigation target={{ lat: assignment.meeting_spots.latitude, lng: assignment.meeting_spots.longitude }} />
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${assignment.meeting_spots.latitude},${assignment.meeting_spots.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button>Open in Google Maps</Button>
              </a>
              <Button variant="secondary" onClick={() => location.reload()}>Refresh</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
};

export default AttendeeSpot;
