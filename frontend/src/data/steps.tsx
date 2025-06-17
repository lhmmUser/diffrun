import { JSX } from "react";
import { FaBookOpen, FaPen, FaRegHeart, FaGift } from "react-icons/fa";

interface Step {
  icon: JSX.Element;
  title: string;
  description: string;
}

export const steps: Step[] = [
  {
    icon: <FaBookOpen className="text-white text-2xl" />,
    title: "Find a book they’ll love",
    description: "Browse our collection to pick the perfect story for your child",
  },
  {
    icon: <FaPen className="text-white text-2xl" />,
    title: "Personalize it with care",
    description: "Add their name and photo to make every page feel truly magical",
  },
  {
    icon: <FaRegHeart className="text-white text-2xl" />,
    title: "Make it truly personal",
    description: "We craft stories with your child's face and their unique details",
  },
  {
    icon: <FaGift className="text-white text-2xl" />,
    title: "Give a gift to remember",
    description: "A beautiful keepsake they’ll cherish long after storytime ends",
  },
];
