import { CardLoader } from "@/components/ui/card-loader"
import { Skeleton } from "@/components/ui/skeleton"

function CardsLoader({n=4}) {
    const cols = n == 6 ? '3' : '4';
    return (
        <div className={`h-40 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${cols} p-4 mb-14`}>
            {[...Array(n)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-20 w-40 rounded-xl" />
                    <div className="space-y-2">
                        <CardLoader className="h-4 w-[150px]" />
                        <CardLoader className="h-4 w-[100px]" />
                        <CardLoader className="h-4 w-[50px]" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default CardsLoader
