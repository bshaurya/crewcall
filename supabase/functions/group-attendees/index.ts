import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") as string | undefined;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string | undefined;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const resend = RESEND_API_KEY ? new (Resend as any)(RESEND_API_KEY) : null;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("is_grouping_done", false);

    if (eventsError) throw eventsError;

    const nowTs = Date.now();
    const dueEvents = (events || []).filter((e: any) => {
      const start = new Date(e.start_time).getTime();
      const leadMs = (e.grouping_lead_minutes ?? 10) * 60 * 1000;
      return nowTs >= start - leadMs;
    });

    for (const event of dueEvents) {
      const { data: attendees, error: attErr } = await supabase
        .from("attendees")
        .select("*")
        .eq("event_id", event.id);
      if (attErr) throw attErr;

      const { data: spots, error: spotErr } = await supabase
        .from("meeting_spots")
        .select("*")
        .eq("event_id", event.id);
      if (spotErr) throw spotErr;

      if (!spots || spots.length === 0 || !attendees || attendees.length === 0) {
        await supabase.from("events").update({ is_grouping_done: true }).eq("id", event.id);
        continue;
      }

      const shuffled = [...attendees].sort(() => Math.random() - 0.5);
      const assignments: Array<{ event_id: string; attendee_id: string; spot_id: string }> = [];
      const totalCapacity = spots.reduce((sum, spot) => sum + Number(spot.capacity ?? event.group_size ?? 5), 0);
      const eventStartTime = new Date(event.start_time).getTime();
      const timeUntilEvent = eventStartTime - nowTs;
      const fifteenMinutes = 15 * 60 * 1000;
      const allowOverfill = timeUntilEvent <= fifteenMinutes || shuffled.length > totalCapacity;
      
      if (allowOverfill) {
        let spotIndex = 0;
        for (let i = 0; i < shuffled.length; i++) {
          assignments.push({
            event_id: event.id,
            attendee_id: shuffled[i].id,
            spot_id: spots[spotIndex].id
          });
          spotIndex = (spotIndex + 1) % spots.length;
        }
      } else {
        let idx = 0;
        for (const spot of spots) {
          const capacity = Number(spot.capacity ?? event.group_size ?? 5);
          for (let i = 0; i < capacity && idx < shuffled.length; i++) {
            assignments.push({
              event_id: event.id,
              attendee_id: shuffled[idx++].id,
              spot_id: spot.id
            });
          }
        }
        
        let spotIndex = 0;
        while (idx < shuffled.length) {
          assignments.push({
            event_id: event.id,
            attendee_id: shuffled[idx++].id,
            spot_id: spots[spotIndex].id
          });
          spotIndex = (spotIndex + 1) % spots.length;
        }
      }

      if (assignments.length > 0) {
        const { error: insertErr } = await supabase.from("assignments").upsert(assignments, {
          onConflict: "attendee_id",
        });
        if (insertErr) throw insertErr;
      }

      await supabase.from("events").update({ is_grouping_done: true }).eq("id", event.id);

      if (resend && APP_BASE_URL) {
        try {
          for (const a of attendees) {
            const assignment = assignments.find((as) => as && as.attendee_id === a.id);
            if (!assignment) continue;

            const url = `${APP_BASE_URL}/event/${event.id}/attendee/${a.id}`;
            const subject = `Your meetup spot is ready: ${event.title}`;
            const html = `
              <h2 style="margin:0 0 8px 0; font-family:Inter,system-ui,-apple-system,sans-serif;">${event.title}</h2>
              <p style="margin:0 0 12px 0; color:#555">Your meeting spot has been revealed.</p>
              <p style="margin:0 0 16px 0;">Tap below to open the app and get directions:</p>
              <p><a href="${url}" target="_blank" style="display:inline-block; padding:10px 14px; background:#111827; color:#fff; text-decoration:none; border-radius:8px;">Open my spot</a></p>
              <p style="margin-top:16px; color:#777; font-size:12px;">If the button doesn’t work, copy & paste this link:<br/>${url}</p>
            `;

            await resend.emails.send({
              from: "Crew Call <onboarding@resend.dev>",
              to: [a.email],
              subject,
              html,
            } as any);

            await supabase.from("attendees").update({ notification_sent: true }).eq("id", a.id);
          }
        } catch (e) {
          console.error("Email sending error:", e);
        }
      } else {
        console.log("Skipping email: RESEND_API_KEY or APP_BASE_URL not configured");
      }
    }

    return new Response(JSON.stringify({ grouped: dueEvents.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("group-attendees error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
