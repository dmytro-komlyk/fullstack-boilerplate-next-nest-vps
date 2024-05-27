'use client';

import { Button, ButtonGroup, Input } from '@nextui-org/react';
import type { FormikProps } from 'formik';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { MdCancel, MdDone, MdEdit } from 'react-icons/md';
import * as Yup from 'yup';

import { trpc } from '../(utils)/trpc/client';

const EditTextForm = ({ initialText }: { initialText: any }) => {
  const getExampleTrpc = trpc.example.getById.useQuery(initialText.id, {
    initialData: initialText,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const [isEdit, setEdit] = useState(false);
  const onEditText = () => setEdit(true);
  const cancelEditText = () => setEdit(false);

  const handleCancelEdit = () => {
    cancelEditText();
  };

  const editBy = trpc.example.update.useMutation({
    onSettled: () => {
      getExampleTrpc.refetch();
    },
  });

  return isEdit ? (
    <Formik
      initialValues={getExampleTrpc?.data}
      validationSchema={Yup.object({
        text: Yup.string()
          .min(3, 'Must be 3 characters or more')
          .required('Please enter your name'),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);
        editBy.mutate(values);
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
              size="sm"
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
    <div className="flex items-center gap-x-3">
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
