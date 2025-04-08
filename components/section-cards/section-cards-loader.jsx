import { CardLoader } from "../ui/card-loader";
import { Skeleton } from "../ui/skeleton";

function SectionCardsLoader() {
    return (
        <div className="h-40 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4">
            {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <div className="space-y-2">
                        <CardLoader className="h-4 w-[150px]" />
                        <CardLoader className="h-4 w-[100px]" />
                        <CardLoader className="h-4 w-[50px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default SectionCardsLoader;
