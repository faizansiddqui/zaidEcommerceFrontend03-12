import { Star, ArrowRight, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { useNavigation } from "../../utils/navigation";

export default function Hero() {
  const { go } = useNavigation();

  return (
    <div className="relative bg-[#FCFBFA] text-gray-900 overflow-hidden border-b border-amber-100/50">
      {/* Abstract Background Orbs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-amber-50/60 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content Area */}
          <div className="order-2 lg:order-1 space-y-8 text-center lg:text-left">
            
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-3 bg-white border border-amber-100 px-4 py-2 rounded-full shadow-sm animate-fadeIn">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-amber-200 flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 border-l border-gray-100 pl-3">
                <div className="flex text-amber-500">
                  <Star size={12} fill="currentColor" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">4.9/5 Rating</span>
              </div>
            </div>

            {/* Premium Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-light leading-[1.1] tracking-tight text-gray-900">
                Elevate Your Space with 
                <span className="block font-serif italic text-amber-800 font-normal mt-2">
                  Divine Elegance
                </span>
              </h1>
              <p className="text-gray-600 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                Discover a curated collection of handcrafted Islamic art pieces that bring serenity and sophistication to your modern home.
              </p>
            </div>

            {/* Refined Features List */}
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto lg:mx-0">
              <div className="flex items-start gap-3">
                <span className="text-amber-800 font-serif italic font-bold">01.</span>
                <div className="text-left">
                  <p className="font-bold text-sm uppercase tracking-wider">Museum Quality</p>
                  <p className="text-xs text-gray-500">Premium Grade Materials</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-amber-800 font-serif italic font-bold">02.</span>
                <div className="text-left">
                  <p className="font-bold text-sm uppercase tracking-wider">Global Shipping</p>
                  <p className="text-xs text-gray-500">Insured Delivery Worldwide</p>
                </div>
              </div>
            </div>

            {/* High-Impact CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <button
                onClick={() => go('/category-list')}
                className="relative group overflow-hidden bg-gray-900 text-white px-10 py-4 rounded-full font-bold transition-all hover:bg-amber-800 shadow-xl shadow-gray-200 active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Explore Collection
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>

            {/* Security Trust Marks */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4 grayscale opacity-60">
               <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tighter">
                 <ShieldCheck size={14} /> Secure Checkout
               </div>
               <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tighter">
                 <Truck size={14} /> Fast Tracking
               </div>
            </div>
          </div>

          {/* Right Visual Area */}
          <div className="order-1 lg:order-2 relative group">
            {/* The Main Image Container */}
            <div className="relative md:aspect-square rounded-[2rem] overflow-hidden shadow-2xl transform lg:rotate-2 transition-transform duration-700 group-hover:rotate-0">
              <img
                src="/hero.jpg"
                alt="Modern Islamic Living Room"
                className="w-full h-[45vh] sm:h-[90vh] md:h-[100vh] lg:h-[100vh] object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Floating "Inspiration" Card (Glassmorphism) */}
            <div className="absolute -bottom-6 -left-6 md:left-12 bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/50 max-w-[240px] hidden sm:block animate-bounce-slow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-800 rounded-lg text-white">
                  <Sparkles size={20} />
                </div>
                <span className="font-bold text-sm">Artist Choice</span>
              </div>
              <p className="text-xs text-gray-600 italic">"The perfect balance between traditional calligraphy and contemporary minimalism."</p>
            </div>

            {/* Accent Border Frame */}
            <div className="absolute inset-0 border-[12px] border-amber-800/5 rounded-[2rem] -m-4 pointer-events-none hidden lg:block"></div>
          </div>

        </div>
      </div>
    </div>
  );
}