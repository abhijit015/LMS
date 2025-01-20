import {
  generateLicense,
  validateLicenseExpiry,
} from "@/app/controllers/license.controller";
import { NextRequest, NextResponse } from "next/server";
import { handleErrorMsg } from "@/app/utils/common";

export async function POST(req: NextRequest) {
  let result;
  let proceed: boolean = true;
  let errMsg: string = "";
  let bodyData: string = "";

  try {
    const token = req.headers.get("token");

    // if (proceed) {
    //   result = await validateReqAuth(token);

    //   if (!result.status) {
    //     proceed = false;
    //     errMsg = result.data;
    //   }
    // }

    if (proceed) {
      bodyData = await req.json();
      result = await validateLicenseExpiry(bodyData);
      if (!result.status) {
        proceed = false;
      }
    }

    if (proceed) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    const response = {
      status: false,
      message: handleErrorMsg(error),
      data: null,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
