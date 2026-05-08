import { Bar, Pill } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 pt-2 animate-pulse">
      <div className="grid grid-cols-2 gap-2">
        <Pill className="h-11" />
        <Pill className="h-11" />
      </div>
      <div className="card space-y-3">
        <Bar className="h-3 w-20" />
        <Bar className="h-12 w-1/2" />
      </div>
      <div className="space-y-2">
        <Bar className="h-3 w-24" />
        <div className="flex flex-wrap gap-2">
          <Pill className="h-8 w-24" />
          <Pill className="h-8 w-20" />
          <Pill className="h-8 w-28" />
          <Pill className="h-8 w-20" />
          <Pill className="h-8 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Bar className="h-3 w-20" />
        <div className="grid grid-cols-2 gap-2">
          <Pill className="h-11" />
          <Pill className="h-11" />
        </div>
      </div>
      <Pill className="h-12" />
    </div>
  );
}
