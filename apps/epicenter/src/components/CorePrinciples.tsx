import { cn } from "@repo/ui/utils";

type Principle = {
  title: string;
  description: string;
  icon?: string;
};

const userPrinciples: Principle[] = [
  {
    title: "Own your data",
    description: "Everything lives as files on your disk. Delete the app, keep your work.",
  },
  {
    title: "Use any model",
    description: "OpenAI, Anthropic, local LLMs. Your choice, your API key.",
  },
  {
    title: "Preserve authenticity",
    description: "No middleman. Direct connection to your tools and models.",
  },
];

const developerPrinciples: Principle[] = [
  {
    title: "Free and open source",
    description: "Audit the code. Fork it. Make it yours.",
  },
  {
    title: "Blazing fast",
    description: "Built with Rust, Svelte 5, and obsessive performance optimization.",
  },
  {
    title: "Built on tomorrow's stack",
    description: "CRDTs, local-first architecture, and the bleeding edge of web tech.",
  },
];

function PrincipleCard({ principle }: { principle: Principle }) {
  return (
    <div className="p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <h3 className="font-semibold text-gray-900 mb-2">{principle.title}</h3>
      <p className="text-gray-600 text-sm">{principle.description}</p>
    </div>
  );
}

export function CorePrinciples({ className }: { className?: string }) {
  return (
    <section className={cn("grid md:grid-cols-2 gap-12", className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">For You</h3>
        <div className="space-y-4">
          {userPrinciples.map((principle, index) => (
            <PrincipleCard key={index} principle={principle} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">For Developers</h3>
        <div className="space-y-4">
          {developerPrinciples.map((principle, index) => (
            <PrincipleCard key={index} principle={principle} />
          ))}
        </div>
      </div>
    </section>
  );
}