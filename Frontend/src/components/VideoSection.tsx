import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
* Modern Islamic Art Showcase Section
* Features a 9:16 video background with text specifications on the side.
* The video is non-controllable, muted, and auto-plays.
*/
const IslamicArtShowcase: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Ensure video plays even if browser blocks autoplay
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log("Autoplay was prevented:", error);
            });
        }
    }, []);

   const specifications = [
    { label: "Material", value: "Authentic Black Silk with Silver & Gold Thread" },
    { label: "Artisanship", value: "Hand-Embroidered by Skilled Makkah Craftsmen" },
    { label: "Calligraphy", value: "Traditional Thuluth Script Quranic Verses" },
    { label: "Frame", value: "Premium Gilded Wood with Museum-Grade Acrylic" },
    { label: "Heritage", value: "Inspired by the Sacred Kiswah of the Holy Kaaba" }
];

    return (
        <section className="relative w-full min-h-screen bg-[#F8F7F2] flex items-center justify-center py-12 px-4 sm:px-8 lg:px-16 overflow-hidden">
            {/* Container for the Grid */}
            <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                {/* Left Side: Text Specifications */}
                <div className="order-2 lg:order-1 z-10">
                    <h4 className="text-amber-700 font-bold tracking-widest uppercase text-sm mb-4">
                        Interior Masterpiece
                    </h4>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-8">
                        Exquisite Islamic Calligraphy <br />
                        <span className="text-amber-600">& Gilded Artistry</span>
                    </h2>

                    <div className="space-y-6 max-w-lg">
                        {specifications.map((spec, index) => (
                            <div key={index} className="group border-b border-slate-200 pb-4 transition-all hover:border-amber-600">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-amber-700">
                                    {spec.label}
                                </p>
                                <p className="text-lg text-slate-800 font-medium">
                                    {spec.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* High-Impact CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                        <button
                            onClick={() => navigate('/category-list')}
                            className="relative group overflow-hidden bg-gray-900 text-white px-10 py-4 rounded-full font-bold transition-all hover:bg-amber-800 shadow-xl shadow-gray-200 active:scale-95"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Explore Collection
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>
                </div>

                {/* Right Side: 9:16 Video Display */}
                <div className="order-1 lg:order-2 flex justify-center">
                    <div className="relative w-full max-w-[400px] aspect-[9/16] rounded-[2rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border-8 border-white group">
                        {/* Background Gradient/Fallback */}
                        <div className="absolute inset-0 bg-slate-200 animate-pulse" />

                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover z-10"
                            src="/demo.mp4" // Ensure the file is in public folder or correctly imported
                            muted
                            loop
                            autoPlay
                            playsInline
                            controls={false}
                            style={{ pointerEvents: 'none' }} // Prevents users from right-clicking or stopping
                        />

                        {/* Subtle Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-20" />

                        {/* Design Elements */}
                        <div className="absolute top-6 left-6 z-30 bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/30">
                            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Live Preview</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Decorative Background Element */}
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-100 rounded-full blur-[100px] opacity-50 -z-1" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-200 rounded-full blur-[100px] opacity-30 -z-1" />
        </section>
    );
};

export default IslamicArtShowcase;