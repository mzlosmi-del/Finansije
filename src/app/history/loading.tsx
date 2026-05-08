import { Bar, Pill } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 pt-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card space-y-2">
          <Bar className="h-3 w-1/3" />
          <Pill className="h-12" />
          <Pill className="h-12" />
          <Pill className="h-12" />
        </div>
      ))}
    </div>
  );
}
