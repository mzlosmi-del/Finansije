import { Bar, Pill } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 pt-2 animate-pulse">
      <div className="card space-y-3">
        <Bar className="h-3 w-1/3" />
        <Pill className="h-12" />
        <Pill className="h-12" />
        <Pill className="h-12" />
      </div>
      <div className="card space-y-3">
        <Bar className="h-3 w-1/4" />
        <Pill className="h-12" />
        <Pill className="h-12" />
      </div>
      <div className="card space-y-2">
        <Bar className="h-3 w-1/3" />
        <Pill className="h-10" />
        <Pill className="h-10" />
        <Pill className="h-10" />
      </div>
    </div>
  );
}
