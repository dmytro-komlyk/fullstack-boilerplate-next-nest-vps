"use client";

import { Button } from "@nextui-org/react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";

const SignInButton = () => {
  const router = useRouter();
  const { data: session } = useSession();

  if (session && session.user)
    return (
      <div className="flex gap-4 ml-auto items-center">
        <p className="text-slate-700">{session.user.name}</p>
        <Button
          color="danger"
          variant="bordered"
          startContent={<FiLogOut />}
          onClick={() => {
            signOut({ redirect: false }).then(() => {
              router.push(`${window.location.origin}`); // Redirect to the home page after signing out
            });
          }}
          className="flex ml-auto text-red-600"
        >
          Sign Out
        </Button>
      </div>
    );

  return (
    <div className="flex gap-4 ml-auto items-center">
      <Link
        href={"/api/auth/signin"}
        className="flex gap-4 ml-auto text-green-600"
      >
        Sign In
      </Link>
      <Link
        href={"/api/auth/signup"}
        className="flex gap-4 ml-auto bg-green-600 text-green-200 p-2 rounded"
      >
        Sign Up
      </Link>
    </div>
  );
};

export default SignInButton;
