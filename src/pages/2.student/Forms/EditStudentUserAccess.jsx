import React, { useState } from 'react'
import { Formik, Form } from 'formik'
import * as yup from 'yup'
import FormErrorHandler from '../../../components/FormErrorHandler/FormErrorHandler'
import { Eye, EyeOff } from 'lucide-react'
import { HiOutlineDocumentDuplicate } from 'react-icons/hi'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sendStudentPasswordResetService } from '../../../store/tanstackStore/services/api'

const EditStudentUserAccess = ({ studentData, formRef, handleNext, changeStudentPasswordMutation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [resetSentTo, setResetSentTo] = useState(null);

  // Preferred over setting a password by hand: the student chooses their own via an emailed link
  const sendResetMutation = useMutation({
    mutationFn: () => sendStudentPasswordResetService(studentData?.student?.id),
    onSuccess: (data) => {
      setResetSentTo(data?.maskedEmail || 'the student');
      toast.success(data?.message || 'Reset link sent');
    },
    onError: (error) => toast.error(error?.message || 'Could not send the reset link'),
  });

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const initialValues = {
    newPassword: '',
   
  }

  const validationSchema = yup.object().shape({
    newPassword: yup.string().required('Password is required'),
   
  })    

  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        changeStudentPasswordMutation.mutate(values);
      }}
    >
      {({ errors, touched, handleChange, handleBlur, values, setFieldValue }) => (
        <Form className="space-y-6">
          {/** Header */}
            {/** Header */}
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
                User Access
            </h2>
            <button 
              disabled={changeStudentPasswordMutation.isPending}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 ${
                changeStudentPasswordMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <HiOutlineDocumentDuplicate className="w-4 h-4 mr-2" />
              {changeStudentPasswordMutation.isPending ? "Saving..." : "Save Details"}
            </button>
          </div>

          {/** Send reset link */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Send password reset link</h3>
            <p className="mt-1 text-sm text-gray-600">
              Emails the student a link to choose their own password. The link works once and expires in 30 minutes.
              Use this instead of setting a password for them whenever they can reach their email.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => sendResetMutation.mutate()}
                disabled={sendResetMutation.isPending || !studentData?.student?.id}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendResetMutation.isPending ? 'Sending...' : 'Send reset link'}
              </button>
              {resetSentTo && (
                <span className="text-sm text-green-700">Sent to {resetSentTo}</span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Or set a password manually, for students who can no longer reach their email:
          </p>

          {/** Form */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.newPassword}
                className={`mt-1 block w-full rounded-md border ${
                  errors.newPassword && touched.newPassword ? 'border-red-500' : 'border-gray-300'
                } shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && touched.newPassword && (
              <div className="text-red-500 text-sm mt-1">{errors.newPassword}</div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setFieldValue('newPassword', generatePassword())}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Generate Password
            </button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default EditStudentUserAccess