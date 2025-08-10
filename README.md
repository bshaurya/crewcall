# CrewCall

*Because coordinating random meetup events shouldn't feel like herding hackclubers*

## What is this?

Here's how it works: You create an event, add a bunch of potential meeting spots, and people sign up. Then, shortly before the event starts, everyone gets assigned to a specific spot with a map and directions. No more "where are we meeting again?" texts or people showing up at the wrong place. You can add multiple locations to 

## Features

- **Last-minute reveals**: Meeting spots have the option to be revealed close to event time instead of much before
- **Smart grouping**: Automatically assigns people to spots based on capacity and preferences
- **Interactive maps**: Built-in Leaflet maps with compass navigation
- **Mobile-friendly**: Works great on phones (because that's where you'll use it)
- **Simple signup**: Just name, email, and optional interests for better grouping

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Maps**: Leaflet + React Leaflet
- **Deployment**: Vercel

## Getting Started

```bash
# Clone the repo
git clone https://github.com/bshaurya/
cd crewcall

# Install dependencies
npm install

# Run the dev server
npm run dev
```

## How to Use

1. **Create an event** at `/host` - add your event details and meeting spots
2. **Share the signup link** with your (shipwrecked) crew
3. **People sign up** with basic info and interests
4. **Spots get revealed** automatically before the event starts
5. **Everyone shows up** at their assigned location with built-in navigation

---


## Picture of a meetup

[Picture](https://hc-cdn.hel1.your-objectstorage.com/s/v3/72dd2415715ea55b38a721209b7a29b259df7b04_img_4930.heic)

## License

MIT - use it, modify it, make it better.

---

*Built with ☕ (celsius) and frustration at poorly coordinated group hangouts*