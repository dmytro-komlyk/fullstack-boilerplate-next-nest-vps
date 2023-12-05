"use client";

import { Button, Input } from "@nextui-org/react";
import { Field, Form, Formik, FormikProps } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaUserAlt } from "react-icons/fa";
import { HiMail } from "react-icons/hi";
import * as Yup from "yup";
import { Api, Backend_URL } from "../(lib)/constants";

const RegisterForm = () => {
  const router = useRouter();
  const [isVisiblePassword, setIsVisiblePassword] = useState(false);
  const [isVisiblePasswordConfirm, setIsVisiblePasswordConfirm] =
    useState(false);

  const toggleVisibilityPassword = () =>
    setIsVisiblePassword(!isVisiblePassword);
  const toggleVisibilityPasswordConfirm = () =>
    setIsVisiblePasswordConfirm(!isVisiblePasswordConfirm);

  return (
    <Formik
      initialValues={{
        name: "",
        email: "",
        password: "",
        passwordConfirmation: "",
        tenantKey: "",
      }}
      validationSchema={Yup.object({
        name: Yup.string()
          .min(3, "Must be 3 characters or more")
          .required("Please enter your name"),
        email: Yup.string()
          .max(30, "Must be 30 characters or less")
          .email("Invalid email address")
          .required("Please enter your email"),
        password: Yup.string()
          .min(6, "password must be at least 6 characters")
          .required("Please enter your password"),
        passwordConfirmation: Yup.string()
          .label("confirm password")
          .oneOf([Yup.ref("password")], "Passwords must match")
          .required("Please enter your confirm password"),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);

        const res = await fetch(Backend_URL + Api + "/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          alert(res.statusText);
          return;
        }
        const response = await res.json();
        console.log("User Registered!");
        setSubmitting(false);
        router.push(window.location.origin + "/api/auth/signin");
      }}
    >
      {(props: FormikProps<any>) => (
        <Form className="p-4 md:p-5 lg:p-6" onSubmit={props.handleSubmit}>
          <div className="grid gap-y-3">
            <Field name="name">
              {({ meta, field }: any) => (
                <Input
                  type="text"
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
                  isInvalid={meta.touched && meta.error}
                  errorMessage={meta.touched && meta.error && meta.error}
                  placeholder="Name"
                  endContent={<FaUserAlt className="text-xl text-slate-400" />}
                  {...field}
                />
              )}
            </Field>
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
            <Field name="passwordConfirmation">
              {({ meta, field }: any) => (
                <Input
                  type={isVisiblePasswordConfirm ? "text" : "password"}
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
                  placeholder="Confirm password"
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibilityPasswordConfirm}
                    >
                      {isVisiblePasswordConfirm ? (
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
              <HiMail className="text-xl" />
              Sign up
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default RegisterForm;
