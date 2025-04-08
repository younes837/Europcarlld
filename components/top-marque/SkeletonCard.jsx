import { Skeleton } from "../ui/skeleton"

function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3 justify-center">
      <Skeleton className="h-[270px] w-[350px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[350px]" />
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  )
}

export default SkeletonCard
