import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface EventRow { id: string; title: string; description: string | null; start_time: string }

const EventSignup = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [attendeeId, setAttendeeId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      setEvent(data as any);
    };
    load();
  }, [id]);

  const submit = async () => {
    if (!id || !name || !email) {
      toast({ title: "Missing info", description: "Name and email are required." });
      return;
    }
    const { data, error } = await supabase
      .from("attendees")
      .insert({ 
        event_id: id, 
        name, 
        email, 
        interests,
        phone_number: phoneNumber || null,
        instagram_handle: instagramHandle || null
      })
      .select("id")
      .single();
    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }
    setAttendeeId(data.id);
    toast({ title: "You're in!", description: "We’ll email you when your spot is revealed." });
  };

  if (!event) return <div className="container py-10">Loading...</div>;

  return (
    <main className="container py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <p className="text-muted-foreground">{event.description}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Interests (optional)</Label>
            <Textarea value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Topics you enjoy, to help grouping" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number (optional)</Label>
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label>Instagram Handle (optional)</Label>
              <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@username" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
            We may use your contact info to remind you about the event. To delete your data or for any privacy concerns, email us at <a href="mailto:sb314mldummy@gmail.com" className="underline">sb314mldummy@gmail.com</a>
          </div>
          <Button onClick={submit}>Join event</Button>

          {attendeeId && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">Bookmark your assignment page:</p>
              <Link to={`/event/${event.id}/attendee/${attendeeId}`} className="underline">Open my spot page</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default EventSignup;
