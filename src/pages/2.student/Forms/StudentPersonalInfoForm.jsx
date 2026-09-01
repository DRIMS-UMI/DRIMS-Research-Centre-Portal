import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import FormErrorHandler from "@/components/FormErrorHandler/FormErrorHandler";
import { PhoneInput } from "@/components/ui/phone-input";



const StudentPersonalInfoForm = ({ formRef, handleNext }) => {

  // Encryption/decryption functions
  const encryptData = (data) => {
    return btoa(JSON.stringify(data)) // Simple base64 encoding for demo
  }

  const decryptData = (encryptedData) => {
    try {
      return JSON.parse(atob(encryptedData)) // Decode base64
    } catch {
      return {}
    }
  }

  // Get and decrypt stored data
  const encryptedData = localStorage.getItem('studentPersonalInfo')
  const storedData = encryptedData ? decryptData(encryptedData) : {}

  const initialValues = {
    title: storedData.title || "",
    fullName: storedData?.fullName || "",
    registrationNumber: storedData?.registrationNumber || "",
    studentNumber: storedData?.studentNumber || "",
    email: storedData.email || "",
    phoneNumber: storedData.phoneNumber || "",
    gender: storedData.gender || "",
    nationality: storedData.nationality || "",
    address: storedData.address || "",
    city: storedData.city || "",
    country: storedData.country || "",
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    fullName: Yup.string().required("Full name is required"),
    studentNumber: Yup.string().optional(),
    registrationNumber: Yup.string().required("Registration Number is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phoneNumber: Yup.string().required("Phone number is required"),
    gender: Yup.string().required("Gender is required"),
  });




  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        // Encrypt data before storing
        const encryptedValues = encryptData(values)
        localStorage.setItem('studentPersonalInfo', encryptedValues)
        handleNext()
      }}
    >
      {({ errors, touched, handleChange, handleBlur, values, setFieldValue }) => {
        const handleTitleChange = (e) => {
          handleChange(e);
          const title = e.target.value;
          if (title === "Mr") {
            setFieldValue("gender", "male");
          } else if (title === "Ms" || title === "Mrs") {
            setFieldValue("gender", "female");
          }
        };

        return (
        <Form className="space-y-6">
          <div className="flex flex-col gap-6">
            {/** Rehistration Number */}
            <div className="grid grid-cols-3 gap-6">

              <div>
                <label
                  htmlFor="registrationNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Registration Number
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.registrationNumber}
                  className={`w-full h-9 rounded-md border ${errors?.registrationNumber ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}
                />
                <FormErrorHandler
                  errors={errors?.registrationNumber}
                  message={errors?.registrationNumber}
                />
              </div>

              <div>
                <label
                  htmlFor="studentNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Student Number (Optional)
                </label>
                <input
                  type="text"
                  id="studentNumber"
                  name="studentNumber"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.studentNumber}
                  className={`w-full h-9 rounded-md border ${errors?.studentNumber ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}
                />
                <FormErrorHandler
                  errors={errors?.studentNumber}
                  message={errors?.studentNumber}
                />
              </div>


            </div>
            {/** Name */}
            <div className="grid grid-cols-3 gap-6">
              {/** title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <select
                  id="title"
                  name="title"
                  onChange={handleTitleChange}
                  onBlur={handleBlur}
                  value={values.title}
                  className={`w-full h-9 rounded-md border ${errors?.title ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}

                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  <option value="">Select Title</option>
                  <option value="Mr">Mr.</option>
                  <option value="Ms">Ms.</option>
                  <option value="Mrs">Mrs.</option>
                  <option value="Dr">Dr.</option>
                  <option value="Prof">Prof.</option>
                </select>
                <FormErrorHandler
                  errors={errors?.title}
                  message={errors?.title}
                />
              </div>

              {/** full name */}
              <div className="col-span-2">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.fullName}
                  className={`w-full h-9 rounded-md border ${errors?.fullName ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}
                />
                <FormErrorHandler
                  errors={errors?.fullName}
                  message={errors?.fullName}
                />
              </div>
            </div>

            {/** Email */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.email}
                  className={`w-full h-9 rounded-md border ${errors?.email ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}
                />
                <FormErrorHandler
                  errors={errors?.email}
                  message={errors?.email}
                />
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <PhoneInput
                  name="phoneNumber"
                  value={values.phoneNumber}
                  onChange={handleChange}
                  placeholder="770000000"
                />
                <FormErrorHandler
                  errors={errors?.phoneNumber}
                  message={errors?.phoneNumber}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">

              {/** gender */}
              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.gender}
                  className={`w-full h-9 rounded-md border ${errors?.gender ? "border-red-500" : "border-gray-200"
                    } shadow-sm px-3 py-2  text-sm bg-gray-50 appearance-none`}

                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 10l5 5 5-5"/></svg>')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <FormErrorHandler
                  errors={errors?.gender}
                  message={errors?.gender}
                />
              </div>
            </div>

          </div>
        </Form>
        );
      }}
    </Formik>
  );
};

export default StudentPersonalInfoForm;
