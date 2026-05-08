import { Bar, Pill } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 pt-2 animate-pulse">
      <div className="flex items-center justify-between">
        <Bar className="h-9 w-12" />
        <Bar className="h-5 w-32" />
        <Bar className="h-9 w-12" />
      </div>
      <div className="card space-y-3">
        <Bar className="h-3 w-1/3" />
        <Bar className="h-9 w-2/3" />
        <Bar className="h-2 w-full" />
      </div>
      <div className="card space-y-2">
        <Bar className="h-3 w-1/4" />
        <Pill className="h-14" />
        <Pill className="h-14" />
      </div>
      <div className="card space-y-2">
        <Bar className="h-3 w-1/3" />
        <Pill className="h-12" />
        <Pill className="h-12" />
        <Pill className="h-12" />
      </div>
    </div>
  );
}
