import { Skeleton } from "@/components/ui/skeleton"

function InputsLoader() {
    return (
        <div className="flex space-y-3 justify-left">
            {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-[30px] w-[170px] rounded-xl mx-4" />
            ))}
        </div>
    )
}

export default InputsLoader



