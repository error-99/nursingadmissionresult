import axios from "axios";
import cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

const BASE = "http://bnmc.teletalk.com.bd";
const RESULT_URL = BASE + "/options/result.php";

export default async function handler(req, res) {

  const roll = req.query.roll;

  if (!roll) {
    return res.status(400).json({
      status: false,
      message: "roll required"
    });
  }

  try {

    /* create session client */
    const jar = new CookieJar();

    const client = wrapper(
      axios.create({
        jar,
        withCredentials: true,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: 15000
      })
    );

    // STEP 1 — create session
    await client.get(RESULT_URL);

    // STEP 2 — submit roll
    const params = new URLSearchParams({
      yes: "YES",
      roll_no: roll,
      button01: "Submit"
    });

    const response = await client.post(RESULT_URL, params);

    const $ = cheerio.load(response.data);

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

    $(".result tr").each((i, el) => {

      const label = $(el).find("td").eq(0).text().trim();
      const value = $(el).find("td").eq(2).text().trim();

      switch (label) {
        case "Roll": data.roll = value; break;
        case "Name": data.name = value; break;
        case "Course Name": data.course = value; break;
        case "Merit Position": data.merit_position = value; break;
        case "Test Score": data.test_score = value; break;
        case "Merit Score": data.merit_score = value; break;
        case "College Code": data.college_code = value; break;
        case "College Name": data.college_name = value; break;
        case "Status": data.result_status = value; break;
      }
    });

    // image fix
    const img = $(".result img").attr("src");
    if (img) {
      data.photo = BASE + "/" + img.replace("../", "");
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      status: false,
      error: err.message
    });
  }
}
