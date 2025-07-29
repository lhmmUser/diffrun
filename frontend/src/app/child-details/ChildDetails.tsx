"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { FcPrivacy } from "react-icons/fc";
import Link from "next/link";
import { motion } from "framer-motion";
import { containerVariants, headingVariants, subHeadingVariants, loadingContainerVariants } from "@/types";
import { FaExpandAlt, FaCropAlt, FaTrash } from "react-icons/fa";
import CropModal from "@/components/custom/CropModal";
import { v4 as uuidv4 } from "uuid";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Autoplay, Pagination } from "swiper/modules";
import { FiUser, FiEye, FiTruck, FiImage } from 'react-icons/fi';
import { Cards } from "@/data/data";
import { IoCloudUploadOutline } from "react-icons/io5";

interface ImageFile {
  file: File;
  preview: string;
}

interface LoadingBarProps {
  progress: number;
}

interface FormGuide {
  visible: boolean;
  message: string;
  type: 'info' | 'success' | 'warning';
}

type CountryCode = 'US' | 'CA' | 'IN' | 'AU' | 'NZ' | 'GB' | string;

const TypingCycle: React.FC = () => {
  const texts = [
    "Good things take a few seconds... Great things take a little longer!",
    "Hold tight — we’re crafting your one-of-a-kind storybook!",
    "Personalizing every page with love and a sprinkle of wonder",
    "Your hero's journey is coming to life — one pixel at a time.",
    "Illustrating your imagination... this won't take long.",
    "Summoning storybook magic — your adventure is about to begin!",
    "Turning your memories into magical moments...",
    "Fairy-tale engines are running — we’re nearly done!"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    setTypingDone(false);

    const interval = setInterval(() => {
      setDisplayedText(texts[currentIndex].slice(0, i + 1));
      i++;

      if (i === texts[currentIndex].length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    if (!typingDone) return;
    const delay = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, 9000);

    return () => clearTimeout(delay);
  }, [typingDone]);

  return (
    <p className="text-left text-base sm:text-lg font-poppins-200 text-[#454545] italic w-full">
      {displayedText}
      <span className="animate-pulse">|</span>
    </p>
  );
};

const LoadingBar: React.FC<LoadingBarProps> = ({ progress }) => (
  <div className="w-full sm:w-2/3 h-3 bg-gray-300 rounded-full overflow-hidden">
    <div
      className="h-full bg-green-500 transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
);

const pastelTags = [
  "bg-pink-100 text-pink-700",
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-yellow-100 text-yellow-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-lime-100 text-lime-700",
];

const fallbackOrder = ["GB", "US", "IN"];

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  const currentIndex = parseInt(img.dataset.fallbackIndex || "0");
  const nextIndex = currentIndex + 1;

  if (nextIndex < fallbackOrder.length) {
    const nextCountry = fallbackOrder[nextIndex];
    img.src = `/books/${img.dataset.bookKey}/${nextCountry}/${img.dataset.fileName}`;
    img.dataset.fallbackIndex = nextIndex.toString();
  }
};

const Form: React.FC = () => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("book_id") || "story1";

  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showContent, setShowContent] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [redirectData, setRedirectData] = useState<{
    jobId: string;
    name: string;
    gender: string;
    bookId: string;
  } | null>(null);

  const [formGuide, setFormGuide] = useState<FormGuide>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showFormGuide = (message: string, type: FormGuide['type'] = 'info') => {
    setFormGuide({ visible: true, message, type });
    setTimeout(() => setFormGuide(prev => ({ ...prev, visible: false })), 5000);
  };

  const [imageToCrop, setImageToCrop] = useState<number | null>(null);
  const [locale, setLocale] = useState<CountryCode>("IN");
  const [isLocaleLoading, setIsLocaleLoading] = useState(true);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const GEO = process.env.GEO;

  const isValidCountryCode = (code: string): boolean => {
    const normalized = normalizeCountryCode(code);
    return ['US', 'CA', 'IN', 'AU', 'NZ', 'GB'].includes(normalized);
  };

  const normalizeCountryCode = (code: string): CountryCode => {
    if (!code) return 'IN';
    const upperCode = code.toUpperCase();
    if (upperCode === 'UK') return 'GB';

    return upperCode;
  };

  const getClientSideCountry = async (): Promise<string> => {
    const apis = [
      {
        name: "ipapi.co",
        fn: () => fetch(`https://ipapi.co/json?token=${GEO}`).then(res => res.json()),
        extract: (data: any) => data.country
      },
      {
        name: "api.country.is",
        fn: () => fetch('https://api.country.is').then(res => res.json()),
        extract: (data: any) => data.country
      },
      {
        name: "geolocation-db.com",
        fn: () => fetch('https://geolocation-db.com/json/').then(res => res.json()),
        extract: (data: any) => data.country_code
      }
    ];

    for (const api of apis) {
      try {
        console.log(`[Geo] Trying ${api.name} API`);
        const response = await api.fn();
        let countryCode = api.extract(response);
        countryCode = normalizeCountryCode(countryCode);

        if (countryCode && isValidCountryCode(countryCode)) {
          console.log(`[Geo] Success with ${api.name}:`, countryCode);
          return countryCode;
        }
      } catch (e) {
        console.error(`[Geo] Failed with ${api.name}:`, e);
        continue;
      }
    }
    throw new Error("[Geo] All geolocation APIs failed");
  };

  const updateBackendLocale = async (locale: string, jobId?: string) => {
    if (!apiBaseUrl) return;

    try {
      const payload = jobId ? { locale, job_id: jobId } : { locale };
      console.log("[Geo] Updating backend with:", payload);

      await fetch(`${apiBaseUrl}/update-country`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[Geo] Backend update failed:", err);
    }
  };

  useEffect(() => {
    const determineLocale = async () => {
      setIsLocaleLoading(true);
      console.log("[Geo] Starting locale detection");

      try {
        const cachedLocale = localStorage.getItem("userLocale");
        if (cachedLocale && isValidCountryCode(cachedLocale)) {
          const normalized = normalizeCountryCode(cachedLocale);
          setLocale(normalized);
          await updateBackendLocale(normalized);
          setIsLocaleLoading(false);
          return;
        }

        const countryCode = await getClientSideCountry();
        const normalized = normalizeCountryCode(countryCode);

        setLocale(normalized);
        localStorage.setItem("userLocale", normalized);
        await updateBackendLocale(normalized);
      } catch (error) {
        console.error("[Geo] Geolocation failed, using default IN", error);
        setLocale("IN");
      } finally {
        setIsLocaleLoading(false);
      }
    };

    determineLocale();
  }, []);

  useEffect(() => {
    if (redirectData?.jobId && locale) {
      updateBackendLocale(locale, redirectData.jobId);
    }
  }, [redirectData, locale]);

  const formatPrice = (card: typeof Cards[0], bookType: 'paperback' | 'hardcover') => {
    if (isLocaleLoading) {
      return <span className="h-4 w-20 bg-gray-200 animate-pulse rounded"></span>;
    }

    const countryKey = Object.keys(card.prices).find(
      key => key.toUpperCase() === locale.toUpperCase()
    ) as keyof typeof card.prices || 'IN';

    const countryPrices = card.prices[countryKey] || card.prices.IN;
    const priceData = countryPrices[bookType];

    const currencyMatch = priceData.price.match(/[A-Z]{2,3}$/);
    const currencyCode = currencyMatch ? currencyMatch[0] :
      countryKey === 'US' ? 'USD' :
        countryKey === 'GB' ? 'GBP' :
          countryKey === 'CA' ? 'CAD' :
            countryKey === 'AU' ? 'AUD' :
              countryKey === 'NZ' ? 'NZD' : 'INR';

    return (
      <span>
        From {priceData.price.includes(currencyCode)
          ? priceData.price
          : `${priceData.price} ${currencyCode}`}
      </span>
    );
  };

  const handleFileProcessing = async (file: File): Promise<{ file: File } | null> => {
    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      try {
        const heic2any = (await import("heic2any")).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8,
        });

        const convertedFile = new File(
          [convertedBlob as Blob],
          file.name.replace(/\.heic$/i, ".jpg"),
          { type: "image/jpeg" }
        );

        return { file: convertedFile };
      } catch (err) {
        console.error("HEIC conversion failed:", err);
        setError("HEIC conversion failed. Please try another image.");
        return null;
      }
    }

    return { file };
  };

  const imagesRef = useRef<ImageFile[]>([]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const currentCount = imagesRef.current.length;
    const remaining = 3 - currentCount;

    if (acceptedFiles.length === 0) {
      alert("Please select at least one image.");
      return;
    }

    if (acceptedFiles.length > remaining) {
      alert(`You can only upload ${remaining} more image${remaining > 1 ? "s" : ""}.`);
      return;
    }

    const processed: ImageFile[] = [];

    for (const file of acceptedFiles) {
      const result = await handleFileProcessing(file);
      if (result) {
        processed.push({
          file: result.file,
          preview: URL.createObjectURL(result.file),
        });
      }
    }

    if (processed.length > 0) {
      setImages((prev) => [...prev, ...processed]);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop,
    disabled: imageToCrop !== null,
  });

  useEffect(() => {
    if (loadingProgress === 100 && redirectData) {
      router.push(
        `/preview?job_id=${redirectData.jobId}&name=${encodeURIComponent(redirectData.name)}&gender=${redirectData.gender}&book_id=${redirectData.bookId}&approved=false&paid=false`
      );
    }
  }, [loadingProgress, redirectData, router]);

  const formatName = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  const openCropModal = (index: number) => setImageToCrop(index);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    if (!name.trim() || !email || !gender || !isConfirmed || images.length < 1 || images.length > 3) {
      setError("Please fill all fields correctly and confirm consent.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!gender) {
      showFormGuide("Please select your child's gender", 'warning');
      return;
    }

    if (!email) {
      showFormGuide("We need your email to send the preview", 'warning');
      return;
    }

    if (images.length < 1 || images.length > 3) {
      showFormGuide("Please upload between 1-3 photos of your child", 'warning');
      return;
    }

    if (!isConfirmed) {
      showFormGuide("Please confirm you have consent to use these photos", 'warning');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim().charAt(0).toUpperCase() + name.trim().slice(1));
      formData.append("gender", gender.toLowerCase());
      formData.append("email", email.trim().toLowerCase());
      formData.append("book_id", bookId);
      images.forEach(({ file }) => formData.append("images", file));
      console.log("📤 Sending form data to /store-user-details");

      const storeResponse = await fetch(`${apiBaseUrl}/store-user-details`, {
        method: "POST",
        body: formData,
      });
      if (!storeResponse.ok) {
        const errorData = await storeResponse.json();
        throw new Error(errorData.detail || "Failed to upload images");
      }

      const data = await storeResponse.json();
      const redirectPayload = {
        jobId: data.job_id,
        name,
        gender,
        email,
        bookId,
      };
      setRedirectData(redirectPayload);

      console.log("✅ User details stored:", data);
      console.log("📤 Triggering workflow execution");

      const workflowResponse = await fetch(`${apiBaseUrl}/execute-workflow-lock`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          job_id: data.job_id,
          name: name.trim(),
          gender: gender.toLowerCase(),
          book_id: bookId,
        }).toString(),
      });
      if (!workflowResponse.ok) {
        const errorText = await workflowResponse.text();
        throw new Error(`Failed to start workflow: ${errorText}`);
      }
      console.log("✅ Workflow started successfully");

      setShowContent(false);
      setLoadingProgress(0);
      window.scrollTo({ top: 0, behavior: "smooth" });

      let progress = 0;
      const duration = 50000;
      const startTime = Date.now();

      const step = () => {
        const elapsed = Date.now() - startTime;
        const remainingTime = duration - elapsed;
        const remainingProgress = 100 - progress;

        if (remainingProgress <= 0 || remainingTime <= 0) {
          setLoadingProgress(100);
          router.push(
            `/preview?job_id=${redirectPayload.jobId}&name=${encodeURIComponent(redirectPayload.name)}&gender=${redirectPayload.gender}&book_id=${redirectPayload.bookId}&approved=false&paid=false`
          );
          return;
        }

        const increment = Math.min(remainingProgress, Math.floor(Math.random() * 4) + 1);
        progress += increment;
        setLoadingProgress(progress);

        const stepsLeft = Math.ceil(remainingProgress / 2);
        const avgDelay = remainingTime / stepsLeft;
        const jitteredDelay = avgDelay * (0.5 + Math.random());

        setTimeout(step, jitteredDelay);
      };

      step();
    } catch (error: any) {
      console.error("❌ Submission error:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedBook = Cards.find((b) => b.bookKey === bookId) ?? Cards[0];
  const otherBooks = Cards.filter((b) => b.bookKey !== selectedBook.bookKey);
  const title = selectedBook?.title || "";
  const description = selectedBook?.description || "";

  const CountryBookAvailability: Record<CountryCode, string[]> = {
    US: ["wigu", "dream", "astro", "abcd", "sports_us"],
    GB: ["wigu", "dream", "astro", "abcd", "sports_us"],
    IN: ["wigu", "dream", "astro", "abcd", "sports"],
    CA: ["wigu", "dream", "astro", "abcd", "sports"],
    AU: ["wigu", "dream", "astro", "abcd", "sports"],
    NZ: ["wigu", "dream", "astro", "abcd", "sports"]
  };

  function buildImagePath(card: typeof Cards[0], country: CountryCode, type: "main" | "hover") {
    const file = type === "main"
      ? card.imageSrc.split("/").pop()
      : card.hoverImageSrc?.split("/").pop();

    return `/books/${card.bookKey}/${country}/${file}`;
  }

  return (
    <main className="w-full min-h-screen flex flex-col items-center bg-white">
      {showContent ? (
        <>
          <div className="flex flex-col lg:flex-row w-full max-w-5xl mx-auto justify-between items-start px-4 lg:px-0 py-2 md:py-8">

            <div className="w-full lg:w-[50%]">
              <div className="max-w-md mx-auto w-full md:max-w-3xl">
                <h2 className="block lg:hidden text-left md:text-center text-gray-700 text-2xl md:text-3xl font-libre font-medium mb-4">
                  {title}
                </h2>
                <Swiper
                  modules={[Autoplay, Pagination]}
                  spaceBetween={20}
                  slidesPerView={1}
                  loop={true}
                  autoplay={{ delay: 4000, disableOnInteraction: false }}
                  pagination={{
                    clickable: true,
                    renderBullet: (className) => {
                      return `
                        <span 
                          class="${className}" 
                          style="
                            display:inline-block;
                            width:clamp(12px, 4vw, 24px);
                            height:clamp(12px, 4vw, 24px);
                            background:url('/global/circle.png') no-repeat center center / contain;
                            margin:0 3px;
                          ">
                        </span>
                      `;
                    },
                  }}
                  className="w-full h-auto mx-auto relative"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const fallbackOrder = ["GB", "US", "IN"];
                    const countryFolder = fallbackOrder.includes(locale) ? locale : "GB";
                    const imagePath = `/books/${bookId}/${countryFolder}/${bookId}-book-${num}.avif`;

                    return (
                      <SwiperSlide key={num}>
                        <img
                          src={imagePath}
                          alt={`Diffrun personalized books - Book ${num}`}
                          className="w-full h-auto object-contain aspect-square max-w-2xs md:max-w-sm lg:max-w-md"
                          onError={(e) => {
                            const fallbackIndex = fallbackOrder.indexOf(countryFolder);
                            if (fallbackIndex < fallbackOrder.length - 1) {
                              const nextFallback = fallbackOrder[fallbackIndex + 1];
                              e.currentTarget.src = `/books/${bookId}/${nextFallback}/${bookId}-book-${num}.avif`;
                            } else {
                              e.currentTarget.src = `/books/${bookId}/IN/${bookId}-book-${num}.avif`;
                            }
                          }}
                        />
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
                <div className="flex justify-start mt-5 mb-6 lg:mb-0">

                  <ul className="text-left text-sm sm:text-lg text-gray-700 md:text-base font-poppins font-medium space-y-1">
                    <li className="flex items-center space-x-2">
                      <FiUser aria-hidden="true" />
                      <span>Perfect for children aged {selectedBook.age}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiImage aria-hidden="true" />
                      <span>Personalize with your child’s special photo</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiEye aria-hidden="true" />
                      <span>Enjoy a full preview of the story before purchase</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiTruck aria-hidden="true" />
                      <span>Printed and shipped within 7–8 business days</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[50%]">
              <form
                onSubmit={handleSubmit}
                className="max-w-md mx-auto w-full space-y-4"
              >
                <h2 className="hidden lg:block text-left text-gray-700 text-2xl md:text-3xl font-libre font-medium">
                  {title}
                </h2>

                <p className="text-left text-gray-700 text-base mb-4 font-poppins leading-tight">
                  {description}
                </p>

                <h2 className="text-left text-gray-700 text-lg md:text-xl font-libre font-medium">
                  Personalize your Child's Book
                </h2>

                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="">
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                      className="block w-full px-4 md:py-1 text-lg bg-white border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-pastel-purple shadow-sm placeholder-gray-400"
                      placeholder="Child's First Name"
                    />
                  </div>

                  <div className="">
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="boy"
                          checked={gender === "boy"}
                          onChange={() => setGender("boy")}
                          disabled={loading}
                          className="h-5 w-5 accent-pastel-purple"
                        />
                        <span className="text-gray-700 text-lg">Boy</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="girl"
                          checked={gender === "girl"}
                          onChange={() => setGender("girl")}
                          disabled={loading}
                          className="h-5 w-5 accent-pastel-purple"
                        />
                        <span className="text-gray-700 text-lg">Girl</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="block w-full px-4 md:py-1 text-lg bg-white border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-pastel-purple shadow-sm placeholder-gray-400"
                    placeholder="Your Email Address"
                  />
                </div>

                <div className="">
                  <div
                    {...getRootProps()}
                    className={`py-3 text-center bg-[#5784ba] text-white border border-gray-300 rounded hover:bg-pastel-blue cursor-pointer transition-all duration-200 ${imageToCrop !== null ? "opacity-60 pointer-events-none" : ""
                      }`}
                  >
                    <input {...getInputProps()} disabled={imageToCrop !== null} />
                    <button className="flex items-center justify-center w-full gap-4 font-poppins">
                      <IoCloudUploadOutline className="text-lg md:text-2xl text-blue-50 flex-shrink-0" />
                      <span className="text-sm md:text-lg font-medium text-blue-50 text-center">
                        Upload upto 3 Child Images
                      </span>
                    </button>
                    {imageToCrop !== null && (
                      <CropModal
                        image={images[imageToCrop].file}
                        index={imageToCrop}
                        total={images.length}
                        existingImageCount={0}
                        onClose={() => setImageToCrop(null)}
                        onNext={() => { }}
                        onFinalize={() => { }}
                        onCropComplete={(blob, _) => {
                          const file = new File([blob], `cropped_${uuidv4()}.jpg`, { type: "image/jpeg" });
                          const preview = URL.createObjectURL(file);
                          const updated = [...images];
                          updated[imageToCrop] = { file, preview };
                          setImages(updated);
                          setImageToCrop(null);
                        }}
                      />
                    )}
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 md:mt-2">
                      {images.map((img, index) => (
                        <div key={index} className="relative bg-white border border-gray-200 rounded-sm shadow-sm">
                          <img
                            src={img.preview}
                            alt={`Diffrun personalized books - preview-${index}`}
                            className="w-full h-24 object-contain rounded-t-sm"
                          />

                          <div className="absolute top-1 left-1 right-1 flex justify-between px-1">
                            <button
                              onClick={() => openCropModal(index)}
                              className="bg-pastel-purple text-white text-xs p-1 rounded-full shadow"
                              aria-label="Crop Image"
                            >
                              <FaCropAlt className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setImages(images.filter((_, i) => i !== index))}
                              className="bg-pastel-pink text-white text-xs p-1 rounded-full shadow"
                              aria-label="Remove Image"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative inline-block">
                  <img
                    src="/global/instructions.jpg"
                    alt="Diffrun personalized books - Instructions"
                    className="w-auto h-70 border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="absolute top-1 right-1 text-white bg-pink-300 p-1 rounded-full hover:bg-pink-400 cursor-pointer"
                    aria-label="Expand instructions"
                  >
                    <FaExpandAlt />
                  </button>
                </div>

                <div className="flex items-start gap-2 text-gray-700 font-poppins">
                  <input
                    type="checkbox"
                    id="confirmation"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    disabled={loading}
                    className="h-5 w-5 accent-pastel-purple"
                  />
                  <label htmlFor="confirmation" className="text-sm leading-5">
                    I confirm that I am at least 18 years old and have obtained consent from the child's parent or guardian to share this information for the purpose of creating a personalized storybook, in accordance with the{" "}
                    <Link className="underline" href="/privacy-policy">
                      Privacy Policy
                    </Link>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!name || !gender || !email || images.length < 1 || images.length > 3 || loading || !isConfirmed}
                  title={
                    !name || !gender || !email || images.length < 1 || images.length > 3 || !isConfirmed
                      ? "Fill all details and confirm consent to continue"
                      : ""
                  }
                  className={`w-full py-3 text-lg font-bold rounded-sm shadow-sm transition-all duration-200 ${!name || !gender || images.length < 1 || images.length > 3 || !isConfirmed
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#5784ba] text-white cursor-pointer"
                    }`}
                >
                  {loading ? "Processing..." : "Preview your book"}
                </button>

                <p className="text-zinc-700 text-center font-poppins flex items-center justify-center gap-2">
                  <span>We follow strict data privacy standards</span>
                  <FcPrivacy className="text-lg" />
                </p>
              </form>
            </div>
          </div>

          <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-libre font-medium mb-6 text-gray-800 text-left">
              Explore More Books
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 lg:gap-10 w-full">
              {otherBooks.filter(card =>
                CountryBookAvailability[locale as CountryCode]?.includes(card.bookKey) ?? true
              ).map((card, index) => {
                const supportedCountries = ["IN", "US", "GB"];
                const countryFolder = supportedCountries.includes(locale) ? locale : "US";
                const mainImage = buildImagePath(card, countryFolder, "main");
                const hoverImage = buildImagePath(card, countryFolder, "hover");

                return (
                  <div
                    key={card.bookKey}
                    className="flex flex-col bg-white shadow-md hover:shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <Link
                      href={`/child-details?job_type=story&book_id=${card.bookKey}`}
                      aria-label={`Personalize ${card.title} story for ages ${card.age}`}
                      className="flex flex-col h-full"
                    >
                      <div className="relative w-full pt-[75%] overflow-hidden">

                        <img
                          src={mainImage}
                          alt={card.title}
                          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 lg:group-hover:opacity-0 lg:opacity-100 hidden md:block"
                          loading="lazy"
                          data-book-key={card.bookKey}
                          data-file-name={`${card.bookKey}-book.avif`}
                          data-fallback-index="0"
                          onError={handleImageError}
                        />

                        <img
                          src={hoverImage}
                          alt={`${card.title} hover`}
                          className="absolute inset-0 w-full h-full object-cover hidden md:block opacity-0 transition-opacity duration-500 lg:group-hover:opacity-100"
                          loading="lazy"
                          data-book-key={card.bookKey}
                          data-file-name={card.hoverImageSrc?.split('/').pop() || ''}
                          data-fallback-index="0"
                          onError={handleImageError}
                        />

                        <img
                          src={hoverImage}
                          alt={`${card.title} mobile`}
                          className="absolute inset-0 w-full h-full object-cover md:hidden"
                          loading="lazy"
                          data-book-key={card.bookKey}
                          data-file-name={card.hoverImageSrc?.split('/').pop() || ''}
                          data-fallback-index="0"
                          onError={handleImageError}
                        />
                      </div>

                      <div className="flex flex-col flex-1 p-4 md:p-6 space-y-3">
                        <div className="flex justify-between items-center flex-wrap gap-y-1">
                          <div className="flex flex-wrap gap-1">
                            {card.category?.map((tag, i) => (
                              <span
                                key={`${card.bookKey}-${tag}`}
                                className={`text-xs px-2 py-1 font-semibold rounded-full ${pastelTags[(index + i) % pastelTags.length]
                                  } whitespace-nowrap`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                            Ages {card.age}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-medium font-libre text-gray-900 mt-2">
                          {card.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                          {card.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4">
                          <span className="text-base md:text-lg font-medium text-gray-800">
                            {formatPrice(card, "paperback")}
                          </span>
                          <button
                            className="bg-[#5784ba] hover:bg-[#406493] text-white py-2 px-4 sm:px-6 rounded-lg font-medium text-sm transition-colors duration-200"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/child-details?job_type=story&book_id=${card.bookKey}`;
                            }}
                          >
                            Personalize
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

        </>
      ) : (
        <motion.div
          className="w-full min-h-screen flex flex-col items-center gap-4 px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-2xl sm:text-4xl font-medium mb-2 text-blue-900 font-libre"
            variants={headingVariants}
          >
            {formatName(name)}'s Book Preview
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl font-medium text-[#454545] inline-block font-poppins"
            variants={subHeadingVariants}
          >
            Creating storybook magic...
          </motion.p>

          <motion.div
            className="w-full flex flex-col items-center justify-center space-y-3 mt-10"
            variants={loadingContainerVariants}
          >
            <LoadingBar progress={loadingProgress} />
            <p className="text-sm text-black tracking-wide font-poppins-200">
              Progress: {loadingProgress}%
            </p>
          </motion.div>

          <motion.div
            className="mt-10 italic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <TypingCycle />
          </motion.div>
          <div className="my-20">
            <div className="elfsight-app-29870a34-63ec-4b12-8726-598d2c8c614c" data-elfsight-app-lazy></div>
          </div>
        </motion.div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-orange-300 bg-opacity-70 z-50 flex items-center justify-center p-6">
          <div className="bg-white p-4 rounded-lg max-w-3xl w-full relative shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-white bg-gray-700 hover:bg-gray-800 px-2 py-1 rounded-full"
              aria-label="Close expanded image"
            >
              ✕
            </button>
            <img
              src="/global/instructions.jpg"
              alt="Diffrun personalized books - Expanded Instructions"
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default Form;