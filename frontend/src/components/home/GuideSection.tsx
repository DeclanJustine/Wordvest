import { guideSteps } from "@/data/wordvest-mock"
import ImageSlot from "@/components/home/ImageSlot"

export default function GuideSection() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-5">
        {guideSteps.map((step, i) => (
          <div
            key={i}
            className="rounded-xl border-2 border-[#242424] bg-white p-5 shadow-[4px_4px_0_#242424] transition-transform hover:-translate-y-1"
          >
            <span className="font-serif text-[36px] font-bold leading-none text-[#242424]">
              0{i + 1}
            </span>
            <h3 className="mt-2 font-bold text-[#242424]">{step.title}</h3>
            <p className="mt-1 text-[15px] text-[#6B6B6B] leading-relaxed text-justify">
              {step.description}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center">
        <ImageSlot
          src="/panduan.svg"
          alt="Ilustrasi panduan belajar"
          fileName="panduan.svg"
          width={800}
          height={600}
          className="w-full aspect-[4/3]"
        />
      </div>
    </div>
  )
}
