"use server";
import { handleErrorMsg } from "../utils/common";

//import { Resend } from "resend";
import nodemailer from "nodemailer";

export async function sendEmail(
  mailTo: string,
  mailSubject: string,
  mailBody: string
): Promise<{ status: boolean; message: string }> {
  // try {
  //   const transporter = nodemailer.createTransport({
  //     host: "smtp.gmail.com",
  //     port: 587,
  //     secure: false,
  //     auth: {
  //       user: "training@busy.net.in",
  //       pass: "yshccczajjtesfii",
  //     },
  //   });

  //   const mailOptions = {
  //     from: '"Algofast India Pvt. Ltd." <training@busy.net.in>',
  //     to: mailTo,
  //     subject: mailSubject,
  //     html: mailBody,
  //   };

  //   await transporter.sendMail(mailOptions);

  return { status: true, message: "Email sent successfully" };
  // } catch (error) {
  //   console.error("Error sending email:", error);
  //   const errorMessage =
  //     error instanceof Error
  //       ? error.message
  //       : "An unexpected error occurred while sending the email.";
  //   return { status: false, message: errorMessage };
  // }
}

// const resend = new Resend("re_FQnXi6pw_5EV7yL4VZLJqQTv4j5EamUe7");

// export async function sendEmail({
//   to,
//   cc = "",
//   bcc = "",
//   subject,
//   html,
// }: {
//   to: string;
//   cc?: string;
//   bcc?: string;
//   subject: string;
//   html: string;
// }) {
//   try {
//     const result = await resend.emails.send({
//       from: "onboarding@resend.dev",
//       to,
//       cc,
//       bcc,
//       subject,
//       html,
//     });

//     console.log("result : ", result);
//     if (result.data) {
//       return {
//         status: true,
//         message: "Email sent successfully",
//         data: result,
//       };
//     } else {
//       return {
//         status: false,
//         message: result.error?.message,
//         data: null,
//       };
//     }
//   } catch (error) {
//     console.error("Error during email sending:", error);
//     return {
//       status: false,
//       message:
//         error instanceof Error
//           ? error.message
//           : "An unexpected error occurred.",
//       data: null,
//     };
//   }
// }

export async function sendWhatsapp(phoneNumber: string, message: string) {
  const url = "https://app.messageautosender.com/message/new";
  let proceed = true;
  let errMsg = "";
  let result;

  // try {
  //   if (proceed) {
  //     const payload = {
  //       addContact: "true",
  //       username: "busyrnd1",
  //       password: "rg0306",
  //       sender: "OTPBNS",
  //       receiverMobileNo: phoneNumber,
  //       message: message,
  //     };

  //     const formBody = Object.entries(payload)
  //       .map(
  //         ([key, value]) =>
  //           encodeURIComponent(key) + "=" + encodeURIComponent(value)
  //       )
  //       .join("&");

  //     const response = await fetch(url, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/x-www-form-urlencoded",
  //       },
  //       body: formBody,
  //     });

  //     const data = await response.text();

  //     try {
  //       result = JSON.parse(data);
  //     } catch (e) {
  //       result = data;
  //     }

  //     if (response.ok) {
  //       return {
  //         status: true,
  //         message: "WhatsApp message sent successfully",
  //         data: result,
  //       };
  //     } else {
  //       proceed = false;
  //       errMsg = result || "Failed to send WhatsApp message";
  //     }
  //   }

  return {
    status: proceed,
    message: proceed ? "Success" : errMsg,
    data: null,
  };
  // } catch (error) {
  //   console.error("Failed to send WhatsApp message:", error);
  //   return {
  //     status: false,
  //     message:
  //       error instanceof Error
  //         ? error.message
  //         : "An unexpected error occurred.",
  //     data: null,
  //   };
  // }
}
