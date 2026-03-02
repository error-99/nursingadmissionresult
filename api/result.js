import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {

  const roll = req.query.roll;

  if (!roll) {
    return res.json({
      status: false,
      message: "Roll number required"
    });
  }

  const base = "http://bnmc.teletalk.com.bd";
  const url = base + "/options/result.php";

  try {

    /* ======================
       STEP 1 — CREATE SESSION
    =======================*/

    const session = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      },
      withCredentials: true
    });

    const cookies = session.headers["set-cookie"];

    /* ======================
       STEP 2 — POST REQUEST
    =======================*/

    const form = new URLSearchParams({
      yes: "YES",
      roll_no: roll,
      button01: "Submit"
    });

    const response = await axios.post(url, form, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies?.join("; ")
      }
    });

    const html = response.data;

    /* ======================
       STEP 3 — PARSE HTML
    =======================*/

    const $ = cheerio.load(html);

    const data = {
      status: true,
      roll: "",
      name: "",
      course: "",
      merit_position: "",
      test_score: "",
      merit_score: "",
      college_code: "",
      college_name: "",
      result_status: "",
      photo: ""
    };

    $("table.result tr").each((i, el) => {

      const tds = $(el).find("td");

      if (tds.length >= 3) {

        const label = $(tds[0]).text().trim();
        const value = $(tds[2]).text().trim();

        switch (label) {
          case "Roll":
            data.roll = value;
            break;
          case "Name":
            data.name = value;
            break;
          case "Course Name":
            data.course = value;
            break;
          case "Merit Position":
            data.merit_position = value;
            break;
          case "Test Score":
            data.test_score = value;
            break;
          case "Merit Score":
            data.merit_score = value;
            break;
          case "College Code":
            data.college_code = value;
            break;
          case "College Name":
            data.college_name = value;
            break;
          case "Status":
            data.result_status = value;
            break;
        }
      }
    });

    /* IMAGE */
    const img = $("table.result img").attr("src");

    if (img) {
      const clean = img.replace("../", "");
      data.photo = `${base}/${clean}`;
    }

    return res.json(data);

  } catch (err) {

    return res.json({
      status: false,
      error: err.message
    });
  }
}
