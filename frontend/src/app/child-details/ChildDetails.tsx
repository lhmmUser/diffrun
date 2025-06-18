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
import { bookDetails, Cards } from "@/data/data";

interface ImageFile {
  file: File;
  preview: string;
}

interface LoadingBarProps {
  progress: number;
}

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

const Form: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobType = searchParams.get("job_type") || "story";
  const bookId = searchParams.get("book_id") || "story1";

  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showContent, setShowContent] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [redirectData, setRedirectData] = useState<{
    jobId: string;
    jobType: string;
    name: string;
    gender: string;
    bookId: string;
  } | null>(null);

  const [imageToCrop, setImageToCrop] = useState<number | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const locale = data.country || "";

        if (locale && redirectData?.jobId) {
          await fetch(`${apiBaseUrl}/update-country`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              job_id: redirectData.jobId,
              locale,
            }),
          });
          console.log("✅ Locale sent:", locale);
        }
      } catch (err) {
        console.error("🌐 Failed to fetch locale:", err);
      }
    };

    fetchCountry();
  }, [redirectData]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !gender || !isConfirmed || images.length < 1 || images.length > 3) {
      setError("Please fill all fields correctly and confirm consent.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim().charAt(0).toUpperCase() + name.trim().slice(1));
      formData.append("gender", gender.toLowerCase());
      formData.append("job_type", jobType);
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
        jobType,
        name,
        gender,
        bookId,
      };
      setRedirectData(redirectPayload);

      console.log("✅ User details stored:", data);
      console.log("📤 Triggering workflow execution");

      const workflowResponse = await fetch(`${apiBaseUrl}/execute-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          job_id: data.job_id,
          name: name.trim(),
          gender: gender.toLowerCase(),
          job_type: jobType,
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
      const duration = 65000;
      const startTime = Date.now();

      const step = () => {
        const elapsed = Date.now() - startTime;
        const remainingTime = duration - elapsed;
        const remainingProgress = 100 - progress;

        if (remainingProgress <= 0 || remainingTime <= 0) {
          setLoadingProgress(100);
          router.push(
            `/preview?job_id=${redirectPayload.jobId}&job_type=${redirectPayload.jobType}&name=${encodeURIComponent(redirectPayload.name)}&gender=${redirectPayload.gender}&book_id=${redirectPayload.bookId}&approved=false&paid=false`
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
  };

  useEffect(() => {
    if (loadingProgress === 100 && redirectData) {
      router.push(
        `/preview?job_id=${redirectData.jobId}&job_type=${redirectData.jobType}&name=${encodeURIComponent(redirectData.name)}&gender=${redirectData.gender}&book_id=${redirectData.bookId}&approved=false&paid=false`
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

  const { title, description } = bookDetails[bookId] || bookDetails["astro"];

  return (
    <main
      className="w-full min-h-screen flex flex-col items-center bg-white"
    // style={{ backgroundImage: "url('/background-grid.jpg')" }} 
    >
      {showContent ? (
        <>
          <div className="flex flex-col lg:flex-row w-full max-w-5xl mx-auto justify-between items-start px-4 lg:px-0 py-8">

            <div className="w-full lg:w-[50%]">
              <div className="max-w-md mx-auto w-full md:max-w-3xl">
                <h2 className="block lg:hidden text-center mr-20 text-gray-700 text-2xl md:text-3xl font-libre font-medium mb-4">
                  {title}
                </h2>
                <Swiper
                  modules={[Autoplay, Pagination]}
                  spaceBetween={20}
                  slidesPerView={1}
                  loop={true}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  pagination={{
                    clickable: true,
                    renderBullet: (index, className) => {
                      return `
                      <span 
                        class="${className}" 
                        style="
                          display:inline-block;
                          width:clamp(12px, 4vw, 24px);
                          height:clamp(12px, 4vw, 24px);
                          background:url('/circle.png') no-repeat center center / contain;
                          margin:0 6px;
                        ">
                      </span>
                    `;
                    },
                  }}
                  className="w-full h-auto mx-auto relative"
                >
                  {[1, 2].map((num) => (
                    <SwiperSlide key={num}>
                      <img
                        src={`/${bookId}-book-${num}.avif`}
                        alt={`Diffrun personalized books - Book ${num}`}
                        className="w-full h-auto object-contain mx-auto aspect-square max-w-sm lg:max-w-md"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div className="flex lg:justify-start justify-center mx-auto mt-4 lg:ml-8 mb-6 lg:mb-0">

                  <ul className="text-left text-sm text-gray-700 md:text-base font-poppins">
                    <li className="flex items-center space-x-2">
                      <FiUser aria-hidden="true" />
                      <span>Perfect for children aged 0 to 6</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiEye aria-hidden="true" />
                      <span>Enjoy a full preview of the story before purchase</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiTruck aria-hidden="true" />
                      <span>Printed and shipped within 2–4 business days</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiImage aria-hidden="true" />
                      <span>Personalize with your child’s special photo</span>
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

                <div className="flex flex-col md:flex-row gap-4 md:gap-12 mt-4">
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
                    <div className="flex space-x-6">
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

                <div className="space-y-3">
                  <div
                    {...getRootProps()}
                    className={`py-3 text-center bg-[#9ac8eb] text-white border border-gray-300 rounded hover:bg-pastel-blue cursor-pointer transition-all duration-200 ${imageToCrop !== null ? "opacity-60 pointer-events-none" : ""
                      }`}
                  >
                    <input {...getInputProps()} disabled={imageToCrop !== null} />
                    <button className="">
                      <span className="text-left font-medium ml-4">
                        Upload Images of Your Child
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
                    <div className="grid grid-cols-3 gap-3">
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
                    src="/instructions.jpg"
                    alt="Diffrun personalized books - Instructions"
                    className="w-auto h-60 border border-gray-200"
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
                    className="mt-1 h-5 w-5 accent-pastel-purple"
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
                  disabled={!name || !gender || images.length < 1 || images.length > 3 || loading || !isConfirmed}
                  title={
                    !name || !gender || images.length < 1 || images.length > 3 || !isConfirmed
                      ? "Fill all details and confirm consent to continue"
                      : ""
                  }
                  className={`w-full py-3 text-lg font-bold rounded-sm shadow-sm transition-all duration-200 ${!name || !gender || images.length < 1 || images.length > 3 || !isConfirmed
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#9ac8eb] text-white cursor-pointer"
                    }`}
                >
                  {loading ? "Processing..." : "Preview your book"}
                </button>

                <p className="text-zinc-700 text-center font-poppins flex items-center justify-center gap-2">
                  <span>We follow strict data privacy standards</span>
                  <FcPrivacy className="text-lg" />
                </p>

                {error && (
                  <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-sm mt-4 shadow-sm">
                    {error}
                  </div>
                )}
              </form>
            </div>

          </div>

          <div className="w-full max-w-5xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-libre font-medium mb-6 text-gray-800 text-left">
              Explore More Books
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Cards.filter(book => book.bookKey !== bookId).map((book, index) => (
                <div
                  key={index}
                  className="bg-white overflow-hidden"
                >
                  <img
                    src={book.imageSrc}
                    alt={book.title}
                    width={400}
                    height={400}
                    className="w-full h-64 object-cover object-left"
                  />
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium font-libre text-gray-800 my-2">{book.title}</h3>
                    <p className="text-sm text-gray-600 font-poppins my-2">Age : {book.age}</p>
                    <p className="text-gray-700 font-poppins my-2 text-sm">{book.description}</p>
                    <Link
                      href={`/child-details?book_id=${book.bookKey}&job_type=story`}
                      className="inline-block mb-4 text-indigo-600 font-play font-medium"
                    >
                      Personalize this book →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <motion.div
          className="w-full min-h-screen flex flex-col items-center gap-10"
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
            className="text-lg sm:text-xl font-medium text-[#454545] inline-block mt-2 font-poppins"
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
              src="/instructions.jpg"
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