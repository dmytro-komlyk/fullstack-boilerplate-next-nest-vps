"use client";

import { Button, ButtonGroup, Input } from "@nextui-org/react";
import { Form, Formik, FormikProps } from "formik";
import { useState } from "react";
import { MdCancel, MdDone, MdEdit } from "react-icons/md";
import * as Yup from "yup";
import { trpc } from "../(utils)/trpc/client";
import { serverClient } from "../(utils)/trpc/serverClient";

const EditTextForm = ({
  initialText,
}: {
  initialText: Awaited<ReturnType<(typeof serverClient)["getExampleTrpc"]>>;
}) => {
  const getExampleTrpc = trpc.getExampleTrpc.useQuery(
    { id: "65731bc5fce8c87e24fd4361" },
    {
      initialData: initialText,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const [isEdit, setEdit] = useState(false);
  const onEditText = () => setEdit(true);
  const cancelEditText = () => setEdit(false);

  const handleCancelEdit = () => {
    cancelEditText();
  };

  const editBy = trpc.editExampleTrpc.useMutation({
    onSettled: () => {
      getExampleTrpc.refetch();
    },
  });

  return isEdit ? (
    <Formik
      initialValues={getExampleTrpc?.data}
      validationSchema={Yup.object({
        text: Yup.string()
          .min(3, "Must be 3 characters or more")
          .required("Please enter your name"),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);
        editBy.mutate({ id: "65731bc5fce8c87e24fd4361", ...values });
        handleCancelEdit();
        setSubmitting(false);
      }}
    >
      {(props: FormikProps<any>) => (
        <Form className="p-4 md:p-5 lg:p-6" onSubmit={props.handleSubmit}>
          <div className="flex gap-x-3">
            <ButtonGroup>
              <Button
                size="sm"
                color="primary"
                variant="bordered"
                isIconOnly
                aria-label="Edit"
                type="submit"
              >
                <MdDone size={16} />
              </Button>
              <Button
                size="sm"
                color="primary"
                variant="bordered"
                isIconOnly
                aria-label="Edit"
                type="reset"
                onClick={handleCancelEdit}
              >
                <MdCancel size={16} />
              </Button>
            </ButtonGroup>
            <Input
              size={"sm"}
              onChange={props.handleChange}
              onBlur={props.handleBlur}
              value={props.values.text}
              type="text"
              name="text"
            />
          </div>
        </Form>
      )}
    </Formik>
  ) : (
    <div className="flex gap-x-3 items-center">
      <Button
        size="sm"
        color="primary"
        variant="bordered"
        isIconOnly
        aria-label="Edit"
        onClick={onEditText}
      >
        <MdEdit size={16} />
      </Button>
      <p>{getExampleTrpc?.data?.text}</p>
    </div>
  );
};

export default EditTextForm;
