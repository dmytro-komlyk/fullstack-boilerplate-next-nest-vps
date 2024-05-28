'use client';

import { Button } from '@nextui-org/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FiLogOut } from 'react-icons/fi';

const SignInButton = () => {
  const router = useRouter();
  const { data: session } = useSession();

  if (session && session.user)
    return (
      <div className="ml-auto flex items-center gap-4">
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
          className="ml-auto flex text-red-600"
        >
          Sign Out
        </Button>
      </div>
    );

  return (
    <div className="ml-auto flex items-center gap-4">
      <Link
        href="/api/auth/signin"
        className="ml-auto flex gap-4 text-green-600"
      >
        Sign In
      </Link>
      <Link
        href="/api/auth/signup"
        className="ml-auto flex gap-4 rounded bg-green-600 p-2 text-green-200"
      >
        Sign Up
      </Link>
    </div>
  );
};

export default SignInButton;
