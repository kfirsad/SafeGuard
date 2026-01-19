import bcrypt from "bcryptjs";


type WorkerRecord = {
  phone: string;
  passwordHash: string;
  Events: string[];
};

const responderDB: WorkerRecord[] = [
  { phone: "0501234567", passwordHash: bcrypt.hashSync("responder1pass", 10),Events:[] },
  { phone: "0529876543", passwordHash: bcrypt.hashSync("responder2pass", 10),Events:[] },
  { phone: "0545555555", passwordHash: bcrypt.hashSync("responder3pass", 10),Events:[] },
];

export const checkResponderInRemoteDB = async (
  phone: string,
  password: string
): Promise<boolean> => {
  // 1. Simulate network delay
  await new Promise((res) => setTimeout(res, 400));

  const responder = responderDB.find((r) => r.phone === phone);
  if (!responder) {
    return false;
  }

  try {
    const match = await bcrypt.compare(password, responder.passwordHash);
    return match;
  } catch (e) {
    return false;
  }
};