import RegisterForm from "@admin/app/(components)/RegisterForm";
import Link from "next/link";

export default async function SignUp() {
  return (
    <div className="flex-col py-4">
      <RegisterForm />
      <div className="flex justify-center gap-2 text-slate-600">
        Already have an account?
        <Link
          href={"/api/auth/signin"}
          className="text-green-600 hover:text-blue-600"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
