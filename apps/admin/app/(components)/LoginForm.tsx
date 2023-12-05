"use client";

import { Button, Input } from "@nextui-org/react";
import { Field, Form, Formik, FormikProps } from "formik";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FiLogIn } from "react-icons/fi";
import { HiMail } from "react-icons/hi";
import * as Yup from "yup";

const LoginForm = () => {
  const router = useRouter();
  const [isVisiblePassword, setIsVisiblePassword] = useState(false);
  const toggleVisibilityPassword = () =>
    setIsVisiblePassword(!isVisiblePassword);

  return (
    <Formik
      initialValues={{ email: "", password: "", tenantKey: "" }}
      validationSchema={Yup.object({
        email: Yup.string()
          .max(30, "Must be 30 characters or less")
          .email("Invalid email address")
          .required("Please enter your email"),
        password: Yup.string().required("Please enter your password"),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);
        const res = await signIn("credentials", {
          redirect: false,
          email: values.email,
          password: values.password,
          callbackUrl: `${window.location.origin}`,
        });
        if (res?.error) {
          // setError(res.error);
        } else {
          // setError(null);
        }
        if (res?.url) router.push(window.location.origin);
        setSubmitting(false);
      }}
    >
      {(props: FormikProps<any>) => (
        <Form className="p-4 md:p-5 lg:p-6" onSubmit={props.handleSubmit}>
          <div className="grid gap-y-3">
            <Button
              onClick={() => signIn("google")}
              className="flex items-center justify-center gap-x-2 rounded-md border border-slate-600 bg-slate-700 py-3 px-4 text-slate-300 transition hover:text-purple-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                className="bi bi-google"
                viewBox="0 0 16 16"
              >
                <path
                  d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"
                  fill="#cbd5e1"
                ></path>
              </svg>
              Sign in with Google
            </Button>
          </div>

          <div className="my-3 flex items-center px-3">
            <hr className="w-full border-slate-600" />
            <span className="mx-3 text-slate-500">or</span>
            <hr className="w-full border-slate-600" />
          </div>

          <div className="grid gap-y-3">
            <Field name="email">
              {({ meta, field }: any) => (
                <Input
                  type="email"
                  isInvalid={meta.touched && meta.error}
                  errorMessage={meta.touched && meta.error && meta.error}
                  classNames={{
                    input: [
                      "text-slate-200",
                      "outline-none",
                      "transition",
                      "placeholder:text-slate-400",
                    ],
                    inputWrapper: [
                      "rounded-md",
                      "bg-slate-700",
                      "border",
                      "border-slate-600",
                      "group-data-[hover=true]:border-purple-400",
                      "group-data-[focus=true]:border-purple-400",
                      "group-data-[hover=true]:bg-slate-700",
                      "group-data-[focus=true]:bg-slate-600",
                    ],
                  }}
                  placeholder="email@example.com"
                  endContent={<HiMail className="text-xl text-slate-400" />}
                  {...field}
                />
              )}
            </Field>
            <Field name="password">
              {({ meta, field }: any) => (
                <Input
                  type={isVisiblePassword ? "text" : "password"}
                  isInvalid={meta.touched && meta.error}
                  errorMessage={meta.touched && meta.error && meta.error}
                  classNames={{
                    input: [
                      "text-slate-200",
                      "outline-none",
                      "transition",
                      "placeholder:text-slate-400",
                    ],
                    inputWrapper: [
                      "rounded-md",
                      "bg-slate-700",
                      "border",
                      "border-slate-600",
                      "group-data-[hover=true]:border-purple-400",
                      "group-data-[focus=true]:border-purple-400",
                      "group-data-[hover=true]:bg-slate-700",
                      "group-data-[focus=true]:bg-slate-600",
                    ],
                  }}
                  placeholder="password"
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibilityPassword}
                    >
                      {isVisiblePassword ? (
                        <AiFillEyeInvisible className="text-xl hover:text-slate-200 text-slate-400" />
                      ) : (
                        <AiFillEye className="text-xl hover:text-slate-200 text-slate-400" />
                      )}
                    </button>
                  }
                  {...field}
                />
              )}
            </Field>
            <Button
              type="submit"
              isLoading={props.isSubmitting}
              className="flex items-center justify-center gap-x-2 rounded-md border border-slate-600 bg-slate-700 py-3 px-4 text-slate-300 transition hover:text-purple-400"
            >
              <FiLogIn className="text-xl" />
              Sign in with Email
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default LoginForm;
