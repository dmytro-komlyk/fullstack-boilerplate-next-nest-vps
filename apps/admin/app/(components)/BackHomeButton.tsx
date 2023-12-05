"use client";
import Link from "next/link";
import { BiArrowBack } from "react-icons/bi";

const BackHomeButton = () => {
  return (
    <div className="mr-auto">
      <Link href={"/"}>
        <BiArrowBack className="text-4xl text-slate-700 dark:text-slate-200" />
      </Link>
    </div>
  );
};

export default BackHomeButton;
