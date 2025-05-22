"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import 'swiper/css/effect-fade';
import { Navigation, Pagination, EffectFade } from "swiper/modules";
import LZString from "lz-string";
import { motion } from "framer-motion";
import { BsImages, BsArrowLeftRight } from "react-icons/bs";

const Preview: React.FC = () => {

  const router = useRouter();
  const deepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
  const forceContinueUntil = useRef<number>(Date.now() + 10000);
  type ImageType = string | { filename: string; url: string };

  const [jobId, setJobId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [carousels, setCarousels] = useState<{ workflow: string; images: ImageType[] }[]>([]);
  const [selectedSlides, setSelectedSlides] = useState<number[]>([0, 0, 0]);
  const [paid, setPaid] = useState<boolean>(false);
  const [approved, setApproved] = useState<boolean>(false);
  const [urlPaid, setUrlPaid] = useState<boolean>(false);
  const [urlApproved, setUrlApproved] = useState<boolean>(false);
  const [regeneratingWorkflow, setRegeneratingWorkflow] = useState<number | null>(null);
  const [placeholders, setPlaceholders] = useState<Record<string, number>>({});
  const [bookId, setBookId] = useState<string>("story1");
  const [encodedSelections, setEncodedSelections] = useState<string | null>(null);
  const [slidesInitialized, setSlidesInitialized] = useState(false);
  const [imageCounts, setImageCounts] = useState<number[]>([]);
  const [regeneratingIndexes, setRegeneratingIndexes] = useState<number[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);
  const [visibleCarousels, setVisibleCarousels] = useState(0);
  const [jobType, setJobType] = useState<"story" | "comic">("story");

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const initialize = async () => {
      try {
        const id = searchParams.get("job_id");
        const userName = searchParams.get("name")?.trim() || "";
        const userGender = searchParams.get("gender")?.trim() || "";
        const type = (searchParams.get("job_type") || "story") as "story" | "comic";
        const book = searchParams.get("book_id") || "story1";
        const encodedSelections = searchParams.get("selected");

        if (!id || !userName || !userGender) {
          throw new Error("Invalid request. Missing required parameters.");
        }

        setJobId(id);
        setName(userName);
        setGender(userGender);
        setJobType(type);
        setBookId(book);
        setEncodedSelections(encodedSelections || null);
        setUrlPaid(searchParams.get("paid") === "true");
        setUrlApproved(searchParams.get("approved") === "true");
      } catch (err: any) {
        console.error("Error initializing preview:", err.message);
        setError(err.message);
      }
    };

    initialize();
  }, [isHydrated]);

  useEffect(() => {
    console.log("🚀 useEffect triggered with jobId:", jobId);
    if (!jobId) return;

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/get-job-status/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job status.");
        }

        const data = await response.json();
        console.log("🧾 get-job-status response:", data);
        const backendPaid = data.paid || false;
        const backendApproved = data.approved || false;

        if (urlPaid !== backendPaid || urlApproved !== backendApproved) {
          const newSearchParams = new URLSearchParams(window.location.search);
          newSearchParams.set("paid", backendPaid.toString());
          newSearchParams.set("approved", backendApproved.toString());
          router.replace(`/preview?${newSearchParams.toString()}`, { scroll: false });
        }

        setPaid(backendPaid);
        setApproved(backendApproved);
        setWorkflowStatus(data.workflow_status);
        console.log("✅ Set workflowStatus to:", data.workflow_status);

      } catch (err: any) {
        console.error("Error fetching job status:", err.message);
        setError(err.message || "An error occurred while fetching job status.");
      }
    };

    fetchJobStatus();
  }, [jobId, urlPaid, urlApproved, router]);

  useEffect(() => {
    if (!jobId || workflowStatus === "completed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/get-job-status/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.workflow_status === "completed") {
            setWorkflowStatus("completed");
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.warn("Workflow status check failed:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, workflowStatus]);

  useEffect(() => {
    const checkUserDetailsAndRedirect = async () => {
      try {
        if (!jobId) return;

        const searchParams = new URLSearchParams(window.location.search);
        const skipCheck = searchParams.get("skip_user_details_check") === "true";

        if (!skipCheck) {
          console.log("🛑 Not skipping user details check. Staying on preview.");
          return;
        }

        const response = await fetch(`http://127.0.0.1:8000/get-job-status/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job details.");
        }

        const data = await response.json();
        console.log("🔍 Job details fetched for skip check:", data);

        const isEmailMissing = !data.email || data.email.trim() === "";
        const isUsernameMissing = !data.username || data.username.trim() === "";

        const queryParams = new URLSearchParams(window.location.search).toString();

        if (!isEmailMissing && !isUsernameMissing) {
          console.log("✅ Email & name exist, skipping user-details → redirecting to /purchase");
          router.push(`/purchase?${queryParams}`);
        } else {
          console.log("👤 Email/username missing. Stay on preview to collect details.");
        }
      } catch (err: any) {
        console.error("❌ Error checking user details:", err.message);
        setError(err.message || "An error occurred while fetching job details.");
      }
    };

    checkUserDetailsAndRedirect();
  }, [jobId, router]);

  useEffect(() => {
    const lastCarousel = document.getElementById(`carousel-${visibleCarousels - 1}`);
    if (lastCarousel) lastCarousel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [visibleCarousels]);

  const pollImages = async () => {

    try {
      console.log("📊 Polling images for job ID:", jobId);
      const response = await fetch(`http://127.0.0.1:8000/poll-images?job_id=${jobId}&t=${Date.now()}`);
      if (!response.ok) throw new Error("Failed to fetch images.");
      const data = await response.json();
      console.log("🖼️ New images received:", data);

      setCarousels((prev) => {
        const workflowMap = new Map<string, ImageType[]>();

        prev.forEach((c) => {
          workflowMap.set(c.workflow, c.images.filter(img =>
            typeof img === 'object' ? img.url : img
          ));
        });

        (data.carousels || []).forEach((newC: { workflow: string; images: { filename: string; url: string }[] }) => {
          const workflowKey = newC.workflow;
          const prevImages = workflowMap.get(workflowKey) || [];

          const cleanedPrev = prevImages.filter(
            (img) =>
              (typeof img === "string" && !img.startsWith("loading-placeholder")) ||
              (typeof img === "object" && img !== null && "filename" in img)
          );

          const existingFilenames = new Set(
            cleanedPrev
              .filter((img): img is { filename: string; url: string } => typeof img === "object" && "filename" in img)
              .map((img) => img.filename)
          );

          const newImgs = newC.images.filter(
            (img) => !existingFilenames.has(img.filename)
          );

          const combined = [...cleanedPrev, ...newImgs];
          workflowMap.set(workflowKey, combined);

          if (newImgs.length >= (placeholders[workflowKey] || 0)) {
            setPlaceholders((prev) => {
              const updated = { ...prev };
              delete updated[workflowKey];
              return updated;
            });
          }

        });

        const newCarousels = Array.from(workflowMap.entries()).map(([workflow, images]) => ({
          workflow,
          images,
        }));

        const readyCount = newCarousels.filter(
          (c) =>
            c.images.length > 0 &&
            !(c.images.length === 1 && c.images[0] === "loading-placeholder")
        ).length;

        setVisibleCarousels((prev) => Math.max(prev, readyCount));

        if (regeneratingIndexes.length > 0 && imageCounts.length === carousels.length) {
          const completed = regeneratingIndexes.filter(index => {
            const workflow = carousels[index].workflow;
            const updatedCarousel = newCarousels.find(c => c.workflow === workflow);
            const newImageCount = updatedCarousel?.images.length || 0;
            return newImageCount > imageCounts[index];
          });

          if (completed.length > 0) {
            setRegeneratingIndexes(prev => prev.filter(i => !completed.includes(i)));

            setImageCounts(prev => {
              const updated = [...prev];
              completed.forEach(i => {
                const workflow = carousels[i].workflow;
                const updatedCarousel = newCarousels.find(c => c.workflow === workflow);
                updated[i] = updatedCarousel?.images.length || prev[i];
              });
              return updated;
            });
          }
        }

        if (!deepEqual(prev, newCarousels)) {
          return newCarousels;
        }
        return prev;
      });

      if (slidesInitialized && data.carousels?.length > 0) {
        const updatedSlides = data.carousels.map((carousel: { images: string | any[] }, i: number) => {
          const slideIndex = selectedSlides[i] || 0;
          return Math.min(slideIndex, carousel.images.length - 1);
        });
        setSelectedSlides(updatedSlides);
      }

      const hasPlaceholders = Object.values(placeholders).some((count) => count > 0);

      pollingRef.current = setTimeout(pollImages, 2000);

      if (data.completed && !hasPlaceholders && regeneratingIndexes.length === 0) {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }

    } catch (err: any) {
      console.error("⚠️ Error during image polling:", err.message);
      setError("An error occurred while fetching images.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    pollingRef.current = setTimeout(pollImages, 2000);

    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [jobId]);

  useEffect(() => {
    if (!encodedSelections || carousels.length === 0) return;

    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(encodedSelections);
      const parsed = JSON.parse(decompressed);

      if (Array.isArray(parsed) && parsed.length === carousels.length) {
        setSelectedSlides(parsed);
        setSlidesInitialized(true);
      }
    } catch (err) {
      console.warn("Failed to decompress selected slides:", err);
    }
  }, [encodedSelections, carousels.length]);

  const updateSelectedSlide = (workflowIndex: number, index: number) => {
    setSelectedSlides((prev) => {
      const updated = [...prev];
      updated[workflowIndex] = index;
      return updated;
    });
  };

  useEffect(() => {
    if (!jobId || !carousels.length) return;

    const newSearchParams = new URLSearchParams(window.location.search);

    newSearchParams.set("selected", LZString.compressToEncodedURIComponent(
      JSON.stringify(selectedSlides)
    ));

    const queryString = newSearchParams.toString();
    const newUrl = `/preview?${queryString}`;

    router.replace(newUrl, { scroll: false });
  }, [selectedSlides]);

  const handleSubmit = async () => {
    try {
      if (!jobId || !name || !gender || !jobType || !setSelectedSlides) {
        console.error("Missing required parameters for redirection.");
        return;
      }
  
      const selectedParam = LZString.compressToEncodedURIComponent(
        JSON.stringify(selectedSlides)
      );

      console.log("🌍 Origin detected:", window.location.origin);
      const previewUrl = `${window.location.origin}/preview?job_id=${jobId}&job_type=${jobType}&name=${name}&gender=${gender}&book_id=${bookId}&selected=${selectedParam}`;
  
      if (previewUrl && previewUrl.startsWith("http")) {
        console.log("📤 Updating preview URL:", previewUrl);
        await fetch("/update-preview-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId, preview_url: previewUrl }),
        });
      } else {
        console.warn("⚠️ Skipping update-preview-url — invalid previewUrl:", previewUrl);
      }      
  
      const query = new URLSearchParams({
        job_id: jobId,
        name,
        gender,
        job_type: jobType,
        book_id: bookId,
        selected: selectedParam,
      });
  
      const basePath = jobType === "comic" ? "/comic1" : "/user-details";
      router.push(`${basePath}?${query.toString()}`);
    } catch (err: any) {
      console.error("🚨 Error during submission:", err.message);
    }
  };  

  useEffect(() => {
    if (selectedSlides.some((i) => typeof i !== "number" || isNaN(i))) {
      const fixed: number[] = selectedSlides.map((i): number =>
        typeof i === "number" && !isNaN(i) ? i : 0
      );
      console.warn("⚠️ Fixing invalid selectedSlides:", selectedSlides, "→", fixed);
      setSelectedSlides(fixed);
    }
  }, [selectedSlides]);  
  
  const handleApprove = async () => {
    try {
      if (!jobId) throw new Error("Job ID is missing.");
  
      if (selectedSlides.length !== carousels.length) {
        console.warn("Mismatch between selected slides and carousels.");
        setSelectedSlides(Array(carousels.length).fill(0));
        return;
      }
  
      console.log("📸 Final selectedSlides before submit:", selectedSlides);
  
      const sanitizedSlides = selectedSlides.map(i =>
        typeof i === "number" && !isNaN(i) ? i : 0
      );
  
      const formData = new FormData();
      formData.append("job_id", jobId);
      formData.append("name", name);
      formData.append("gender", gender);
      formData.append("selectedSlides", JSON.stringify(sanitizedSlides));
  
      const response = await fetch("http://127.0.0.1:8000/approve", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to approve: ${errText}`);
      }
  
      const selectedParam = LZString.compressToEncodedURIComponent(JSON.stringify(sanitizedSlides));
  
      const newSearchParams = new URLSearchParams({
        job_id: jobId,
        paid: String(paid),
        approved: "true",
        selected: selectedParam,
        job_type: jobType,
        book_id: bookId,
        name,
        gender,
      });
  
      window.location.href = `/preview?${newSearchParams.toString()}`;
      
    } catch (err: any) {
      console.error("Error approving:", err.message);
    }
  };  

  const startPolling = () => {
    if (pollingRef.current) clearTimeout(pollingRef.current);
    pollingRef.current = setTimeout(pollImages, 2000);
  };

  useEffect(() => {
    if (carousels.length && imageCounts.length === 0) {
      setImageCounts(carousels.map(c => c.images.length));
    }
  }, [carousels]);

  const handleRegenerate = async (workflowIndex: number) => {
    if (!jobId) return;

    try {
      console.log("🔄 Regenerating workflow", workflowIndex + 1);

      forceContinueUntil.current = Date.now() + 60000;

      const workflowKey = (workflowIndex + 1).toString().padStart(2, "0");

      setRegeneratingIndexes(prev => [...prev, workflowIndex]);

      setImageCounts(prev => {
        const updated = [...prev];
        updated[workflowIndex] = carousels[workflowIndex].images.length;
        return updated;
      });

      setCarousels((prev) =>
        prev.map((c, i) =>
          i === workflowIndex
            ? {
              ...c,
              images: [...c.images, "loading-placeholder"],
            }
            : c
        )
      );

      setPlaceholders((prev) => ({
        ...prev,
        [workflowKey]: 1,
      }));

      setRegeneratingWorkflow(workflowIndex);

      const response = await fetch('http://127.0.0.1:8000/regenerate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          job_id: jobId,
          name,
          gender,
          workflow_number: carousels[workflowIndex].workflow,
          jobType: jobType,
          book_id: bookId,
          force: "true",
        }).toString(),
      });

      if (!response.ok) throw new Error('Regeneration failed');

      await response.json();
      startPolling();

      console.log("Backend response: Regeneration triggered.");
    } catch (error) {
      console.error('🔥 Error during regeneration:', error);
      setRegeneratingIndexes(prev => prev.filter(i => i !== workflowIndex));
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
        <header className="max-w-4xl mx-auto mb-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-2xl sm:text-4xl font-bold mb-2 text-blue-900"
          >
            {approved ? (
              `${name.charAt(0).toUpperCase() + name.slice(1)}'s Finalized Book`
            ) : paid ? (
              `Finalize ${name.charAt(0).toUpperCase() + name.slice(1)}'s Book`
            ) : jobType === "comic" ? (
              "Your Comic Preview"
            ) : (
              `${name.charAt(0).toUpperCase() + name.slice(1)}'s Book Preview`
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg sm:text-xl font-medium text-[#454545] inline-block"
          >
            {loading
              ? jobType === "comic"
                ? "Assembling comic panels..."
                : "Creating storybook magic..."
              : error || (jobType === "comic" ? "Comic is ready!" : "Storybook is ready!")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 text-base sm:text-lg text-gray-600 space-y-1 flex flex-col items-center"
          >
            <div className="flex items-center gap-2">
              <BsImages size={20} className="text-indigo-600" />
              <p>Pages get shown one below the other</p>
            </div>
            <div className="flex items-center gap-2">
              <BsArrowLeftRight size={20} className="text-indigo-600" />
              <p>Swipe and leave each page at the option you like best</p>
            </div>
          </motion.div>
        </header>

        <div className="flex-1 w-full my-4 overflow-y-auto">
          <div className="max-w-md w-full mx-auto space-y-12">
            {carousels.slice(0, visibleCarousels).map((carousel, workflowIndex) => (
              <div key={workflowIndex} className="w-full max-w-md mx-auto mb-12 relative">
                <div className="w-full text-center mb-2 flex justify-end">
                  <div className="inline-block px-3 py-1 text-sm font-medium text-gray-800 bg-gray-100 rounded-full">
                    {workflowIndex === 0 ? "Book Cover" : `Page ${workflowIndex}`}
                  </div>
                </div>
                <div className="relative w-full aspect-square overflow-hidden shadow-[5px_5px_10px_rgba(0,0,0,0.5)] bg-white">
                  {carousel.images.length === 0 || (carousel.images.length === 1 && carousel.images[0] === "loading-placeholder") ? (
                    <div className="flex flex-col justify-center items-center w-full h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
                      <p className="text-sm text-gray-700 mt-4">
                        Generating image {workflowIndex + 1} of {carousels.length}
                      </p>
                    </div>
                  ) : (
                    <Swiper
                      key={`${workflowIndex}-${selectedSlides[workflowIndex] || 0}`}
                      modules={[Navigation, Pagination, EffectFade]}
                      slidesPerView={1}
                      effect="fade"
                      fadeEffect={{ crossFade: true }}
                      navigation={{
                        nextEl: `.next-${workflowIndex}`,
                        prevEl: `.prev-${workflowIndex}`,
                      }}
                      pagination={{ clickable: true }}
                      initialSlide={selectedSlides[workflowIndex] || 0}
                      onSlideChange={(swiper) => updateSelectedSlide(workflowIndex, swiper.activeIndex)}
                      className="w-full h-full pb-8"
                    >
                      {carousel.images.map((image, imgIndex) => (
                        <SwiperSlide key={imgIndex}>
                          {image === "loading-placeholder" ? (
                            <div className="flex justify-center items-center w-full h-full bg-white">
                              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500"></div>
                            </div>
                          ) : (
                            <img
                              src={typeof image === "string" ? image : image.url}
                              alt={`Story Page ${imgIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </SwiperSlide>
                      ))}
                      {!approved && (
                        <SwiperSlide key="generate-more">
                          <div className="flex flex-col items-center justify-center w-full h-full bg-white p-6 sm:p-8 border-4 border-gray-900 shadow-[6px_6px_0px_rgba(0,0,0,0.8)]">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 sm:mb-6 text-center">
                              Not Happy with the Previously Generated Image?
                            </h3>

                            <p className="text-sm sm:text-base font-semibold text-gray-800 mb-4 sm:mb-6 text-center">
                              Generate More Options
                            </p>

                            <button
                              onClick={() => handleRegenerate(workflowIndex)}
                              disabled={regeneratingWorkflow === workflowIndex}
                              className={`
                                  px-6 py-2 text-sm sm:text-lg font-bold rounded-xl transition-all duration-200 
                                  ${regeneratingWorkflow === workflowIndex
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-yellow-400 text-black hover:bg-yellow-500 active:bg-yellow-600 hover:shadow-[4px_4px_0px_rgba(0,0,0,0.8)] active:translate-x-[2px] active:translate-y-[2px]'
                                }
                                `}
                              aria-label="Regenerate more options"
                            >
                              {regeneratingWorkflow === workflowIndex ? (
                                <>
                                  <svg
                                    className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-black inline-block mr-2"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                  </svg>
                                  <span className="text-xs sm:text-sm">Regenerating...</span>
                                </>
                              ) : (
                                <span className="text-xs sm:text-sm">Regenerate</span>
                              )}
                            </button>
                          </div>
                        </SwiperSlide>
                      )}
                      <div className={`prev-${workflowIndex} absolute left-3 top-1/2 -translate-y-1/2 z-10`}>
                        <button
                          className="bg-white/80 border-black border hover:bg-white text-black p-2 rounded-full shadow transition"
                          aria-label="Previous slide"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                      <div className={`next-${workflowIndex} absolute right-3 top-1/2 -translate-y-1/2 z-10`}>
                        <button
                          className="bg-white/80 border-black border hover:bg-white text-black p-2 rounded-full shadow transition"
                          aria-label="Next slide"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>

                      <div className="swiper-pagination absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10"></div>
                    </Swiper>
                  )}
                  {carousel.images.length === 0 ||
                    (carousel.images.length === 1 && carousel.images[0] === "loading-placeholder") ? (
                    <p className="text-center text-sm text-gray-500 mt-8 italic">
                      Waiting for page {workflowIndex + 1} to be generated...
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {carousels.length > visibleCarousels && (
              <div key="placeholder" className="w-full max-w-md mx-auto mb-12 relative">
                <div className="w-full text-center mb-2 flex justify-end">
                  <div className="inline-block px-3 py-1 text-sm font-medium text-gray-800 bg-gray-100 rounded-full">
                    Page {visibleCarousels + 1}
                  </div>
                </div>
                <div className="relative w-full aspect-square overflow-hidden shadow-[5px_5px_10px_rgba(0,0,0,0.5)] bg-white">
                  <div className="flex flex-col justify-center items-center w-full h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
                    <p className="text-sm text-gray-700 mt-4">
                      Generating image {visibleCarousels + 1} of {carousels.length}
                    </p>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500 mt-8 italic">
                  Waiting for page {visibleCarousels + 1} to be generated...
                </p>
              </div>
            )}
          </div>
        </div>

        {!loading && workflowStatus !== "completed" && !approved && !paid && carousels.length > 0 &&  (
          <div
            className="fixed z-50 bottom-8 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-800 p-6 rounded-lg shadow-brutalist text-center"
            style={{
              boxShadow: "8px 8px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <p className="text-gray-800 font-medium mb-4 text-lg sm:text-xl animate-fade-in">
              Don&apos;t want to wait?
            </p>

            <button
              onClick={() => {
                const query = new URLSearchParams({
                  job_id: jobId || "",
                  name,
                  gender,
                  job_type: jobType,
                  book_id: bookId,
                  selected: LZString.compressToEncodedURIComponent(
                    JSON.stringify(selectedSlides)
                  ),
                });
                router.push(`/email-preview-request?${query.toString()}`);
              }}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-2.5 px-5 font-medium border border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              Email me the Preview Link
            </button>
          </div>
        )}

        <footer className="w-full p-4 sm:p-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
            {jobType !== "comic" && !paid && !approved && (
              <button
                onClick={handleSubmit}
                disabled={!jobId || loading || carousels.length < 2}
                className={`px-6 py-3 rounded-[1rem] text-sm sm:text-base font-medium text-white
                ${carousels.length >= 2
                    ? 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 shadow-[3px_3px_0px_#232323]'
                    : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Save Preview & Show Price
              </button>
            )}

            {jobType !== "comic" && paid && !approved && (
              <button
                onClick={handleApprove}
                disabled={!jobId || loading || carousels.length < 2}
                className={`px-6 py-3 rounded-[1rem] text-sm sm:text-lg font-bold text-white
                ${carousels.length >= 2
                    ? 'bg-indigo-500 hover:bg-indigo-600 active:bg-[#33aaaa] shadow-[3px_3px_0px_#454545]'
                    : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Approve for printing
              </button>
            )}

            {jobType === "comic" && (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 rounded-[1rem] text-sm sm:text-base font-medium text-white
              bg-[#454545] hover:bg-[#333] active:bg-[#1a1a1a] shadow-[3px_3px_0px_#FF6B6B]"
              >
                Create Comic
              </button>
            )}
          </div>
        </footer>

      </div>
    </Suspense>
  );
};

export default Preview;