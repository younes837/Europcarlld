import { Skeleton } from "../ui/skeleton"

function Loader() {
  return (
    <div className="flex flex-col space-y-3 justify-center">
      <Skeleton className="h-[350px] w-[700px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[600px]" />
        <Skeleton className="h-4 w-[500px]" />
      </div>
    </div>
  )
}

export default Loader
