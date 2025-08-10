import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface SpotInput {
  label?: string;
  latitude: string;
  longitude: string;
  capacity?: string;
}

const Host = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [groupSize, setGroupSize] = useState(5);
  const [leadMinutes, setLeadMinutes] = useState(10);
  const [spots, setSpots] = useState<SpotInput[]>([{ label: "", latitude: "", longitude: "", capacity: "" }]);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const addSpot = () => setSpots([...spots, { label: "", latitude: "", longitude: "", capacity: "" }]);
  const removeSpot = (idx: number) => setSpots(spots.filter((_, i) => i !== idx));

  const updateSpot = (idx: number, key: keyof SpotInput, value: string) => {
    const next = [...spots];
    next[idx] = { ...next[idx], [key]: value };
    setSpots(next);
  };

  const createEvent = async () => {
    if (!title || !startTime || spots.length === 0) {
      toast({ title: "Missing info", description: "Please fill title, time and add at least one spot." });
      return;
    }
    try {
      const startISO = new Date(startTime).toISOString();
      const { data: eventData, error: eventErr } = await supabase
        .from("events")
        .insert({
          title,
          description,
          start_time: startISO,
          group_size: groupSize,
          grouping_lead_minutes: leadMinutes,
        })
        .select("id")
        .single();

      if (eventErr) throw eventErr;
      const eventId = eventData.id as string;

      const spotRows = spots
        .filter((s) => s.latitude && s.longitude)
        .map((s) => ({
          event_id: eventId,
          label: s.label?.trim() || null,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          capacity: s.capacity ? Number(s.capacity) : null,
        }));

      if (spotRows.length === 0) {
        throw new Error("Please add at least one valid spot with coordinates.");
      }

      const { error: spotsErr } = await supabase.from("meeting_spots").insert(spotRows);
      if (spotsErr) throw spotsErr;

      setCreatedEventId(eventId);
      toast({ title: "Event created", description: "Share the signup link with your attendees." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error creating event", description: e.message });
    }
  };

  return (
    <main className="container py-10 space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Create a Crew Call</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Set your event details, add meeting spots, and share the public sign-up link. Groups will be assigned
          automatically shortly before start.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunset Walk & Chat" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Start time</Label>
              <Input id="start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Max group size per spot</Label>
              <Input id="group" type="number" min={2} value={groupSize} onChange={(e) => setGroupSize(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead">Reveal lead time (minutes)</Label>
              <Input id="lead" type="number" min={1} value={leadMinutes} onChange={(e) => setLeadMinutes(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description, what to bring, etc." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meeting spots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {spots.map((s, idx) => (
            <div key={idx} className="grid md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input value={s.label} onChange={(e) => updateSpot(idx, "label", e.target.value)} placeholder="North Gate" />
              </div>
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input value={s.latitude} onChange={(e) => updateSpot(idx, "latitude", e.target.value)} placeholder="37.7749" />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input value={s.longitude} onChange={(e) => updateSpot(idx, "longitude", e.target.value)} placeholder="-122.4194" />
              </div>
              <div className="flex gap-2">
                <Input
                  className="w-full"
                  value={s.capacity}
                  onChange={(e) => updateSpot(idx, "capacity", e.target.value)}
                  placeholder="Capacity (optional)"
                />
                <Button variant="secondary" type="button" onClick={() => removeSpot(idx)}>Remove</Button>
              </div>
            </div>
          ))}
          <div className="flex gap-3">
            <Button type="button" onClick={addSpot}>Add spot</Button>
            <Button type="button" onClick={createEvent}>Create event</Button>
          </div>
        </CardContent>
      </Card>

      {createdEventId && (
        <Card>
          <CardHeader>
            <CardTitle>Share sign-up link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">Send this link to attendees so they can sign up:</p>
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <code className="bg-muted px-3 py-2 rounded-md">/event/{createdEventId}</code>
              <Link to={`/event/${createdEventId}`} className="underline">Open sign-up page</Link>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
};

export default Host;
