import { Skeleton } from "../ui/skeleton"

function Loader() {
  return (
  <div className="flex flex-col space-y-3 justify-center">
    <Skeleton className="h-[300px] w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[800px]" />
      <Skeleton className="h-4 w-[600px]" />
    </div>
  </div>
  )
}

export default Loader
