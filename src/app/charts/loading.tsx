import { Bar, Pill } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 pt-2 animate-pulse">
      <div className="card space-y-3">
        <Bar className="h-3 w-2/3" />
        <div className="flex gap-2">
          <Pill className="h-7 w-12" />
          <Pill className="h-7 w-12" />
          <Pill className="h-7 w-12" />
          <Pill className="h-7 w-12" />
        </div>
        <Pill className="h-64" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Pill className="h-16" />
        <Pill className="h-16" />
        <Pill className="h-16" />
      </div>
      <div className="card space-y-2">
        <Bar className="h-3 w-1/3" />
        <Pill className="h-8" />
        <Pill className="h-8" />
        <Pill className="h-8" />
      </div>
    </div>
  );
}
