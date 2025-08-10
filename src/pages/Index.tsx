import { Link } from "react-router-dom";

const Index = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <section className="text-center space-y-6 p-8">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Crew Call</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
          Coordinate small group meetups with precise, last-minute spot reveals and built-in map guidance.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/host" className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-5 py-3 font-medium">Create an event</Link>
          <a href="#how-it-works" className="inline-flex items-center rounded-md border px-5 py-3">How it works</a>
        </div>
      </section>
    </main>
  );
};

export default Index;
