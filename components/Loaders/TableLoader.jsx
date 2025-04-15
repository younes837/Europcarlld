import { Skeleton } from "@/components/ui/skeleton"

function TableLoader() {
  return (
    <div className="flex flex-col space-y-3 justify-center">
      <Skeleton className="h-[60px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-[50vh] w-full rounded-xl" />
      </div>
    </div>
  )
}

export default TableLoader
