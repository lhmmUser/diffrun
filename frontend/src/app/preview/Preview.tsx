"use client";

import React, { useEffect, useState, useRef, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import 'swiper/css/effect-fade';
import { Navigation, Pagination, EffectFade } from "swiper/modules";
import LZString from "lz-string";
import { motion } from "framer-motion";
import { BsImages, BsArrowLeftRight } from "react-icons/bs";
import { div } from "framer-motion/client";

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
  const [selectedSlides, setSelectedSlides] = useState<number[]>([]);
  const [slidesLengthInitialized, setSlidesLengthInitialized] = useState(false);
  const [paid, setPaid] = useState<boolean>(false);
  const [approved, setApproved] = useState<boolean>(false);
  const [urlPaid, setUrlPaid] = useState<boolean>(false);
  const [urlApproved, setUrlApproved] = useState<boolean>(false);
  const [regeneratingWorkflow, setRegeneratingWorkflow] = useState<number[]>([]);
  const [placeholders, setPlaceholders] = useState<Record<string, number>>({});
  const [bookId, setBookId] = useState<string>("story1");
  const [encodedSelections, setEncodedSelections] = useState<string | null>(null);
  const [imageCounts, setImageCounts] = useState<number[]>([]);
  const [regeneratingIndexes, setRegeneratingIndexes] = useState<number[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);
  const [visibleCarousels, setVisibleCarousels] = useState(0);
  const [jobType, setJobType] = useState<"story" | "comic">("story");
  const [approving, setApproving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingSelectionUpdates, setPendingSelectionUpdates] = useState<CarouselChange[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [completedWorkflows, setCompletedWorkflows] = useState<number[]>([]);
  const [currentlyLoadingIndex, setCurrentlyLoadingIndex] = useState<number>(0);
  const [remainingWorkflowsLoading, setRemainingWorkflowsLoading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const searchParams = useSearchParams();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const paginationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const parsedSelectionsRef = useRef<number[] | null>(null);
  const isInitializingFromUrl = useRef(false);
  const isMountedRef = useRef(true);
  const regeneratingIndexesRef = useRef<number[]>([]);
  const regeneratingWorkflowRef = useRef<number[]>([]);
  const hasInitializedFromUrl = useRef(false);
  const lastUpdateRef = useRef<{ workflowIndex: number, index: number, timestamp: number } | null>(null);
  const previousCarouselLengths = useRef<number[]>([]);
  const syncInProgressRef = useRef(false);
  const [activeRegenerationIndex, setActiveRegenerationIndex] = useState<number | null>(null);
  const [totalWorkflows, setTotalWorkflows] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  type CarouselChange = {
    workflowIndex: number;
    previousLength: number;
    newLength: number;
  };

  const batchUpdateRef = useRef<{
    updates: Map<number, number>;
    timestamp: number;
  } | null>(null);

  const validateSelectionArray = useCallback((selections: number[]) => {
    return selections.map(val => Math.max(0, val));
  }, []);

  const pendingUpdateRef = useRef<{
    selections: number[];
    reason: string;
  } | null>(null);

  const saveCurrentState = useCallback(async () => {
    if (!jobId) return;

    try {
      setIsSaving(true);
      const currentSelections = pendingUpdateRef.current?.selections || selectedSlides;

      const selectedParam = LZString.compressToEncodedURIComponent(
        JSON.stringify(currentSelections)
      );

      const previewUrl = `${window.location.origin}/preview?job_id=${jobId}&job_type=${jobType}&name=${name}&gender=${gender}&book_id=${bookId}&selected=${selectedParam}`;

      console.log("💾 Saving state:", {
        selections: currentSelections.join(','),
        url: previewUrl,
        timestamp: new Date().toISOString()
      });

      const updateResponse = await fetch(`${apiBaseUrl}/update-preview-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          preview_url: previewUrl,
          current_state: currentSelections.map((selection, index) => ({
            workflowIndex: index,
            selectedImage: selection,
            totalImages: carousels[index]?.images.length || 0
          }))
        }),
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to save state: ${updateResponse.status}`);
      }

    } catch (err) {
      console.error("Failed to save state:", err);
    } finally {
      setIsSaving(false);
    }
  }, [jobId, name, gender, bookId, jobType, selectedSlides, carousels]);

  const updateSelections = useCallback((newSelections: number[], reason: string) => {
    const validatedSelections = validateSelectionArray(newSelections);

    pendingUpdateRef.current = {
      selections: validatedSelections,
      reason
    };

    queueMicrotask(() => {
      if (!pendingUpdateRef.current) return;

      const { selections, reason } = pendingUpdateRef.current;

      setSelectedSlides(selections);

      const newSearchParams = new URLSearchParams(window.location.search);
      const selectedParam = LZString.compressToEncodedURIComponent(JSON.stringify(selections));
      newSearchParams.set("selected", selectedParam);
      const newUrl = `/preview?${newSearchParams.toString()}`;

      console.log("🔄 Atomic state update:", {
        state: selections.join(','),
        url: newUrl,
        reason,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });

      router.replace(newUrl, { scroll: false });

      if (jobId) {
        saveCurrentState();
      }

      pendingUpdateRef.current = null;
    });
  }, [router, jobId, saveCurrentState]);

  const syncRef = useCallback((slides: number[]) => {
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;

    queueMicrotask(() => {
      console.log("🔒 Synchronized state:", {
        slides: slides.join(','),
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        stack: new Error().stack?.split('\n').slice(1, 3).join('\n')
      });
      syncInProgressRef.current = false;
    });
  }, []);

  const applyBatchedUpdates = useCallback(() => {
    if (!batchUpdateRef.current) return;

    const { updates, timestamp } = batchUpdateRef.current;
    if (Date.now() - timestamp > 100) {
      batchUpdateRef.current = null;
      return;
    }

    setSelectedSlides(prev => {
      const updated = [...prev];
      let hasChanges = false;

      updates.forEach((newIndex, workflowIndex) => {
        if (updated[workflowIndex] !== newIndex) {
          updated[workflowIndex] = newIndex;
          hasChanges = true;
        }
      });

      if (!hasChanges) return prev;

      syncRef(updated);

      return updated;
    });

    batchUpdateRef.current = null;
  }, [syncRef]);

  const queueSelectionUpdate = useCallback((workflowIndex: number, newIndex: number) => {
    console.log("🎯 Queueing selection update:", {
      workflowIndex,
      newIndex,
      currentSelections: selectedSlides.join(','),
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    if (!batchUpdateRef.current) {
      batchUpdateRef.current = {
        updates: new Map([[workflowIndex, newIndex]]),
        timestamp: Date.now()
      };
    } else {
      batchUpdateRef.current.updates.set(workflowIndex, newIndex);
    }

    Promise.resolve().then(applyBatchedUpdates);
  }, [selectedSlides, applyBatchedUpdates]);

  useEffect(() => {
    if (pendingSelectionUpdates.length === 0 || isInitializingFromUrl.current) return;

    const updates = new Map<number, number>();

    pendingSelectionUpdates.forEach(change => {
      const { workflowIndex } = change;
      const carousel = carousels[workflowIndex];

      if (!carousel?.images.length) return;

      const validImages = carousel.images.filter(img =>
        img !== "loading-placeholder" &&
        (typeof img === "string" ? true : img.url)
      );

      if (!validImages.length) return;

      const newIndex = validImages.length - 1;
      if (selectedSlides[workflowIndex] !== newIndex) {
        updates.set(workflowIndex, newIndex);
      }
    });

    if (updates.size > 0) {
      batchUpdateRef.current = {
        updates,
        timestamp: Date.now()
      };
      applyBatchedUpdates();
    }

    setPendingSelectionUpdates([]);
  }, [pendingSelectionUpdates, selectedSlides, carousels, isInitializingFromUrl, applyBatchedUpdates]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
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
        const response = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job status.");
        }

        const data = await response.json();
        console.log("🧾 get-job-status response:", data);
        const backendPaid = data.paid || false;
        const backendApproved = data.approved || false;
        if (data.name) setName(data.name);
        if (data.email) setUserEmail(data.email);
        if (data.preview_url) setPreviewUrl(data.preview_url);

        if (urlPaid !== backendPaid || urlApproved !== backendApproved) {
          const newSearchParams = new URLSearchParams(window.location.search);
          newSearchParams.set("paid", backendPaid.toString());
          newSearchParams.set("approved", backendApproved.toString());
          router.replace(`/preview?${newSearchParams.toString()}`, { scroll: false });
        }

        if (backendPaid && !backendApproved && data.total_workflows > 10) {
          setRemainingWorkflowsLoading(true);
          setCurrentlyLoadingIndex(10);
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
        const res = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
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

        const response = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
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

  useEffect(() => {
    if (!encodedSelections) return;
    if (hasInitializedFromUrl.current) {
      console.log("🔒 Already initialized from URL, skipping");
      return;
    }

    try {
      console.log("🔍 Processing URL selections:", encodedSelections);
      const decompressed = LZString.decompressFromEncodedURIComponent(encodedSelections);
      const parsed = JSON.parse(decompressed);
      if (Array.isArray(parsed)) {
        console.log("📦 Stored parsed selections:", {
          parsed,
          length: parsed.length,
          sample: parsed.slice(0, 3)
        });

        parsedSelectionsRef.current = parsed;

        if (carousels.length > 0) {
          if (parsed.length === carousels.length) {
            console.log("📏 Setting selections from URL");
            isInitializingFromUrl.current = true;

            const validatedSlides = parsed.map((selection, idx) => {
              if (!carousels[idx] || !carousels[idx].images) return 0;
              const maxIndex = carousels[idx].images.length - 1;
              return Math.min(Math.max(0, selection), maxIndex);
            });

            setSelectedSlides(validatedSlides);
            setSlidesLengthInitialized(true);
            hasInitializedFromUrl.current = true;

            setTimeout(() => {
              isInitializingFromUrl.current = false;
            }, 500);
          } else {
            console.log("📏 Setting default zeros due to length mismatch");
            setSelectedSlides(Array(carousels.length).fill(0));
            setSlidesLengthInitialized(true);
            hasInitializedFromUrl.current = true;
          }
        }
      }
    } catch (err: any) {
      console.error("🔥 Error processing selections:", err.message);
      isInitializingFromUrl.current = false;
      hasInitializedFromUrl.current = true;
    }
  }, [encodedSelections, carousels.length]);

  const pollImages = async () => {
    try {
      if (!isMountedRef.current) return;

      console.log("🔄 Starting poll cycle:", {
        jobId,
        regeneratingIndexes: regeneratingIndexesRef.current.join(','),
        regeneratingCount: regeneratingIndexesRef.current.length,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        currentlyLoadingIndex
      });

      const response = await fetch(`${apiBaseUrl}/poll-images-lock?job_id=${jobId}&t=${Date.now()}`);
      const data = await response.json();

      console.log("📥 Poll response received:", {
        carouselsLength: data.carousels?.length,
        regeneratingIndexes: regeneratingIndexesRef.current.join(','),
        regeneratingCount: regeneratingIndexesRef.current.length,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });

      if (data.total_workflows) {
        setTotalWorkflows(data.total_workflows);
      }

      if (!isMountedRef.current) return;

      if (data.completed) {
        setLoading(false);
        setWorkflowStatus("completed");
      }

      if (!slidesLengthInitialized && data.carousels?.length > 0 && !hasInitializedFromUrl.current) {
        const length = data.carousels.length;
        const urlSelections = parsedSelectionsRef.current;

        console.log("🎯 Initialization check:", {
          length,
          urlSelections: urlSelections ? {
            length: urlSelections.length,
            sample: urlSelections.slice(0, 3)
          } : null,
          isInitialized: slidesLengthInitialized
        });

        if (urlSelections && urlSelections.length === length) {
          console.log("📏 Setting selections from URL:", urlSelections);
          isInitializingFromUrl.current = true;
          if (isMountedRef.current) {
            setSelectedSlides(urlSelections);
            setSlidesLengthInitialized(true);
            hasInitializedFromUrl.current = true;
          }
          setTimeout(() => {
            isInitializingFromUrl.current = false;
          }, 500);
        } else {
          console.log("📏 Setting default zeros");
          if (isMountedRef.current) {
            setSelectedSlides(Array(length).fill(0));
            setSlidesLengthInitialized(true);
            hasInitializedFromUrl.current = true;
          }
        }
      }

      if (isMountedRef.current) {
        setCarousels((prev) => {
          const workflowMap = new Map<string, ImageType[]>();
          let hasNewImages = false;
          const newImageWorkflows = new Set<number>();
          const newlyCompletedWorkflows: number[] = [];

          prev.forEach((c) => {
            workflowMap.set(c.workflow, c.images.filter(img =>
              typeof img === 'object' ? img.url : img
            ));
          });

          (data.carousels || []).forEach((newC: { workflow: string; images: { filename: string; url: string }[] }, index: number) => {
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

            if (newImgs.length > 0) {
              hasNewImages = true;
              newImageWorkflows.add(index);

              // Check if this workflow just completed
              if (!completedWorkflows.includes(index)) {
                newlyCompletedWorkflows.push(index);
              }

              console.log("🆕 New images detected:", {
                workflowIndex: index,
                newImagesCount: newImgs.length,
                currentImages: cleanedPrev.length,
                willUpdateTo: cleanedPrev.length + newImgs.length - 1,
                env: process.env.NODE_ENV,
                timestamp: new Date().toISOString()
              });
            }

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

          // Update completed workflows if we found new ones
          if (newlyCompletedWorkflows.length > 0) {
            setCompletedWorkflows(prev => [...prev, ...newlyCompletedWorkflows]);

            // Advance the loading index if the current one completed
            if (newlyCompletedWorkflows.includes(currentlyLoadingIndex)) {
              setCurrentlyLoadingIndex(prev => {
                const nextIndex = prev + 1;
                // Don't go beyond total workflows
                return nextIndex < totalWorkflows ? nextIndex : prev;
              });
            }
          }

          // Handle regenerating indexes
          const newRegeneratingIndexes = [...regeneratingIndexesRef.current];
          const newRegeneratingWorkflows = [...regeneratingWorkflowRef.current];

          workflowMap.forEach((images, workflow, idx) => {
            const workflowIndex = Array.from(workflowMap.keys()).indexOf(workflow);
            if (images.length > (imageCounts[workflowIndex] || 0)) {
              // If we have new images, remove from regenerating indexes
              const regeneratingIdx = newRegeneratingIndexes.indexOf(workflowIndex);
              if (regeneratingIdx > -1) {
                newRegeneratingIndexes.splice(regeneratingIdx, 1);
              }

              const regeneratingWorkflowIdx = newRegeneratingWorkflows.indexOf(workflowIndex);
              if (regeneratingWorkflowIdx > -1) {
                newRegeneratingWorkflows.splice(regeneratingWorkflowIdx, 1);
              }
            }
          });

          if (newRegeneratingIndexes.length !== regeneratingIndexesRef.current.length) {
            setRegeneratingIndexes(newRegeneratingIndexes);
            regeneratingIndexesRef.current = newRegeneratingIndexes;
          }

          if (newRegeneratingWorkflows.length !== regeneratingWorkflowRef.current.length) {
            setRegeneratingWorkflow(newRegeneratingWorkflows);
            regeneratingWorkflowRef.current = newRegeneratingWorkflows;
          }

          // Update image counts
          const newImageCounts = Array.from(workflowMap.values()).map(images => images.length);
          if (!deepEqual(newImageCounts, imageCounts)) {
            setImageCounts(newImageCounts);
          }

          const newCarousels = Array.from(workflowMap.entries()).map(([workflow, images]) => ({
            workflow,
            images,
          }));

          if (hasNewImages && !isInitializingFromUrl.current) {
            console.log("📈 State update cycle:", {
              before: selectedSlides.join(','),
              after: newCarousels.map((c, i) => c.images.length - 1).join(','),
              env: process.env.NODE_ENV,
              timestamp: new Date().toISOString()
            });

            const updatedSelections = selectedSlides.map((current, workflowIndex) => {
              if (!newImageWorkflows.has(workflowIndex)) return current;

              const carousel = newCarousels[workflowIndex];
              if (!carousel || carousel.images.length === 0) return current;

              const validImages = carousel.images.filter(img =>
                img !== "loading-placeholder" &&
                (typeof img === "string" ? true : img.url)
              );

              const newIndex = validImages.length - 1;

              // ✅ NEW: prevent auto-slide if user is on regenerate and regen still in progress
              const swiper = swiperRefs.current[workflowIndex];
              const isOnRegenerate = swiper?.activeIndex === carousel.images.length;
              const isRegenerating = regeneratingWorkflow.includes(workflowIndex);

              if (isOnRegenerate && isRegenerating) {
                console.log(`🕒 Staying on regenerate for workflow ${workflowIndex}`);
                return current;
              }

              if (newIndex !== current) {
                console.log(`✨ Selection update for workflow ${workflowIndex}:`, {
                  from: current,
                  to: newIndex,
                  reason: 'New images detected',
                  env: process.env.NODE_ENV,
                  timestamp: new Date().toISOString()
                });
              }

              return newIndex;
            });


            if (!deepEqual(selectedSlides, updatedSelections)) {
              console.log("🔄 Applying selection updates:", {
                from: selectedSlides.join(','),
                to: updatedSelections.join(','),
                hasChanges: true,
                affectedWorkflows: Array.from(newImageWorkflows).join(','),
                env: process.env.NODE_ENV,
                timestamp: new Date().toISOString()
              });

              updateSelections(updatedSelections, 'New images detected');
            }
          }

          return newCarousels;
        });
      }

      setActiveRegenerationIndex(null);

      if (isMountedRef.current) {
        pollingRef.current = setTimeout(pollImages, 2000);
      }

    } catch (err: any) {
      console.error("⚠️ Poll error:", {
        error: err.message,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      if (isMountedRef.current) {
        setError("An error occurred while fetching images.");
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!jobId) return;

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job status.");
        }

        const data = await response.json();
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

        if (backendPaid && !backendApproved && data.total_workflows > 10) {
          setRemainingWorkflowsLoading(true);
        }
      } catch (err: any) {
        console.error("Error fetching job status:", err.message);
        setError(err.message || "An error occurred while fetching job status.");
      }
    };

    fetchJobStatus();
  }, [jobId, urlPaid, urlApproved, router]);

  useEffect(() => {
    if (!carousels.length) return;
    if (visibleCarousels >= totalWorkflows) return;

    const nextIndex = visibleCarousels;
    if (!paid && nextIndex >= 10) return;

    const nextCarousel = carousels[nextIndex];
    if (nextCarousel && nextCarousel.images.length > 0) {
      setVisibleCarousels((prev) => prev + 1);
    }
  }, [carousels, visibleCarousels, totalWorkflows, paid]);


  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    const startPollingTimeout = setTimeout(() => {
      if (!cancelled && isMountedRef.current) {
        pollImages();
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(startPollingTimeout);
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [jobId]);

  useEffect(() => {
    if (!encodedSelections || carousels.length === 0) {
      console.log("🚫 Skipping URL processing:", {
        hasEncodedSelections: !!encodedSelections,
        carouselsLength: carousels.length,
        currentSelectedLength: selectedSlides.length,
        timestamp: new Date().toISOString()
      });
      return;
    }
  }, [encodedSelections, carousels.length]);

  useEffect(() => {
    const carouselLengths = carousels.map(c => c.images.length);
    console.log("🎠 Carousel state updated:", {
      count: carousels.length,
      lengths: carouselLengths.join(','),
      previousLengths: previousCarouselLengths.current.join(','),
      hasNewImages: carousels.some((c, i) => c.images.length > (previousCarouselLengths.current[i] || 0)),
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    previousCarouselLengths.current = carouselLengths;
  }, [carousels]);

  useEffect(() => {
    if (!encodedSelections) return;
    console.log("🎯 URL selection processing:", {
      hasInitializedFromUrl: hasInitializedFromUrl.current,
      isInitializingFromUrl: isInitializingFromUrl.current,
      carouselsLength: carousels.length,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }, [encodedSelections, carousels.length]);

  useEffect(() => {
    if (isInitializingFromUrl.current || !jobId || !carousels.length) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentState();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedSlides, carousels, saveCurrentState, jobId]);

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      console.log("🔘 Submit clicked:", {
        selectedSlides: selectedSlides.join(','),
        carouselsLength: carousels.length,
        jobId,
        name,
        gender,
        bookId,
        apiBaseUrl
      });

      if (!jobId || !name || !gender || !bookId) {
        console.error("❌ Missing required parameters for redirection.");
        alert("Missing required information. Please refresh the page and try again.");
        return;
      }

      if (!apiBaseUrl) {
        console.error("❌ API base URL is not defined");
        alert("Configuration error. Please refresh the page and try again.");
        return;
      }

      if (!router) {
        console.error("❌ Router is not available");
        alert("Navigation error. Please refresh the page and try again.");
        return;
      }

      const selectedParam = LZString.compressToEncodedURIComponent(
        JSON.stringify(selectedSlides)
      );

      const previewUrl = `${window.location.origin}/preview?job_id=${jobId}&job_type=story&name=${name}&gender=${gender}&book_id=${bookId}&selected=${selectedParam}`;

      if (previewUrl && previewUrl.startsWith("http")) {
        console.log("📤 Sending preview URL to backend:", previewUrl);
        const updateResponse = await fetch(`${apiBaseUrl}/update-preview-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId, preview_url: previewUrl }),
        });

        if (!updateResponse.ok) {
          console.error("Failed to update preview URL:", updateResponse.status);
        }
      }

      const queryParams = new URLSearchParams({
        job_id: jobId,
        name,
        gender,
        job_type: "story",
        book_id: bookId,
        selected: selectedParam,
      });

      const res = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch job status: ${res.status}`);
      }

      const data = await res.json();
      const hasEmail = data.email && data.email.trim() !== "";
      const hasUserName = data.user_name && data.user_name.trim() !== "";

      const redirectPath = hasEmail && hasUserName ? "/purchase" : "/user-details";
      router.push(`${redirectPath}?${queryParams.toString()}`);
    } catch (err: any) {
      console.error("🚨 Error during handleSubmit:", err);
      alert(`Error: ${err.message || 'Failed to save preview. Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  }, [jobId, name, gender, bookId, apiBaseUrl, router, selectedSlides]);

  useEffect(() => {
    if (selectedSlides.some((i) => typeof i !== "number" || isNaN(i) || i < 0)) {
      const fixed: number[] = selectedSlides.map((i): number =>
        typeof i === "number" && !isNaN(i) && i >= 0 ? i : 0
      );
      console.warn("⚠️ Fixing invalid selectedSlides (including negative values):", selectedSlides, "→", fixed);
      setSelectedSlides(fixed);
    }
  }, [selectedSlides]);

  const handleApprove = async () => {
    try {

      if (!jobId) throw new Error("Job ID is missing.");

      console.log("selectedslides, carousal", selectedSlides.length, carousels.length)


      if (selectedSlides.length !== carousels.length) {

        console.warn("Mismatch between selected slides and carousels.");
        setSelectedSlides(Array(carousels.length).fill(0));
        return;
      }
      setApproving(true);
      console.log("📸 Final selectedSlides before submit:", selectedSlides);

      const sanitizedSlides = selectedSlides.map((i, idx) => {
        if (!carousels[idx] || !carousels[idx].images) return 0;

        const imageCount = carousels[idx].images.length;

        const hasRegenerate = !approved;
        const rawMax = hasRegenerate ? imageCount - 1 : imageCount - 1;

        const maxValidIndex = Math.max(0, rawMax);
        if (typeof i !== "number" || isNaN(i)) return 0;
        return Math.min(i, maxValidIndex);
      });

      console.log("🧪 Submitting sanitizedSlides:", sanitizedSlides);

      const formData = new FormData();
      formData.append("job_id", jobId);
      formData.append("name", name);
      formData.append("gender", gender);
      formData.append("selectedSlides", JSON.stringify(sanitizedSlides));

      const response = await fetch(`${apiBaseUrl}/approve`, {
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
        approved: String(approved),
        selected: selectedParam,
        job_type: jobType,
        book_id: bookId,
        name,
        gender,
      });

      window.location.href = `/approved?${newSearchParams.toString()}`

    } catch (err: any) {
      console.error("Error approving:", err.message);
    } finally {
      setApproving(false);
    }
  };

  const startPolling = () => {
    if (!isMountedRef.current) return;

    if (pollingRef.current) clearTimeout(pollingRef.current);
    pollingRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        pollImages();
      }
    }, 2000);
  };

  useEffect(() => {
    if (carousels.length && imageCounts.length === 0) {
      const newImageCounts = carousels.map(c => c.images.length);
      console.log("📊 Initializing imageCounts:", newImageCounts.length, "for", carousels.length, "carousels");
      setImageCounts(newImageCounts);
    }
  }, [carousels]);

  const handleRegenerate = async (workflowIndex: number) => {
    if (!jobId) return;

    console.log("🔄 Regeneration triggered:", {
      workflowIndex,
      currentImages: carousels[workflowIndex]?.images.length,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    const swiper = swiperRefs.current[workflowIndex];
    if (swiper) {
      swiper.slideTo(carousels[workflowIndex].images.length); // Last slide is regenerate slide
      swiper.allowTouchMove = false; // Disable swiping
    }

    setActiveRegenerationIndex(workflowIndex);

    try {
      console.log("🔄 Regenerating workflow", workflowIndex + 1);

      forceContinueUntil.current = Date.now() + 60000;

      const workflowKey = carousels[workflowIndex].workflow;

      setRegeneratingIndexes(prev => [...prev, workflowIndex]);
      regeneratingIndexesRef.current = [...regeneratingIndexesRef.current, workflowIndex];

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

      setRegeneratingWorkflow(prev => [...prev, workflowIndex]);
      regeneratingWorkflowRef.current = [...regeneratingWorkflowRef.current, workflowIndex];
      await new Promise(resolve => setTimeout(resolve, 50));

      const response = await fetch(`${apiBaseUrl}/regenerate-workflow-lock`, {
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

      console.log("✨ Regeneration request sent:", {
        workflowIndex,
        workflowKey: carousels[workflowIndex].workflow,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("🔥 Regeneration error:", {
        workflowIndex,
        error,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      setRegeneratingIndexes(prev => prev.filter(i => i !== workflowIndex));
    } finally {
      // Re-enable swiping when done
      const swiper = swiperRefs.current[workflowIndex];
      if (swiper) {
        swiper.allowTouchMove = true;
      }
      setActiveRegenerationIndex(null);
    }
  };

  const updateSelectedSlide = useCallback((workflowIndex: number, index: number) => {
    console.log("🎯 Manual slide update triggered:", {
      workflowIndex,
      index,
      currentSlides: selectedSlides.join(','),
      isInitializingFromUrl: isInitializingFromUrl.current,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    if (isInitializingFromUrl.current) {
      console.log("🔒 Skipping update - URL initialization in progress");
      return;
    }

    const now = Date.now();
    const lastUpdate = lastUpdateRef.current;
    if (lastUpdate &&
      lastUpdate.workflowIndex === workflowIndex &&
      now - lastUpdate.timestamp < 300) {
      console.log("⏭️ Skipping rapid update:", {
        timeSinceLastUpdate: now - lastUpdate.timestamp,
        env: process.env.NODE_ENV
      });
      return;
    }

    lastUpdateRef.current = {
      workflowIndex,
      index,
      timestamp: now
    };

    queueSelectionUpdate(workflowIndex, Math.max(0, index));
  }, [selectedSlides, queueSelectionUpdate, isInitializingFromUrl]);

  useEffect(() => {
    if (!jobId || workflowStatus === "completed") {
      setLoading(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.workflow_status === "completed") {
            setWorkflowStatus("completed");
            setLoading(false);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.warn("Workflow status check failed:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, workflowStatus]);

  const formatName = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  const swiperRefs = useRef<(SwiperClass | null)[]>([]);

  const allWorkflowsCompleted = useMemo(() => {
    return carousels.length === totalWorkflows &&
      carousels.every(c => c?.images?.length > 0);
  }, [carousels, totalWorkflows]);

  const first10WorkflowsCompleted = useMemo(() => {
    return carousels.length >= 10 &&
      carousels.slice(0, 10).every(c => c?.images?.length > 0);
  }, [carousels]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8" style={{ backgroundImage: "url('/background-grid.jpg')" }} >
        <header className="max-w-4xl mx-auto mb-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-2xl sm:text-4xl font-libre font-medium mb-2 text-blue-900"
          >
            {approved ? (
              `${formatName(name)}'s Finalized Book`
            ) : paid ? (
              `Finalize ${name.charAt(0).toUpperCase() + name.slice(1)}'s Book`
            ) : (
              `${formatName(name)}'s Preview Book`

            )}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 text-base sm:text-lg text-gray-600 space-y-1 flex flex-col items-center"
          >
            <div className="flex items-center gap-2">
              <BsImages size={20} className="text-blue-900 font-poppins" />
              <p>Watch the story come alive one page at a time!</p>
            </div>
            <div className="flex items-center gap-2">
              <BsArrowLeftRight size={20} className="text-blue-900 font-poppins" />
              <p>Slide left or right to pick the best moment</p>
            </div>
          </motion.div>
        </header>

        <div className="flex-1 w-full my-4 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-12">

            {Array.from({ length: totalWorkflows }).map((_, index) => {
              const carousel = carousels[index];
              const isGenerated = carousel?.images?.length > 0;
              const first10Rendered = carousels.slice(0, 10).every((c) => c?.images?.length > 0);

              let workflowState = 'preparing';
              if (isGenerated) workflowState = 'ready';
              else if (!paid && index >= 10) workflowState = 'locked';
              else if (index === visibleCarousels) workflowState = 'loading';

              if (workflowState === 'locked' && !remainingWorkflowsLoading && first10Rendered) {
                return (
                  <div key={`locked-${index}`} className="w-full max-w-md mx-auto mb-12 relative">
                    <div className="w-full text-center mb-2 flex justify-end">
                      <div className="inline-block px-3 py-1 text-sm font-poppins text-gray-800 bg-gray-100 rounded-full">
                        {index === 0 ? "Book Cover" : `Page ${index}`}
                      </div>
                    </div>
                    <div className="relative w-full aspect-square overflow-hidden shadow-[5px_5px_10px_rgba(0,0,0,0.5)] bg-white">
                      <div className="flex flex-col justify-center items-center w-full h-full">
                        <img src="/lock-page.webp" alt="Locked" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  </div>
                );
              }

              if (index > visibleCarousels) return null;

              if (!carousel || !carousel.images || carousel.images.length === 0) {
                if (!paid && index >= 10) return null;
                return (
                  <div key={`placeholder-${index}`} className="w-full max-w-md mx-auto mb-12 relative">
                    <div className="w-full text-center mb-2 flex justify-end">
                      <div className="inline-block px-3 py-1 text-sm font-poppins text-gray-800 bg-gray-100 rounded-full">
                        Page {index}
                      </div>
                    </div>
                    <div className="relative w-full aspect-square overflow-hidden shadow-[5px_5px_10px_rgba(0,0,0,0.5)] bg-white">
                      <div className="flex flex-col justify-center items-center w-full h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
                        <p className="text-sm text-gray-700 mt-4 font-poppins">
                          Generating page {index} of {totalWorkflows}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={`carousel-${index}`} className="w-full max-w-md mx-auto mb-12 relative">
                  <div className="w-full text-center mb-2 flex justify-end">
                    <div className="inline-block px-3 py-1 text-sm font-poppins text-gray-800 bg-gray-100 rounded-full">
                      {index === 0 ? "Book Cover" : `Page ${index}`}
                    </div>
                  </div>

                  <div className="relative w-full aspect-square overflow-hidden shadow-[5px_5px_10px_rgba(0,0,0,0.2)] bg-white flex flex-col justify-center items-center">
                    <div
                      ref={(el) => { paginationRefs.current[index] = el; }}
                      className="swiper-pagination"
                    />
                    {paginationRefs.current[index] && (() => (
                      <Swiper
                        key={`swiper-${index}`}
                        modules={[Navigation, Pagination, EffectFade]}
                        slidesPerView={1}
                        effect="fade"
                        fadeEffect={{ crossFade: true }}
                        allowTouchMove={activeRegenerationIndex !== index}
                        preventInteractionOnTransition={true}
                        speed={300}
                        watchSlidesProgress={true}
                        simulateTouch={false}
                        touchRatio={1}
                        longSwipesRatio={0.2}
                        onSwiper={(swiper) => {
                          swiperRefs.current[index] = swiper;
                        }}
                        navigation={{
                          nextEl: `.next-${index}`,
                          prevEl: `.prev-${index}`,
                        }}
                        pagination={{
                          el: paginationRefs.current[index],
                          clickable: true,
                          bulletClass: 'swiper-pagination-bullet inline-block w-3 h-3 mx-1 rounded-full bg-black opacity-30',
                          bulletActiveClass: 'swiper-pagination-bullet-active !opacity-100 !bg-yellow-300',
                          renderBullet: (bulletIndex, className) => {
                            const isRegenerate = bulletIndex === carousel.images.length;
                            if (isRegenerate && !approved) return '';
                            return `<img src="/circle.png" class="${className}" style="width: 10px; height: 10px; margin: 0 4px;" />`;
                          }
                        }}
                        onSlideChange={(swiper) => {
                          if (!swiper.animating && !isInitializingFromUrl.current) {
                            const lastIndex = carousel.images.length;

                            // Force stay on regenerate slide during regeneration
                            if (activeRegenerationIndex === index) {
                              swiper.slideTo(lastIndex);
                              return;
                            }

                            const isRegenerateSlide = swiper.activeIndex === lastIndex;

                            if (isRegenerateSlide && swiper.swipeDirection && !approved) {
                              swiper.slideTo(lastIndex - 1);
                              return;
                            }

                            if (!isRegenerateSlide && swiper.activeIndex !== selectedSlides[index]) {
                              requestAnimationFrame(() => {
                                updateSelectedSlide(index, swiper.activeIndex);
                              });
                            }
                          }
                        }}
                        onInit={(swiper) => {
                          const currentIndex = selectedSlides[index];

                          const isRegenerating = regeneratingWorkflow.includes(index);
                          const isOnRegenerate = currentIndex === carousel.images.length;

                          if (isOnRegenerate && isRegenerating) {
                            console.log("🚫 Skipping slideTo on init — still regenerating");
                            return;
                          }

                          if (currentIndex !== undefined && currentIndex !== swiper.activeIndex) {
                            swiper.slideTo(currentIndex, 0, false);
                          }
                        }}
                        className="w-full h-full pb-8"
                        noSwiping={activeRegenerationIndex === index}
                        noSwipingClass="swiper-no-swiping"
                      >
                        {carousel.images.map((image: any, imgIndex: number) => (
                          <SwiperSlide key={imgIndex}>
                            {image === "loading-placeholder" ? (
                              <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 mb-4" />
                              </div>
                            ) : (
                              <img
                                src={typeof image === "string" ? image : image.url}
                                alt={`Page ${index}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </SwiperSlide>
                        ))}

                        {!approved && (
                          <SwiperSlide key="generate-more">
                            <div className="flex flex-col items-center justify-center aspect-square w-full h-full bg-white p-6 sm:p-8 shadow-[6px_6px_0px_rgba(0,0,0,0.8)]">
                              {regeneratingWorkflow.includes(index) ? (
                                <div className="flex flex-col items-center justify-center h-full w-full">
                                  <div className="flex space-x-1 mb-2">
                                    <span className="block w-2 h-2 sm:w-3 sm:h-3 bg-orange-400 rounded-full animate-bounce"></span>
                                    <span className="block w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                                    <span className="block w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                                  </div>
                                  <p className="text-sm sm:text-base font-semibold text-gray-800">Regenerating...</p>
                                </div>
                              ) : (
                                <>
                                  <h3 className="text-base sm:text-xl text-gray-800 mb-4 text-center font-poppins leading-tight">
                                    Generate more options
                                  </h3>
                                  <button
                                    onClick={async () => {
                                      const swiper = swiperRefs.current[index];
                                      if (swiper) {
                                        swiper.slideTo(carousel.images.length);
                                        swiper.allowTouchMove = false;
                                      }

                                      await handleRegenerate(index);
                                    }}
                                    disabled={regeneratingWorkflow.includes(index)}
                                    className={`px-6 py-2 text-sm sm:text-lg font-medium font-poppins rounded-xl transition-all duration-200 ${regeneratingWorkflow.includes(index)
                                      ? 'bg-gray-300 cursor-not-allowed'
                                      : 'bg-[#5784ba] shadow-lg hover:bg-[#9ac8eb] hover:cursor-pointer'
                                      } text-white`}
                                    aria-label="Regenerate more options"
                                  >
                                    {regeneratingWorkflow.includes(index) ? 'Regenerating...' : 'Refine'}
                                  </button>
                                </>
                              )}
                            </div>
                          </SwiperSlide>
                        )}

                        <div className={`prev-${index} absolute left-3 top-1/2 -translate-y-1/2 z-10`}>
                          <button className="bg-white/80 border-black border hover:bg-white text-black p-2 rounded-full shadow transition" aria-label="Previous slide">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        <div className={`next-${index} absolute right-3 top-1/2 -translate-y-1/2 z-10`}>
                          <button className="bg-white/80 border-black border hover:bg-white hover:cursor-pointer text-black p-2 rounded-full shadow transition" aria-label="Next slide">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </Swiper>

                    ))()}
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {loading &&
          workflowStatus !== "completed" &&
          !approved &&
          !paid &&
          carousels.length > 0 &&
          carousels.length < 10 && (
            <div
              className="max-w-xs md:max-w-md fixed z-50 bottom-30 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-800 p-4 md:p-6 rounded-lg shadow-brutalist text-center"
              style={{
                boxShadow: "8px 8px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              <p className="text-gray-800 font-poppins mb-4 text-lg sm:text-xl animate-fade-in">
                Don&apos;t want to wait?
              </p>

              <button
                onClick={() => {
                  const query = new URLSearchParams({
                    job_id: jobId || "",
                    name,
                    gender,
                    book_id: bookId,
                    selected: LZString.compressToEncodedURIComponent(
                      JSON.stringify(selectedSlides)
                    ),
                  });
                  router.push(`/user-details?${query.toString()}`);
                }}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-2.5 px-5 font-poppins border border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-gray-900 text-xs md:text-sm"
              >
                Email Preview Link
              </button>
            </div>
          )}

        <section className="w-full p-4 sm:p-6">
          <div className="max-w-xl mx-auto flex flex-col gap-2 sm:gap-4 justify-center">
            {!paid && !approved && (
              <p className="text-center text-sm sm:text-base text-gray-600 mb-2 font-poppins">
                You can continue refining your book even after this step — regenerate images and finalize later at your convenience.
              </p>
            )}
            {!paid && !approved && (
              <div
                className="w-72 md:w-96 fixed z-50 bottom-10 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 p-3 md:p-6 rounded-lg shadow-2xl text-center">
                <p className="text-gray-800 font-poppins mb-4 text-sm sm:text-base animate-fade-in">
                  Full Preview is available on Purchase
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={
                    !jobId ||
                    loading ||
                    submitting ||
                    regeneratingIndexes.length > 0 ||
                    !first10WorkflowsCompleted
                  }
                  className={`relative overflow-hidden shine px-6 py-3 rounded-[1rem] text-sm sm:text-base font-medium text-white transition-colors duration-200 ${!jobId ||
                      loading ||
                      submitting ||
                      regeneratingIndexes.length > 0 ||
                      !first10WorkflowsCompleted
                      ? 'bg-indigo-400 cursor-not-allowed opacity-75'
                      : 'bg-[#5784ba] hover:bg-[#5784bc] active:bg-[#5784bd] shadow-md cursor-pointer'
                    }`}
                >
                  {submitting
                    ? "Saving..."
                    : regeneratingIndexes.length > 0
                      ? "Regenerating..."
                      : loading
                        ? "Loading..."
                        : !first10WorkflowsCompleted
                          ? "Generating preview..."
                          : "Continue to Purchase"}
                </button>
              </div>
            )}

            {paid && !approved && (
              <div className="w-72 md:w-80 fixed z-50 bottom-10 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 p-3 md:p-6 rounded-xl shadow-2xl text-center space-y-4">

                <button
                  onClick={handleApprove}
                  disabled={approving || !jobId || loading || regeneratingIndexes.length > 0 || !allWorkflowsCompleted}
                  className={`px-6 py-3 rounded-[1rem] text-sm sm:text-base font-medium text-white transition-all duration-200 ${!approving && regeneratingIndexes.length === 0 && allWorkflowsCompleted
                    ? 'bg-[#5784ba] hover:bg-[#516f93] active:bg-[#295288] shadow-md cursor-pointer'
                    : 'bg-indigo-400 opacity-75 cursor-not-allowed'
                    }`}
                >
                  {approving
                    ? "Approving..."
                    : regeneratingIndexes.length > 0
                      ? "Regenerating..."
                      : !allWorkflowsCompleted
                        ? "Generating full preview..."
                        : "Approve for printing"}
                </button>
                <p className="text-gray-800 font-poppins text-sm">
                  Your book will be delivered in 7 days
                </p>
              </div>
            )}

          </div>
        </section>

        {isSaving && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm z-50">
            Saving...
          </div>
        )}

      </div>
    </Suspense>
  );
};

export default Preview;