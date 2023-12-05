import LoginForm from "@admin/app/(components)/LoginForm";
import Link from "next/link";

export default async function SignIn() {
  return (
    <div className="flex-col py-4">
      <LoginForm />
      <div className="flex justify-center gap-2 text-slate-600">
        Don`t have an account?
        <Link
          href={"/api/auth/signup"}
          className="text-green-600 hover:text-blue-600"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
